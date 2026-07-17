# Design: identity-org-hardening

## F.1 — Vinculación por email verificado (🔒)

Problema: el invitado tiene `clerk_user_id NULL`; la política de self-lookup
existente (`app.current_user`) no lo puede encontrar. Igual que en fase 4, se
resuelve **dentro de RLS**, sin bypass:

- Variable de sesión nueva `app.current_user_email`, seteada con el **email
  verificado** que reporta Clerk (nunca input del usuario).
- Política SELECT: members con `clerk_user_id IS NULL` cuyo `email` coincide
  con la variable.
- Política UPDATE: mismo `USING`; el `WITH CHECK` exige que la fila resultante
  tenga `clerk_user_id = app.current_user` y el mismo email — solo podés
  vincularte a vos mismo.
- `linkMembershipsForUser` vincula **todas** las membresías sin vincular de
  ese email (multi-org de invitaciones). El fallback vive en el **borde**
  (páginas), no en `withTenantForUser`: `/members` captura `tenancy/no-member`,
  vincula y reintenta; `/onboarding` usa `resolveOrLinkTenantForUser`. Así los
  use cases no pagan el intento de linking en cada llamada — pero un entry
  point futuro que use solo `withTenantForUser` **no** auto-vincula: debe
  pasar por uno de esos dos caminos primero.
- El email que alimenta `app.current_user_email` sale de `verifiedEmail(user)`
  (`src/lib/verified-email.ts`): **solo emails con `verification.status ===
  "verified"`** — el gate es de código, no de configuración del dashboard.

**Riesgo residual documentado**: RLS no restringe columnas; la política UPDATE
permitiría en teoría modificar `name`/`role` de la fila propia sin vincular.
El único camino de escritura es la app (que solo setea `clerk_user_id`) y la
fila afectable es únicamente la del propio email verificado. Aceptado.

## F.3 — TOCTOU

- **F.3a (se corrige)**: `changeMemberRole` ejecuta
  `SELECT id FROM member WHERE role = 'Direccion' FOR UPDATE` dentro de la
  transacción antes de contar: dos demociones concurrentes se serializan y la
  segunda ve el count real.
- **F.3b (riesgo aceptado de MVP)**: dos `createOrganization` simultáneos del
  mismo usuario pueden crear dos orgs (una queda inalcanzable). Respaldarlo en
  DB pediría un unique global de `clerk_user_id`, que rompería el multi-org de
  invitaciones. Se reevalúa si aparece evidencia real.

## F.4 — Errores en server actions

Las actions devuelven `{ error: string }` vía `useActionState` (React 19) en
un client component de form; los casos esperados (`DomainError` /
`ApplicationError`) se mapean a mensajes en español; lo inesperado se relanza.
El form de invitación solo se renderiza para Dirección (la página ya conoce
los members; el rol del actor sale de ahí — también resuelve F.5b, una sola
resolución de tenant por request).
