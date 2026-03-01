-- Order verified (real) therapists first in toplist/swipe for customers.
-- get_therapists_visible: verified_photo DESC first, then created_at DESC.
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
  ORDER BY (t.verified_photo IS TRUE) DESC, t.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_therapists_visible(text) IS 'Therapists with active Premium; verified users shown first in swipe/toplist.';
