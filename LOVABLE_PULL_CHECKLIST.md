# Lovable – vad som ska hämtas från GitHub

**Branch:** `main` (Lovable ska vara kopplad till denna branch)

**För full synk front + backend utan fel:** Se **`LOVABLE_SYNC_CHECKLIST.md`** (migrations, Edge Functions, secrets, env, verifiering).

**Viktigt:** Efter Pull latest i Lovable – bygg och deploya. Alla filer nedan måste finnas i repot som Lovable bygger från. Ändra inte bort felhantering eller optimeringar.

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

---

## ✅ Övriga filer att hämta (frontend)

### Sidor & komponenter
- [ ] `src/pages/Contact.tsx` + `src/pages/Contact.css` – Kontaktsida
- [ ] `src/App.tsx` – route `/contact`, lazy Contact
- [ ] `src/components/Layout.tsx` – länk "Contact" i header (redan med ErrorBoundary ovan)
- [ ] `src/pages/Login.tsx` – länk "Contact us" under formuläret

### Public & index
- [ ] **`public/ads.txt`** – Adnium (10183 + 11745, pubid 1002887). Ska serveras som /ads.txt
- [ ] **`index.html`** – annonslogik (premium = inga annonser), Adnium-script, SEO

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
6. **Route** `/contact` – fungerar; **ads.txt** – innehåller Adnium-rader.

*Edge Functions deployas via Supabase CLI/Dashboard, inte via Lovable.*
