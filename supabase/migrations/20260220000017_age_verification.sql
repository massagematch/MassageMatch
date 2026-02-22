-- Age verification: users must be 18+. Store birth_year (integer) to compute age.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_year int CHECK (birth_year >= 1900 AND birth_year <= (extract(year from now())::int - 18));

COMMENT ON COLUMN public.profiles.birth_year IS 'Birth year for age verification; user must be 18+ (age = current_year - birth_year).';
