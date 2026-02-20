-- Tinder-style: notifications, verified photo, nearby RPC, AI-ready

-- Notifications (realtime)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT only via Edge Functions (service role) or triggers

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Verified photo badge (therapist + profile)
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS verified_photo boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_photo boolean DEFAULT false;

-- Therapist average rating (computed view for AI/recommendations)
CREATE OR REPLACE FUNCTION public.therapist_rating_avg(tid uuid)
RETURNS double precision
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(avg(rating)::double precision, 0)
  FROM public.reviews
  WHERE therapist_id = tid AND approved = true;
$$;

-- Nearby therapists (using existing distance_km); returns therapists with location within max_distance_km
CREATE OR REPLACE FUNCTION public.nearby_therapists(
  user_lat double precision,
  user_lng double precision,
  max_distance_km double precision DEFAULT 5,
  lim int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  image_url text,
  bio text,
  location_city text,
  distance_km double precision,
  rating_avg double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    t.id,
    t.name,
    t.image_url,
    t.bio,
    t.location_city,
    public.distance_km(user_lat, user_lng, t.location_lat, t.location_lng) AS distance_km,
    public.therapist_rating_avg(t.id) AS rating_avg
  FROM public.therapists t
  WHERE t.location_lat IS NOT NULL
    AND t.location_lng IS NOT NULL
    AND public.distance_km(user_lat, user_lng, t.location_lat, t.location_lng) <= max_distance_km
  ORDER BY distance_km ASC
  LIMIT lim;
$$;

COMMENT ON TABLE public.notifications IS 'In-app + PWA push; types: user_unlocked_you, new_5star_review, new_match';
COMMENT ON COLUMN public.therapists.verified_photo IS 'Photo verification badge (selfie match)';
COMMENT ON COLUMN public.profiles.verified_photo IS 'Photo verification badge';