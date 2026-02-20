-- AI Chat + Profile settings: services, prices, bio

-- Therapists: services (e.g. Swedish, Thai, Hot stone), prices (THB per duration)
ALTER TABLE public.therapists
  ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prices jsonb DEFAULT '{}'::jsonb;

-- Profiles: bio and preferences (for customers); therapists sync from profile to therapist row
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prices jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.therapists.services IS 'e.g. Swedish massage, Thai, Hot stone';
COMMENT ON COLUMN public.therapists.prices IS 'e.g. {"thb60min": 500, "thb90min": 700}';
COMMENT ON COLUMN public.profiles.bio IS 'User/therapist bio';
COMMENT ON COLUMN public.profiles.services IS 'Services offered (therapist) or preferred (customer)';
COMMENT ON COLUMN public.profiles.prices IS 'Price tiers e.g. {"thb60min": 500}';