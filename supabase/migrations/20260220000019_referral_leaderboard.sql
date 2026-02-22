-- Referral leaderboard: top 10 by referrals_count (SECURITY DEFINER so authenticated can read)

CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(lim int DEFAULT 10)
RETURNS TABLE(rank int, display_name text, referrals_count int)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    row_number() OVER (ORDER BY p.referrals_count DESC, p.updated_at DESC)::int AS rank,
    COALESCE(p.display_name, 'Användare')::text AS display_name,
    (p.referrals_count)::int
  FROM public.profiles p
  WHERE p.referrals_count > 0
  ORDER BY p.referrals_count DESC, p.updated_at DESC
  LIMIT lim;
$$;

COMMENT ON FUNCTION public.get_referral_leaderboard IS 'Top referrers by referrals_count; for dashboard leaderboard';
