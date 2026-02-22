# Lovable: Full Implementation Guide

Use this document to implement **everything** we built in Cursor so Lovable has the same behavior (front + backend, no errors). Do steps in order.

---

## Checklist (implement in this order)

1. [ ] **Database:** Run all 14 migrations in `supabase/migrations/` in numeric order.
2. [ ] **Edge Functions:** Deploy `create-checkout`, `stripe-webhook`, and optionally others; set secrets.
3. [ ] **Public file:** Create `public/ee1c2622ae6de28571d0.txt` with exact content below.
4. [ ] **index.html:** Add HilltopAds meta + Adsterra + RichAds scripts in `<head>` (exact blocks below).
5. [ ] **AuthContext:** Add `syncPremiumStorage` and call it wherever profile is set or cleared.
6. [ ] **Layout:** Add CTA banner for free users + CSS.
7. [ ] **Home:** Blurred top cards, click opens PaywallModal; render PaywallModal.
8. [ ] **Swipe:** Paywall when no swipes (overlay + handleAction + PaywallModal).
9. [ ] **PaywallModal:** Full component + CSS + index export.
10. [ ] **useUniversalBuy:** Redirect with `window.location.assign(data.url)`.
11. [ ] **UnlockModal, ExitIntentPopup, Pricing, Premium, UnlockedProfiles:** Loading/error, `assign`, "Redirecting…".
12. [ ] **Env vars:** Set all `VITE_*` and Supabase Edge Function secrets.

---

## 1. Database migrations

Run in **Supabase SQL Editor** (or CLI) in this exact order:

- `20260220000001_initial_schema.sql`
- `20260220000002_rls_policies.sql`
- `20260220000003_realtime_storage.sql`
- `20260220000004_cron_daily_reset.sql`
- `20260220000005_pricing_roles_system.sql`
- `20260220000006_superadmin_reviews.sql`
- `20260220000007_setup_superadmin.sql`
- `20260220000008_gamification_analytics.sql`
- `20260220000009_social_links_validation.sql`
- `20260220000010_thailand_locations.sql`
- `20260220000011_unlock_optimization.sql`
- `20260220000012_tinder_features.sql`
- `20260220000013_therapist_images_carousel.sql`
- `20260220000014_chat_profile_schema.sql`

(If your repo has different migration names, run all `supabase/migrations/*.sql` in lexicographic order.)

---

## 2. Edge Functions

### 2.1 Shared module (required by create-checkout)

**File:** `supabase/functions/_shared/supabase.ts`

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  })
}

export function getSupabaseService() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, supabaseServiceKey)
}
```

### 2.2 create-checkout (required for all payments)

**File:** `supabase/functions/create-checkout/index.ts`

```ts
import { getSupabaseClient } from '../_shared/supabase.ts'

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'

