-- Therapist multiple images for swipe carousel (max 5)
ALTER TABLE public.therapists
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.therapists.images IS 'Array of image URLs for carousel, max 5. Fallback to image_url if empty.';