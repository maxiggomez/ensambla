-- ─────────────────────────────────────────────────────────────────────────────
-- Vinculación por email verificado (ADR-0003 🔒, change identity-org-hardening)
-- Un invitado existe como member con clerk_user_id NULL: la política de
-- self-lookup por app.current_user no lo encuentra. Estas políticas permiten,
-- con `app.current_user_email` = email VERIFICADO por el proveedor de auth
-- (nunca input del usuario), ver y vincular únicamente las membresías sin
-- vincular de ese email. El WITH CHECK del UPDATE exige que la fila resultante
-- quede vinculada al propio `app.current_user`: no se puede capturar la
-- membresía de otro ni vincular a un tercero.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "member_email_self_lookup_select" ON "member"
  FOR SELECT
  USING (
    clerk_user_id IS NULL
    AND email = NULLIF(current_setting('app.current_user_email', true), '')
  );

CREATE POLICY "member_email_self_link_update" ON "member"
  FOR UPDATE
  USING (
    clerk_user_id IS NULL
    AND email = NULLIF(current_setting('app.current_user_email', true), '')
  )
  WITH CHECK (
    clerk_user_id = NULLIF(current_setting('app.current_user', true), '')
    AND email = NULLIF(current_setting('app.current_user_email', true), '')
  );
