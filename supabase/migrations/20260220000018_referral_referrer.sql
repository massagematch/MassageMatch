-- Referral: referrer_id + referral_days (7d gratis premium till upphovsperson när B betalar)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referrer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_days int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_referrer_id ON public.profiles(referrer_id);

COMMENT ON COLUMN public.profiles.referrer_id IS 'User who referred this user (from ?ref= on signup)';
COMMENT ON COLUMN public.profiles.referral_days IS 'Extra premium days granted from referrals (referrer gets +7 when referred user pays)';