interface Body {
  price_id: string
  plan_type?: string
  therapist_id?: string
  salong_id?: string
  success_url?: string
  cancel_url?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }
  try {
    const supabase = getSupabaseClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const body = (await req.json()) as Body
    const { price_id, plan_type, therapist_id, salong_id, success_url, cancel_url } = body
    if (!price_id) {
      return new Response(JSON.stringify({ error: 'price_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (plan_type === 'unlock-profile') {
      const { data: profile } = await supabase.from('profiles').select('plan_expires, access_expires').eq('user_id', user.id).single()
      const planExpires = profile?.plan_expires ? new Date(profile.plan_expires) : null
      const accessExpires = profile?.access_expires ? new Date(profile.access_expires) : null
      const hasActivePlan = (planExpires != null && planExpires > new Date()) || (accessExpires != null && accessExpires > new Date())
      if (!hasActivePlan) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { count } = await supabase.from('unlocked_profiles').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('unlocked_at', since)
        if ((count ?? 0) >= 20) {
          return new Response(JSON.stringify({ error: 'Max 20 unlocks per day for free accounts. Upgrade for more.' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          })
        }
      }
    }

    const stripe = await import('https://esm.sh/stripe@14?target=deno')
    const stripeClient = new stripe.Stripe(stripeSecret, {
      apiVersion: '2023-10-16',
      httpClient: stripe.fetchHttpClient,
    })

    const metadata: Record<string, string> = { user_id: user.id }
    if (plan_type) metadata.plan_type = plan_type
    if (therapist_id) metadata.therapist_id = therapist_id
    if (salong_id) metadata.salong_id = salong_id

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url || `${appUrl}/pricing?success=1`,
      cancel_url: cancel_url || `${appUrl}/pricing`,
      client_reference_id: user.id,
      metadata,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Checkout failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  }
})
```

**Secrets (Supabase Edge Functions):** `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Optional: `APP_URL` (e.g. `https://massagematchthai.com`).

Also deploy **stripe-webhook** (and optionally validate-thailand-bounds, ai-recommendations, chat-query) if present in the repo.

---

## 3. Public file (HilltopAds)

**File:** `public/ee1c2622ae6de28571d0.txt`  
**Exact content (single line, no extra newline):**

```
55b9384f668c04d9a74c
```

---

## 4. index.html

In `<head>`, after existing meta/links and **before** `</head>`:

**(A) HilltopAds meta tag (one line):**

```html
<meta name="hilltopads-verification" content="55b9384f668c04d9a74c" />
```

**(B) Ad scripts (free users only, 2/day each). Insert before `</head>`:**

```html
<script>
  (function() {
    var today = new Date().toDateString();
    var stored = localStorage.getItem('adsterraDate');
    var count = parseInt(localStorage.getItem('adsterraCount') || '0', 10);
    if (stored !== today) { localStorage.setItem('adsterraDate', today); localStorage.setItem('adsterraCount', '0'); count = 0; }
    var isPremium = document.cookie.includes('isPremium=true') || localStorage.getItem('isPremium') === 'true';
    if (!isPremium && count < 2) {
      var s = document.createElement('script');
      s.src = 'https://pl28754770.effectivegatecpm.com/83/ad/d3/83add3235d5d4204274339ec7c86624f.js';
      s.async = true;
      document.head.appendChild(s);
      localStorage.setItem('adsterraCount', String(count + 1));
    }
  })();
  (function() {
    var today = new Date().toDateString();
    var stored = localStorage.getItem('richadsDate');
    var count = parseInt(localStorage.getItem('richadsCount') || '0', 10);
    if (stored !== today) { localStorage.setItem('richadsDate', today); localStorage.setItem('richadsCount', '0'); count = 0; }
    var isPremium = document.cookie.includes('isPremium=true') || localStorage.getItem('isPremium') === 'true';
    if (!isPremium && count < 2) {
      var s = document.createElement('script');
      s.src = 'https://richinfo.co/richpartners/pops/js/richads-pu-ob.js';
      s.setAttribute('data-pubid', '1002887');
      s.setAttribute('data-siteid', '388475');
      s.async = true;
      document.head.appendChild(s);
      localStorage.setItem('richadsCount', String(count + 1));
    }
  })();
</script>
```

---

## 5. AuthContext (isPremium for ads)

**File:** `src/contexts/AuthContext.tsx`

- Add constant: `const PREMIUM_KEY = 'isPremium'`
- Add this function (and call it everywhere profile is set or cleared):

```ts
function syncPremiumStorage(profile: Profile | null) {
  if (!profile) {
    localStorage.setItem(PREMIUM_KEY, 'false')
    if (typeof document !== 'undefined') document.cookie = 'isPremium=; path=/; max-age=0'
    return
  }
  const hasPlan = profile.plan_expires ? new Date(profile.plan_expires) > new Date() : false
  const val = hasPlan ? 'true' : 'false'
  localStorage.setItem(PREMIUM_KEY, val)
  if (typeof document !== 'undefined') document.cookie = 'isPremium=' + val + '; path=/; max-age=86400'
}
```

- When you set profile from fetch: after `setProfile(p)` and `setFallbackProfile(p)`, call `syncPremiumStorage(p)`.
- When profile is set from realtime payload: same, call `syncPremiumStorage(p)`.
- On **SIGNED_OUT**: call `syncPremiumStorage(null)` (and clear profile/fallback as you already do).

---

## 6. Layout (CTA banner)

**File:** `src/components/Layout.tsx`

- At the top of the layout div (before `<header>`), add:

```tsx
{profile && !(profile.plan_expires ? new Date(profile.plan_expires) > new Date() : false) && (
  <Link to="/pricing" className="ad-cta-banner">
    Ingen reklam för 99 THB! →
  </Link>
)}
```

- Ensure `Link` is imported from `react-router-dom`.

**File:** `src/components/Layout.css`

- Add (e.g. after `.layout`):

```css
.ad-cta-banner {
  display: block;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2));
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid rgba(16, 185, 129, 0.3);
}
.ad-cta-banner:hover {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(20, 184, 166, 0.3));
  color: var(--accent);
}
```

---

## 7. Home (blurred top list + PaywallModal)

**File:** `src/pages/Home.tsx`

- State: `const [showPaywall, setShowPaywall] = useState(false)`.
- Load top therapists (e.g. from `therapists` table, limit 6, not null `image_url`).
- Render a section “Top therapists in Phuket” with a **grid of cards**. Each card:
  - Wrapper: `<button type="button" className="home-top-card" onClick={() => setShowPaywall(true)}>`.
  - Inside: a blurred image div (e.g. `home-top-card-blur` with `OptimizedImage` or `img`), then a teaser div with name, city, “Available NOW”.
- At the end of the page: `<PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} mode="signup" />`.
- Import: `import { PaywallModal } from '@/components/PaywallModal'` (or from `PaywallModal` folder index).

**File:** `src/pages/Home.css`

- Card: `.home-top-card` (block, aspect-ratio 3/4, overflow hidden, cursor pointer).
- Blur: `.home-top-card-blur { position: absolute; inset: 0; filter: blur(20px); transition: filter 0.3s ease; }` and optionally `.home-top-card:hover .home-top-card-blur { filter: blur(8px); }`.
- Teaser: `.home-top-card-teaser` at bottom with gradient background, white text, name and “Available NOW”.

---

## 8. Swipe (paywall when no swipes)

**File:** `src/pages/Swipe.tsx`

- State: `const [showPaywall, setShowPaywall] = useState(false)`.
- `canSwipe = (profile?.swipes_remaining ?? 0) > 0 && !loading`.
- In `handleAction('like' | 'pass')`: if `!canSwipe` then `setShowPaywall(true)` and return; else perform swipe as now.
- In the swipe stack (the div that contains the cards), after the cards, add:
  - If `!canSwipe && current`: overlay div with class `swipe-paywall-overlay`, `onClick={() => setShowPaywall(true)}`, containing text “Out of swipes” and a button “Upgrade to continue” that also calls `setShowPaywall(true)`.
- Render: `<PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} mode="premium" />`.
- Import: `import { PaywallModal } from '@/components/PaywallModal'`.

**File:** `src/pages/Swipe.css`

- `.swipe-paywall-overlay`: position absolute, inset 0, z-index 15, flex center, background rgba(0,0,0,0.6), border-radius 16px, cursor pointer, padding 1rem.
- `.swipe-paywall-text`: white, font-weight 600, margin bottom.
- `.swipe-paywall-btn`: padding, gradient background (#10b981 to #14b8a6), white, border-radius 10px, font-weight 600.

---

## 9. PaywallModal (full component)

**File:** `src/components/PaywallModal/PaywallModal.tsx`

- Props: `open`, `onClose`, `mode?: 'signup' | 'login' | 'premium'`.
- Use: `useAuth()`, `useUniversalBuy().buyNow`, `useNavigate()`.
- State: `loading`, `error`.
- `UNLIMITED_PRICE_ID = import.meta.env.VITE_STRIPE_UNLIMITED_12H ?? ''`.
- If !open return null.
- `handleUnlimited`: if no price id or no user, navigate to `/pricing` and close; else set error null, loading true, call `buyNow({ price_id: UNLIMITED_PRICE_ID, plan_type: '12h-unlimited', success_url: origin + '/swipe?success=1', cancel_url: window.location.href })`, on catch set error, in finally set loading false.
- `handleSignup` / `handleLogin`: onClose and navigate to `/login`.
- JSX: overlay (onClick onClose), modal (stopPropagation), close button, icon, title “Unlock Phuket's Best”, description, primary button “Start Free Trial (3 swipes)” → handleSignup, then {error && <p className="paywall-error">{error}</p>}, then button “Unlimited 12h ฿199” → user ? handleUnlimited : handleSignup, disabled={loading}, text loading ? 'Redirecting…' : '💎 Unlimited 12h ฿199', then benefits list (Unlimited swipes, Chat verified therapists, See who's nearby, Top list priority), then “Already have account? Login” → handleLogin.
- Use `window.location.assign` in useUniversalBuy (see below); PaywallModal just calls `buyNow`.

**File:** `src/components/PaywallModal/PaywallModal.css`

- Include styles for: .paywall-overlay, .paywall-modal, .paywall-close, .paywall-icon-wrap, .paywall-title, .paywall-desc, .paywall-ctas, .paywall-btn, .paywall-btn-primary, .paywall-btn-outline, .paywall-btn-outline:disabled, .paywall-error, .paywall-benefits, .paywall-benefit, .paywall-check, .paywall-login. (Copy from repo or use the same as in README; key: .paywall-error red, .paywall-btn-outline:disabled cursor wait.)

**File:** `src/components/PaywallModal/index.ts`

- `export { PaywallModal, type PaywallMode } from './PaywallModal'`

---

## 10. useUniversalBuy (Stripe redirect on mobile)

**File:** `src/hooks/useUniversalBuy.ts`

- Invoke `create-checkout` with body (price_id, plan_type, therapist_id, salong_id, success_url, cancel_url) and Authorization header from session.
- On success: if `data?.url` then **`window.location.assign(data.url)`** and return (do not use `window.location.href =` for reliability on iOS/Android). Else throw “No checkout URL returned”.
- On `data?.error` throw that error; on invoke error throw.

---

## 11. Payment buttons (loading + assign + “Redirecting…”)

- **Pricing:** `handleCheckout` must use `window.location.assign(data.url)` when `data?.url`; set loading state per plan; button disabled when loading; button text: loading ? 'Redirecting…' : 'Buy Now'.
- **Premium:** Same: `window.location.assign(data.url)`, loading, disabled, “Redirecting…” when loading.
- **UnlockModal:** Uses `useUniversalBuy().buyNow`; already uses assign inside hook; button disabled when loading; text loading ? 'Redirecting…' : buttonCopy.
- **ExitIntentPopup:** Add state `loading`, `error`. On “Claim discount”: set loading true, invoke create-checkout, on success `window.location.assign(data.url)`; on catch set error; finally set loading false. Button disabled={loading}, text loading ? 'Redirecting…' : 'Claim 20% Discount'. Show error in popup. Add CSS for .exit-intent-cta:disabled and .exit-intent-error.
- **UnlockedProfiles (Extend):** When extending, invoke create-checkout; on success `window.location.assign(data.url)`. Keep extending state so button shows loading.

---

## 12. Environment variables

**Lovable / frontend (build):**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_UNLOCK_PROFILE`
- `VITE_STRIPE_UNLIMITED_12H`
- `VITE_STRIPE_PREMIUM_PRICE_ID`
- `VITE_STRIPE_THERAPIST_PREMIUM_1M`, `VITE_STRIPE_THERAPIST_PREMIUM_3M`, `VITE_STRIPE_BOOST_SWIPE_6H`, `VITE_STRIPE_BOOST_SEARCH_24H`
- `VITE_STRIPE_SALONG_PREMIUM_1M`, `VITE_STRIPE_SALONG_TOPLIST_7D`

**Supabase Edge Functions (secrets):**

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (for stripe-webhook)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (often auto-set)
- `APP_URL` (optional, e.g. https://massagematchthai.com)

---

## 13. Verification after deploy

- **HilltopAds:** Open `https://your-domain.com/ee1c2622ae6de28571d0.txt` → must show `55b9384f668c04d9a74c`. View page source → meta `hilltopads-verification` content `55b9384f668c04d9a74c`.
- **Ads:** Free user (no plan) → Adsterra/RichAds can show (max 2/day each). Premium user → no ad scripts.
- **Paywall:** Home blurred card click → PaywallModal. Swipe with 0 swipes → overlay + PaywallModal.
- **Stripe:** Every payment button goes to Stripe Checkout (assign, “Redirecting…”). If it “just loads”, check create-checkout deployed and all `VITE_STRIPE_*` set.

---

**End of implementation guide.** Implement in the order above so front and backend stay in sync and errors are avoided.
