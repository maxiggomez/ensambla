-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('Direccion', 'Lider', 'Colaborador');

-- CreateTable
CREATE TABLE "organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_organization_id_email_key" ON "member"("organization_id", "email");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security (ADR-0003 🔒)
-- Toda tabla de tenant DEBE crearse con su política RLS en la misma migración.
-- FORCE es obligatorio: Prisma conecta como owner de las tablas y sin FORCE el
-- owner bypassea RLS silenciosamente.
-- El tenant del request se lee de la variable de sesión `app.current_org`,
-- seteada por withTenant() con set_config(..., true) dentro de la transacción.
-- ─────────────────────────────────────────────────────────────────────────────

-- organization: visible/editable solo para el propio tenant. INSERT queda
-- abierto porque crear una organización es una operación pre-tenant (todavía
-- no existe contexto); lectura y modificación sí exigen el tenant.
ALTER TABLE "organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization" FORCE ROW LEVEL SECURITY;

CREATE POLICY "organization_tenant_select" ON "organization"
  FOR SELECT
  USING (id = NULLIF(current_setting('app.current_org', true), '')::uuid);

CREATE POLICY "organization_tenant_update" ON "organization"
  FOR UPDATE
  USING (id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.current_org', true), '')::uuid);

CREATE POLICY "organization_tenant_delete" ON "organization"
  FOR DELETE
  USING (id = NULLIF(current_setting('app.current_org', true), '')::uuid);

CREATE POLICY "organization_pre_tenant_insert" ON "organization"
  FOR INSERT
  WITH CHECK (true);

-- member: todas las operaciones exigen el tenant actual.
ALTER TABLE "member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "member" FORCE ROW LEVEL SECURITY;

CREATE POLICY "member_tenant_all" ON "member"
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
