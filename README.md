# MassageMatch Thailand (Thai Massage Connect)

Production-ready Lovable + Supabase app: secure auth, persistent profiles/swipes, realtime sync, Stripe pricing, freemium paywall, Tinder-style swipe, Thailand locations, single-profile unlock, ad monetization (Adsterra/RichAds/HilltopAds), and Super Admin dashboard.

**Sync flow:** Cursor → GitHub → Lovable (Pull latest). Push to `main` triggers Lovable deploy when connected.

---

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, Stripe price IDs
npm run dev
```

---

## 🗄️ Database: Run Migrations in Order

Apply these in your **Supabase SQL Editor** (or CLI) in numeric order:

| # | Migration | Purpose |
|---|-----------|---------|
| 1 | `20260220000001_initial_schema.sql` | Base: therapists, profiles, swipes, logs |
| 2 | `20260220000002_rls_policies.sql` | RLS for therapists, profiles, swipes, logs |
| 3 | `20260220000003_realtime_storage.sql` | Realtime + storage |
| 4 | `20260220000004_cron_daily_reset.sql` | `daily_reset_expired_access()` |
| 5 | `20260220000005_pricing_roles_system.sql` | Roles, plans, unlocks, salongs |
| 6 | `20260220000006_superadmin_reviews.sql` | Superadmin, reviews, discount_codes, admin_logs |
| 7 | `20260220000007_setup_superadmin.sql` | Superadmin helper |
| 8 | `20260220000008_gamification_analytics.sql` | Streaks, referrals, badges |
| 9 | `20260220000009_social_links_validation.sql` | Social links + validation on profiles |
| 10 | `20260220000010_thailand_locations.sql` | region/city/area, lat/lng, share_location, RLS |
| 11 | `20260220000011_unlock_optimization.sql` | Unlock CRO, idempotency, refund, limits |
| 12 | `20260220000012_tinder_features.sql` | notifications, verified_photo, nearby_therapists RPC, therapist_rating_avg |
| 13 | `20260220000013_therapist_images_carousel.sql` | therapists.images (jsonb) for carousel |
| 14 | `20260220000014_chat_profile_schema.sql` | profiles: bio, services, prices (chat + profile) |
| 15 | `20260220000015_customer_images.sql` | profiles: customer_images (1–5), display_name; storage customer-photos; RLS for therapist read customers |
| 16 | `20260220000016_therapist_visible_and_promo.sql` | get_therapists_visible RPC: only therapists with plan_expires &gt; now() appear in swipe/search |

**Important:** All migrations must be applied for frontend and Edge Functions to work without errors.

---

## 🔐 Login, Sign-in & Admin (no stuck loading)

- **Sign-in / Register:** Login page uses profile **upsert** on sign-up (no duplicate-key error). Auth profile load has a **12s timeout**; if it fails, the app shows "Connection slow. Refresh the page or try again." and a Refresh button so the user is never stuck on "Loading…".
- **Admin (thaimassagematch@hotmail.com):** Use the **footer "Admin" button** (not the main Login page). Enter email and password; if you see "Access denied. Add this user as super admin in Supabase", run this in **Supabase SQL Editor** (replace with the real `user_id` from Auth → Users):

```sql
INSERT INTO public.profiles (user_id, role)
VALUES ('USER_ID_FROM_AUTH_USERS', 'superadmin')
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';
```

- **Customer photos (1–5):** Customers upload 1–5 profile photos in **Profile → Bilder**. These are shown when **therapists** open **Swipe** (therapist sees customer cards with photos; no photos = placeholder). Run migration **15** and ensure storage bucket `customer-photos` exists.

---

## ⚡ Edge Functions (Supabase)

Deploy from `supabase/functions/`. Set secrets in Supabase Dashboard → Edge Functions → Secrets.

| Function | Purpose | Secrets / Notes |
|----------|---------|-----------------|
| `create-checkout` | Stripe Checkout (unlock, premium, plans) | `STRIPE_SECRET_KEY`; max 20 unlocks/day per user |
| `stripe-webhook` | Stripe webhooks (payment, subscription) | `STRIPE_WEBHOOK_SECRET`; idempotency, unlock notification, 24h access |
| `validate-thailand-bounds` | Validate lat/lng inside Thailand | None |
| `ai-recommendations` | AI therapist recommendations | Optional OpenAI/key |
| `chat-query` | Natural-language chat → therapist matches | Optional; uses profile bio/services/prices |
| `apply-promo` | Therapist 3-month free code (NEWTHERAPIST90) | None; sets plan_expires, promo_used, ensures therapists row |

**Deploy (CLI):**
```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy validate-thailand-bounds
supabase functions deploy ai-recommendations
supabase functions deploy chat-query
supabase functions deploy apply-promo
```

---

## Therapist/Freelance: 3-month free + legal

- **Terminology:** UI uses "Therapist/Freelance" and "therapists/freelancers" (e.g. Login role, Pricing plans, Home, FAQ). DB and code keep `role = 'therapist'` and table `therapists`.
- **3-month free:** Therapists can enter code **NEWTHERAPIST90** on **Pricing** (PromoCodeInput). Deploy **apply-promo** Edge Function; it sets `plan_expires` (+90 days), `promo_used = true`, and ensures a `therapists` row. **Timer** on Profile (PlanTimer) shows Premium active until expiry; after that they must pay Premium or they **do not appear** in customer swipe/search (migration 16: `get_therapists_visible` filters by `plan_expires > now()`).
- **Legal:** FAQ has section **#legal** (Regler & Användaransvar). Login sign-up has checkbox "I agree to the rules & FAQ" linking to `/faq#legal`. Footer (AdminFooterButton) has "FAQ & Regler | thaimassagematch@hotmail.com". Contact email everywhere: **thaimassagematch@hotmail.com**.

