-- Setup script: Create superadmin user (run manually after creating thaimassagematch@hotmail.com user)
-- Replace USER_ID_HERE with the actual auth.users.id after creating the user

-- Example:
-- 1. Create user via Supabase Auth Dashboard or API: thaimassagematch@hotmail.com
-- 2. Get the user_id from auth.users
-- 3. Run:
--    UPDATE public.profiles SET role = 'superadmin' WHERE user_id = 'USER_ID_HERE';
--    OR if profile doesn't exist:
--    INSERT INTO public.profiles (user_id, role) VALUES ('USER_ID_HERE', 'superadmin');

-- Function to check if email is superadmin (helper)
CREATE OR REPLACE FUNCTION public.get_superadmin_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT user_id FROM public.profiles WHERE role = 'superadmin' LIMIT 1;
$$;
