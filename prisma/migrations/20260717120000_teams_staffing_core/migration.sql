-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('Lead', 'Contributor');

-- CreateTable
CREATE TABLE "team" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "role" "TeamRole" NOT NULL,
    "capacity_percent" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_objective" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_objective_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_organization_id_idx" ON "team"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_team_id_member_id_key" ON "team_member"("team_id", "member_id");

-- CreateIndex
CREATE INDEX "team_member_organization_id_idx" ON "team_member"("organization_id");

-- CreateIndex
CREATE INDEX "team_member_member_id_idx" ON "team_member"("member_id");

-- CreateIndex
CREATE INDEX "project_organization_id_idx" ON "project"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_objective_project_id_objective_id_key" ON "project_objective"("project_id", "objective_id");

-- CreateIndex
CREATE INDEX "project_objective_organization_id_idx" ON "project_objective"("organization_id");

-- CreateIndex
CREATE INDEX "project_objective_objective_id_idx" ON "project_objective"("objective_id");

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_objective" ADD CONSTRAINT "project_objective_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_objective" ADD CONSTRAINT "project_objective_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_objective" ADD CONSTRAINT "project_objective_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security (ADR-0003 🔒)
-- Toda tabla de tenant nace con su política RLS en la misma migración.
-- Patrón idéntico a `member_tenant_all`.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "team" FORCE ROW LEVEL SECURITY;

CREATE POLICY "team_tenant_all" ON "team"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "team_member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "team_member" FORCE ROW LEVEL SECURITY;

CREATE POLICY "team_member_tenant_all" ON "team_member"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project" FORCE ROW LEVEL SECURITY;

CREATE POLICY "project_tenant_all" ON "project"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "project_objective" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_objective" FORCE ROW LEVEL SECURITY;

CREATE POLICY "project_objective_tenant_all" ON "project_objective"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
