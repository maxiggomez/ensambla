-- Complete the OKR lifecycle with additive, tenant-scoped persistence.
-- Derived progress, at-risk and outdated state deliberately remain absent.

ALTER TYPE "ObjectiveStatus" ADD VALUE 'Closed';
ALTER TYPE "ObjectiveStatus" ADD VALUE 'Archived';

CREATE TYPE "CheckInCadence" AS ENUM ('Weekly', 'Biweekly', 'Monthly');
CREATE TYPE "EvidenceKind" AS ENUM ('Link', 'File');
CREATE TYPE "KeyResultGrade" AS ENUM ('Achieved', 'Partial', 'NotAchieved');

CREATE TABLE "okr_cycle" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "okr_cycle_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "okr_cycle_dates_check" CHECK ("ends_at" > "starts_at")
);

ALTER TABLE "objective"
    ADD COLUMN "team_id" UUID,
    ADD COLUMN "parent_objective_id" UUID,
    ADD COLUMN "cycle_id" UUID,
    ADD COLUMN "source_objective_id" UUID,
    ADD COLUMN "published_at" TIMESTAMPTZ(6),
    ADD COLUMN "closed_at" TIMESTAMPTZ(6),
    ADD COLUMN "archived_at" TIMESTAMPTZ(6);

ALTER TABLE "key_result"
    ADD COLUMN "grade" "KeyResultGrade",
    ADD COLUMN "source_key_result_id" UUID;

CREATE TABLE "okr_cadence_config" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "objective_id" UUID,
    "team_id" UUID,
    "cadence" "CheckInCadence" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "okr_cadence_config_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "okr_cadence_exactly_one_target_check" CHECK (
      ("objective_id" IS NOT NULL AND "team_id" IS NULL)
      OR ("objective_id" IS NULL AND "team_id" IS NOT NULL)
    )
);

CREATE TABLE "check_in" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "key_result_id" UUID NOT NULL,
    "actor_member_id" UUID NOT NULL,
    "measurement_type" "MeasurementType" NOT NULL,
    "numeric_value" DECIMAL(20,4),
    "check_done" BOOLEAN,
    "text_state" "TextState",
    "confidence" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_in_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_in_confidence_check" CHECK ("confidence" BETWEEN 0 AND 10)
);

CREATE TABLE "check_in_evidence" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "check_in_id" UUID NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "url" TEXT,
    "file_name" TEXT,
    "media_type" TEXT,
    "size_bytes" INTEGER,
    "file_bytes" BYTEA,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_in_evidence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_in_evidence_shape_check" CHECK (
      ("kind" = 'Link' AND "url" IS NOT NULL AND "file_bytes" IS NULL)
      OR (
        "kind" = 'File'
        AND "url" IS NULL
        AND "file_name" IS NOT NULL
        AND "media_type" IS NOT NULL
        AND "size_bytes" IS NOT NULL
        AND "file_bytes" IS NOT NULL
      )
    ),
    CONSTRAINT "check_in_evidence_size_check" CHECK (
      "size_bytes" IS NULL OR "size_bytes" BETWEEN 0 AND 5242880
    )
);

CREATE TABLE "okr_audit_event" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "actor_member_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "okr_audit_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "okr_cycle_organization_id_name_key"
    ON "okr_cycle"("organization_id", "name");
CREATE INDEX "okr_cycle_organization_id_idx" ON "okr_cycle"("organization_id");
CREATE INDEX "objective_team_id_idx" ON "objective"("team_id");
CREATE INDEX "objective_parent_objective_id_idx" ON "objective"("parent_objective_id");
CREATE INDEX "objective_cycle_id_idx" ON "objective"("cycle_id");
CREATE INDEX "objective_source_objective_id_idx" ON "objective"("source_objective_id");
CREATE INDEX "key_result_source_key_result_id_idx" ON "key_result"("source_key_result_id");
CREATE UNIQUE INDEX "okr_cadence_objective_unique"
    ON "okr_cadence_config"("objective_id") WHERE "objective_id" IS NOT NULL;
CREATE UNIQUE INDEX "okr_cadence_team_unique"
    ON "okr_cadence_config"("team_id") WHERE "team_id" IS NOT NULL;
CREATE INDEX "okr_cadence_config_organization_id_idx"
    ON "okr_cadence_config"("organization_id");
