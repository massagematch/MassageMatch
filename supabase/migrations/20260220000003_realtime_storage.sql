-- Realtime: enable for profiles and swipes so client can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.swipes;

-- Storage: therapist images bucket (public read; RLS by folder if needed)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'therapist-images',
  'therapist-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage: authenticated users can read; upload by user_id folder
CREATE POLICY "therapist_images_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'therapist-images');

CREATE POLICY "therapist_images_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'therapist-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "therapist_images_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'therapist-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
