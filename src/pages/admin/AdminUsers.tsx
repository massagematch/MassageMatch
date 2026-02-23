import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin'
import type { Profile } from '@/lib/supabase'
import './AdminUsers.css'

type UserWithProfile = Profile & {
  email?: string
  stripe_customer_id?: string
  banned?: boolean
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Profile>>({})

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (profiles) {
        // Fetch emails from auth.users (requires service role in production)
        const enriched = await Promise.all(
          profiles.map(async (p) => {
            const { data: authUser } = await supabase.auth.admin.getUserById(p.user_id)
            return { ...p, email: authUser?.user?.email }
          })
        )
        setUsers(enriched as UserWithProfile[])
      }
    } catch (e) {
      console.error('Failed to load users', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(userId: string, email?: string) {
    if (!confirm(`Delete user ${email || userId}? This cannot be undone.`)) return
    try {
      await supabase.from('profiles').delete().eq('user_id', userId)
      await logAdminAction('delete_user', 'profile', userId, { email })
      alert('User deleted')
      loadUsers()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  async function handleBan(userId: string, ban: boolean, reason?: string) {
    try {
      await supabase
        .from('profiles')
        .update({
          banned: ban,
          banned_reason: reason || null,
          banned_at: ban ? new Date().toISOString() : null,
        })
        .eq('user_id', userId)
      await logAdminAction(ban ? 'ban_user' : 'unban_user', 'profile', userId, { reason })
      alert(ban ? 'User banned' : 'User unbanned')
      loadUsers()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  async function handleSaveEdit(userId: string) {
    try {
      await supabase.from('profiles').update(editData).eq('user_id', userId)
      await logAdminAction('edit_user', 'profile', userId, editData)
      setEditing(null)
      setEditData({})
      loadUsers()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  function handleExport() {
    const csv = [
      ['ID', 'Email', 'Role', 'Plan', 'Expires', 'Swipes Used', 'Created'].join(','),
      ...users.map((u) =>
        [
          u.user_id,
          u.email || '',
          u.role,
          u.plan_type || '',
          u.plan_expires || '',
          u.swipes_used,
          u.created_at,
        ].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (search && !u.email?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="admin-users">
      <div className="admin-header">
        <h1>Users Management</h1>
        <div>
          <Link to="/admin" className="btn-back">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="users-filters">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="therapist">Therapists</option>
          <option value="salong">Salongs</option>
        </select>
        <button type="button" onClick={handleExport} className="btn-export">
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Expires</th>
                <th>Swipes Used</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.user_id} className={user.banned ? 'banned' : ''}>
                  <td>{user.email || user.user_id.slice(0, 8)}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>{user.plan_type || '—'}</td>
                  <td>
                    {user.plan_expires
                      ? new Date(user.plan_expires).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>{user.swipes_used}</td>
                  <td>
                    {user.banned ? (
                      <span className="status-banned">Banned</span>
                    ) : (
                      <span className="status-active">Active</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <Link
                        to={`/admin/impersonate/${user.user_id}`}
                        className="btn-action btn-impersonate"
                        title="Impersonate"
                      >
                        👁️
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(user.user_id)
                          setEditData({
                            role: user.role,
                            plan_type: user.plan_type,
                            swipes_remaining: user.swipes_remaining,
                            boost_expires: user.boost_expires,
                          })
                        }}
                        className="btn-action btn-edit"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBan(user.user_id, !user.banned)}
                        className="btn-action btn-ban"
                        title={user.banned ? 'Unban' : 'Ban'}
                      >
                        {user.banned ? '✅' : '🚫'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.user_id, user.email)}
                        className="btn-action btn-delete"
                        title="Delete"
                      >
                        ❌
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>Edit User</h3>
            <label>
              Role:
              <select
                value={editData.role || ''}
                onChange={(e) => setEditData({ ...editData, role: e.target.value as any })}
              >
                <option value="customer">Customer</option>
                <option value="therapist">Therapist</option>
                <option value="salong">Salong</option>
              </select>
            </label>
            <label>
              Plan Type:
              <input
                type="text"
                value={editData.plan_type || ''}
                onChange={(e) => setEditData({ ...editData, plan_type: e.target.value })}
              />
            </label>
            <label>
              Swipes Remaining:
              <input
                type="number"
                value={editData.swipes_remaining ?? ''}
                onChange={(e) =>
                  setEditData({ ...editData, swipes_remaining: Number(e.target.value) })
                }
              />
            </label>
            <div className="edit-modal-actions">
              <button type="button" onClick={() => setEditing(null)} className="btn-cancel">
                Cancel
              </button>
              <button type="button" onClick={() => handleSaveEdit(editing)} className="btn-save">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
