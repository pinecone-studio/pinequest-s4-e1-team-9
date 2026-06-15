ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS use_case_type TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS setup_status TEXT NOT NULL DEFAULT 'READY',
  ADD COLUMN IF NOT EXISTS setup_step INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_owner_id UUID,
  ADD COLUMN IF NOT EXISTS ai_configuration JSONB,
  ADD COLUMN IF NOT EXISTS system_instructions TEXT,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS companies_setup_status_idx
  ON public.companies(setup_status);

CREATE INDEX IF NOT EXISTS companies_setup_owner_id_idx
  ON public.companies(setup_owner_id);
