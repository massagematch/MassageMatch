# MassageMatch Thailand (Thai Massage Connect)

Production-ready Lovable + Supabase app: secure auth, persistent profiles/swipes, realtime sync, Stripe 12h Premium, RLS, Edge Functions, cron, **Super Admin Dashboard**.

## Urgent bug fixes applied

1. **Login deadlock** — `onAuthStateChange` no longer blocks: `fetchProfile` runs in `setTimeout(0)` so the auth callback returns immediately. See `src/contexts/AuthContext.tsx`.
2. **Persistence** — `profiles` and `swipes` tables with RLS; profiles created on first login; swipes recorded server-side via Edge Function `swipe-use`.
3. **Abuse** — Unlimited swipes prevented: 5 free swipes/day; all swipes go through Edge Function with validation.

## Stack

- **Frontend:** React 18, Vite, TypeScript, React Router
- **Backend:** Supabase (Auth, Postgres, Realtime, Storage, Edge Functions)
- **Payments:** Stripe Checkout + webhook
- **Admin:** Super Admin Dashboard with impersonation, moderation, content management

## DB schema

- **profiles** — `user_id` (PK), `role` (customer/therapist/salong/superadmin), `swipes_remaining` (default 5), `swipes_used`, `access_expires`, `plan_type`, `plan_expires`, `boost_expires`, `promo_used`, `visibility_score`, `banned`, `hotel_discounts`, `created_at`
- **swipes** — `id`, `user_id`, `therapist_id`, `action` (like/pass), `timestamp`
- **salongs** — `id`, `user_id`, `name`, `image_url`, `bio`, `location`, `visibility_score`, `plan_type`, `plan_expires`, `boost_expires`
- **unlocked_profiles** — `id`, `user_id`, `therapist_id`/`salong_id`, `unlocked_at`, `expires_at` (customer unlocks)
- **reviews** — `id`, `user_id`, `therapist_id`/`salong_id`, `rating` (1-5), `comment`, `flagged`, `approved`, `admin_reply`, `created_at`
- **discount_codes** — `id`, `code`, `discount_type`, `discount_value`, `plan_type`, `max_uses`, `uses_count`, `expires_at`, `active`
- **admin_logs** — `id`, `admin_user_id`, `action`, `target_type`, `target_id`, `details`, `ip_address`, `created_at` (audit trail)
- **logs** — `level`, `event`, `user_id`, `payload`, `created_at` (errors, analytics)
- **therapists** — reference data (id, name, image_url, bio)
- **therapist_rankings** (view) — computed effective_rank with boost multipliers
- **salong_rankings** (view) — computed effective_rank with boost multipliers

RLS is enabled on all tables; policies allow superadmin bypass via `public.is_superadmin()` function.

## Super Admin Dashboard

**Access:** `/admin` → Login with `thaimassagematch@hotmail.com` (superadmin role required)

### Setup Superadmin:
1. Create user `thaimassagematch@hotmail.com` via Supabase Auth Dashboard
2. Get `user_id` from `auth.users`
3. Run SQL:
   ```sql
   INSERT INTO public.profiles (user_id, role) 
   VALUES ('USER_ID_HERE', 'superadmin')
   ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';
   ```

### Features:
- **Dashboard** (`/admin`): Stats cards (revenue, active users, pending reviews, boosts), quick actions (add free membership, create discount codes)
- **Users** (`/admin/users`): Search/filter by role/email, edit roles/plans/swipes, ban/unban, delete accounts, **impersonate users** (view as them)
- **Reviews** (`/admin/reviews`): Moderate 1-5★ reviews, approve/delete, reply as admin, bulk approve
- **Content** (`/admin/content`): Manage therapists/salongs (ban listings), create discount codes (NEWTHERAPIST90, hotel discounts)
- **Stripe** (`/admin/stripe`): View transactions, revenue charts, manual refunds (connect Stripe API in production)
- **Impersonation** (`/admin/impersonate/[userId]`): Click "View as User" → see their exact frontend view (swipes, pricing, boosts they see)

### Security:
- Superadmin bypasses ALL RLS policies via `public.is_superadmin()` function
- All admin actions logged to `admin_logs` table (audit trail)
- Mobile-responsive UI

## Realtime

After login, the client subscribes to `user_${user.id}` for `profiles`, `swipes`, `reviews`, `discount_codes` postgres_changes. Swipes remaining and timer stay in sync across tabs/devices. Unsubscribe on logout.

## Pricing System (Role-Based)

### Customer Plans
- **Unlock Profile** (49 THB): Unlock 1 therapist/salong + direct contact (1h)
- **12h Unlimited** (199 THB): Unlimited swipes/profiles (12h)