---

## 💳 Stripe Checkout (Mobile & Lovable)

All payment clicks must send the user to Stripe Checkout and work reliably on phone (iOS Safari, Android, PWA).

**Entry points (all use `create-checkout` Edge Function):**
- **Pricing** – every plan button (Unlock Profile, 12h Unlimited, therapist/salong plans)
- **Premium** – “Buy 12h Premium”
- **UnlockModal** – “Unlock Now” / “See Contacts” (single-profile unlock)
- **PaywallModal** – “Unlimited 12h ฿199”
- **ExitIntentPopup** – “Claim 20% Discount”
- **UnlockedProfiles** – “Extend” on expired unlocks

**Implementation (already in code):**
- **Redirect:** `window.location.assign(data.url)` – no popup; works on iOS/Android. Popups are blocked on mobile.
- **Loading:** Every payment button shows “Redirecting…” and is **disabled** while the request runs (prevents double-tap).
- **Errors:** Buttons show error message if `create-checkout` fails or returns no URL; user can retry.
- **URLs:** `success_url` and `cancel_url` are absolute (`window.location.origin + path`). Required by Stripe.

**Lovable / production checklist:**
1. **Deploy `create-checkout`** – Supabase Edge Functions → deploy `create-checkout`; set secret `STRIPE_SECRET_KEY`.
2. **Set env vars** – In Lovable (or Vercel), set every Stripe Price ID you use:
   - `VITE_STRIPE_UNLOCK_PROFILE`, `VITE_STRIPE_UNLIMITED_12H`, `VITE_STRIPE_PREMIUM_PRICE_ID`
   - `VITE_STRIPE_THERAPIST_PREMIUM_1M`, `VITE_STRIPE_THERAPIST_PREMIUM_3M`, `VITE_STRIPE_BOOST_SWIPE_6H`, `VITE_STRIPE_BOOST_SEARCH_24H`
   - `VITE_STRIPE_SALONG_PREMIUM_1M`, `VITE_STRIPE_SALONG_TOPLIST_7D`
3. **Cold start:** First request to `create-checkout` on a cold Edge Function may take 5–15 seconds. Button shows “Redirecting…” until then; do not navigate away.
4. **Stripe Dashboard:** Ensure the price IDs exist and are in **live** mode if you use live keys.

If checkout “just loads” on phone: verify (1) `create-checkout` is deployed and (2) all required `VITE_STRIPE_*` are set in the deployed app.

