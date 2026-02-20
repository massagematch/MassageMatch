# Single Profile Unlock – Optimization Summary

## 1. CRO Boosts
- **Progress bar:** "85% unlocked in [city]" in UnlockModal
- **Social proof:** "1,247 unlocks this week"
- **Urgency:** "Unlock expires in 24h"
- **Repeat discount:** Copy "Unlock again? 39 THB (20% off)" when `isRepeat`; extend on UnlockedProfiles = "Extend access 24 THB"
- **A/B button:** Variant A = "Unlock Now", B = "See Contacts" (via `getVariant('unlock_button', userId)`)

## 2. Unlocked Dashboard (`/unlocked-profiles`)
- **Tabs:** Active (timer >0), Expired (re-buy), Most contacted (sort by `messages_sent`)
- **Cards:** WhatsApp, Call, Maps (MapButton); "Extend access 24 THB" for expired
- **Success redirect:** Checkout success_url → `/unlocked-profiles?success=1`

## 3. Mobile
- **Bottom sheet:** UnlockModal uses `bottom-sheet` class; on mobile aligns to bottom, on desktop centered
- **Swipe-to-unlock:** `.swipe-to-unlock` class on primary button (touch-friendly)
- **PWA:** `PWAInstallPrompt` component; manifest has `display: standalone`; "Lägg till hemskärm" prompt (Chrome + iOS copy)

## 4. Analytics
- **PostHog:** `unlock_funnel` (modal_opened, checkout_clicked, redirected, error, extend_clicked); `unlock_rate` (view, click, payment)
- **A/B:** `unlock_button` test – button copy "Unlock Now" vs "See Contacts"
- **Supabase:** Webhook logs `stripe_fulfilled` with `plan_type: unlock-profile`; fulfillment is idempotent by `stripe_payment_id`

## 5. Backend
- **Idempotency:** Same Stripe session id → skip duplicate insert in `unlocked_profiles`
- **Refund:** `charge.refunded` webhook deletes row where `stripe_charge_id` = charge.id (charge id stored after checkout via session expand)
- **Abuse:** Max 20 unlocks per 24h for free users (no active plan/access); enforced in `create-checkout` when `plan_type === 'unlock-profile'`
- **Unlock duration:** 24h (was 1h)

## Env
- `VITE_STRIPE_UNLOCK_PROFILE` – Stripe Price ID for single unlock

## Test checklist
- Unlock from Swipe → Stripe → Success → redirect to `/unlocked-profiles`
- UnlockedProfiles: Active / Expired / Most contacted; contact buttons; Extend
- Mobile: Unlock modal as bottom sheet; PWA install prompt
- PostHog: unlock_funnel and unlock_rate events
- Backend: 20 unlocks/day limit for free user; idempotent webhook; refund removes row
