# TODO – MassageMatch Thailand

**Lovable/Cursor:** Läs denna + COMPLETED.md + ERRORS.md + IMPLEMENTATION_STATUS.md innan ny uppgift. Arbeta en uppgift i taget.

---

## Critical

- [ ] Verifiera Stripe checkout end-to-end (inloggad användare → redirect → webhook → premium aktiv) | Critical | 45m | create-checkout, stripe-webhook
- [ ] Verifiera att oinloggade inte når checkout (PaywallModal register-first popup, Pricing/Premium auth-guard) | Critical | 20m | PaywallModal, Pricing, Premium, useUniversalBuy
- [ ] Kör alla 20 migrations i Supabase (om inte redan klart) | Critical | 60m | supabase/migrations

---

## High

- [ ] Deploy Edge Functions: create-checkout, stripe-webhook, swipe-use, apply-promo, send-welcome | High | 30m | supabase/functions
- [ ] Sätt Supabase Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, VAPID_* | High | 15m | Supabase Dashboard
- [ ] Sätt Lovable env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_* (se LOVABLE_SYNC_CHECKLIST C1) | High | 10m | Lovable dashboard
- [ ] Smoke test: Login, Home, Swipe, Pricing, /contact, /top, ErrorBoundary (se LOVABLE_SYNC_CHECKLIST D2) | High | 30m | –
- [ ] Verifiera RLS och tabeller profiles, therapists, swipes i Supabase (se LOVABLE_SYNC_CHECKLIST D3) | High | 20m | –

---

## Medium

- [ ] Testa swipe-räknare och blockering efter X swipes för ej registrerade | Medium | 25m | Swipe, useSwipe
- [ ] Testa rabattkod (t.ex. NEWTHERAPIST90) och timer på Profile | Medium | 20m | Pricing, apply-promo, Profile
- [ ] Testa bilduppladdning (therapist/customer) och Supabase Storage | Medium | 25m | Profile, therapist-images, customer-photos
- [ ] Verifiera annonser visas för icke-premium, döljs för premium (index.html, premium-check) | Medium | 15m | index.html, public
- [ ] Full testrunda enligt TESTING_CHECKLIST.md (Error Boundaries, Offline, Push, Lazy, Performance) | Medium | 60m | –

---

## Low

- [ ] Testa responsivitet 320px–2560px och touch-gester på mobil | Low | 40m | –
- [ ] Verifiera 404 och Error Boundary fallback (krasch på sida → "Försök igen") | Low | 15m | ErrorBoundary, Layout
- [ ] Dokumentera kända edge cases i ERRORS.md eller TESTING_LOG.md | Low | 20m | –

---

**Källa:** IMPLEMENTATION_STATUS.md (B1–B3, C1–C2, D) + kritiska områden för pre-launch. Uppdatera när uppgifter slutförs (flytta till COMPLETED.md och lägg till post där).
