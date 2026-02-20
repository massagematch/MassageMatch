import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin'
import './AdminReviews.css'

type Review = {
  id: string
  user_id: string
  therapist_id: string | null
  salong_id: string | null
  rating: number
  comment: string | null
  flagged: boolean
  flagged_reason: string | null
  approved: boolean
  admin_reply: string | null
  created_at: string
  user_email?: string
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged'>('pending')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    loadReviews()
  }, [filter])

  async function loadReviews() {
    setLoading(true)
    try {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false })
      
      if (filter === 'pending') {
        query = query.eq('approved', false)
      } else if (filter === 'flagged') {
        query = query.eq('flagged', true)
      }
      
      const { data } = await query
      if (data) {
        // Enrich with user emails
        const enriched = await Promise.all(
          data.map(async (r) => {
            const { data: authUser } = await supabase.auth.admin.getUserById(r.user_id)
            return { ...r, user_email: authUser?.user?.email }
          })
        )
        setReviews(enriched as Review[])
      }
    } catch (e) {
      console.error('Failed to load reviews', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(reviewId: string) {
    try {
      await supabase.from('reviews').update({ approved: true }).eq('id', reviewId)
      await logAdminAction('approve_review', 'review', reviewId)
      loadReviews()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  async function handleDelete(reviewId: string) {
    if (!confirm('Delete this review?')) return
    try {
      await supabase.from('reviews').delete().eq('id', reviewId)
      await logAdminAction('delete_review', 'review', reviewId)
      loadReviews()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  async function handleReply(reviewId: string) {
    if (!replyText.trim()) return
    try {
      await supabase.from('reviews').update({ admin_reply: replyText }).eq('id', reviewId)
      await logAdminAction('reply_review', 'review', reviewId, { reply: replyText })
      setReplyingTo(null)
      setReplyText('')
      loadReviews()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  async function handleBulkApprove() {
    const pending = reviews.filter((r) => !r.approved)
    if (!confirm(`Approve ${pending.length} reviews?`)) return
    try {
      await Promise.all(pending.map((r) => supabase.from('reviews').update({ approved: true }).eq('id', r.id)))
      await logAdminAction('bulk_approve_reviews', 'review', undefined, { count: pending.length })
      loadReviews()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  return (
    <div className="admin-reviews">
      <div className="admin-header">
        <h1>Reviews Moderation</h1>
        <div>
          <Link to="/admin" className="btn-back">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="reviews-filters">
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
        >
          Pending ({reviews.filter((r) => !r.approved).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('flagged')}
          className={`filter-btn ${filter === 'flagged' ? 'active' : ''}`}
        >
          Flagged ({reviews.filter((r) => r.flagged).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
        >
          All
        </button>
        {filter === 'pending' && (
          <button type="button" onClick={handleBulkApprove} className="btn-bulk-approve">
            Bulk Approve All
          </button>
        )}
      </div>

      {loading ? (
        <div className="admin-loading">Loading reviews...</div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className={`review-card ${review.flagged ? 'flagged' : ''}`}>
              <div className="review-header">
                <div>
                  <div className="review-rating">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <div className="review-meta">
                    {review.user_email || review.user_id.slice(0, 8)} •{' '}
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="review-status">
                  {review.flagged && <span className="status-flagged">🚩 Flagged</span>}
                  {review.approved ? (
                    <span className="status-approved">✓ Approved</span>
                  ) : (
                    <span className="status-pending">⏳ Pending</span>
                  )}
                </div>
              </div>
              <div className="review-comment">{review.comment || '(No comment)'}</div>
              {review.flagged_reason && (
                <div className="review-flagged-reason">Flag reason: {review.flagged_reason}</div>
              )}
              {review.admin_reply && (
                <div className="review-admin-reply">
                  <strong>Admin:</strong> {review.admin_reply}
                </div>
              )}
              <div className="review-actions">
                {!review.approved && (
                  <button
                    type="button"
                    onClick={() => handleApprove(review.id)}
                    className="btn-approve"
                  >
                    ✓ Approve
                  </button>
                )}
                {!replyingTo && (
                  <button
                    type="button"
                    onClick={() => setReplyingTo(review.id)}
                    className="btn-reply"
                  >
                    💬 Reply
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(review.id)}
                  className="btn-delete"
                >
                  ❌ Delete
                </button>
              </div>
              {replyingTo === review.id && (
                <div className="reply-form">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Admin reply..."
                    rows={3}
                  />
                  <div className="reply-actions">
                    <button type="button" onClick={() => setReplyingTo(null)} className="btn-cancel">
                      Cancel
                    </button>
                    <button type="button" onClick={() => handleReply(review.id)} className="btn-send">
                      Send Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {reviews.length === 0 && <div className="empty-state">No reviews found</div>}
        </div>
      )}
    </div>
  )
}
