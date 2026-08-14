-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Active', 'Closed');
CREATE TYPE "FeedbackClassification" AS ENUM ('Strength', 'Improvement');
CREATE TYPE "GrowthEvidenceSource" AS ENUM ('Feedback', 'Project');

-- Minimal Project lifecycle. Existing Projects remain Active.
ALTER TABLE "project"
  ADD COLUMN "status" "ProjectStatus" NOT NULL DEFAULT 'Active';

-- Composite tenant keys used by cross-context foreign keys.
ALTER TABLE "member"
  ADD CONSTRAINT "member_organization_id_id_key" UNIQUE ("organization_id", "id");
ALTER TABLE "project"
  ADD CONSTRAINT "project_organization_id_id_key" UNIQUE ("organization_id", "id");
ALTER TABLE "skill"
  ADD CONSTRAINT "skill_organization_id_id_key" UNIQUE ("organization_id", "id");

-- Feedback request: pending is derived from absence of a related Feedback.
CREATE TABLE "feedback_request" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "requester_id" UUID NOT NULL,
  "requested_from_id" UUID NOT NULL,
  "prompt" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feedback_request_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "feedback_request_organization_id_id_key" UNIQUE ("organization_id", "id"),
  CONSTRAINT "feedback_request_content_valid" CHECK (
    "requester_id" <> "requested_from_id" AND length(btrim("prompt")) > 0
  )
);

CREATE TABLE "feedback" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "recipient_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "classification" "FeedbackClassification" NOT NULL,
  "project_id" UUID,
  "value" TEXT,
  "request_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "feedback_request_id_key" UNIQUE ("request_id"),
  CONSTRAINT "feedback_organization_id_id_key" UNIQUE ("organization_id", "id"),
  CONSTRAINT "feedback_organization_id_request_id_key" UNIQUE ("organization_id", "request_id"),
  CONSTRAINT "feedback_content_valid" CHECK (
    "author_id" <> "recipient_id" AND length(btrim("body")) > 0
    AND ("value" IS NULL OR length(btrim("value")) > 0)
  )
);

CREATE TABLE "kudo" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "giver_id" UUID NOT NULL,
  "recipient_id" UUID NOT NULL,
  "message" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "objective_id" UUID,
  "objective_title_snapshot" TEXT,
  "key_result_id" UUID,
  "key_result_title_snapshot" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kudo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "kudo_content_valid" CHECK (
    "giver_id" <> "recipient_id" AND length(btrim("message")) > 0
    AND length(btrim("value")) > 0
  ),
  CONSTRAINT "kudo_context_exclusive" CHECK (
    "objective_id" IS NULL OR "key_result_id" IS NULL
  ),
  CONSTRAINT "kudo_context_snapshot_valid" CHECK (
    ("objective_id" IS NULL AND "key_result_id" IS NULL AND "objective_title_snapshot" IS NULL
      OR ("objective_id" IS NOT NULL OR "key_result_id" IS NOT NULL)
        AND "objective_title_snapshot" IS NOT NULL
        AND length(btrim("objective_title_snapshot")) > 0)
    AND ("key_result_id" IS NULL AND "key_result_title_snapshot" IS NULL
      OR "key_result_id" IS NOT NULL AND "key_result_title_snapshot" IS NOT NULL
        AND length(btrim("key_result_title_snapshot")) > 0)
  )
);

CREATE TABLE "growth_plan" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "next_milestone" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "growth_plan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "growth_plan_member_id_key" UNIQUE ("member_id"),
  CONSTRAINT "growth_plan_organization_id_id_key" UNIQUE ("organization_id", "id"),
  CONSTRAINT "growth_plan_milestone_required" CHECK (length(btrim("next_milestone")) > 0)
);

CREATE TABLE "growth_target" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "growth_plan_id" UUID NOT NULL,
  "skill_id" UUID NOT NULL,
  "target_level" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "growth_target_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "growth_target_growth_plan_id_skill_id_key" UNIQUE ("growth_plan_id", "skill_id"),
  CONSTRAINT "growth_target_level_valid" CHECK ("target_level" BETWEEN 0 AND 4)
);

CREATE TABLE "growth_evidence" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "growth_plan_id" UUID NOT NULL,
  "source" "GrowthEvidenceSource" NOT NULL,
  "feedback_id" UUID,
  "project_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "growth_evidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "growth_evidence_growth_plan_id_feedback_id_key" UNIQUE ("growth_plan_id", "feedback_id"),
  CONSTRAINT "growth_evidence_growth_plan_id_project_id_key" UNIQUE ("growth_plan_id", "project_id"),
  CONSTRAINT "growth_evidence_source_valid" CHECK (
    ("source" = 'Feedback' AND "feedback_id" IS NOT NULL AND "project_id" IS NULL)
    OR ("source" = 'Project' AND "project_id" IS NOT NULL AND "feedback_id" IS NULL)
  )
);

-- Indexes
CREATE INDEX "feedback_request_organization_id_requested_from_id_idx"
  ON "feedback_request"("organization_id", "requested_from_id");
CREATE INDEX "feedback_request_organization_id_requester_id_idx"
  ON "feedback_request"("organization_id", "requester_id");
