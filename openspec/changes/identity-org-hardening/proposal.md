# Proposal: identity-org-hardening

## Why

La review de `foundation` (fase 5) dejó cinco follow-ups documentados
(F.1–F.5 en el tasks.md archivado). El más importante es F.1: hoy un invitado
existe como Member sin identidad de auth (`clerk_user_id NULL`) y **no puede
acceder nunca** — el Scenario "the person gains access" de ORG-2 está
implementado a medias. Los demás endurecen invariantes y UX: guard de última
Dirección sin unit test propio (F.2), dos TOCTOU sin serializar (F.3), forms
sin estados de error y Clerk en inglés (F.4), y el nombre de member sin
validar (F.5).

## What Changes

- **F.1 — Vinculación al primer login (🔒)**: nueva política RLS de
  self-lookup **por email verificado** (`app.current_user_email`) sobre
  members sin vincular, con `WITH CHECK` que solo admite escribir el propio
  `clerk_user_id`. El fallback de vinculación vive en las páginas
  (`/members` captura `tenancy/no-member` y reintenta;
  `/onboarding` usa `resolveOrLinkTenantForUser`), siempre con el email
  verificado (`verifiedEmail(user)`).
- **F.2**: unit test de tabla para `direccion-guard`.
- **F.3a — Democión serializada (🔒)**: `changeMemberRole` toma lock de fila
  sobre las Direcciones de la org antes de contar, eliminando la carrera de
  demociones concurrentes. **F.3b** (doble `createOrganization` concurrente)
  queda como riesgo aceptado de MVP, documentado en design.md.
- **F.4 — UX**: server actions devuelven errores amigables (sin pantalla cruda
  de Next), localización `esES` de Clerk, y el form de invitación solo se
  muestra a Dirección.
- **F.5**: value object `memberName` (rechaza vacío) y dedup de la resolución
  de tenant en `/members`.

## Capabilities

### MODIFIED: `identity-org`

El acceso del invitado se completa: al primer login con el email invitado, la
persona queda vinculada y entra a su organización con el rol asignado.

## Impact

- Migración RLS nueva (🔒), `src/shared/tenancy`, `src/modules/identity-org`
  (domain/application), `src/app` (UI), tests de integración y e2e.
