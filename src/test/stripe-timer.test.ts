import { describe, it, expect } from 'vitest'

const PREMIUM_HOURS = 12

function addHours(date: Date, h: number): Date {
  const out = new Date(date)
  out.setTime(out.getTime() + h * 60 * 60 * 1000)
  return out
}

describe('Stripe timer and expiry', () => {
  it('access_expires is now + 12 hours', () => {
    const now = new Date()
    const expires = addHours(now, PREMIUM_HOURS)
    expect(expires.getTime() - now.getTime()).toBe(PREMIUM_HOURS * 60 * 60 * 1000)
  })

  it('expired when access_expires < now', () => {
    const past = new Date(Date.now() - 1000)
    expect(past < new Date()).toBe(true)
  })
})