CREATE INDEX "feedback_organization_id_author_id_idx"
  ON "feedback"("organization_id", "author_id");
CREATE INDEX "feedback_organization_id_recipient_id_idx"
  ON "feedback"("organization_id", "recipient_id");
CREATE INDEX "feedback_project_id_idx" ON "feedback"("project_id");
CREATE INDEX "kudo_organization_id_created_at_idx" ON "kudo"("organization_id", "created_at");
CREATE INDEX "kudo_objective_id_idx" ON "kudo"("objective_id");
CREATE INDEX "kudo_key_result_id_idx" ON "kudo"("key_result_id");
CREATE INDEX "growth_plan_organization_id_idx" ON "growth_plan"("organization_id");
CREATE INDEX "growth_target_organization_id_idx" ON "growth_target"("organization_id");
CREATE INDEX "growth_target_skill_id_idx" ON "growth_target"("skill_id");
CREATE INDEX "growth_evidence_organization_id_idx" ON "growth_evidence"("organization_id");

-- Tenant-safe foreign keys
ALTER TABLE "feedback_request" ADD CONSTRAINT "feedback_request_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "feedback_request" ADD CONSTRAINT "feedback_request_organization_id_requester_id_fkey"
  FOREIGN KEY ("organization_id", "requester_id") REFERENCES "member"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "feedback_request" ADD CONSTRAINT "feedback_request_organization_id_requested_from_id_fkey"
  FOREIGN KEY ("organization_id", "requested_from_id") REFERENCES "member"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "feedback" ADD CONSTRAINT "feedback_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_organization_id_author_id_fkey"
  FOREIGN KEY ("organization_id", "author_id") REFERENCES "member"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_organization_id_recipient_id_fkey"
  FOREIGN KEY ("organization_id", "recipient_id") REFERENCES "member"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_organization_id_project_id_fkey"
  FOREIGN KEY ("organization_id", "project_id") REFERENCES "project"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_organization_id_request_id_fkey"
  FOREIGN KEY ("organization_id", "request_id") REFERENCES "feedback_request"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "kudo" ADD CONSTRAINT "kudo_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "kudo" ADD CONSTRAINT "kudo_organization_id_giver_id_fkey"
  FOREIGN KEY ("organization_id", "giver_id") REFERENCES "member"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "kudo" ADD CONSTRAINT "kudo_organization_id_recipient_id_fkey"
  FOREIGN KEY ("organization_id", "recipient_id") REFERENCES "member"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "kudo" ADD CONSTRAINT "kudo_organization_id_objective_id_fkey"
  FOREIGN KEY ("organization_id", "objective_id") REFERENCES "objective"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "kudo" ADD CONSTRAINT "kudo_organization_id_key_result_id_fkey"
  FOREIGN KEY ("organization_id", "key_result_id") REFERENCES "key_result"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "growth_plan" ADD CONSTRAINT "growth_plan_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_plan" ADD CONSTRAINT "growth_plan_organization_id_member_id_fkey"
  FOREIGN KEY ("organization_id", "member_id") REFERENCES "member"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "growth_target" ADD CONSTRAINT "growth_target_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_target" ADD CONSTRAINT "growth_target_organization_id_growth_plan_id_fkey"
  FOREIGN KEY ("organization_id", "growth_plan_id") REFERENCES "growth_plan"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_target" ADD CONSTRAINT "growth_target_organization_id_skill_id_fkey"
  FOREIGN KEY ("organization_id", "skill_id") REFERENCES "skill"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "growth_evidence" ADD CONSTRAINT "growth_evidence_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_evidence" ADD CONSTRAINT "growth_evidence_organization_id_growth_plan_id_fkey"
  FOREIGN KEY ("organization_id", "growth_plan_id") REFERENCES "growth_plan"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_evidence" ADD CONSTRAINT "growth_evidence_organization_id_feedback_id_fkey"
  FOREIGN KEY ("organization_id", "feedback_id") REFERENCES "feedback"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "growth_evidence" ADD CONSTRAINT "growth_evidence_organization_id_project_id_fkey"
  FOREIGN KEY ("organization_id", "project_id") REFERENCES "project"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-Level Security (ADR-0003 🔒)
ALTER TABLE "feedback_request" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feedback_request" FORCE ROW LEVEL SECURITY;
CREATE POLICY "feedback_request_tenant_all" ON "feedback_request" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feedback" FORCE ROW LEVEL SECURITY;
CREATE POLICY "feedback_tenant_all" ON "feedback" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "kudo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "kudo" FORCE ROW LEVEL SECURITY;
CREATE POLICY "kudo_tenant_all" ON "kudo" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "growth_plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "growth_plan" FORCE ROW LEVEL SECURITY;
CREATE POLICY "growth_plan_tenant_all" ON "growth_plan" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "growth_target" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "growth_target" FORCE ROW LEVEL SECURITY;
CREATE POLICY "growth_target_tenant_all" ON "growth_target" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "growth_evidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "growth_evidence" FORCE ROW LEVEL SECURITY;
CREATE POLICY "growth_evidence_tenant_all" ON "growth_evidence" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
