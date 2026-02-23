import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import './NotificationBell.css'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  link: string | null
  created_at: string
}

export function NotificationBell() {
  const { user } = useAuth()
  const [list, setList] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = user?.id
    if (!userId) return
    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, read, link, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      setList((data as Notification[]) ?? [])
      setLoading(false)
    }
    load()
  }, [user?.id])

  useEffect(() => {
    const userId = user?.id
    if (!userId) return
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setList((prev) => [payload.new as Notification, ...prev.slice(0, 19)])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const unreadCount = list.filter((n) => !n.read).length

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  async function markAllRead() {
    const uid = user?.id
    if (!uid) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false)
    setList((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="notification-bell-wrap">
      <button type="button" className="notification-bell" onClick={() => setOpen(!open)} aria-label="Notifications">
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <>
          <div className="notification-backdrop" onClick={() => setOpen(false)} aria-hidden />
          <div className="notification-dropdown">
            <div className="notification-dropdown-header">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button type="button" className="notification-mark-all" onClick={markAllRead}>Mark all read</button>
              )}
            </div>
            {loading ? (
              <p className="notification-empty">Loading…</p>
            ) : list.length === 0 ? (
              <p className="notification-empty">No notifications yet</p>
            ) : (
              <ul className="notification-list">
                {list.map((n) => (
                  <li key={n.id} className={n.read ? '' : 'unread'} onClick={() => { markRead(n.id); setOpen(false); }}>
                    <Link to={n.link || '#'} className="notification-item">
                      <strong>{n.title}</strong>
                      {n.body && <span className="notification-body">{n.body}</span>}
                      <span className="notification-time">
                        {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
