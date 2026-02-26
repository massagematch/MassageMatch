# Lovable – vad som ska hämtas från GitHub

**Branch:** `main` (Lovable ska vara kopplad till denna branch)

---

## ⚠️ INSTRUKTION FÖR LOVABLE – LÄS FÖRST

**Lovable ska IMPLEMENTERA – inte göra om.**

- **Implementera** = ta koden från GitHub och behålla den som den är. Utför punkt för punkt.
- **Göra om** = skriva ny kod, ändra struktur, ta bort eller ersätta filer. Det ska Lovable **inte** göra.

**Arbeta igenom checklistan steg för steg, en punkt i taget.** Kryssa av varje punkt när den är klar. Hoppa inte över steg.

**För full synk front + backend:** Se **`LOVABLE_SYNC_CHECKLIST.md`** (A1–A6, B1–B3, C1–C2, D, sammanfattning). **För terminology:** Se A6 i LOVABLE_SYNC_CHECKLIST och **`IMPLEMENTATION_STATUS.md`**.

---

---

## 🔴 MÅST implementeras – felhantering & stabilitet (inga kraschar för användare)

Dessa filer **måste** vara uppdaterade i Lovable så att användare inte får fel eller fastnar:

| Fil | Vad det gör |
|-----|-------------|
| **`src/main.tsx`** | Try/catch kring `initAnalytics()`; koll på `#root` – om saknas visas "App failed to load" istället för krasch. |
| **`src/components/ErrorBoundary.tsx`** | Retry-knappen **remountar** innehållet (retryKey) så att "Försök igen" faktiskt laddar om sidan. |
| **`src/components/Layout.tsx`** | **ErrorBoundary** runt `<Outlet />` – vid krasch på en sida visas fel bara i innehållsområdet; header/navigation fungerar så användaren kan klicka vidare. |
| **`src/hooks/useUniversalBuy.ts`** | Try/catch kring checkout: nätverksfel → "Network error. Please try again."; andra fel → "Checkout failed. Please try again." (inga rå fel i UI). |
| **`src/pages/Home.tsx`** | Try/catch kring `get_therapists_visible` – vid fel sätts listan till tom istället för oändlig laddning. |
| **`src/pages/Swipe.tsx`** | Try/catch + **finally** så att `setListLoading(false)` alltid körs; vid fel sätts listan till tom. Användaren fastnar inte på "Loading…". |

**Checklista Lovable (kryssa av efter pull):**
- [ ] `src/main.tsx` – innehåller `try { initAnalytics() } catch` och `if (!rootEl)`-kontroll
- [ ] `src/components/ErrorBoundary.tsx` – innehåller `retryKey` och `key={this.state.retryKey}` på children
- [ ] `src/components/Layout.tsx` – `<ErrorBoundary><Outlet /></ErrorBoundary>` i main
- [ ] `src/hooks/useUniversalBuy.ts` – try/catch med "Network error" och "Checkout failed" meddelanden
- [ ] `src/pages/Home.tsx` – load() i try/catch, setTopTherapists([]) vid fel
- [ ] `src/pages/Swipe.tsx` – load() i try { ... } catch { setTherapists([]) } finally { setListLoading(false) }

### A5. Köp kräver inloggning (ta inte bort)
- [ ] `src/pages/Pricing.tsx` – handleCheckout kollar `!user?.id` → navigate(ROUTES.LOGIN). Köpknappar disabled när `!user?.id`.
- [ ] `src/pages/Premium.tsx` – samma; knapp disabled när `!user?.id`.
- [ ] `src/pages/UnlockedProfiles.tsx` – handleExtend kollar user; Extend-knapp disabled när `!user?.id`.
- [ ] `src/components/PaywallModal/PaywallModal.tsx` – handleUnlimited redirectar till login när `!user?.id`.
- [ ] `src/components/UnlockModal/UnlockModal.tsx` – handleUnlock redirectar; knapp disabled när `!user?.id`.
- [ ] `src/components/ExitIntentPopup.tsx` – visar Claim-knapp endast när `user` finns.

---

## ✅ Övriga filer att hämta (frontend)

### Sidor & komponenter
- [ ] `src/pages/Contact.tsx` + `src/pages/Contact.css` – Kontaktsida (route `/contact`)
- [ ] `src/pages/TopPage.tsx` + `src/pages/TopPage.css` – Publik topplista (route `/top`)
- [ ] `src/pages/cities/CityPage.tsx` – Stadssida (route `/:city`)
- [ ] `src/App.tsx` – routes `/contact`, `/top`, `/`, `/swipe`, `/pricing`, etc. Lazy imports för alla sidor. `AdminFooterButton` renderas **globalt här** (syns på ALLA sidor inkl. landningssidan). Använder `src/constants/routes.ts`.
- [ ] `src/constants/routes.ts` – Route-konstanter (ROUTES.LOGIN, ROUTES.PRICING, etc.). **Alla** filer använder ROUTES – inga hardcodade sökvägar.
- [ ] `src/components/Layout.tsx` – ErrorBoundary runt Outlet. **AdminFooterButton ska INTE finnas här** (renderas i App.tsx istället).
- [ ] `src/components/AdminFooterButton.tsx` – Discreet footer med Admin-login; **ingen hårdkodad admin-lösenord** – användaren skriver in lösenord själv.
- [ ] `src/components/ExitIntentPopup.tsx` – Popup **enbart på /login**; trigger: `visibilitychange` + `mouseleave clientY <= 0`; max 1 gång/session.
- [ ] `src/pages/Login.tsx` – länkar "Contact us", "See top 10 freelancers" under formuläret

