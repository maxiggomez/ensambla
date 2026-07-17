-- CreateEnum
CREATE TYPE "ObjectiveLevel" AS ENUM ('Company', 'Area', 'Team', 'Person');

-- CreateEnum
CREATE TYPE "ObjectiveStatus" AS ENUM ('Draft', 'Published');

-- CreateEnum
CREATE TYPE "MeasurementType" AS ENUM ('Check', 'Percentage', 'Integer', 'Currency', 'Text');

-- CreateEnum
CREATE TYPE "TextState" AS ENUM ('NotStarted', 'InProgress', 'Done');

-- CreateTable
CREATE TABLE "north_star" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "measurement_type" "MeasurementType" NOT NULL,
    "start_value" DECIMAL(20,4),
    "target_value" DECIMAL(20,4),
    "current_value" DECIMAL(20,4),
    "check_done" BOOLEAN,
    "text_state" "TextState",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "north_star_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objective" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "level" "ObjectiveLevel" NOT NULL,
    "status" "ObjectiveStatus" NOT NULL DEFAULT 'Draft',
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_result" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "measurement_type" "MeasurementType" NOT NULL,
    "start_value" DECIMAL(20,4),
    "target_value" DECIMAL(20,4),
    "current_value" DECIMAL(20,4),
    "check_done" BOOLEAN,
    "text_state" "TextState",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "north_star_organization_id_key" ON "north_star"("organization_id");

-- CreateIndex
CREATE INDEX "objective_organization_id_idx" ON "objective"("organization_id");

-- CreateIndex
CREATE INDEX "key_result_organization_id_idx" ON "key_result"("organization_id");

-- CreateIndex
CREATE INDEX "key_result_objective_id_idx" ON "key_result"("objective_id");

-- AddForeignKey
ALTER TABLE "north_star" ADD CONSTRAINT "north_star_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective" ADD CONSTRAINT "objective_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective" ADD CONSTRAINT "objective_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_result" ADD CONSTRAINT "key_result_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_result" ADD CONSTRAINT "key_result_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security (ADR-0003 🔒)
-- Toda tabla de tenant nace con su política RLS en la misma migración.
-- Patrón idéntico a `member_tenant_all`: todas las operaciones exigen el
-- tenant actual (`app.current_org`, seteado por withTenant()).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "north_star" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "north_star" FORCE ROW LEVEL SECURITY;

CREATE POLICY "north_star_tenant_all" ON "north_star"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "objective" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "objective" FORCE ROW LEVEL SECURITY;

CREATE POLICY "objective_tenant_all" ON "objective"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "key_result" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "key_result" FORCE ROW LEVEL SECURITY;

CREATE POLICY "key_result_tenant_all" ON "key_result"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
