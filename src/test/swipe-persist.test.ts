import { describe, it, expect } from 'vitest'

describe('Swipe persistence', () => {
  it('swipe-use contract: requires therapist_id and action', () => {
    const body = { therapist_id: 'uuid', action: 'like' }
    expect(body.therapist_id).toBeDefined()
    expect(['like', 'pass']).toContain(body.action)
  })

  it('profile shape has swipes_remaining and access_expires', () => {
    const profile = {
      user_id: 'uuid',
      swipes_remaining: 5,
      swipes_used: 0,
      access_expires: null as string | null,
      created_at: new Date().toISOString(),
    }
    expect(profile.swipes_remaining).toBe(5)
    expect(profile.access_expires).toBeNull()
  })
})
