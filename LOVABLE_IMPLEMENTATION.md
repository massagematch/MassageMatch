# Lovable Implementation Guide – MassageMatch Thailand

Use this after **Pull latest** from GitHub so front and backend stay in sync. Optimized for **PC and mobile**.

---

## 1. Backend (Supabase)

1. **Migrations:** Run in **Supabase SQL Editor** in order:
   - 1–17 (existing)
   - **18** `20260220000018_referral_referrer.sql` (referrer_id, referral_days)
   - **19** `20260220000019_referral_leaderboard.sql` (get_referral_leaderboard RPC)

2. **Edge Functions:** Deploy and set secrets:
   - `create-checkout`, `stripe-webhook`, `apply-promo`, etc.
   - Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`

3. **stripe-webhook:** Referral logic is already in code: when a user (B) who was referred pays, the referrer (A) gets +7 days Premium and referrals_count is incremented.

---

## 2. Frontend env (Lovable project settings)

Set all `VITE_*` used by the app, including:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_UNLOCK_PROFILE`, `VITE_STRIPE_UNLIMITED_12H`, `VITE_STRIPE_PREMIUM_PRICE_ID`
- **Optional A/B:** `VITE_STRIPE_UNLIMITED_12H_79` (for 50% users seeing ฿79 in exit popup)
- Other Stripe IDs: therapist, salong, boost (see README)

---

## 3. What’s included (no extra setup)

- **Legal:** FAQ#legal + Register checkbox + [Läs regler] link. Text: "Användare ansvarar för Thai lag/licens. Inga sexuella tjänster."
- **Wording:** "freelancers" / "freelance therapist" in UI; DB unchanged (role `therapist`, table `therapists`).
- **Exit intent:** "Top freelancers väntar!" + Stripe; A/B ฿99 vs ฿79 when env is set.
- **Referral:** Dashboard "📱 Dela → 7d Gratis Premium!" with copy link; signup with `?ref=user_id`; webhook gives referrer +7d.
- **Sitemap:** `public/sitemap.xml` (base + phuket, bangkok, pattaya, chiang-mai). **hreflang:** en, th, sv in index.html.
- **City routes:** `/phuket`, `/bangkok`, `/pattaya`, `/chiang-mai` → Home filtered by city.
- **Performance:** Code splitting (manualChunks), OptimizedImage (WebP params for Supabase storage), lazy loading.
- **Gamification:** Streak badges 1–5 days; referral leaderboard (top 10) on Dashboard.

---

## 5. Test checklist (front + backend sync) (front + backend sync)

- [ ] **Register:** Age 18–100 required; [Läs regler] opens `/faq#legal`; referrer: open `/login?ref=<user_id>`, register → profile has referrer_id.
- [ ] **Images:** Load &lt;1s; lazy loading; Supabase images use WebP params.
- [ ] **City routes:** `/phuket`, `/bangkok`, `/pattaya`, `/chiang-mai` show "Top freelancers in &lt;City&gt;" and filtered list.
- [ ] **Referral:** A shares link → B registers with link → B pays (e.g. 12h) → A gets +7d Premium (check plan_expires and referral_days/referrals_count).
- [ ] **Exit popup:** Mouse leave (desktop) shows "Top freelancers väntar!"; claim goes to Stripe; no console errors.
- [ ] **Legal:** Register checkbox + [Läs regler]; FAQ#legal shows correct text.
- [ ] **Wording:** "freelancers" in Home, Dashboard, FAQ; no "support@" (all thaimassagematch@hotmail.com).
- [ ] **Stripe/DB:** Payments fulfill plan; unlock creates row; referral +7d applied in webhook.
- [ ] **Console:** 0 errors on main flows (login, swipe, pricing, dashboard).
- [ ] **Mobile/PWA:** PWAInstallBanner; /install med Android/iPhone-instruktioner; SW + push + offline.
- [ ] **Lighthouse:** Aim 95+ Performance/Accessibility (run after deploy).

---

## 6. Deploy

1. Push to GitHub `main` (already done from Cursor).
2. In Lovable: **Pull latest**.
3. Trigger deploy. Ensure env vars are set for the deployed URL.
4. Verify production URL (e.g. https://massagematchthai.com), sitemap, and one payment + referral flow.

---

**Contact:** thaimassagematch@hotmail.com
