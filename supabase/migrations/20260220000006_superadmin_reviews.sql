-- SUPER ADMIN + REVIEWS SYSTEM

-- Add superadmin to role enum (extend CHECK constraint)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('customer', 'therapist', 'salong', 'superadmin'));

-- Add banned status
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles(banned);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES public.therapists(id) ON DELETE CASCADE,
  salong_id uuid REFERENCES public.salongs(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  flagged boolean DEFAULT false,
  flagged_reason text,
  approved boolean DEFAULT false,
  admin_reply text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK ((therapist_id IS NOT NULL)::int + (salong_id IS NOT NULL)::int = 1)
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_therapist_id ON public.reviews(therapist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_salong_id ON public.reviews(salong_id);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON public.reviews(flagged);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(approved);

-- Discount codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_months')),
  discount_value numeric NOT NULL,
  plan_type text,
  max_uses int,
  uses_count int DEFAULT 0,
  expires_at timestamptz,
  active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON public.discount_codes(active);

-- Admin actions log (audit trail)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON public.admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at);

-- Trigger for reviews updated_at
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews (public read approved, users write own, superadmin all)
CREATE POLICY "reviews_select_approved"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (approved = true OR auth.uid() = user_id);

CREATE POLICY "reviews_select_anon"
  ON public.reviews FOR SELECT
  TO anon
  USING (approved = true);

CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Superadmin bypass function (used in RLS policies)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'superadmin'
  );
$$;

-- Superadmin policies (bypass RLS)
CREATE POLICY "reviews_admin_all"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "discount_codes_admin_all"
  ON public.discount_codes FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "discount_codes_select_active"
  ON public.discount_codes FOR SELECT
  TO authenticated
  USING (active = true OR public.is_superadmin());

CREATE POLICY "admin_logs_admin_all"
  ON public.admin_logs FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Update existing RLS policies to allow superadmin bypass
-- Profiles: superadmin can see/edit all
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Swipes: superadmin can see all
DROP POLICY IF EXISTS "swipes_admin_all" ON public.swipes;
CREATE POLICY "swipes_admin_all"
  ON public.swipes FOR SELECT
  TO authenticated
  USING (public.is_superadmin());

-- Therapists: superadmin can edit
DROP POLICY IF EXISTS "therapists_admin_all" ON public.therapists;
CREATE POLICY "therapists_admin_all"
  ON public.therapists FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Salongs: superadmin can edit
DROP POLICY IF EXISTS "salongs_admin_all" ON public.salongs;
CREATE POLICY "salongs_admin_all"
  ON public.salongs FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Unlocked profiles: superadmin can see all
DROP POLICY IF EXISTS "unlocked_admin_all" ON public.unlocked_profiles;
CREATE POLICY "unlocked_admin_all"
  ON public.unlocked_profiles FOR SELECT
  TO authenticated
  USING (public.is_superadmin());

-- Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discount_codes;
