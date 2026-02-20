-- Daily reset: restore 5 free swipes for expired premium users (run via pg_cron or Supabase cron)
-- To use pg_cron in Supabase: enable extension and schedule.
-- Example (run at midnight UTC):
-- SELECT cron.schedule(
--   'daily-reset-expired-profiles',
--   '0 0 * * *',
--   $$ UPDATE public.profiles
--      SET swipes_remaining = 5, swipes_used = 0
--      WHERE access_expires IS NOT NULL AND access_expires < now() $$
-- );

-- Standalone function so Edge Function or cron can call it
CREATE OR REPLACE FUNCTION public.daily_reset_expired_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Reset expired premium access (legacy)
  UPDATE public.profiles
  SET swipes_remaining = 5,
      swipes_used = 0,
      updated_at = now()
  WHERE access_expires IS NOT NULL AND access_expires < now();
  
  -- Reset expired plan_expires and boost_expires
  UPDATE public.profiles
  SET plan_type = NULL,
      plan_expires = NULL,
      visibility_score = 1,
      updated_at = now()
  WHERE plan_expires IS NOT NULL AND plan_expires < now();
  
  UPDATE public.profiles
  SET boost_expires = NULL,
      visibility_score = CASE WHEN plan_expires IS NOT NULL AND plan_expires > now() THEN 3 ELSE 1 END,
      updated_at = now()
  WHERE boost_expires IS NOT NULL AND boost_expires < now();
  
  -- Reset expired unlocks
  DELETE FROM public.unlocked_profiles
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Grant execute to service_role and authenticated (cron may use either)
GRANT EXECUTE ON FUNCTION public.daily_reset_expired_access() TO service_role;
GRANT EXECUTE ON FUNCTION public.daily_reset_expired_access() TO authenticated;
