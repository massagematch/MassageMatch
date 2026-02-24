# Lovable: Checklista så frontend och backend synkar utan fel

---

## ⚠️ INSTRUKTION FÖR LOVABLE – LÄS FÖRST

**Lovable ska IMPLEMENTERA – inte göra om.**

- **Implementera** = ta koden från GitHub och behålla den som den är. Utför punkt för punkt.
- **Göra om** = skriva ny kod, ändra struktur, ta bort eller ersätta filer. Det ska Lovable **inte** göra.

**Arbeta igenom checklistan steg för steg, en punkt i taget (A1 → A2 → A3 → A4 → B1 → B2 → B3 → C1 → C2 → D).** Kryssa av varje punkt när den är klar. Hoppa inte över steg. Om något av detta saknas eller har tagits bort får användare fel eller sidan fungerar inte.

---

## A. Frontend – filer Lovable MÅST behålla (ta inte bort, skriv inte över)

### A1. Felhantering (annars kraschar eller fastnar användare)

| Fil | Krävs | Kontroll |
|-----|-------|----------|
| `src/main.tsx` | Ja | Innehåller `try { initAnalytics() } catch` och `if (!rootEl)` innan `createRoot`. |
| `src/components/ErrorBoundary.tsx` | Ja | Har `retryKey` i state och `key={this.state.retryKey}` på children (så "Försök igen" remountar). |
| `src/components/Layout.tsx` | Ja | Innehåller `<ErrorBoundary><Outlet /></ErrorBoundary>` i `<main>`. |
| `src/hooks/useUniversalBuy.ts` | Ja | Try/catch kring hela checkout; kastar "Network error. Please try again." vid nätverksfel, "Checkout failed. Please try again." vid andra fel. |
| `src/pages/Home.tsx` | Ja | load() i useEffect är i try/catch; vid fel: `setTopTherapists([])`. |
| `src/pages/Swipe.tsx` | Ja | load() har try/catch/finally; `setListLoading(false)` i finally; vid fel: `setTherapists([])`. |

### A2. Routes och sidor (annars 404 eller trasiga flöden)

| Fil / Route | Krävs | Kontroll |
|-------------|-------|----------|
| `src/App.tsx` | Ja | Routes: `/login`, `/contact`, `/top`, `/`, `/swipe`, `/pricing`, `/dashboard`, `/profile`, `/unlocked-profiles`, `/faq`, `/:city`, `/admin` (+ underroutes). Lazy imports för alla sidor. |
| `src/pages/Contact.tsx` + `Contact.css` | Ja | Route `/contact` – kontaktsida (e-postlänk, "Back to Login"). |
| `src/pages/TopPage.tsx` + `TopPage.css` | Ja | Route `/top` – publik topplista (suddiga kort, klick → Login). |
| `src/pages/cities/CityPage.tsx` | Ja | Route `/:city` – stadssida. |

### A3. Public (annars fel på ads / SEO)

| Fil | Krävs | Kontroll |
|-----|-------|----------|
| `public/ads.txt` | Ja | Innehåller Adnium (10183.xml.4armn.com, 11745.xml.4armn.com, pubid=1002887). |
| `index.html` | Ja | Premium-check för annonser; inga annonser för premium-användare. |

### A4. Backend-anrop frontend gör (Supabase måste ha detta)

Frontend anropar dessa – om de saknas i Supabase får användaren fel:

| Typ | Namn | Används i |
|-----|------|-----------|
| Edge Function | `create-checkout` | Köp (Pricing, Premium, UnlockModal, PaywallModal, ExitIntentPopup, UnlockedProfiles). **Måste finnas.** |
| Edge Function | `send-welcome` | Login (efter signup), Profile. |
| Edge Function | `swipe-use` | useSwipe (Like/Pass). **Måste finnas.** |
| Edge Function | `notify-push` | useSwipe (push "Ny like!"). |
| Edge Function | `apply-promo` | PromoCodeInput (NEWTHERAPIST90). |
| Edge Function | `chat-query` | ChatBubble. |
| Edge Function | `validate-social` | useSocialValidation (Profile). |
| Edge Function | `ai-recommendations` | Dashboard. |
| RPC | `get_therapists_visible` | Home, Swipe, CityPage, TopPage. **Måste finnas.** |
| RPC | `nearby_therapists` | Dashboard. |
| RPC | `get_referral_leaderboard` | Dashboard. |

---

## B. Backend (Supabase) – Lovable bygger inte detta; måste finnas i samma projekt

Lovable bygger bara frontend. Supabase (migrations + Edge Functions) måste vara klart i samma Supabase-projekt som frontend använder (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).

### B1. Migrations (kör i Supabase SQL Editor i nummerordning)

Alla 20 migrations måste vara körda. Annars saknas tabeller/RPC och frontend får fel.

