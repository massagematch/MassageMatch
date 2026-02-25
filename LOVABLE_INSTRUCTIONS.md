# Lovable: Implementation Instructions for MassageMatch Thailand

> **This file is written for Lovable's AI agent.** It uses Lovable's internal patterns (search-replace over write, small focused changes, design system tokens, Supabase integration) to ensure correct implementation.

---

## CRITICAL: Read Before Any Changes

**IMPLEMENT – do not rewrite.** This codebase is production-ready from GitHub. Your job is to preserve and deploy it, not rebuild it.

**Before changing anything:** Read **WORKFLOW.md**, **TODO.md**, **COMPLETED.md**, **ERRORS.md**, **IMPLEMENTATION_STATUS.md** so you know where the project stands.

- Use `lov-line-replace` for edits, not `lov-write` (except for new files)
- Check "useful-context" before reading files
- Batch parallel operations
- Keep explanations under 2 lines

---

## Architecture Overview

```
src/
├── App.tsx                    # Root: AuthProvider + Routes + global components
├── constants/routes.ts        # ROUTES object – ALL paths defined here
├── components/
│   ├── Layout.tsx             # Protected route wrapper (ErrorBoundary around Outlet)
│   ├── AdminFooterButton.tsx  # Global footer (rendered in App.tsx, NOT Layout)
│   ├── ExitIntentPopup.tsx    # Discount popup (only on /login, visibilitychange trigger)
│   ├── ErrorBoundary.tsx      # Crash recovery with retryKey remount
│   ├── PaywallModal/          # Premium upsell modal
│   └── UnlockModal/           # Single profile unlock modal
├── pages/
│   ├── Login.tsx              # Public: sign in/up + registration
│   ├── Home.tsx               # Protected: dashboard home
│   ├── Swipe.tsx              # Protected: Tinder-style therapist cards
│   ├── Pricing.tsx            # Protected: all plan purchase buttons
│   ├── Premium.tsx            # Protected: 12h premium purchase
│   ├── Dashboard.tsx          # Protected: AI recs, nearby, referral
│   ├── Profile.tsx            # Protected: user profile editor
│   ├── Contact.tsx            # Public: contact page
│   ├── TopPage.tsx            # Public: top 10 therapists (blurred)
│   ├── cities/CityPage.tsx    # Protected: city-specific landing
│   └── admin/                 # Admin dashboard, users, reviews, content, stripe
├── hooks/
│   ├── useSwipe.ts            # Swipe action handler
│   ├── useUniversalBuy.ts     # Centralized Stripe checkout
│   └── useABTest.ts           # A/B test variant selection
├── lib/
│   ├── supabase.ts            # Supabase client init
│   ├── admin.ts               # isSuperAdmin() check
│   ├── analytics.ts           # PostHog/event tracking
│   └── cityConfig.ts          # City slug → data mapping
└── contexts/
    ├── AuthContext.tsx         # User/profile/session state
    └── RealtimeContext.tsx     # Supabase realtime sync

supabase/
├── functions/
│   ├── _shared/supabase.ts    # Shared Supabase client helpers
│   ├── create-checkout/       # Stripe Checkout session creation
│   ├── stripe-webhook/        # Stripe payment fulfillment
│   ├── swipe-use/             # Like/Pass + send notifications
│   ├── apply-promo/           # NEWTHERAPIST90 code redemption
│   ├── send-welcome/          # Welcome email (Resend)
│   ├── send-like/             # "Ny like!" email
│   ├── send-match/            # Mutual match email
│   ├── send-payment/          # Payment confirmation email
│   └── send-contact/          # Contact form email
└── migrations/                # 20 SQL migrations (run in order)
```

---

## What Lovable Must Preserve (DO NOT modify these patterns)

### 1. Route Constants
Every file imports `ROUTES` from `@/constants/routes.ts`. There are **zero hardcoded path strings** in the codebase. If you add navigation, use:
```typescript
import { ROUTES } from '@/constants/routes'
navigate(ROUTES.LOGIN, { state: { returnTo: ROUTES.PRICING } })
```

### 2. Global Components in App.tsx
`AdminFooterButton` renders in `App.tsx` (global scope), **NOT** in `Layout.tsx`. This ensures it appears on ALL pages including the public login page. Do not move it back to Layout.

