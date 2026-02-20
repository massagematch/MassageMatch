# MassageMatch Thailand (Thai Massage Connect)

Production-ready Lovable + Supabase app: secure auth, persistent profiles/swipes, realtime sync, Stripe pricing, Super Admin dashboard, performance optimizations, SEO, social validation, welcome emails.

## 🚀 Complete Feature Set

### Core Features
- ✅ Secure authentication with deadlock fix
- ✅ Persistent profiles/swipes (no reset on refresh)
- ✅ Realtime sync across devices/tabs
- ✅ Role-based pricing (customer/therapist/salong)
- ✅ Stripe 12h Premium + all plan types
- ✅ FREE 3-month therapist promo code
- ✅ Super Admin dashboard with impersonation
- ✅ Reviews moderation system
- ✅ Content management (therapists/salongs/discounts)

### Performance & SEO
- ✅ Code splitting (<100KB core bundle)
- ✅ WebP images with lazy loading
- ✅ PWA support (offline swipes)
- ✅ Schema markup (LocalBusiness, FAQPage)
- ✅ Hreflang tags (en/th)
- ✅ Sitemap.xml

### Conversion & Retention
- ✅ Exit-intent popup (20% discount)
- ✅ A/B testing infrastructure
- ✅ WhatsApp booking button
- ✅ Login streaks (+1 free swipe)
- ✅ Referral codes (24h boost)
- ✅ Gamification badges

### Social & Validation
- ✅ Profile form with social links
- ✅ Real-time validation (Instagram/Telegram/Line/WA/FB)
- ✅ 24h validation cache
- ✅ Explicit Save button (no deadlock)

### Email System
- ✅ Welcome emails (Resend integration)
- ✅ Role-based templates (customer/therapist/salong)
- ✅ Auto-send on signup/profile completion

## 📦 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase and Stripe keys
npm run dev
```

## 🗄️ Database Setup

Run migrations in order:
1. `20260220000001_initial_schema.sql` - Base tables
2. `20260220000002_rls_policies.sql` - RLS policies
3. `20260220000003_realtime_storage.sql` - Realtime + storage
4. `20260220000004_cron_daily_reset.sql` - Cron function
5. `20260220000005_pricing_roles_system.sql` - Pricing + roles
6. `20260220000006_superadmin_reviews.sql` - Admin + reviews
7. `20260220000007_setup_superadmin.sql` - Superadmin helper
8. `20260220000008_gamification_analytics.sql` - Gamification
9. `20260220000009_social_links_validation.sql` - Social links

## 🔐 Super Admin Setup

1. Create user `thaimassagematch@hotmail.com` via Supabase Auth
2. Get `user_id` from `auth.users`
3. Run SQL:
```sql
INSERT INTO public.profiles (user_id, role) 
VALUES ('USER_ID_HERE', 'superadmin')
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';
```

## 🔧 Environment Variables

See `.env.example` for all required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Stripe Price IDs (all plans)
- `VITE_POSTHOG_KEY` (optional)
- Edge Function secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `APP_URL`

## 📚 Documentation

- `OPTIMIZATION_SUMMARY.md` - Performance/SEO/CRO details
- `VERIFICATION_CHECKLIST.md` - Deployment checklist
- `SOCIAL_LINKS_IMPLEMENTATION.md` - Social validation guide

## 🧪 Testing

```bash
npm run test
```

All tests passing ✅

## 🚀 Deployment

1. Push to GitHub main branch
2. Lovable auto-syncs
3. Apply migrations to production Supabase
4. Set environment variables
5. Deploy Edge Functions

**Production-ready!** 🎉
