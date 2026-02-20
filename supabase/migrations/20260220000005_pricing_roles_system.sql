-- PRICING + ROLES SYSTEM: Add role-based plans, boosts, promo codes, visibility scoring

-- Add role and plan fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('customer', 'therapist', 'salong')) DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS plan_type text,
  ADD COLUMN IF NOT EXISTS plan_expires timestamptz,
  ADD COLUMN IF NOT EXISTS boost_expires timestamptz,
  ADD COLUMN IF NOT EXISTS promo_used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility_score int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS hotel_discounts boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_expires ON public.profiles(plan_expires);
CREATE INDEX IF NOT EXISTS idx_profiles_boost_expires ON public.profiles(boost_expires);

-- Salongs table (for salong role)
CREATE TABLE IF NOT EXISTS public.salongs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name text NOT NULL,
  image_url text,
  bio text,
  location text,
  visibility_score int DEFAULT 1,
  plan_type text,
  plan_expires timestamptz,
  boost_expires timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salongs_user_id ON public.salongs(user_id);
CREATE INDEX IF NOT EXISTS idx_salongs_plan_expires ON public.salongs(plan_expires);

-- Unlocked profiles (customer unlocks therapist/salong for direct contact)
CREATE TABLE IF NOT EXISTS public.unlocked_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES public.therapists(id) ON DELETE CASCADE,
  salong_id uuid REFERENCES public.salongs(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  CHECK ((therapist_id IS NOT NULL)::int + (salong_id IS NOT NULL)::int = 1)
);

CREATE INDEX IF NOT EXISTS idx_unlocked_user_id ON public.unlocked_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_expires ON public.unlocked_profiles(expires_at);

-- Rankings view: computed effective_rank for therapists (boosts multiply visibility)
CREATE OR REPLACE VIEW public.therapist_rankings AS
SELECT 
  t.*,
  p.user_id,
  p.plan_type,
  p.plan_expires,
  p.boost_expires,
  p.visibility_score,
  CASE 
    WHEN p.boost_expires IS NOT NULL AND p.boost_expires > now() THEN p.visibility_score * 5
    WHEN p.plan_expires IS NOT NULL AND p.plan_expires > now() THEN p.visibility_score * 3
    ELSE p.visibility_score
  END as effective_rank
FROM public.therapists t
LEFT JOIN public.profiles p ON p.user_id = t.id AND p.role = 'therapist'
ORDER BY effective_rank DESC, t.created_at DESC;

-- Rankings view for salongs
CREATE OR REPLACE VIEW public.salong_rankings AS
SELECT 
  s.*,
  CASE 
    WHEN s.boost_expires IS NOT NULL AND s.boost_expires > now() THEN s.visibility_score * 5
    WHEN s.plan_expires IS NOT NULL AND s.plan_expires > now() THEN s.visibility_score * 3
    ELSE s.visibility_score
  END as effective_rank
FROM public.salongs s
ORDER BY effective_rank DESC, s.created_at DESC;

-- Trigger for salongs updated_at
CREATE TRIGGER salongs_updated_at
  BEFORE UPDATE ON public.salongs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS on new tables
ALTER TABLE public.salongs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salongs
CREATE POLICY "salongs_select_all"
  ON public.salongs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "salongs_select_anon"
  ON public.salongs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "salongs_insert_own"
  ON public.salongs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "salongs_update_own"
  ON public.salongs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for unlocked_profiles
CREATE POLICY "unlocked_select_own"
  ON public.unlocked_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "unlocked_insert_own"
  ON public.unlocked_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.salongs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unlocked_profiles;
