# Therapist/Freelance + Legal: Implementation for Lovable

Use this together with **LOVABLE_IMPLEMENTATION.md**. Ensures therapist 3-month free code, timer, visibility rule, UI terminology, and legal disclaimer work front + backend.

---

## Checklist

1. [ ] **Migration 16** applied: `get_therapists_visible` RPC (therapists with `plan_expires > now()` only).
2. [ ] **Edge Function apply-promo** deployed; no extra secrets.
3. [ ] **UI terminology:** "Therapist/Freelance", "therapists/freelancers" in Login, Pricing, Home, FAQ, Layout role badge, PromoCodeInput.
4. [ ] **FAQ #legal** section + styles; footer "FAQ & Regler | thaimassagematch@hotmail.com".
5. [ ] **Login:** Checkbox "I agree to the rules & FAQ" (link to `/faq#legal`) required for sign-up.
6. [ ] **Contact email** everywhere: thaimassagematch@hotmail.com (no support@).

---

## 1. Backend

### Migration 16 (if not already applied)

File: `supabase/migrations/20260220000016_therapist_visible_and_promo.sql`

- RPC `get_therapists_visible(p_city)` returns only therapists whose profile has `plan_expires > now()` and not banned.
- Used by Home (top list) and Swipe (customer list). Without active plan, therapist does **not** appear in swipe/search.

### Edge Function: apply-promo

- **Path:** `supabase/functions/apply-promo/index.ts`
- **Body:** `{ "code": "NEWTHERAPIST90" }` (or valid code from `discount_codes` with `plan_type = 'premium'`, `discount_type = 'free_months'`).
- **Auth:** Bearer token required.
- **Logic:** Require profile `role === 'therapist'`, `promo_used === false`. Set `plan_expires = now() + 90 days`, `plan_type = 'premium'`, `promo_used = true`, `visibility_score = 3`. Upsert `therapists` with `id = user.id`, `name = email prefix`.
- **Deploy:** `supabase functions deploy apply-promo`

---

## 2. Frontend

### Terminology (display only; keep `role = 'therapist'` and table name `therapists` in code)

- Login role dropdown: option text **"Therapist/Freelance"**.
- Login subtitle: **"Connect with trusted therapists/freelancers"**.
- Home: **"Top therapists/freelancers in Phuket"**, **"Discover therapists/freelancers"**.
- Pricing: **"Therapist/Freelance Plans"**, **"Therapist/Freelance Premium 1 Month"**, **"Therapist/Freelance Premium 3 Months"**.
- Layout role badge: if `role === 'therapist'` show **"therapist/freelance"**.
- PromoCodeInput banner: **"Therapist/Freelance FREE 3 months"** + "Timer on Profile; after expiry pay Premium to appear in swipe/search."
- FAQ: keep existing therapist/freelance wording.

### Legal

- **FAQ:** Add section with `id="legal"` (or `#legal`):
  - Heading: **Regler & Användaransvar**
  - Text: Genom registrering godkänner du: (1) Följa Thai lag, inga sexuella tjänster, (2) Therapists/freelancers/salonger ansvarar för allt, (3) Kunder endast legal massage, (4) MassageMatch = matchmaking, ej ansvarig. Rapportera: thaimassagematch@hotmail.com. SV: Alla ansvarar för licens/lag; plattform ej ansvarig.
- **Login (sign-up):** Checkbox "I agree to the [rules & FAQ](/faq#legal)" required before submit; show error if unchecked.
- **Footer:** In AdminFooterButton (or global footer): link **FAQ & Regler** to `/faq#legal`, and **thaimassagematch@hotmail.com** as mailto.

### Timer

- **PlanTimer** on Profile (and Pricing for therapist) already shows "Premium active: Xd Xh left" from `profile.plan_expires`. No code change needed; ensure migration 16 and apply-promo are deployed so that after expiry they drop out of swipe/search.

---

## 3. Tests (Lovable)

**Frontend**

1. Register as Therapist/Freelance → role saved; checkbox required for sign-up.
2. Pricing: Therapist/Freelance plans and promo banner visible; enter NEWTHERAPIST90 → apply-promo succeeds; refetch shows timer.
3. Profile: Timer shows "Premium active" until plan_expires.
4. FAQ: #legal section and footer link open; Login checkbox link goes to FAQ#legal.
5. After plan_expires (or test with past date): therapist not in customer Swipe or Home top list.

**Backend**

1. `get_therapists_visible(null)` returns only rows with profile.plan_expires > now().
2. apply-promo: valid code for therapist → plan_expires set, promo_used true; therapists row exists.

**E2E**

- New user → Register as Therapist/Freelance → agree to rules → sign up → go to Pricing → apply NEWTHERAPIST90 → Profile shows timer → customer sees them in Swipe. After expiry (or mock), customer no longer sees them.

---

## 4. Files touched (reference)

- `supabase/functions/apply-promo/index.ts` (new)
- `supabase/migrations/20260220000016_therapist_visible_and_promo.sql`
- `src/pages/Login.tsx` (checkbox, agreedToRules, terminology)
- `src/pages/Login.css` (login-rules-check)
- `src/pages/Home.tsx` (terminology)
- `src/pages/Pricing.tsx` (terminology)
- `src/pages/FAQ.tsx` (legal section), `src/pages/FAQ.css` (faq-legal)
- `src/components/Layout.tsx` (role badge)
- `src/components/AdminFooterButton.tsx` + `.css` (footer links)
- `src/components/PromoCodeInput.tsx` (terminology)
- `README.md` (migration 16, apply-promo, Therapist/Freelance + legal section)

---

Commit: **"Therapist/Freelance: 3-month free code, apply-promo, legal disclaimer, UI terminology, migration 16"**  
Push to main → Lovable sync → deploy apply-promo and run migration 16.
