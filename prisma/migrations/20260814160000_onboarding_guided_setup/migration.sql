-- CreateEnum
CREATE TYPE "OnboardingSetupStatus" AS ENUM ('Pending', 'Completed', 'Skipped');
CREATE TYPE "OnboardingSetupStep" AS ENUM ('CompanyProfile', 'Review');

-- CreateTable
CREATE TABLE "onboarding_setup" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "status" "OnboardingSetupStatus" NOT NULL DEFAULT 'Pending',
  "current_step" "OnboardingSetupStep" NOT NULL DEFAULT 'CompanyProfile',
  "company_type" TEXT,
  "industry" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "onboarding_setup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "onboarding_setup_organization_id_key" UNIQUE ("organization_id"),
  CONSTRAINT "onboarding_setup_profile_valid" CHECK (
    (
      "company_type" IS NULL AND "industry" IS NULL
      OR "company_type" IS NOT NULL AND "industry" IS NOT NULL
        AND length(btrim("company_type")) > 0
        AND length(btrim("industry")) > 0
    )
    AND (
      "current_step" = 'CompanyProfile'
      OR "company_type" IS NOT NULL AND "industry" IS NOT NULL
    )
    AND ("status" <> 'Completed' OR "current_step" = 'Review')
  )
);

CREATE INDEX "onboarding_setup_status_idx" ON "onboarding_setup"("status");

ALTER TABLE "onboarding_setup" ADD CONSTRAINT "onboarding_setup_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing Organizations have already entered the app. Preserve that state rather
-- than forcing them through a newly deployed first-entry flow.
INSERT INTO "onboarding_setup" (
  "organization_id", "status", "current_step", "id"
)
SELECT "id", 'Skipped', 'CompanyProfile',
       md5('onboarding-setup:' || "id"::text)::uuid
FROM "organization";

-- Row-Level Security (ADR-0003 🔒)
ALTER TABLE "onboarding_setup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding_setup" FORCE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_setup_tenant_all" ON "onboarding_setup" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

-- Deployments use a separate non-superuser application role when present.
-- Fresh developer databases create that role after migrations, so keep this conditional.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ensambla_app') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "onboarding_setup" TO ensambla_app';
  END IF;
END
$$;
