DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'EventStatus'
  ) THEN
    CREATE TYPE public."EventStatus" AS ENUM ('scheduled', 'cancelled');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  requires_name_completion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_name_length_check
    CHECK (char_length(btrim(name)) BETWEEN 2 AND 80)
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ(6) NOT NULL,
  ends_at TIMESTAMPTZ(6),
  timezone TEXT NOT NULL,
  location TEXT,
  meeting_url TEXT,
  status public."EventStatus" NOT NULL DEFAULT 'scheduled',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT events_title_length_check
    CHECK (char_length(btrim(title)) BETWEEN 1 AND 140),
  CONSTRAINT events_timezone_length_check
    CHECK (char_length(btrim(timezone)) BETWEEN 1 AND 80),
  CONSTRAINT events_ends_after_starts_check
    CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS events_company_id_starts_at_idx
  ON public.events(company_id, starts_at);

CREATE INDEX IF NOT EXISTS events_company_id_status_starts_at_idx
  ON public.events(company_id, status, starts_at);

CREATE INDEX IF NOT EXISTS events_created_by_idx
  ON public.events(created_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO service_role;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "AI members can read events" ON public.events;
CREATE POLICY "AI members can read events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      JOIN public.companies c ON c.id = cm.company_id
      WHERE cm.company_id = events.company_id
        AND cm.user_id = auth.uid()
        AND c.archived_at IS NULL
    )
  );
