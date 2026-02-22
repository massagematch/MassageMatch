/**
 * IndexedDB cache for offline mode – Thailand 4G optimized.
 * Caches user profile and swipe list for fast load when network is slow or offline.
 */

const DB_NAME = 'mm_offline_v1'
const PROFILE_STORE = 'profile'
const SWIPE_LIST_STORE = 'swipe_list'
const SWIPE_LIST_KEY = 'list'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: 'user_id' })
      }
      if (!db.objectStoreNames.contains(SWIPE_LIST_STORE)) {
        db.createObjectStore(SWIPE_LIST_STORE)
      }
    }
  })
}

export async function setCachedProfile(userId: string, profile: unknown): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROFILE_STORE, 'readwrite')
      tx.objectStore(PROFILE_STORE).put({ user_id: userId, ...(profile as object), cached_at: Date.now() })
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('Offline cache set profile failed', e)
  }
}

export async function getCachedProfile(userId: string): Promise<unknown | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROFILE_STORE, 'readonly')
      const req = tx.objectStore(PROFILE_STORE).get(userId)
      req.onsuccess = () => {
        db.close()
        const row = req.result
        if (!row) return resolve(null)
        const maxAge = 24 * 60 * 60 * 1000 // 24h
        if (Date.now() - (row.cached_at ?? 0) > maxAge) return resolve(null)
        const { user_id, cached_at, ...profile } = row
        resolve({ user_id, ...profile })
      }
      req.onerror = () => { db.close(); reject(req.error) }
    })
  } catch (e) {
    console.warn('Offline cache get profile failed', e)
    return null
  }
}

export async function setCachedSwipeList(list: unknown[]): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SWIPE_LIST_STORE, 'readwrite')
      tx.objectStore(SWIPE_LIST_STORE).put({ list, cached_at: Date.now() }, SWIPE_LIST_KEY)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('Offline cache set swipe list failed', e)
  }
}

export async function getCachedSwipeList(): Promise<unknown[] | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SWIPE_LIST_STORE, 'readonly')
      const req = tx.objectStore(SWIPE_LIST_STORE).get(SWIPE_LIST_KEY)
      req.onsuccess = () => {
        db.close()
        const row = req.result
        if (!row?.list || !Array.isArray(row.list)) return resolve(null)
        const maxAge = 60 * 60 * 1000 // 1h
        if (Date.now() - (row.cached_at ?? 0) > maxAge) return resolve(null)
        resolve(row.list)
      }
      req.onerror = () => { db.close(); reject(req.error) }
    })
  } catch (e) {
    console.warn('Offline cache get swipe list failed', e)
    return null
  }
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine !== false
}
