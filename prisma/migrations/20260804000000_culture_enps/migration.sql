-- culture-enps: anonymous continuous pulses (ADR-0003 / ADR-0004 / ADR-0005 🔒)

ALTER TABLE "organization"
  ADD COLUMN "enps_minimum_responses" INTEGER NOT NULL DEFAULT 4,
  ADD CONSTRAINT "organization_enps_minimum_responses_check"
    CHECK ("enps_minimum_responses" BETWEEN 4 AND 100);

CREATE TYPE "PulseScope" AS ENUM ('Organization', 'Team');
CREATE TYPE "PulseFrequency" AS ENUM ('Weekly', 'Monthly', 'Quarterly');
CREATE TYPE "PulseStatus" AS ENUM ('Open', 'Closed');
CREATE TYPE "PulseDriver" AS ENUM (
  'Recognition', 'GoalClarity', 'CareerGrowth', 'Workload', 'Coordination', 'Other'
);

CREATE TABLE "pulse_schedule" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "scope" "PulseScope" NOT NULL,
  "team_id" UUID,
  "frequency" "PulseFrequency" NOT NULL,
  "next_run_at" TIMESTAMPTZ(6) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pulse_schedule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pulse_schedule_scope_team_check" CHECK (
    ("scope" = 'Organization' AND "team_id" IS NULL)
    OR ("scope" = 'Team' AND "team_id" IS NOT NULL)
  )
);

CREATE TABLE "pulse" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "scope" "PulseScope" NOT NULL,
  "team_id" UUID,
  "status" "PulseStatus" NOT NULL DEFAULT 'Open',
  "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closes_at" TIMESTAMPTZ(6),
  "schedule_id" UUID,
  "scheduled_for" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pulse_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pulse_scope_team_check" CHECK (
    ("scope" = 'Organization' AND "team_id" IS NULL)
    OR ("scope" = 'Team' AND "team_id" IS NOT NULL)
  ),
  CONSTRAINT "pulse_schedule_fields_check" CHECK (
    ("schedule_id" IS NULL AND "scheduled_for" IS NULL)
    OR ("schedule_id" IS NOT NULL AND "scheduled_for" IS NOT NULL)
  )
);

CREATE TABLE "pulse_participation" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "pulse_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "responded" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pulse_participation_pkey" PRIMARY KEY ("id")
);

-- There is intentionally no member_id, participation_id, auth id, or mutable
-- timestamp on this table. Participation and response cannot be joined.
CREATE TABLE "pulse_response" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "pulse_id" UUID NOT NULL,
  "team_id" UUID,
  "measurement_type" "MeasurementType" NOT NULL,
  "start_value" DECIMAL(20,4) NOT NULL,
  "target_value" DECIMAL(20,4) NOT NULL,
  "current_value" DECIMAL(20,4) NOT NULL,
  "check_done" BOOLEAN,
  "text_state" "TextState",
  "driver" "PulseDriver" NOT NULL,
  "comment" TEXT,
  "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pulse_response_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pulse_response_rating_measurement_check" CHECK (
    "measurement_type" = 'Integer'
    AND "start_value" = 0
    AND "target_value" = 10
    AND "current_value" BETWEEN 0 AND 10
    AND "current_value" = trunc("current_value")
    AND "check_done" IS NULL
    AND "text_state" IS NULL
  ),
  CONSTRAINT "pulse_response_comment_length_check" CHECK (
    "comment" IS NULL OR char_length("comment") <= 2000
  )
);

CREATE INDEX "pulse_schedule_organization_id_idx" ON "pulse_schedule"("organization_id");
CREATE INDEX "pulse_schedule_next_run_at_active_idx" ON "pulse_schedule"("next_run_at", "active");
CREATE UNIQUE INDEX "pulse_schedule_id_organization_id_key" ON "pulse_schedule"("id", "organization_id");
CREATE INDEX "pulse_organization_id_idx" ON "pulse"("organization_id");
CREATE INDEX "pulse_team_id_idx" ON "pulse"("team_id");
CREATE UNIQUE INDEX "pulse_schedule_id_scheduled_for_key" ON "pulse"("schedule_id", "scheduled_for");
CREATE UNIQUE INDEX "pulse_id_organization_id_key" ON "pulse"("id", "organization_id");
CREATE UNIQUE INDEX "pulse_participation_pulse_id_member_id_key" ON "pulse_participation"("pulse_id", "member_id");
CREATE INDEX "pulse_participation_organization_id_idx" ON "pulse_participation"("organization_id");
CREATE INDEX "pulse_participation_member_id_idx" ON "pulse_participation"("member_id");
CREATE INDEX "pulse_response_organization_id_idx" ON "pulse_response"("organization_id");
CREATE INDEX "pulse_response_pulse_id_idx" ON "pulse_response"("pulse_id");
CREATE INDEX "pulse_response_team_id_idx" ON "pulse_response"("team_id");

ALTER TABLE "pulse_schedule" ADD CONSTRAINT "pulse_schedule_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pulse_schedule" ADD CONSTRAINT "pulse_schedule_team_id_fkey"
  FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pulse" ADD CONSTRAINT "pulse_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pulse" ADD CONSTRAINT "pulse_team_id_fkey"
  FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pulse" ADD CONSTRAINT "pulse_schedule_tenant_fkey"
  FOREIGN KEY ("schedule_id", "organization_id")
  REFERENCES "pulse_schedule"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pulse_participation" ADD CONSTRAINT "pulse_participation_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pulse_participation" ADD CONSTRAINT "pulse_participation_pulse_tenant_fkey"
  FOREIGN KEY ("pulse_id", "organization_id")
  REFERENCES "pulse"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pulse_participation" ADD CONSTRAINT "pulse_participation_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pulse_response" ADD CONSTRAINT "pulse_response_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pulse_response" ADD CONSTRAINT "pulse_response_pulse_tenant_fkey"
  FOREIGN KEY ("pulse_id", "organization_id")
  REFERENCES "pulse"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pulse_response" ADD CONSTRAINT "pulse_response_team_id_fkey"
  FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION reject_pulse_response_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'PulseResponse is immutable';
END;
$$;

CREATE TRIGGER pulse_response_immutable
BEFORE UPDATE OR DELETE ON "pulse_response"
FOR EACH ROW EXECUTE FUNCTION reject_pulse_response_mutation();

ALTER TABLE "pulse_schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pulse_schedule" FORCE ROW LEVEL SECURITY;
CREATE POLICY "pulse_schedule_tenant_all" ON "pulse_schedule" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "pulse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pulse" FORCE ROW LEVEL SECURITY;
CREATE POLICY "pulse_tenant_all" ON "pulse" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "pulse_participation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pulse_participation" FORCE ROW LEVEL SECURITY;
CREATE POLICY "pulse_participation_tenant_all" ON "pulse_participation" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "pulse_response" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pulse_response" FORCE ROW LEVEL SECURITY;
CREATE POLICY "pulse_response_tenant_all" ON "pulse_response" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
