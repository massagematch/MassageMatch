# GitHub Deployment Guide for Lovable + Supabase

## Step 1: Create GitHub Repository

1. Go to GitHub.com → New Repository
2. Name: `thai-massage-connect` (or your preferred name)
3. **DO NOT** initialize with README (we already have one)
4. Create repository

## Step 2: Connect Local Repo to GitHub

```bash
cd C:\massagematch\thai-massage-connect

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/thai-massage-connect.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/thai-massage-connect.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Connect Lovable to GitHub

1. Go to Lovable Dashboard
2. Connect GitHub repository
3. Select `thai-massage-connect` repo
4. Enable auto-sync

## Step 4: Apply Supabase Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order:
   - `supabase/migrations/20260220000001_initial_schema.sql`
   - `supabase/migrations/20260220000002_rls_policies.sql`
   - `supabase/migrations/20260220000003_realtime_storage.sql`
   - `supabase/migrations/20260220000004_cron_daily_reset.sql`
   - `supabase/migrations/20260220000005_pricing_roles_system.sql`
   - `supabase/migrations/20260220000006_superadmin_reviews.sql`
   - `supabase/migrations/20260220000007_setup_superadmin.sql`
   - `supabase/migrations/20260220000008_gamification_analytics.sql`
   - `supabase/migrations/20260220000009_social_links_validation.sql`

## Step 5: Deploy Edge Functions

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy swipe-use
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy fulfill-stripe
supabase functions deploy abuse-check
supabase functions deploy apply-promo
supabase functions deploy validate-social
supabase functions deploy send-welcome
```

## Step 6: Set Environment Variables

### In Lovable Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- All Stripe Price IDs (see `.env.example`)
- `VITE_POSTHOG_KEY` (optional)

### In Supabase Dashboard → Edge Functions → Secrets:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `APP_URL` (your production URL)

## Step 7: Setup Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Select events: `checkout.session.completed`
4. Copy webhook secret → Add to Supabase Edge Function secrets

## Step 8: Setup Resend (Welcome Emails)

1. Go to resend.com → Sign up
2. Get API key → Add to Supabase Edge Function secrets
3. Add domain `massagematchthai.com` (or your domain)
4. Verify DKIM/SPF records

## Step 9: Create Superadmin User

1. Create user `thaimassagematch@hotmail.com` via Supabase Auth Dashboard
2. Get `user_id` from `auth.users` table
3. Run SQL:
```sql
INSERT INTO public.profiles (user_id, role) 
VALUES ('USER_ID_HERE', 'superadmin')
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';
```

## Step 10: Verify Deployment

- [ ] Login works
- [ ] Swipes persist
- [ ] Stripe checkout redirects
- [ ] Admin dashboard accessible (`/admin`)
- [ ] Profile page saves social links
- [ ] Validation works (Instagram/Telegram/etc.)
- [ ] Welcome emails send
- [ ] Service worker registers
- [ ] Exit-intent popup shows

## 🎉 Done!

Your app is now live and synced with Lovable + Supabase!
