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

**Important:** All migrations must be applied for frontend and Edge Functions to work without errors.

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

**Deploy (CLI):**
```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy validate-thailand-bounds
supabase functions deploy ai-recommendations
supabase functions deploy chat-query
```

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
