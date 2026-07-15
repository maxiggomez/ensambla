-- AlterTable
ALTER TABLE "member" ADD COLUMN "clerk_user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "member_organization_id_clerk_user_id_key" ON "member"("organization_id", "clerk_user_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-lookup de membership (ADR-0003 🔒, foundation fase 4)
-- Para derivar el tenant de un request autenticado hay que leer los Members del
-- usuario ANTES de tener contexto de tenant. Esta política resuelve el
-- huevo-y-gallina dentro de RLS (sin bypass): con `app.current_user` seteado
-- (set_config local por request), un SELECT sobre member expone únicamente las
-- filas cuyo clerk_user_id es el del propio usuario. Las políticas son
-- permisivas (OR): esto NO amplía lo que ve un tenant ya resuelto más allá de
-- las filas propias del usuario autenticado.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "member_self_lookup_select" ON "member"
  FOR SELECT
  USING (
    clerk_user_id IS NOT NULL
    AND clerk_user_id = NULLIF(current_setting('app.current_user', true), '')
  );
