-- RLS Policies (clearly labeled)

-- therapists: public read; only service role / admin can write (no policy = no access for anon/authenticated write)
CREATE POLICY "therapists_select_all"
  ON public.therapists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "therapists_select_anon"
  ON public.therapists FOR SELECT
  TO anon
  USING (true);

-- profiles: users can only see and update their own row
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role (Edge Functions) to upsert any profile for fulfillment
-- (Edge Functions use service_role key, not authenticated user context when needed)

-- swipes: users can insert their own swipes; select own only
CREATE POLICY "swipes_select_own"
  ON public.swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "swipes_insert_own"
  ON public.swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- logs: only service role / backend should write; optionally allow users to read own
CREATE POLICY "logs_select_own"
  ON public.logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT for authenticated on logs; Edge Functions use service_role to write logs

COMMENT ON POLICY "profiles_select_own" ON public.profiles IS 'Users see only their profile';
COMMENT ON POLICY "profiles_update_own" ON public.profiles IS 'Users update only their profile';
COMMENT ON POLICY "swipes_select_own" ON public.swipes IS 'Users see only their swipes';
COMMENT ON POLICY "swipes_insert_own" ON public.swipes IS 'Users record only their swipes';
