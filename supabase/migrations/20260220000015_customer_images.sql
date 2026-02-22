-- Customer profile photos (1–5) for therapist swipe: show real pictures instead of black/empty
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS customer_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS display_name text;

COMMENT ON COLUMN public.profiles.customer_images IS 'Array of image URLs (1–5) for customers; shown when therapists swipe';
COMMENT ON COLUMN public.profiles.display_name IS 'Optional display name (e.g. for customers in therapist swipe)';

-- Storage: customer photos bucket (authenticated read for swipe; upload own folder)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-photos',
  'customer-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone authenticated can read (therapists need to see customer photos in swipe)
CREATE POLICY "customer_photos_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'customer-photos');

-- Customers upload to their own folder: user_id/filename
CREATE POLICY "customer_photos_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'customer-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "customer_photos_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'customer-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "customer_photos_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'customer-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Therapists can read customer profiles (for swipe); customers still only read own
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR role = 'customer');
