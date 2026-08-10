-- strategy-northstar (change strategy-northstar): columnas de estatutos en
-- organization + input levers, pilares y su asignación. RLS en la misma
-- migración (ADR-0003 🔒). Progreso nunca persistido: derivado por roll-up.

-- AlterTable
ALTER TABLE "organization" ADD COLUMN "mission" TEXT,
ADD COLUMN "values" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "vision" TEXT;

-- CreateTable
CREATE TABLE "north_star_lever" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "north_star_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "objective_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "north_star_lever_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_pillar" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategic_pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pillar_objective" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "pillar_id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pillar_objective_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "north_star_lever_organization_id_idx" ON "north_star_lever"("organization_id");

-- CreateIndex
CREATE INDEX "north_star_lever_objective_id_idx" ON "north_star_lever"("objective_id");

-- CreateIndex
CREATE INDEX "strategic_pillar_organization_id_idx" ON "strategic_pillar"("organization_id");

-- CreateIndex
CREATE INDEX "pillar_objective_organization_id_idx" ON "pillar_objective"("organization_id");

-- CreateIndex
CREATE INDEX "pillar_objective_objective_id_idx" ON "pillar_objective"("objective_id");

-- CreateIndex
CREATE UNIQUE INDEX "pillar_objective_pillar_id_objective_id_key" ON "pillar_objective"("pillar_id", "objective_id");

-- AddForeignKey
ALTER TABLE "north_star_lever" ADD CONSTRAINT "north_star_lever_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "north_star_lever" ADD CONSTRAINT "north_star_lever_north_star_id_fkey" FOREIGN KEY ("north_star_id") REFERENCES "north_star"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "north_star_lever" ADD CONSTRAINT "north_star_lever_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_pillar" ADD CONSTRAINT "strategic_pillar_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pillar_objective" ADD CONSTRAINT "pillar_objective_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pillar_objective" ADD CONSTRAINT "pillar_objective_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "strategic_pillar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pillar_objective" ADD CONSTRAINT "pillar_objective_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS (ADR-0003 🔒): las tres tablas son tenant-scoped por organization_id.
ALTER TABLE "north_star_lever" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "north_star_lever" FORCE ROW LEVEL SECURITY;
CREATE POLICY "north_star_lever_tenant_all" ON "north_star_lever" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "strategic_pillar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "strategic_pillar" FORCE ROW LEVEL SECURITY;
CREATE POLICY "strategic_pillar_tenant_all" ON "strategic_pillar" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);

ALTER TABLE "pillar_objective" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pillar_objective" FORCE ROW LEVEL SECURITY;
CREATE POLICY "pillar_objective_tenant_all" ON "pillar_objective" FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
