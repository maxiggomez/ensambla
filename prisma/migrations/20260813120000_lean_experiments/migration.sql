-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('Hypothesis', 'Building', 'Measuring', 'Learned');

-- CreateEnum
CREATE TYPE "LearningDecision" AS ENUM ('Persevere', 'Pivot');

-- Composite tenant keys used by cross-context foreign keys.
ALTER TABLE "objective"
  ADD CONSTRAINT "objective_organization_id_id_key" UNIQUE ("organization_id", "id");
ALTER TABLE "key_result"
  ADD CONSTRAINT "key_result_organization_id_id_key" UNIQUE ("organization_id", "id");

-- CreateTable
CREATE TABLE "hypothesis" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "key_result_id" UUID NOT NULL,
  "objective_id" UUID NOT NULL,
  "belief" TEXT NOT NULL,
  "expected_outcome" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hypothesis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hypothesis_content_required" CHECK (
    length(btrim("belief")) > 0 AND length(btrim("expected_outcome")) > 0
  ),
  CONSTRAINT "hypothesis_organization_id_id_key" UNIQUE ("organization_id", "id")
);

CREATE TABLE "experiment" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "hypothesis_id" UUID NOT NULL,
  "status" "ExperimentStatus" NOT NULL DEFAULT 'Hypothesis',
  "measurement_type" "MeasurementType",
  "start_value" DECIMAL(20,4),
  "target_value" DECIMAL(20,4),
  "current_value" DECIMAL(20,4),
  "check_done" BOOLEAN,
  "text_state" "TextState",
  "cutoff_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "experiment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "experiment_hypothesis_id_key" UNIQUE ("hypothesis_id"),
  CONSTRAINT "experiment_organization_id_id_key" UNIQUE ("organization_id", "id"),
  CONSTRAINT "experiment_organization_id_hypothesis_id_key" UNIQUE ("organization_id", "hypothesis_id"),
  CONSTRAINT "experiment_measurement_required" CHECK (
    ("status" IN ('Hypothesis', 'Building') AND "measurement_type" IS NULL AND "cutoff_at" IS NULL)
    OR ("status" IN ('Measuring', 'Learned') AND "measurement_type" IS NOT NULL AND "cutoff_at" IS NOT NULL)
  )
);

CREATE TABLE "learning" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "experiment_id" UUID NOT NULL,
  "believed" TEXT NOT NULL,
  "tested" TEXT NOT NULL,
  "learned" TEXT NOT NULL,
  "decision" "LearningDecision" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "learning_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "learning_experiment_id_key" UNIQUE ("experiment_id"),
  CONSTRAINT "learning_organization_id_experiment_id_key" UNIQUE ("organization_id", "experiment_id"),
  CONSTRAINT "learning_content_required" CHECK (
    length(btrim("believed")) > 0 AND length(btrim("tested")) > 0 AND length(btrim("learned")) > 0
  ),
  CONSTRAINT "learning_decision_valid" CHECK ("decision"::text IN ('Persevere', 'Pivot'))
);

-- Indexes
CREATE INDEX "hypothesis_organization_id_idx" ON "hypothesis"("organization_id");
CREATE INDEX "hypothesis_key_result_id_idx" ON "hypothesis"("key_result_id");
CREATE INDEX "hypothesis_objective_id_idx" ON "hypothesis"("objective_id");
CREATE INDEX "experiment_organization_id_status_idx" ON "experiment"("organization_id", "status");
CREATE INDEX "learning_organization_id_idx" ON "learning"("organization_id");

-- Tenant-safe foreign keys
ALTER TABLE "hypothesis" ADD CONSTRAINT "hypothesis_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hypothesis" ADD CONSTRAINT "hypothesis_organization_id_key_result_id_fkey"
  FOREIGN KEY ("organization_id", "key_result_id") REFERENCES "key_result"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hypothesis" ADD CONSTRAINT "hypothesis_organization_id_objective_id_fkey"
  FOREIGN KEY ("organization_id", "objective_id") REFERENCES "objective"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "experiment" ADD CONSTRAINT "experiment_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "experiment" ADD CONSTRAINT "experiment_organization_id_hypothesis_id_fkey"
  FOREIGN KEY ("organization_id", "hypothesis_id") REFERENCES "hypothesis"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "learning" ADD CONSTRAINT "learning_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "learning" ADD CONSTRAINT "learning_organization_id_experiment_id_fkey"
  FOREIGN KEY ("organization_id", "experiment_id") REFERENCES "experiment"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-Level Security (ADR-0003 🔒)
ALTER TABLE "hypothesis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hypothesis" FORCE ROW LEVEL SECURITY;
CREATE POLICY "hypothesis_tenant_all" ON "hypothesis" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "experiment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "experiment" FORCE ROW LEVEL SECURITY;
CREATE POLICY "experiment_tenant_all" ON "experiment" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "learning" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning" FORCE ROW LEVEL SECURITY;
CREATE POLICY "learning_tenant_all" ON "learning" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
