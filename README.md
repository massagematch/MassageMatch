# MassageMatch Thailand (Thai Massage Connect)

Production-ready Lovable + Supabase app: secure auth, persistent profiles/swipes, realtime sync, Stripe pricing, freemium paywall, Tinder-style swipe, Thailand locations, single-profile unlock, ad monetization (Adsterra/RichAds/HilltopAds/Adnium), and Super Admin dashboard.

**Sync flow:** Cursor → GitHub → Lovable (Pull latest). Push to `main` triggers Lovable deploy when connected.

---

## 🚀 Quick Start (Installation)

```bash
npm install
cp .env.example .env
# Edit .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, Stripe price IDs
npm run dev
```

**Optional – quick setup script (Unix/macOS):**
```bash
chmod +x setup.sh
./setup.sh
```
Then edit `.env` and run migrations in Supabase (see below).

---

## 🧪 Testing Instructions

- **Full checklist:** See **`TESTING_CHECKLIST.md`** to verify:
  - Error boundaries (SV/TH/EN fallback)
  - Offline mode (IndexedDB profile + swipe list)
  - Push notifications ("Ny like!" delivery)
  - Lazy loading (route chunks, bundle size)
  - Performance on Thailand 4G (&lt; 3 s initial, &lt; 0.5 s cache hit)
- **Unit tests:** `npm run test`
- **Typecheck:** `npm run typecheck`
- **Lint:** `npm run lint`

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
| 17 | `20260220000017_age_verification.sql` | Age verification (18+): `profiles.birth_year`; required on register, editable on Profile with Save |
| 18 | `20260220000018_referral_referrer.sql` | Referral: `profiles.referrer_id`, `referral_days`; ?ref= on signup; referrer gets +7d when referred user pays |
| 19 | `20260220000019_referral_leaderboard.sql` | `get_referral_leaderboard(lim)` RPC for Dashboard top 10 referrers |
| 20 | `20260220000020_push_subscriptions.sql` | Push notifications: `push_subscriptions` (user_id, subscription jsonb) for "Ny like!" |

**Important:** All migrations must be applied for frontend and Edge Functions to work without errors.

**Age verification (18+):** Registration requires age 18–100 (stored as `birth_year`). Profile → Location tab has an Age (18+) selector; changes are saved with the **Save Social Contacts** button. Backend CHECK ensures only birth years that imply age ≥ 18 are allowed.

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
| `notify-push` | Web Push "Ny like!" when someone likes you | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (generate with `npx web-push generate-vapid-keys`) |
| `send-welcome` / `send-register` | Welcome email on signup (Resend) | `RESEND_API_KEY`; FROM_EMAIL / TO_EMAIL optional |
| `send-payment` | Premium/betalning bekräftelse (invoked from stripe-webhook) | Same Resend secrets |
| `send-like` | "Ny like väntar!" to profile that was liked (invoked from swipe-use) | Same Resend secrets |
| `send-match` | "GRATTIS! Ni har matchat" when mutual like (invoked from swipe-use) | Same Resend secrets |
| `send-contact` | Contact form → email to thaimassagematch@hotmail.com | Same Resend secrets |

**Deploy (CLI):**
```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy validate-thailand-bounds
supabase functions deploy ai-recommendations
supabase functions deploy chat-query
supabase functions deploy apply-promo
supabase functions deploy notify-push
supabase functions deploy send-welcome
supabase functions deploy send-register
supabase functions deploy send-payment
supabase functions deploy send-like
supabase functions deploy send-match
supabase functions deploy send-contact
```

---

## 📧 Email System (Resend)

