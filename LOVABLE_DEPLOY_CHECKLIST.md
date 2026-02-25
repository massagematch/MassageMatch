# Lovable: Deploy-checklista

**Lovable:** Efter Pull från GitHub, kör först **LOVABLE_SYNC_CHECKLIST** A1–A6 och D1. Deploy enligt denna checklista.

---

## Pre-Deploy

- [ ] Alla environment variables satta i Lovable dashboard (endast VITE_* – se LOVABLE_SYNC_CHECKLIST C1–C2, B3)
- [ ] Supabase-anslutning testad (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Stripe API keys (production) konfigurerade i Supabase Secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) – **aldrig** i Lovable
- [ ] Build utan errors eller warnings: `npm run typecheck` och `npm run build`
- [ ] All TypeScript-kod kompilerar

**Referens:** LOVABLE_SYNC_CHECKLIST C1–C2 (env), B3 (Secrets).

---

## Deploy Process

- [ ] Kör build lokalt först: `npm run build`
- [ ] Verifiera build output (dist/)
- [ ] Testa built version lokalt: `npm run preview`
- [ ] Deploy till Lovable staging (om tillgängligt)
- [ ] Testa staging version noggrant
- [ ] Deploy till production
- [ ] Verifiera production deploy

---

## Post-Deploy

- [ ] Smoke test alla kritiska funktioner (se LOVABLE_SYNC_CHECKLIST D2–D3):
  - [ ] Login – registrering och inloggning
  - [ ] Home – topplistan laddar
  - [ ] Swipe – kort laddar; Like/Pass ger inte krasch
  - [ ] Pricing – klick på köp ger redirect till Stripe eller tydligt fel
  - [ ] /contact, /top – sidor laddar
  - [ ] ErrorBoundary – krasch visar "Försök igen"
- [ ] Kontrollera Stripe webhooks fungerar (stripe-webhook deployad, secret satt)
- [ ] Verifiera databasanslutning (tabeller profiles, therapists, swipes; RLS)
- [ ] Testa användarregistrering
- [ ] Testa payment flow (checkout → Stripe → webhook → premium aktiv)
- [ ] Kontrollera error logs i Lovable dashboard

**Referens:** LOVABLE_SYNC_CHECKLIST D2 (snabbtest), D3 (Supabase).
