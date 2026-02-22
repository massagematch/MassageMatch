# MassageMatch Thailand – Implementation Guide

Komplett guide för Error Boundaries, Offline Mode, Push Notifications och Lazy Loading. Anpassat för Thailand 4G, PC och mobil.

---

## 1. Error Boundaries (Svensk/Thai fallback)

**Fil:** `src/components/ErrorBoundary.tsx` + `src/components/ErrorBoundary.css`

- Fångar alla React-renderfel så att appen inte kraschar.
- Visar fallback-UI på **svenska**, **thai** eller **engelska** beroende på `navigator.language`.
- Texter: "Något gick fel" / "เกิดข้อผิดพลาด" / "Something went wrong" + kontakt thaimassagematch@hotmail.com.
- Knapp "Försök igen" / "ลองอีกครั้ง" / "Try again" återställer state.

**Användning:** Redan inkopplad i `src/main.tsx` runt `<App />`:

```tsx
<ErrorBoundary>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</ErrorBoundary>
```

---

## 2. Offline Mode (IndexedDB cache)

**Filer:** `src/lib/offlineCache.ts`, används i `AuthContext` och `Swipe`.

- **Databas:** `mm_offline_v1` med stores `profile` (keyPath: `user_id`) och `swipe_list`.
- **Profile:** Cachas vid lyckad Supabase-fetch; vid offline eller timeout används cache (max 24h).
- **Swipe-lista:** Cachas efter `get_therapists_visible` / customer-lista; vid offline används cache (max 1h).
- **Online-check:** `isOnline()` använder `navigator.onLine`.

**Integrering:**
- `AuthContext.fetchProfile`: vid offline → `getCachedProfile(uid)`; vid success → `setCachedProfile(uid, p)`; vid timeout → fallback till cache.
- `Swipe.tsx` load: vid offline → `getCachedSwipeList()`; vid success → `setCachedSwipeList(list)`.

---

## 3. Push Notifications ("Ny like! Anna 1.8km Phuket")

**Backend:**
- **Migration 20:** `supabase/migrations/20260220000020_push_subscriptions.sql` – tabell `push_subscriptions (user_id, subscription jsonb)`.
- **Edge Function:** `supabase/functions/notify-push/index.ts` – tar emot `target_user_id`, `title`, `body`; läser subscription; skickar Web Push (kräver VAPID-nycklar).
- **Secrets:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` i Supabase Edge Functions.

**Frontend:**
- **Hook:** `src/hooks/usePushSubscription.ts` – anropar `Notification.requestPermission()`, prenumererar med `VITE_VAPID_PUBLIC_KEY`, sparar subscription i `push_subscriptions`.
- **Layout:** anropar `usePushSubscription(user?.id)` så att inloggade användare får push aktiverad.
- **Swipe:** vid lyckad like anropas `notify-push` med `target_user_id` (therapist), `title: "Ny like!"`, `body: "[Name] [distance]km [city]"`.
- **Service worker:** `public/sw.js` – lyssnar på `push` och visar `showNotification(title, body)`; `notificationclick` fokuserar/öppnar fönster.

**VAPID-nycklar (generera en gång):**
```bash
npx web-push generate-vapid-keys
```
- Sätt **public** i Lovable/env som `VITE_VAPID_PUBLIC_KEY`.
- Sätt **private** i Supabase Edge Function secrets som `VAPID_PRIVATE_KEY` och **public** som `VAPID_PUBLIC_KEY` (behövs i notify-push).

---

## 4. Lazy Loading (React.lazy + Suspense)

**Fil:** `src/App.tsx`

- Alla sidkomponenter (Login, Home, Swipe, Premium, Pricing, Dashboard, FAQ, Profile, UnlockedProfiles, Admin-* ) laddas med `React.lazy(() => import('@/pages/...'))`.
- `<Suspense fallback={<PageFallback />}>` runt `<Routes>`; fallback visar "Loading…".
- Vite gör redan code splitting (`manualChunks` i `vite.config.ts`); lazy ger ytterligare route-baserad splitting så att initial bundle blir mindre och första laddning snabbare på 4G.

---

## 5. Filstruktur (referens)

```
src/
  components/
    ErrorBoundary.tsx    # SV/TH/EN fallback
    ErrorBoundary.css
  lib/
    offlineCache.ts      # IndexedDB profile + swipe list
  hooks/
    usePushSubscription.ts
    useSwipe.ts          # anropar notify-push vid like
  contexts/
    AuthContext.tsx      # använder getCachedProfile/setCachedProfile
  pages/
    Swipe.tsx            # använder getCachedSwipeList/setCachedSwipeList, skickar likeMeta
  App.tsx                # React.lazy + Suspense
public/
  sw.js                  # push + notificationclick
supabase/
  migrations/
    20260220000020_push_subscriptions.sql
  functions/
    notify-push/
      index.ts
```

---

## 6. Environment variables

- **Client (Lovable / .env):**  
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` (valfritt för push).
- **Edge Function secrets:**  
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` för `notify-push`.

Se `.env.example` för full lista.

---

## 7. Thailand 4G – mål

- **Initial load:** &lt; 3 s (lazy loading + code splitting).
- **Cache hit (offline/retry):** &lt; 0,5 s (IndexedDB).
- **Push:** leverans i realtid när någon ger like.
- **Crashes:** 0 (Error Boundary fångar fel).
- **Mobil/PC:** samma kod; responsiv layout och touch-vänliga knappar.

Alla dessa features är redan implementerade i projektet; följ TESTING_CHECKLIST.md för verifiering.
