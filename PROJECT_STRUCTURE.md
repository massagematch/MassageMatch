# Projektstruktur – var du hittar vad

Översikt över mappar och ansvar så att koden är lätt att hitta och underhålla.

---

## `src/`

### `src/App.tsx`
- Root-komponent: AuthProvider, routes, globala komponenter (ExitIntentPopup, WhatsAppButton, PWAInstallBanner, ChatBubble).
- Routes definieras här; path-konstanter finns i `src/constants/routes.ts`.

### `src/main.tsx`
- Entry point: ErrorBoundary, BrowserRouter, initAnalytics, root-mount. Ändra inte bort try/catch eller #root-kontroll.

### `src/constants/`
- **`routes.ts`** – alla route paths (ROUTES.LOGIN, ROUTES.PRICING, etc.). Använd dessa istället för hårdkodade strängar.

### `src/components/`
- **Layout** – header, nav, Outlet, ErrorBoundary runt innehåll. Används av alla inloggade sidor.
- **Modaler:** PaywallModal, UnlockModal (mapp med index.ts + tsx + css).
- **UI:** AccessTimer, PlanTimer, NotificationBell, StreakBadge, OptimizedImage, LocationSelector, MapButton, PromoCodeInput.
- **Globala:** ExitIntentPopup (endast /login), WhatsAppButton, PWAInstallBanner, ChatBubble, SEOHead, SchemaMarkup.
- **Admin:** AdminRoute, AdminFooterButton.
- **Swipe:** SwipeCard (mapp med index + tsx + css).
- **Felhantering:** ErrorBoundary – viktig för att sidan inte ska krascha; retry remountar innehåll.

### `src/contexts/`
- **AuthContext** – user, profile, loading, refetchProfile, signOut. Använd useAuth() överallt som behöver auth.
- **RealtimeContext** – realtime-anslutning för profil/swipes.

### `src/hooks/`
- **useUniversalBuy** – Stripe checkout (redirect). Try/catch för användarvänliga fel – ändra inte bort.
- **useSwipe** – Like/Pass, anropar Edge Function swipe-use.
- **useABTest**, **usePushSubscription**, **usePWAInstall**, **useSocialValidation**.

### `src/lib/`
- **supabase** – Supabase-klient och typer (Profile, Swipe). Ingen hemlighet här.
- **analytics** – PostHog/events.
- **abTesting**, **admin**, **gamification**, **geo**, **imageOptimizer**, **offlineCache**, **retry**, **thailandLocations**, **cityConfig**.

### `src/pages/`
- **Publik:** Login, Contact, TopPage, PWAInstallPage.
- **Efter inloggning (Layout):** Home, Swipe, Premium, Pricing, Dashboard, Profile, UnlockedProfiles, FAQ.
- **Städer:** `cities/CityPage.tsx` – route `/:city`.
- **Admin:** `admin/AdminDashboard`, AdminUsers, AdminReviews, AdminContent, AdminStripe, AdminImpersonate.

### `src/test/`
- Enhetstester (auth, location, stripe-timer, swipe-persist). Kör med `npm run test`.

---

## Backend (utanför `src/`)

### `supabase/functions/`
- Edge Functions (create-checkout, stripe-webhook, swipe-use, send-welcome, apply-promo, notify-push, ai-recommendations, chat-query, validate-social, validate-thailand-bounds, etc.).
- **`_shared/`** – delad kod (t.ex. resend).

### `supabase/migrations/`
- SQL-migrationer 01–20. Måste köras i ordning i Supabase. Se README.

---

## Public & config

- **`public/`** – ads.txt, manifest.json, sw.js, robots.txt, sitemap.xml, ikoner.
- **`index.html`** – entry HTML, annonslogik (premium = inga annonser).
- **`.env.example`** – lista över VITE_* och Supabase Secrets. Använd för Lovable/Supabase-setup.

---

## Checklistor för Lovable

- **`LOVABLE_SYNC_CHECKLIST.md`** – huvudchecklista så front och backend synkar (filer, migrations, Edge Functions, env, verifiering).
- **`LOVABLE_PULL_CHECKLIST.md`** – detaljerad fillista och snabbkontroll efter deploy.

---

## Regler för att undvika krasch

1. **Ta inte bort** felhantering i main.tsx, ErrorBoundary, Layout, useUniversalBuy, Home, Swipe (se LOVABLE_SYNC_CHECKLIST).
2. **Använd** `ROUTES` från `src/constants/routes.ts` för paths där det är möjligt.
3. **Lazy routes** – alla sidor laddas via lazy() i App.tsx; fallback är PageFallback ("Loading…").
4. **Supabase** – alla anrop (RPC, Edge Functions, from()) ska ha try/catch eller .catch där det är kritiskt (checkout, listhämtning).