CREATE INDEX "okr_cadence_config_objective_id_idx" ON "okr_cadence_config"("objective_id");
CREATE INDEX "okr_cadence_config_team_id_idx" ON "okr_cadence_config"("team_id");
CREATE INDEX "check_in_organization_id_idx" ON "check_in"("organization_id");
CREATE INDEX "check_in_key_result_id_created_at_idx" ON "check_in"("key_result_id", "created_at");
CREATE INDEX "check_in_evidence_organization_id_idx" ON "check_in_evidence"("organization_id");
CREATE INDEX "check_in_evidence_check_in_id_idx" ON "check_in_evidence"("check_in_id");
CREATE INDEX "okr_audit_event_organization_id_created_at_idx"
    ON "okr_audit_event"("organization_id", "created_at");
CREATE INDEX "okr_audit_event_entity_type_entity_id_idx"
    ON "okr_audit_event"("entity_type", "entity_id");

ALTER TABLE "okr_cycle"
    ADD CONSTRAINT "okr_cycle_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "objective"
    ADD CONSTRAINT "objective_team_id_fkey"
    FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "objective"
    ADD CONSTRAINT "objective_parent_objective_id_fkey"
    FOREIGN KEY ("parent_objective_id") REFERENCES "objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "objective"
    ADD CONSTRAINT "objective_cycle_id_fkey"
    FOREIGN KEY ("cycle_id") REFERENCES "okr_cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "objective"
    ADD CONSTRAINT "objective_source_objective_id_fkey"
    FOREIGN KEY ("source_objective_id") REFERENCES "objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "key_result"
    ADD CONSTRAINT "key_result_source_key_result_id_fkey"
    FOREIGN KEY ("source_key_result_id") REFERENCES "key_result"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "okr_cadence_config"
    ADD CONSTRAINT "okr_cadence_config_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "okr_cadence_config"
    ADD CONSTRAINT "okr_cadence_config_objective_id_fkey"
    FOREIGN KEY ("objective_id") REFERENCES "objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "okr_cadence_config"
    ADD CONSTRAINT "okr_cadence_config_team_id_fkey"
    FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "check_in"
    ADD CONSTRAINT "check_in_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "check_in"
    ADD CONSTRAINT "check_in_key_result_id_fkey"
    FOREIGN KEY ("key_result_id") REFERENCES "key_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "check_in"
    ADD CONSTRAINT "check_in_actor_member_id_fkey"
    FOREIGN KEY ("actor_member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "check_in_evidence"
    ADD CONSTRAINT "check_in_evidence_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "check_in_evidence"
    ADD CONSTRAINT "check_in_evidence_check_in_id_fkey"
    FOREIGN KEY ("check_in_id") REFERENCES "check_in"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "okr_audit_event"
    ADD CONSTRAINT "okr_audit_event_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "okr_audit_event"
    ADD CONSTRAINT "okr_audit_event_actor_member_id_fkey"
    FOREIGN KEY ("actor_member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "okr_cycle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "okr_cycle" FORCE ROW LEVEL SECURITY;
CREATE POLICY "okr_cycle_tenant_all" ON "okr_cycle" FOR ALL
    USING (organization_id = current_setting('app.current_org', true)::uuid)
    WITH CHECK (organization_id = current_setting('app.current_org', true)::uuid);

ALTER TABLE "okr_cadence_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "okr_cadence_config" FORCE ROW LEVEL SECURITY;
CREATE POLICY "okr_cadence_config_tenant_all" ON "okr_cadence_config" FOR ALL
    USING (organization_id = current_setting('app.current_org', true)::uuid)
    WITH CHECK (organization_id = current_setting('app.current_org', true)::uuid);

ALTER TABLE "check_in" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "check_in" FORCE ROW LEVEL SECURITY;
CREATE POLICY "check_in_tenant_all" ON "check_in" FOR ALL
    USING (organization_id = current_setting('app.current_org', true)::uuid)
    WITH CHECK (organization_id = current_setting('app.current_org', true)::uuid);

ALTER TABLE "check_in_evidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "check_in_evidence" FORCE ROW LEVEL SECURITY;
CREATE POLICY "check_in_evidence_tenant_all" ON "check_in_evidence" FOR ALL
    USING (organization_id = current_setting('app.current_org', true)::uuid)
    WITH CHECK (organization_id = current_setting('app.current_org', true)::uuid);

ALTER TABLE "okr_audit_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "okr_audit_event" FORCE ROW LEVEL SECURITY;
CREATE POLICY "okr_audit_event_tenant_select" ON "okr_audit_event" FOR SELECT
    USING (organization_id = current_setting('app.current_org', true)::uuid);
CREATE POLICY "okr_audit_event_tenant_insert" ON "okr_audit_event" FOR INSERT
    WITH CHECK (organization_id = current_setting('app.current_org', true)::uuid);