- **Setup:** Get API key from [resend.com](https://resend.com) → Supabase Dashboard → Edge Functions → Secrets: `RESEND_API_KEY`. Optional: `FROM_EMAIL` (default `MassageMatch <noreply@massagematchthai.com>`), `TO_EMAIL` (default `thaimassagematch@hotmail.com`).
- **Triggers (automatic):**
  - **Registrering:** Login calls `send-welcome` after signup → välkommen-email till användaren.
  - **Betalning:** `stripe-webhook` anropar `send-payment` efter lyckad checkout → Premium-bekräftelse till användaren + admin-notis till TO_EMAIL.
  - **Like:** `swipe-use` anropar `send-like` när användaren swipar like → "Ny like väntar!" till profilen som gillades.
  - **Match:** `swipe-use` upptäcker mutual like och anropar `send-match` → "GRATTIS! Ni har matchat – WhatsApp kontakt" till båda.
- **Contact:** Route `/contact` (public). Formulär POST → `send-contact` Edge Function → email till thaimassagematch@hotmail.com.
- **Monitor:** Supabase Logs → Edge Functions för email-leverans; kolla thaimassagematch@hotmail.com Inbox/Spam.

---

## Therapist/Freelance: 3-month free + legal

- **Terminology:** UI uses "Therapist/Freelance" and "therapists/freelancers" (e.g. Login role, Pricing plans, Home, FAQ). DB and code keep `role = 'therapist'` and table `therapists`.
- **3-month free:** Therapists can enter code **NEWTHERAPIST90** on **Pricing** (PromoCodeInput). Deploy **apply-promo** Edge Function; it sets `plan_expires` (+90 days), `promo_used = true`, and ensures a `therapists` row. **Timer** on Profile (PlanTimer) shows Premium active until expiry; after that they must pay Premium or they **do not appear** in customer swipe/search (migration 16: `get_therapists_visible` filters by `plan_expires > now()`).
- **Legal:** FAQ has section **#legal** (Regler & Användaransvar). Login sign-up has checkbox "I agree to the rules & FAQ" and **[Läs regler]** link to `/faq#legal`. Text: "Användare ansvarar för Thai lag/licens. Inga sexuella tjänster." Contact everywhere: **thaimassagematch@hotmail.com**.
- **Wording:** UI shows "freelance therapist" / "freelancers" where appropriate; DB keeps `role = 'therapist'` and table `therapists`.

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
   - `VITE_STRIPE_UNLOCK_PROFILE`, `VITE_STRIPE_UNLIMITED_12H`, `VITE_STRIPE_UNLIMITED_12H_79` (optional, for A/B ฿79), `VITE_STRIPE_PREMIUM_PRICE_ID`
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
- **Dashboard:** AI recommendations, nearby freelancers, **Referral** ("📱 Dela → 7d Gratis Premium!" copy link `?ref=user_id`), **Referral leaderboard** (top 10), NotificationBell, links.
- **Referral:** Signup with `?ref=<user_id>` sets `referrer_id`; when referred user pays (Stripe), referrer gets +7 days Premium automatically (stripe-webhook). Dashboard shows share link and leaderboard.
- **City routes (18 turistorter):** En **CityPage** (`src/pages/cities/CityPage.tsx`) täcker alla städer via route `/:city`. Städer: phuket, bangkok, pattaya, chiang-mai, koh-samui, koh-tao, koh-phangan, krabi, ao-nang, phi-phi, railay, hua-hin, karon, kata, mai-khao, jomtien, nimmanhaemin, chaweng. Konfiguration i `src/lib/cityConfig.ts`. **Sitemap:** `public/sitemap.xml` med alla city-URL:er. **Search Console:** Se `SEARCH_CONSOLE_INDEXING.md` för request-indexering.
- **A/B:** Exit popup 12h price: 50% see ฿99, 50% see ฿79 (use `VITE_STRIPE_UNLIMITED_12H_79` for B). Stored in `ab_tests`.
- **Gamification:** Swipe streaks 1–5 days unlock badges; leaderboard by referrals_count.
- **Profile:** Tabs (Bilder, Location, Bio, Priser, Services); Thailand LocationSelector, MapButton.
- **Admin:** Discrete footer button (opacity 40%), mini login modal, 30min session.
- **Ads (free users only; premium = inga annonser):**
  - **Adsterra** + **RichAds** popunder: injected in `index.html` only when `isPremium` is not true; cap **2 per day** each (localStorage date reset).
  - **Adnium (4armn.com):** Adult CPM + Mainstream CPM; same premium check + 2/day cap. Script in `index.html`; `public/ads.txt` has both streams (10183 Adult, 11745 Mainstream). Adnium auto-switch by visitor (Phuket/locals → Adult; turister → Mainstream).
  - **HilltopAds:** Verification meta tag in `<head>` + TXT file in `public/`.
- **CTA banner:** “Ingen reklam för 99 THB!” (Layout, free users only) → `/pricing`.
- **PWA:** `public/manifest.json` (MassageTH); `public/sw.js` (offline + push); **PWAInstallBanner**; route **/install** (Android/iPhone-instruktioner). Ikoner: `public/icons/icon-72.png`, `icon-192.png`, `icon-512.png`.

---

## 📁 Webbplatskarta & robots.txt (Google)

- **robots.txt:** `public/robots.txt` – tillåter alla crawlers (`Allow: /`), blockerar `/admin`, pekar på sitemap. **Lovable:** Ladda upp till `public/` om den saknas; fixar ofta sitemap-fel i Search Console.
- **Sitemap:** `public/sitemap.xml` – startsida + 18 city-URL:er. I Search Console → Sitemaps: lägg till `https://din-domän/sitemap.xml`.
- **City-sidor:** Route `/:city` (CityPage) med unik titel och meta per stad – bra för sök.

---

## 📁 ads.txt & Ad Verification

- **ads.txt (massagematchthai.com/ads.txt)**
  - File: `public/ads.txt`. Required for CPM networks and higher RPM.
  - **Adnium (4armn.com):** Both streams in ads.txt:
    - `10183.xml.4armn.com, pubid=1002887, DIRECT` — Adult CPM (högre $ för Thailand, 18+ / natt).
    - `11745.xml.4armn.com, pubid=1002887, DIRECT` — Mainstream CPM (säkert för turister, dag).
  - **Lovable:** Public files → add/update `ads.txt` → Deploy. Verify: https://massagematchthai.com/ads.txt
  - **Adnium Dashboard:** Add site massagematchthai.com, both streams active; approve within 24h. Revenue: Adult $1.5–4 CPM, Mainstream $0.8–2.5 CPM; total with Google + Adnium ≈ $2–5 RPM. Vid premiumköp visas inga annonser (Adsterra/RichAds/Adnium alla avstängda).

- **HilltopAds**
  - Meta tag in `index.html`: `<meta name="hilltopads-verification" content="55b9384f668c04d9a74c">`
  - TXT file: `public/ee1c2622ae6de28571d0.txt` with **exact** content: `55b9384f668c04d9a74c`
  - **Verify URL:** https://massagematchthai.com/ee1c2622ae6de28571d0.txt (must show `55b9384f668c04d9a74c`)

---

## 🔐 Environment Variables

**Client (Lovable / Vercel) – endast dessa; inga hemligheter här (syns inte i inspekt/källkod):**
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Stripe Price IDs: `VITE_STRIPE_UNLOCK_PROFILE`, `VITE_STRIPE_UNLIMITED_12H`, `VITE_STRIPE_THERAPIST_*`, `VITE_STRIPE_SALONG_*`, `VITE_STRIPE_PREMIUM_PRICE_ID`
- `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`, `VITE_VAPID_PUBLIC_KEY` (optional)

**Supabase Edge Function secrets (aldrig i Lovable/frontend – inte synliga för publiken):**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`; optional: `FROM_EMAIL`, `TO_EMAIL`, `APP_URL`

Stripe Publishable Key (pk_live_...) får sättas i Lovable om någon integration kräver det; Secret Key (sk_live_...) ska **endast** vara i Supabase Secrets.

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

**Lovable: read `LOVABLE_PULL_CHECKLIST.md` after each Pull – it lists files that must stay (ErrorBoundary retry, checkout errors, Home/Swipe loading) so the site does not crash for users.**

1. **Connect repo:** Lovable → GitHub → connect `massagematch/MassageMatch`, branch `main`.
2. **Pull latest:** When credits allow, use “Pull latest” to sync Cursor/GitHub changes.
3. **Backend:** Apply all migrations above to production Supabase; deploy Edge Functions; set secrets.
4. **Frontend env:** Set all `VITE_*` (and any server env) in Lovable project settings.
5. **Deploy:** Lovable builds and deploys; ad scripts and HilltopAds TXT are in `index.html` and `public/` and will work after deploy.

**Verification after deploy:**
- https://massagematchthai.com/ee1c2622ae6de28571d0.txt → `55b9384f668c04d9a74c`
- View page source → “hilltopads-verification” and “55b9384f668c04d9a74c”
- Free user: Adsterra/RichAds/Adnium (max 2/day each). Premium: no ads, no CTA banner. ads.txt: https://massagematchthai.com/ads.txt

---

## ⚡ Performance (Thailand 4G)

Targets for mobile and PC: Initial load &lt; 3 s; cache hit &lt; 0.5 s; push real-time; zero crashes (Error Boundary). Lazy loading and IndexedDB cache optimize for Thailand 4G. Run Lighthouse after deploy (aim Performance &gt; 90).

---

## 🔧 Troubleshooting

- **Connection slow** – Refresh; offline uses cached profile if available.
- **Push not received** – Migration 20, notify-push deployed with VAPID keys, VITE_VAPID_PUBLIC_KEY in env, user allowed notifications.
- **Offline cache empty** – Load profile/swipe once online first.
- **Error Boundary** – Check console; fix bug and click "Försök igen".
- **Lovable deploy fails** – Check VITE_* env; migrations 1–20; Edge Functions + secrets.
- **Stripe not configured** – Set VITE_STRIPE_* price IDs in Lovable env.

---

## 📚 Docs in Repo

- **`LOVABLE_PULL_CHECKLIST.md`** – **Lovable: använd denna.** Lista över filer att hämta och vad som MÅST implementeras (felhantering, ErrorBoundary retry, checkout-meddelanden, Home/Swipe try/catch). Kryssa av efter pull så att Lovable inte tar bort dessa ändringar.
- **`IMPLEMENTATION_GUIDE.md`** – Error Boundaries, Offline Mode (IndexedDB), Push ("Ny like!"), Lazy Loading; kod och filstruktur.
- **`TESTING_CHECKLIST.md`** – Komplett testguide för error boundaries, offline, push, lazy loading, performance 4G.
- **`SEARCH_CONSOLE_INDEXING.md`** – Alla city-URL:er för Google Search Console (Request Indexing) + sitemap.
- **`LOVABLE_IMPLEMENTATION.md`** – Step-by-step for Lovable: migrations 18–19, env, test checklist, PC + mobile.
- `OPTIMIZATION_SUMMARY.md` – Performance/SEO/CRO
- `VERIFICATION_CHECKLIST.md` – Deployment checklist
- `SOCIAL_LINKS_IMPLEMENTATION.md` – Social validation

---

**Production-ready.** Run migrations + Edge Functions + env vars, then push to GitHub so Lovable can deploy with all features and without errors.