### 3. ExitIntentPopup Trigger
Uses `visibilitychange` event (tab switch/close) and `mouseleave` with `clientY <= 0` (strict viewport exit). This prevents false triggers from casual mouse movement. It only activates on `/login` and fires once per session via `sessionStorage`.

### 4. ErrorBoundary Architecture
- `Layout.tsx` wraps `<Outlet />` in `<ErrorBoundary>` so a crash in one page doesn't break the header/navigation
- `ErrorBoundary` uses `retryKey` state to force remount on retry (not just `hasError: false`)

### 5. Auth Guards on All Purchase Buttons
Every checkout handler checks `!user?.id` and redirects to login with `returnTo` state. Every buy button is `disabled` when `!user?.id`. This is defense-in-depth alongside the `create-checkout` Edge Function's 401.

### 6. Data Fetching Pattern
Every `useEffect` data load follows:
```typescript
try {
  const { data } = await supabase.rpc('...')
  setList(data ?? [])
} catch {
  setList([])
} finally {
  setLoading(false)
}
```
The `finally` block is critical – without it, users get stuck on "Loading..." forever.

---

## Supabase Integration Patterns

### Edge Functions (Lovable does NOT deploy these – they're in Supabase)
Frontend calls them via:
```typescript
const { data: { session } } = await supabase.auth.getSession()
const { data, error } = await supabase.functions.invoke('create-checkout', {
  body: { price_id, plan_type, success_url, cancel_url },
  headers: session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : undefined,
})
```

### RPCs
```typescript
const { data } = await supabase.rpc('get_therapists_visible', { p_city: cityName })
```

### Required Edge Functions (must be deployed in Supabase Dashboard)
| Function | Purpose |
|----------|---------|
| `create-checkout` | All Stripe purchases |
| `stripe-webhook` | Payment fulfillment |
| `swipe-use` | Like/Pass actions |
| `apply-promo` | Therapist promo codes |
| `send-welcome` | Welcome email |

### Required RPCs (from migrations)
| RPC | Purpose |
|-----|---------|
| `get_therapists_visible` | Therapist list for Home/Swipe/Top/City |
| `nearby_therapists` | Location-based discovery |
| `get_referral_leaderboard` | Dashboard top referrers |

---

## Environment Variables

### In Lovable (VITE_* only – public, safe)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_UNLOCK_PROFILE=price_xxx
VITE_STRIPE_UNLIMITED_12H=price_xxx
VITE_STRIPE_PREMIUM_PRICE_ID=price_xxx
VITE_STRIPE_THERAPIST_PREMIUM_1M=price_xxx
VITE_STRIPE_THERAPIST_PREMIUM_3M=price_xxx
VITE_STRIPE_BOOST_SWIPE_6H=price_xxx
VITE_STRIPE_BOOST_SEARCH_24H=price_xxx
VITE_STRIPE_SALONG_PREMIUM_1M=price_xxx
VITE_STRIPE_SALONG_TOPLIST_7D=price_xxx
```

### In Supabase Secrets ONLY (NEVER in Lovable)
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
```

---

## Verification After Pull

1. **Build:** `npm run build` must succeed with zero errors
2. **TypeScript:** `npx tsc --noEmit` must pass
3. **Login page:** Registration + sign in works, profile upserts correctly
4. **Swipe:** Cards load (or empty list on error, never stuck "Loading...")
5. **Pricing:** Buy buttons redirect to Stripe or show error message
6. **Admin:** Footer "Admin" button visible on login page, modal opens, login works
7. **Exit popup:** Only appears once when actually leaving `/login` tab
8. **Routes:** `/contact`, `/top`, `/install` all load without 404

---

## Common Mistakes Lovable Makes (avoid these)

1. **Deleting error handling** from main.tsx, ErrorBoundary, Layout, Home, Swipe → causes crashes
2. **Removing auth guards** from Pricing/Premium/UnlockModal/PaywallModal → allows checkout without login (payment can't be attributed)
3. **Moving AdminFooterButton** back to Layout.tsx → button disappears from public pages
4. **Hardcoding paths** like `"/login"` instead of `ROUTES.LOGIN` → breaks when routes change
5. **Putting secrets** in Lovable env → leaked in browser source code
6. **Overwriting ExitIntentPopup** trigger with `mouseleave clientY < 10` → popup fires on every mouse-near-top movement
7. **Forgetting `finally` blocks** in data fetching → "Loading..." spinner forever on error
8. **Writing custom styles** instead of using component CSS files → inconsistent design
