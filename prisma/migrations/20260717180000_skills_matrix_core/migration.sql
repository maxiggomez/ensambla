-- CreateEnum
CREATE TYPE "Seniority" AS ENUM ('Junior', 'SemiSenior', 'Senior');

-- AlterTable (aditivo, sin backfill: sin dato rankea último)
ALTER TABLE "member" ADD COLUMN "seniority" "Seniority";

-- CreateTable
CREATE TABLE "skill" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competency" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_requirement" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "project_id" UUID,
    "key_result_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_requirement_pkey" PRIMARY KEY ("id"),
    -- Exactamente un destino: Project XOR KeyResult.
    CONSTRAINT "skill_requirement_one_target" CHECK (
      ("project_id" IS NOT NULL) <> ("key_result_id" IS NOT NULL)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_organization_id_name_key" ON "skill"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "competency_member_id_skill_id_key" ON "competency"("member_id", "skill_id");

-- CreateIndex
CREATE INDEX "competency_organization_id_idx" ON "competency"("organization_id");

-- CreateIndex
CREATE INDEX "competency_skill_id_idx" ON "competency"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_requirement_skill_id_project_id_key" ON "skill_requirement"("skill_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_requirement_skill_id_key_result_id_key" ON "skill_requirement"("skill_id", "key_result_id");

-- CreateIndex
CREATE INDEX "skill_requirement_organization_id_idx" ON "skill_requirement"("organization_id");

-- AddForeignKey
ALTER TABLE "skill" ADD CONSTRAINT "skill_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency" ADD CONSTRAINT "competency_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency" ADD CONSTRAINT "competency_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency" ADD CONSTRAINT "competency_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_requirement" ADD CONSTRAINT "skill_requirement_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_requirement" ADD CONSTRAINT "skill_requirement_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_requirement" ADD CONSTRAINT "skill_requirement_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_requirement" ADD CONSTRAINT "skill_requirement_key_result_id_fkey" FOREIGN KEY ("key_result_id") REFERENCES "key_result"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security (ADR-0003 🔒) — patrón member_tenant_all.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "skill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "skill" FORCE ROW LEVEL SECURITY;

CREATE POLICY "skill_tenant_all" ON "skill"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "competency" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "competency" FORCE ROW LEVEL SECURITY;

CREATE POLICY "competency_tenant_all" ON "competency"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "skill_requirement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "skill_requirement" FORCE ROW LEVEL SECURITY;

CREATE POLICY "skill_requirement_tenant_all" ON "skill_requirement"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
