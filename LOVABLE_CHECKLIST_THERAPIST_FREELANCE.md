# Lovable Checklist: Therapist/Freelance Setup

Use this checklist to implement therapist/freelance features and push to GitHub. Follow in order.

---

## Pre-flight (code already in repo)

- [ ] Code changes are committed: Login.tsx (role in signUp, session navigate), Swipe.tsx (verified first), auth-webhook, migration 21
- [ ] Branch pushed to GitHub

---

## 1. Supabase Migrations

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Run migration **21** if not applied:
  - File: `supabase/migrations/20260220000021_verified_first_and_auth_webhook.sql`
  - Or paste: `get_therapists_visible` with `ORDER BY (t.verified_photo IS TRUE) DESC, t.created_at DESC`
- [ ] Verify: `SELECT * FROM get_therapists_visible(NULL) LIMIT 5` returns rows (or empty if no therapists)

---

## 2. Edge Function: auth-webhook

- [ ] Deploy: `supabase functions deploy auth-webhook`
- [ ] No secrets required

---

## 3. Database Webhook (therapist/salong sign-in without email verification)

- [ ] Supabase Dashboard → Database → Webhooks
- [ ] Create new webhook:
  - **Name:** `auth-webhook-therapist-confirm`
  - **Table:** `profiles`
  - **Events:** ☑ INSERT
  - **URL:** `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/auth-webhook`
  - Replace `<YOUR_PROJECT_REF>` with your project ref (e.g. `abcdefghij` from `https://abcdefghij.supabase.co`)

**Alternative (simpler, affects all users):** Auth → Providers → Email → disable "Confirm email"

---

## 4. Verify Therapist Sign-up Flow

- [ ] Open app → Login → Create account
- [ ] Select role: **Therapist/Freelance**
- [ ] Enter email + password, agree to rules, Sign up
- [ ] Expected: Either redirected in immediately, or message "Account created! Sign in with your email and password to continue."
- [ ] Sign in with same email/password → should work
- [ ] Go to Pricing → enter **NEWTHERAPIST90** → apply
- [ ] Profile shows "Premium active" timer
- [ ] Customer view: therapist appears in Swipe and Top 10

---

## 5. Verify Verified Users First

- [ ] Customer Swipe: therapists with verified photo (✓) appear before unverified
- [ ] Top 10 page: verified therapists listed first
- [ ] Therapist Swipe (customers): verified customers appear first

---

## 6. Push to GitHub

- [ ] `git status` – no uncommitted changes
- [ ] `git push origin main` (or your default branch)
- [ ] Lovable sync pulls latest
- [ ] Deploy from Lovable if needed

---

## Quick Reference

| Item | Command / Location |
|------|--------------------|
| Migration 21 | `supabase/migrations/20260220000021_verified_first_and_auth_webhook.sql` |
| Deploy auth-webhook | `supabase functions deploy auth-webhook` |
| Webhook URL | `https://<PROJECT_REF>.supabase.co/functions/v1/auth-webhook` |
| Promo code | `NEWTHERAPIST90` (3 months free) |

---

## Troubleshooting

- **Therapist can't sign in after sign-up:** Check Database Webhook is configured on `profiles` INSERT, or disable "Confirm email" in Auth.
- **Therapist not in Swipe/Top:** Apply NEWTHERAPIST90 on Pricing; check `plan_expires > now()` in profiles.
- **Verified not first:** Ensure migration 21 is applied; `get_therapists_visible` must have `ORDER BY (t.verified_photo IS TRUE) DESC`.
