# Tasks: identity-org-hardening

> Orden test-first (ADR-0006).

## 1. F.1 — Vinculación al primer login (🔒)

- [x] 1.1 **Test** integración `member-linking.test.ts`: vincula al primer
  login, no vincula email ajeno, no toca members ya vinculados, vincula todas
  las membresías del email, la política no permite vincular a otro clerk id. (rojo)
- [x] 1.2 Migración: políticas RLS `member_email_self_lookup` (SELECT/UPDATE)
  + `linkMembershipsForUser` + fallback en las páginas (`/members` y
  `/onboarding` vía `resolveOrLinkTenantForUser`), con gate de email
  verificado en código (`verifiedEmail`). (verde)

## 2. F.2 / F.5 — Dominio

- [x] 2.1 **Test** unit: tabla de `direccion-guard` y `memberName` (vacío,
  trim). (rojo)
- [x] 2.2 `memberName` value object aplicado en `inviteMember`. (verde)

## 3. F.3a — Democión serializada (🔒)

- [x] 3.1 **Test** integración: demociones concurrentes de dos Direcciones →
  a lo sumo una gana; queda ≥1 Dirección. (rojo probabilístico; el lock lo
  vuelve determinista)
- [x] 3.2 Lock de fila (`FOR UPDATE`) en `changeMemberRole`. (verde)

## 4. F.4 / F.5b — UX

- [x] 4.1 Server actions con estado de error + form client con mensajes en
  español; form de invitación visible solo para Dirección; una sola resolución
  de tenant en `/members`; localización `esES` de Clerk.
- [x] 4.2 **Test** e2e: invitación con email inválido muestra error amigable
  sin crear member. (test-alongside, UI)

## 5. Verificación

- [x] 5.1 typecheck + lint + format + Vitest + openspec validate en verde.
- [x] 5.2 e2e completo en verde (smoke + design-tokens + identity-org + error).
