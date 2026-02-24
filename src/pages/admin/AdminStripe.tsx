import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin'
import './AdminStripe.css'

type Transaction = {
  id: string
  user_id: string
  amount: number
  currency: string
  status: string
  plan_type: string | null
  created_at: string
  email?: string
}

export default function AdminStripe() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    revenue_today: 0,
    revenue_week: 0,
    revenue_month: 0,
    total_transactions: 0,
  })

  useEffect(() => {
    loadTransactions()
    loadStats()
  }, [])

  async function loadTransactions() {
    setLoading(true)
    try {
      // In production, fetch from Stripe API via Edge Function
      // For now, use logs table as proxy
      const { data: logs } = await supabase
        .from('logs')
        .select('*')
        .eq('event', 'stripe_fulfilled')
        .order('created_at', { ascending: false })
        .limit(100)

      if (logs) {
        const enriched = await Promise.all(
          logs.map(async (log) => {
            const { data: authUser } = await supabase.auth.admin.getUserById(log.user_id || '')
            return {
              id: log.id,
              user_id: log.user_id || '',
              amount: (log.payload as any)?.amount || 0,
              currency: 'THB',
              status: 'paid',
              plan_type: (log.payload as any)?.plan_type || null,
              created_at: log.created_at,
              email: authUser?.user?.email,
            }
          })
        )
        setTransactions(enriched as Transaction[])
      }
    } catch (e) {
      console.error('Failed to load transactions', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    // In production, query Stripe API
    // Mock for now
    setStats({
      revenue_today: 0,
      revenue_week: 0,
      revenue_month: 0,
      total_transactions: transactions.length,
    })
  }

  async function handleRefund(transactionId: string, userId: string) {
    if (!confirm('Issue refund for this transaction?')) return
    try {
      // In production, call Stripe API via Edge Function
      await logAdminAction('refund_transaction', 'transaction', transactionId, { user_id: userId })
      alert('Refund initiated (implement Stripe API call)')
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  return (
    <div className="admin-stripe">
      <div className="admin-header">
        <h1>Stripe Dashboard</h1>
        <Link to={ROUTES.ADMIN} className="btn-back">
          ← Dashboard
        </Link>
      </div>

      <div className="stripe-stats">
        <div className="stat-card">
          <div className="stat-label">Revenue Today</div>
          <div className="stat-value">{stats.revenue_today.toLocaleString()} THB</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue This Week</div>
          <div className="stat-value">{stats.revenue_week.toLocaleString()} THB</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue This Month</div>
          <div className="stat-value">{stats.revenue_month.toLocaleString()} THB</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value">{stats.total_transactions}</div>
        </div>
      </div>

      <div className="transactions-section">
        <h2>Recent Transactions</h2>
        {loading ? (
          <div className="admin-loading">Loading transactions...</div>
        ) : (
          <div className="transactions-table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                    <td>{t.email || t.user_id.slice(0, 8)}</td>
                    <td>{t.plan_type || '—'}</td>
                    <td>{t.amount.toLocaleString()} {t.currency}</td>
                    <td>
                      <span className={`status-badge ${t.status}`}>{t.status}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRefund(t.id, t.user_id)}
                        className="btn-refund"
                      >
                        Refund
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="empty-state">No transactions found</div>
            )}
          </div>
        )}
      </div>

      <div className="stripe-note">
        <p>
          <strong>Note:</strong> Connect Stripe API in production to view real-time revenue and
          transactions. Implement Edge Function to fetch from Stripe Dashboard API.
        </p>
      </div>
    </div>
  )
}
