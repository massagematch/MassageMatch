-- Therapists (reference data; can be seeded by admin)
CREATE TABLE IF NOT EXISTS public.therapists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  bio text,
  created_at timestamptz DEFAULT now()
);

-- Profiles: one per user; swipes and access (critical for persistence)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  swipes_remaining int NOT NULL DEFAULT 5,
  swipes_used int NOT NULL DEFAULT 0,
  access_expires timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Swipes: each like/pass is logged server-side to prevent abuse
CREATE TABLE IF NOT EXISTS public.swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('like', 'pass')),
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_swipes_user_id ON public.swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_timestamp ON public.swipes(timestamp);

-- Logs: errors, swipe events, analytics
CREATE TABLE IF NOT EXISTS public.logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'info',
  event text,
  user_id uuid REFERENCES auth.users(id),
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_event ON public.logs(event);

-- Trigger to set updated_at on profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- (Use EXECUTE PROCEDURE in Postgres <11 if needed)

-- Enable RLS on all tables (critical security)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