---

## 🎯 Frontend Features (Lovable / GitHub)

- **Auth:** Login, persistent profile, `isPremium` synced to `localStorage` + cookie for ad scripts.
- **Home:** Blurred top-therapist cards; click opens **PaywallModal** (signup / premium / login).
- **Swipe:** Full-screen cards, image carousel (1/5), Pass / Like / Unlock. When **swipes_remaining ≤ 0**, overlay + **PaywallModal** (premium) block further swipes.
- **PaywallModal:** “Unlock Phuket’s Best” – Start Free Trial, Unlimited ฿199, benefits, Login. Uses Stripe checkout.
- **Single-profile unlock:** UnlockModal + useUniversalBuy; success/refund via stripe-webhook.
- **Dashboard:** AI recommendations, nearby therapists, NotificationBell, links.
- **Profile:** Tabs (Bilder, Location, Bio, Priser, Services); Thailand LocationSelector, MapButton.
- **Admin:** Discrete footer button (opacity 40%), mini login modal, 30min session.
- **Ads (free users only):**
  - **Adsterra** + **RichAds** popunder: injected in `index.html` only when `isPremium` is not true; cap **2 per day** each (localStorage date reset).
  - **HilltopAds:** Verification meta tag in `<head>` + TXT file in `public/`.
- **CTA banner:** “Ingen reklam för 99 THB!” (Layout, free users only) → `/pricing`.

---

## 📁 Ad Verification & Static Files

- **HilltopAds**
  - Meta tag in `index.html`: `<meta name="hilltopads-verification" content="55b9384f668c04d9a74c">`
  - TXT file: `public/ee1c2622ae6de28571d0.txt` with **exact** content: `55b9384f668c04d9a74c`
  - **Verify URL:** https://massagematchthai.com/ee1c2622ae6de28571d0.txt (must show `55b9384f668c04d9a74c`)

---

## 🔐 Environment Variables

**Client (e.g. Lovable / Vercel):**
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Stripe Price IDs: `VITE_STRIPE_UNLOCK_PROFILE`, `VITE_STRIPE_UNLIMITED_12H`, `VITE_STRIPE_THERAPIST_*`, `VITE_STRIPE_SALONG_*`, `VITE_STRIPE_PREMIUM_PRICE_ID`
- `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` (optional)

**Supabase Edge Function secrets:**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `APP_URL` (if using welcome emails)

See `.env.example` for a full list.

---

## 🔧 Super Admin Setup

1. Create user `thaimassagematch@hotmail.com` in Supabase Auth.
2. In SQL Editor:
```sql
INSERT INTO public.profiles (user_id, role)
VALUES ('USER_ID_FROM_AUTH_USERS', 'superadmin')
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';
```

---

## 🚀 Deployment (Lovable from GitHub)

1. **Connect repo:** Lovable → GitHub → connect `massagematch/MassageMatch`, branch `main`.
2. **Pull latest:** When credits allow, use “Pull latest” to sync Cursor/GitHub changes.
3. **Backend:** Apply all migrations above to production Supabase; deploy Edge Functions; set secrets.
4. **Frontend env:** Set all `VITE_*` (and any server env) in Lovable project settings.
5. **Deploy:** Lovable builds and deploys; ad scripts and HilltopAds TXT are in `index.html` and `public/` and will work after deploy.

**Verification after deploy:**
- https://massagematchthai.com/ee1c2622ae6de28571d0.txt → `55b9384f668c04d9a74c`
- View page source → “hilltopads-verification” and “55b9384f668c04d9a74c”
- Free user: Adsterra/RichAds popunder (max 2/day each). Premium: no popunder, no CTA banner.

---

## 📚 Docs in Repo

- `OPTIMIZATION_SUMMARY.md` – Performance/SEO/CRO
- `VERIFICATION_CHECKLIST.md` – Deployment checklist
- `SOCIAL_LINKS_IMPLEMENTATION.md` – Social validation

---

**Production-ready.** Run migrations + Edge Functions + env vars, then push to GitHub so Lovable can deploy with all features and without errors.
