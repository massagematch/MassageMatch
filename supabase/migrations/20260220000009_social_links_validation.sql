-- SOCIAL LINKS & VALIDATION SYSTEM

-- Add social_links and validation fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS social_validation jsonb DEFAULT '{}'::jsonb;

-- GIN index for fast JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_social_links ON public.profiles USING gin (social_links);
CREATE INDEX IF NOT EXISTS idx_profiles_social_validation ON public.profiles USING gin (social_validation);

-- Cache table for social validation results (24h TTL)
CREATE TABLE IF NOT EXISTS public.social_validation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  handle text NOT NULL,
  valid boolean NOT NULL,
  exists boolean NOT NULL,
  message text,
  cached_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + INTERVAL '24 hours'),
  UNIQUE(platform, handle)
);

CREATE INDEX IF NOT EXISTS idx_social_cache_platform_handle ON public.social_validation_cache(platform, handle);
CREATE INDEX IF NOT EXISTS idx_social_cache_expires ON public.social_validation_cache(expires_at);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_social_cache()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.social_validation_cache
  WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- RLS for cache (read-only for authenticated, superadmin can manage)
ALTER TABLE public.social_validation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_cache_select_all"
  ON public.social_validation_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "social_cache_admin_all"
  ON public.social_validation_cache FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Update profiles RLS to allow social_links update
-- (Already covered by existing policies, but ensure UPDATE works)
COMMENT ON COLUMN public.profiles.social_links IS 'JSONB: {instagram: "@user", telegram: "@user", whatsapp: "+66...", line: "line_id", facebook: "fb.me/user"}';
COMMENT ON COLUMN public.profiles.social_validation IS 'JSONB: {instagram: {valid: true, exists: true, date: "..."}, ...}';