### Terminology (A6)
- [ ] **A6 Terminology** – Alla användarvisade therapist/therapists → therapist/freelance och therapists/freelancers (se LOVABLE_SYNC_CHECKLIST A6 och IMPLEMENTATION_STATUS.md).

### Public & index
- [ ] **`public/ads.txt`** – Adnium (10183 + 11745, pubid 1002887). Ska serveras som /ads.txt
- [ ] **`index.html`** – annonslogik (premium = inga annonser), Adnium-script, SEO

### SEO (react-helmet-async)
Lovable ska **implementera** (inte ta bort eller göra om):
- [ ] **`src/main.tsx`** – `HelmetProvider` från `react-helmet-async` wrappar `<App />` (inom BrowserRouter). Paketet `react-helmet-async` ska vara installerat.
- [ ] **`index.html`** – canonical och og:url (samt hreflang, og:image) använder **https://massagematchthai.com** (inte massagematch.lovable.app).
- [ ] **`src/App.tsx`** – global `<SEOHead />` är **borttagen** (ersatt av per-sida Helmet).
- [ ] **Per-sida Helmet** i: Home, Login, Contact, TopPage, Swipe, Premium, Pricing, Dashboard, Profile, UnlockedProfiles, FAQ, CityPage – med sidpecifik title, description, canonical (https://massagematchthai.com + path) och og/twitter där det användes.
- [ ] **`src/pages/cities/CityPage.tsx`** – dynamisk canonical och title/description utifrån stad (ingen manuell `document.title`/meta i useEffect).

Lovable ska **inte**: ta bort `react-helmet-async`, ersätta Helmet med en enda global titel/description för hela sajten, eller återinföra global SEOHead som skriver över sidtitlar.

### Favicon & site icon (Google)
Lovable ska **implementera** (favicon kvadratisk 1:1, crawlbar på domänen; Google rekommenderar >48×48):
- [ ] **`public/`** – Favicon-filer finns: `favicon.ico`, `favicon-48.png`, `favicon-96.png`, `favicon-192.png` (genererade från logotypen, kvadratiska).
- [ ] **`index.html`** – I `<head>` finns: `<link rel="icon" href="/favicon.ico">`, `<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">`, `<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">`, `<link rel="apple-touch-icon" sizes="192x192" href="/favicon-192.png">`.
- [ ] **`index.html`** – `og:image` pekar på `https://massagematchthai.com/favicon-192.png` (så att delningar visar logotypen).
- [ ] **`public/manifest.json`** – PWA-ikoner pekar på `/favicon-96.png` och `/favicon-192.png` (inte `/icons/icon-*` om de inte finns).

Efter deploy: verifiera att `https://massagematchthai.com/favicon.ico` svarar 200. I Google Search Console: URL-inspektion av startsidan → "Begär indexering" så Google snabbare plockar upp faviconen.

### Supabase Edge Functions (deployas i Supabase, inte Lovable)
- [ ] `supabase/functions/_shared/resend.ts`
- [ ] `supabase/functions/send-register/index.ts`, `send-payment`, `send-like`, `send-match`, `send-contact`
- [ ] `supabase/functions/stripe-webhook/index.ts`, `swipe-use/index.ts` (uppdaterade)

---

## Snabbkontroll efter deploy i Lovable

1. **Pull latest** från GitHub, branch `main`.
2. **Bygg** – `npm run build` / Lovable build ska lyckas.
3. **ErrorBoundary:** Simulera fel (t.ex. kasta i en komponent) – sidan visar "Något gick fel" med knapp "Försök igen"; klicka → innehållet laddas om. På en inre sida (t.ex. Swipe) ska header fortfarande synas och man kan navigera bort.
4. **Checkout:** Vid nätverksfel vid köp ska användaren se "Network error. Please try again." (inte tekniska fel).
5. **Home/Swipe:** Vid trasig API ska listor bli tomma eller visa fel – ingen evig "Loading…".
6. **Routes** `/contact` och `/top` – fungerar; **ads.txt** – innehåller Adnium-rader.

*Edge Functions deployas via Supabase CLI/Dashboard, inte via Lovable.*
