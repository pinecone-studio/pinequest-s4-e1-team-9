ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ(6);

ALTER TABLE public.company_members
  ADD COLUMN IF NOT EXISTS invitation_id UUID;

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_by UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ(6) NOT NULL,
  revoked_at TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  redeemed_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT invite_redemptions_invite_id_user_id_key UNIQUE (invite_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY,
  last_selected_company_id UUID,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'company_members_invitation_id_fkey'
  ) THEN
    ALTER TABLE public.company_members
      ADD CONSTRAINT company_members_invitation_id_fkey
      FOREIGN KEY (invitation_id)
      REFERENCES public.invite_codes(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS companies_archived_at_idx
  ON public.companies(archived_at);

CREATE INDEX IF NOT EXISTS company_members_invitation_id_idx
  ON public.company_members(invitation_id);

CREATE INDEX IF NOT EXISTS invite_codes_company_id_revoked_at_expires_at_idx
  ON public.invite_codes(company_id, revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS invite_codes_created_by_idx
  ON public.invite_codes(created_by);

CREATE INDEX IF NOT EXISTS invite_redemptions_company_id_redeemed_at_idx
  ON public.invite_redemptions(company_id, redeemed_at);

CREATE INDEX IF NOT EXISTS invite_redemptions_user_id_idx
  ON public.invite_redemptions(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invite_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invite_redemptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_preferences TO service_role;

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
