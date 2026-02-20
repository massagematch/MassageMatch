-- THAILAND LOCATION + GEOLOCATION

-- Profiles: region, city, area, lat/lng, share_location
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_region text,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_area text,
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS share_location boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_location_region ON public.profiles(location_region);
CREATE INDEX IF NOT EXISTS idx_profiles_location_city ON public.profiles(location_city);
CREATE INDEX IF NOT EXISTS idx_profiles_share_location ON public.profiles(share_location);

-- Therapists table: add location if not already present
ALTER TABLE public.therapists
  ADD COLUMN IF NOT EXISTS location_region text,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_area text,
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS share_location boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_therapists_location_city ON public.therapists(location_city);
CREATE INDEX IF NOT EXISTS idx_therapists_share_location ON public.therapists(share_location);

-- PostGIS-style distance helper (Haversine approx) for <5km filter
-- Using plain SQL: distance in km ≈ 111 * sqrt((lat1-lat2)^2 + (lng1-lng2)^2) for small distances
CREATE OR REPLACE FUNCTION public.distance_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 111.0 * sqrt(power(lat1 - lat2, 2) + power((lng1 - lng2) * cos(radians(lat1)), 2));
$$;

-- RLS: customers read location only when share_location = true
-- (profiles_update_own already allows users to update own row; location fields included)
COMMENT ON COLUMN public.profiles.share_location IS 'If true, lat/lng visible to customers for map; otherwise show "Location private"';
