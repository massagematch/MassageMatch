# Implementation status – MassageMatch Thailand

Uppdatera denna fil när ändringar görs så Lovable/Cursor vet vad som är gjort och vad som återstår.

---

## Completed

- **A1–A5:** Felhantering, routes, public, backend-anrop, köp kräver inloggning (enligt LOVABLE_SYNC_CHECKLIST).
- **Checkout:** Timeout (`invokeCreateCheckoutWithTimeout`) + register-first popup i PaywallModal.
- **A6:** Terminology therapist/freelance i alla användarvisade texter (PaywallModal, Pricing, Profile, AdminContent, AdminUsers, AdminDashboard).

---

## To do (from checklist)

- **B1–B3:** Migrations (1–20), Edge Functions deployade, Supabase Secrets (om inte redan klart).
- **C1–C2:** Miljövariabler (Lovable: endast VITE_*; hemligheter endast i Supabase).
- **D:** Verifiering efter Pull/deploy: typecheck, build, snabbtest i webbläsare, Supabase-kontroll.

**Efter varje ändring:** Uppdatera Completed/To do i denna fil så att Lovable/Cursor vet var ni är.
