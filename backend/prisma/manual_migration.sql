ALTER TABLE "companies" ADD COLUMN "invitation_code" TEXT;
UPDATE "companies" SET "invitation_code" = upper(substring(md5(random()::text), 1, 8)) WHERE "invitation_code" IS NULL;
ALTER TABLE "companies" ALTER COLUMN "invitation_code" SET NOT NULL;
CREATE UNIQUE INDEX "companies_invitation_code_key" ON "companies"("invitation_code");