### Therapist Plans
- **FREE First-Time** (Promo code `NEWTHERAPIST90`): Full Premium visibility (3 months) — auto-applies on signup
- **Premium 1 Month** (99 THB/mo): Toplist + search + swipe priority (30 days)
- **Premium 3 Month** (269 THB/mo): Toplist + search + swipe priority (90 days)
- **Boost 5X Swipe-Mode** (199 THB): 5x swipe visibility (6h)
- **Boost 24h Top Search** (149 THB): #1 search position (24h)

### Salong Plans
- **Premium 1 Month** (199 THB/mo): Toplist + search priority (30 days)
- **Top List 7 Days** (499 THB): #1 salong toplist (7 days)

### Stripe Integration
- **Checkout:** Client calls Edge Function `create-checkout` with `plan_type` metadata; redirects to Stripe.
- **Fulfillment:** Stripe webhook calls Edge Function `stripe-webhook` (idempotent by `payment_id`): handles all plan types, sets `plan_expires`/`boost_expires`, updates `visibility_score`.
- **Promo Code:** Edge Function `apply-promo` validates `NEWTHERAPIST90` for therapists (once per account, within 30 days of signup).
- **Client:** `PlanTimer` shows countdown for active plans/boosts; role-based pricing page filters plans.
- **Cron:** Run `public.daily_reset_expired_access()` daily to reset expired plans/boosts/unlocks.

## Edge Functions

| Function          | Purpose |
|-------------------|--------|
| `swipe-use`       | Validate user, decrement `swipes_remaining`, insert swipe row. Daily cap 5 free. |
| `create-checkout` | Create Stripe Checkout session with `plan_type` metadata, `client_reference_id` = user id. |
| `stripe-webhook`  | Verify signature; on `checkout.session.completed` fulfill all plan types (idempotent). Handles: unlock-profile, 12h-unlimited, therapist-premium-1m/3m, boost-swipe-6h, boost-search-24h, salong-premium-1m, salong-toplist-7d. |
| `apply-promo`     | Validate therapist promo code `NEWTHERAPIST90`; apply FREE 3-month Premium (once per account). |
| `fulfill-stripe`  | Optional idempotent fulfillment by `payment_id` + `user_id` (e.g. success redirect). |
| `abuse-check`     | Rate limit: returns swipes_today and allowed_remaining (5/day). |

Set secrets in Supabase Dashboard → Edge Functions: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`.

## Storage

Bucket `therapist-images` (public read). RLS: upload only to folder `{user_id}/`. Use for therapist avatars.

## Cron

Daily reset of expired access:

```sql
SELECT cron.schedule(
  'daily-reset-profiles',
  '0 0 * * *',
  $$ SELECT public.daily_reset_expired_access() $$
);
```

Enable pg_cron in Supabase if available, or call `daily_reset_expired_access()` from an external cron.

## 2FA / Emails / SEO

- **2FA:** Enable in Supabase Dashboard → Authentication → Settings (TOTP). Use Supabase Auth MFA APIs in UI if needed.
- **Emails:** Use Resend (or Supabase Auth templates) for welcome, low-swipes, expiry. Configure in Supabase Auth and/or Edge Functions.
- **SEO:** Set dynamic `og:image` per therapist in `index.html` or a meta component (e.g. therapist image URL).
- **PWA:** `public/manifest.json` and `public/sw.js` (optional) for installability and offline fallback.

## Tests

- `npm run test` — Vitest: auth flow, swipe persist, Stripe timer/expiry (mocked).
- See `src/test/` for setup and example tests.

## Production checklist

- [ ] Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, all Stripe Price IDs (see `.env.example`) in build env (no server secrets in client).
- [ ] Edge Function secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`.
- [ ] Stripe webhook URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`.
- [ ] Create Stripe products/prices for all plans (customer/therapist/salong); set Price IDs in env.
- [ ] Run migrations on production DB (including `20260220000006_superadmin_reviews.sql`); enable Realtime for `profiles`, `swipes`, `salongs`, `unlocked_profiles`, `reviews`, `discount_codes` if not already.
- [ ] **Setup superadmin:** Create `thaimassagematch@hotmail.com` user, set role to `superadmin` in `profiles` table.
- [ ] Schedule `daily_reset_expired_access()` (resets expired plans/boosts/unlocks).
- [ ] Test role-based pricing pages: customer/therapist/salong see correct plans.
- [ ] Test therapist promo code `NEWTHERAPIST90` (auto-applies FREE 3-month Premium).
- [ ] Test admin dashboard: login, impersonate user, moderate reviews, create discounts.
- [ ] Connect Stripe API in production for real-time revenue dashboard (implement Edge Function).
- [ ] Responsive UI: layout and Swipe page are mobile-friendly (viewport, touch targets).

## Run locally

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase and Stripe values
npm run dev
```

Supabase: `npx supabase start` and apply migrations; deploy functions with `npx supabase functions deploy`.
