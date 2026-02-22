-- Therapists only visible in swipe/search when they have active plan (plan_expires > now).
-- RPC for customers to fetch therapists that are allowed to appear.
CREATE OR REPLACE FUNCTION public.get_therapists_visible(p_city text DEFAULT NULL)
RETURNS SETOF public.therapists
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.*
  FROM public.therapists t
  JOIN public.profiles p ON p.user_id = t.id AND p.role = 'therapist'
  WHERE (p.plan_expires IS NOT NULL AND p.plan_expires > now())
    AND (p.banned IS NOT TRUE)
    AND (p_city IS NULL OR t.location_city = p_city)
  ORDER BY t.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_therapists_visible(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_therapists_visible(text) TO anon;

COMMENT ON FUNCTION public.get_therapists_visible(text) IS 'Therapists with active Premium (plan_expires > now); used for customer swipe and search.';