- [ ] 1–7: Bas, RLS, realtime, cron, pricing/roles, superadmin, setup
- [ ] 8–12: Gamification, social validation, Thailand locations, unlock, tinder (notifications, nearby_therapists)
- [ ] 13–16: Therapist images, chat schema, customer_images, get_therapists_visible
- [ ] 17–20: Age verification, referral, referral leaderboard, push_subscriptions

**Katalog:** `supabase/migrations/` (eller enligt README – filerna 20260220000001_... till 20260220000020_...).

### B2. Edge Functions som MÅST vara deployade

| Function | Varför |
|----------|--------|
| `create-checkout` | Alla köp – utan den får användare fel vid Premium/Unlock/Pricing. |
| `stripe-webhook` | Tar emot Stripe-betalningar; sätter plan_expires, unlock, notiser. |
| `swipe-use` | Like/Pass; anropar send-like/send-match. |
| `apply-promo` | NEWTHERAPIST90 på Pricing. |
| `send-welcome` | Välkomstmail efter registrering. |

**Övriga (bra att ha):** `notify-push`, `ai-recommendations`, `chat-query`, `validate-social`, `validate-thailand-bounds`.  
**Resend-email (om ni använder e-post):** deploya `send-register`, `send-payment`, `send-like`, `send-match`, `send-contact` om de finns i repot och anropas från stripe-webhook/swipe-use.

### B3. Supabase Secrets (Dashboard → Edge Functions → Secrets)

Sätt dessa – **aldrig** i Lovable/frontend:

- [ ] `STRIPE_SECRET_KEY` (create-checkout, stripe-webhook)
- [ ] `STRIPE_WEBHOOK_SECRET` (stripe-webhook)
- [ ] `RESEND_API_KEY` (om send-welcome/send-payment etc. används)
- [ ] `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (om notify-push används)

---

## C. Miljövariabler – var vad ska sättas

### C1. Lovable (frontend) – endast VITE_*

Dessa ska sättas i Lovable projekts inställningar. Inga hemligheter här.

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_STRIPE_UNLOCK_PROFILE`, `VITE_STRIPE_UNLIMITED_12H` (obligatoriska för checkout)
- [ ] Övriga Stripe Price IDs om ni använder dem: `VITE_STRIPE_THERAPIST_*`, `VITE_STRIPE_SALONG_*`, `VITE_STRIPE_UNLIMITED_12H_79`, etc.
- [ ] Valfritt: `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`, `VITE_VAPID_PUBLIC_KEY`

### C2. Aldrig i Lovable

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `VAPID_PRIVATE_KEY` – endast i Supabase Secrets.

---

## D. Verifiering efter Pull + deploy

Kryssa av efter varje Pull och efter deploy:

### D1. Bygg och typkontroll

- [ ] `npm run typecheck` – inga fel.
- [ ] `npm run build` – lyckas.

### D2. Snabbtest i webbläsare

- [ ] **Login** – registrering och inloggning fungerar (profil skapas/uppdateras).
- [ ] **Home** – topplistan laddar (eller tom vid fel, ingen evig "Loading…").
- [ ] **Swipe** – kort laddar (eller tom lista); Like/Pass ger inte krasch.
- [ ] **Pricing** – klick på köp ger redirect till Stripe eller tydligt felmeddelande (t.ex. "Network error. Please try again."), inte rå fel.
- [ ] **/contact** – sidan laddar, formulär syns.
- [ ] **/top** – sidan laddar.
- [ ] **ErrorBoundary** – vid krasch på en sida ska felmeddelande visas med "Försök igen"; klick ska remounta innehållet. I Layout ska header/nav fortfarande fungera så användaren kan navigera bort.

### D3. Backend (Supabase)

- [ ] Supabase Dashboard: Tabellerna `profiles`, `therapists`, `swipes` finns och RLS är aktiverat.
- [ ] Edge Functions: `create-checkout` och `stripe-webhook` är deployade; secrets satta.
- [ ] RPC `get_therapists_visible` finns (migration 16) och returnerar data för anonym/inloggad användare enligt RLS.

---

## Sammanfattning – vad Lovable ofta missar

1. **Ta bort eller skriva över** de 6 filerna i A1 (main.tsx, ErrorBoundary, Layout, useUniversalBuy, Home, Swipe) → användare får kraschar eller evig laddning.
2. **Glömma** att Supabase har migrations 1–20 och att `create-checkout` + `stripe-webhook` + `swipe-use` är deployade → 500/404 eller "function not found" vid köp/swipe.
3. **Sätta hemligheter** (t.ex. STRIPE_SECRET_KEY) i Lovable istället för i Supabase → risk att de läcker i källkoden.
4. **Sakna** `public/ads.txt` eller rätt `index.html` (premium-check) → fel annonser eller SEO.

**Efter varje Pull:** gå igenom A1–A4, kör D1, och kontrollera att B1–B2 är uppfyllda i Supabase. **Implementera – gör inte om.** Då synkar front och backend utan fel.
