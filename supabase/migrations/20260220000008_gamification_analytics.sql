-- GAMIFICATION & ANALYTICS FIELDS

-- Add gamification fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_data jsonb DEFAULT '{"current_streak": 0, "last_login": null, "longest_streak": 0}'::jsonb,
  ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referrals_count int DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Analytics events table (for custom tracking)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_name text NOT NULL,
  properties jsonb,
  session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- A/B test assignments
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  variant text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(test_name, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_user_id ON public.ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_test_name ON public.ab_tests(test_name);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "analytics_events_insert_own"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analytics_events_select_own"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_superadmin());

CREATE POLICY "ab_tests_select_own"
  ON public.ab_tests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ab_tests_insert_own"
  ON public.ab_tests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Superadmin can see all
CREATE POLICY "analytics_events_admin_all"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "ab_tests_admin_all"
  ON public.ab_tests FOR SELECT
  TO authenticated
  USING (public.is_superadmin());
