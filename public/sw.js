// PWA Service Worker – offline cache + push ("Ny like! Anna 1.8km Phuket")
const CACHE_NAME = 'massage-th-v1'
const OFFLINE_URL = '/offline.html'

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName)
        })
      )
    })
  )
  self.clients.claim()
})

// Push: "Ny like! Anna 1.8km Phuket"
self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const data = event.data.json ? event.data.json() : {}
    const title = data.title || 'MassageMatch Thailand'
    const options = {
      body: data.body || 'Ny notifikation',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: 'mm-push',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    }
    event.waitUntil(self.registration.showNotification(title, options))
  } catch (e) {
    event.waitUntil(
      self.registration.showNotification('MassageMatch Thailand', {
        body: 'Ny notifikation',
        icon: '/icons/icon-192.png',
        vibrate: [200, 100, 200]
      })
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0 && clientList[0].focus) {
        return clientList[0].focus()
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/')
      }
    })
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL).then((r) => r || caches.match('/')))
    )
    return
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  )
})
