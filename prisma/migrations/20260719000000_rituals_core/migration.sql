-- CreateEnum
CREATE TYPE "RitualCadence" AS ENUM ('Weekly', 'Biweekly', 'Monthly');

-- CreateEnum
CREATE TYPE "RitualOccurrenceStatus" AS ENUM ('Scheduled', 'Held', 'Overdue');

-- CreateEnum
CREATE TYPE "BlockerStatus" AS ENUM ('Open', 'Resolved');

-- CreateTable
CREATE TABLE "ritual" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cadence" "RitualCadence" NOT NULL,
    "start_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ritual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ritual_occurrence" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "ritual_id" UUID NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "status" "RitualOccurrenceStatus" NOT NULL DEFAULT 'Scheduled',
    "held_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ritual_occurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocker" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "objective_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "BlockerStatus" NOT NULL DEFAULT 'Open',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "blocker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retrospective" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "held_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retrospective_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ritual_organization_id_idx" ON "ritual"("organization_id");

-- CreateIndex
CREATE INDEX "ritual_team_id_idx" ON "ritual"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "ritual_occurrence_ritual_id_scheduled_date_key" ON "ritual_occurrence"("ritual_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "ritual_occurrence_organization_id_idx" ON "ritual_occurrence"("organization_id");

-- CreateIndex
CREATE INDEX "blocker_organization_id_idx" ON "blocker"("organization_id");

-- CreateIndex
CREATE INDEX "blocker_team_id_idx" ON "blocker"("team_id");

-- CreateIndex
CREATE INDEX "blocker_objective_id_idx" ON "blocker"("objective_id");

-- CreateIndex
CREATE INDEX "blocker_status_idx" ON "blocker"("status");

-- CreateIndex
CREATE INDEX "retrospective_organization_id_idx" ON "retrospective"("organization_id");

-- CreateIndex
CREATE INDEX "retrospective_team_id_idx" ON "retrospective"("team_id");

-- AddForeignKey
ALTER TABLE "ritual" ADD CONSTRAINT "ritual_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ritual" ADD CONSTRAINT "ritual_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ritual_occurrence" ADD CONSTRAINT "ritual_occurrence_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ritual_occurrence" ADD CONSTRAINT "ritual_occurrence_ritual_id_fkey" FOREIGN KEY ("ritual_id") REFERENCES "ritual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocker" ADD CONSTRAINT "blocker_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocker" ADD CONSTRAINT "blocker_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocker" ADD CONSTRAINT "blocker_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocker" ADD CONSTRAINT "blocker_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retrospective" ADD CONSTRAINT "retrospective_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retrospective" ADD CONSTRAINT "retrospective_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security (ADR-0003 🔒)
-- Toda tabla de tenant nace con su política RLS en la misma migración.
-- Patrón idéntico a `member_tenant_all`.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "ritual" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ritual" FORCE ROW LEVEL SECURITY;

CREATE POLICY "ritual_tenant_all" ON "ritual"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "ritual_occurrence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ritual_occurrence" FORCE ROW LEVEL SECURITY;

CREATE POLICY "ritual_occurrence_tenant_all" ON "ritual_occurrence"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "blocker" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blocker" FORCE ROW LEVEL SECURITY;

CREATE POLICY "blocker_tenant_all" ON "blocker"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "retrospective" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "retrospective" FORCE ROW LEVEL SECURITY;

CREATE POLICY "retrospective_tenant_all" ON "retrospective"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
