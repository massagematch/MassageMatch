# Pre-Launch Checklist – MassageMatch Thailand

Sammanställning före go-live. Kryssa av när alla krav är uppfyllda.

---

## Dokumentation & status

- [ ] Alla items i TODO.md är genomförda eller flyttade till backlog
- [ ] ERRORS.md har inga "Critical" eller "High" öppna errors
- [ ] TESTING_LOG.md visar att kritiska funktioner är testade
- [ ] COMPLETED.md är uppdaterad med senaste ändringar
- [ ] IMPLEMENTATION_STATUS.md är uppdaterad (Completed / To do)

---

## Kod & deploy

- [ ] All kod är pushad till GitHub
- [ ] `npm run typecheck` – inga fel
- [ ] `npm run build` – lyckas
- [ ] Lovable deployment är verifierad (om kopplad)
- [ ] Se LOVABLE_SYNC_CHECKLIST D (verifiering)

---

## Backend (Supabase)

- [ ] Backup av Supabase-databas tagen
- [ ] Migrations 1–20 körda (LOVABLE_SYNC_CHECKLIST B1)
- [ ] Edge Functions deployade: create-checkout, stripe-webhook, swipe-use, apply-promo, send-welcome (B2)
- [ ] Supabase Secrets satta: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, VAPID_* (B3)
- [ ] RPC get_therapists_visible finns och returnerar data (D3)

---

## Kritiska områden (referens)

| Område | Vad | Referens |
|--------|-----|----------|
| Användarhantering & profiler | Profiler sparas; bilder laddas; therapist/customer | LOVABLE_SYNC_CHECKLIST A1–A2 |
| Stripe Payment | Checkout → redirect → webhook → premium aktiv | A4, B2; TESTING_CHECKLIST |
| Rabattkoder | NEWTHERAPIST90, timer på Profile | apply-promo; TESTING_CHECKLIST |
| Köp kräver inloggning | Oinloggade → register-first popup / redirect | A5; PaywallModal, Pricing, Premium |
| Swipe | Like/Pass; lista laddar; fel hanteras | A1, A4; TESTING_CHECKLIST |
| Bildhantering | Uppladdning, Storage, RLS | B1; therapist-images, customer_images |
| Annonser | Premium-check; inga annonser för premium | index.html; A3 |
| Backend-synk | RLS, realtime, triggers | B1; VERIFICATION_CHECKLIST |
| Frontend/UI | Responsivitet, touch, formulär | TESTING_CHECKLIST (Performance) |
| Auth & säkerhet | Login, sessioner, skyddade routes | A5; LOVABLE_SYNC_CHECKLIST |
| Performance & loading | Sidladdning, lazy load, loading states | TESTING_CHECKLIST |
| Error handling | Felmeddelanden, Error Boundary, 404 | A1; TESTING_CHECKLIST |

---

## Sista steg

- [ ] Monitoring och error tracking aktiverat (om tillgängligt)
- [ ] **GO LIVE!**
