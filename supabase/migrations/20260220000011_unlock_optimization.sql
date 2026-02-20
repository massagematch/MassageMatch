-- Single Unlock optimization: idempotency, refund, analytics, contact

-- Unlocked: store Stripe session id (idempotency) + charge id (refund)
ALTER TABLE public.unlocked_profiles
  ADD COLUMN IF NOT EXISTS stripe_payment_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_charge_id text,
  ADD COLUMN IF NOT EXISTS messages_sent int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_unlocked_stripe_payment ON public.unlocked_profiles(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_stripe_charge ON public.unlocked_profiles(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_user_unlocked_at ON public.unlocked_profiles(user_id, unlocked_at);

-- Therapist contact (for unlocked card: WA/Call)
ALTER TABLE public.therapists
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text;

COMMENT ON COLUMN public.unlocked_profiles.stripe_payment_id IS 'Stripe checkout session id; idempotency + refund lookup';
COMMENT ON COLUMN public.unlocked_profiles.messages_sent IS 'Contact count for Most contacted sort';
