CREATE TYPE public."CompanyRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id UUID NOT NULL,
  role public."CompanyRole" NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT company_members_company_id_user_id_key UNIQUE (company_id, user_id)
);

CREATE INDEX company_members_user_id_idx
  ON public.company_members(user_id);

CREATE INDEX company_members_company_id_role_idx
  ON public.company_members(company_id, role);

CREATE INDEX companies_created_at_idx
  ON public.companies(created_at);

ALTER TABLE public.user_documents
  ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public.document_chunks
  ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX user_documents_company_id_idx
  ON public.user_documents(company_id);

CREATE INDEX document_chunks_company_id_idx
  ON public.document_chunks(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_members TO service_role;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can read companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.company_id = companies.id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read own company memberships"
  ON public.company_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
