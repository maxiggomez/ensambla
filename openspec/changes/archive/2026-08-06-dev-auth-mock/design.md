# Design: dev-auth-mock

## Contexto

La app consume Clerk en 6 puntos server-side (`auth()`, `currentUser()`,
`clerkMiddleware`) + `ClerkProvider` y `SignIn` en cliente. El contrato real
es chico: un `userId` opaco (que alimenta RLS vía `app.current_user`) y un
shape `User` del que solo se lee `id`, `primaryEmailAddress`, `emailAddresses
[].verification.status` y `fullName` (vía `src/lib/verified-email.ts`).

## Decisión: seam en la frontera de API, no proxy de red

No se intercepta la red de Clerk (frágil, no resuelve incógnito). Se introduce
un gateway que expone la misma API y delega a Clerk o al mock según el modo.

```
app (pages/actions)                client (provider, sign-in)
      │ getAuthContext()                 │ <AuthProvider>
      ▼                                  ▼
┌──────────────────────┐        ┌────────────────────┐
│  src/lib/auth/       │        │  provider cond.    │
│  gateway.ts          │        └────────────────────┘
│   clerk │ mock       │
└──────────────────────┘
```

## Modo (gate 🔒)

`resolveAuthMode()`:
- `NODE_ENV === 'production'` → siempre `clerk` (el mock no compila en el
  bundle y el route de dev no existe).
- si no, `AUTH_MODE=mock` → `mock`; `AUTH_MODE` ausente u otro valor → `clerk`.
- `AUTH_MODE=clerk` explícito como forma de salir del mock sin cambiar env.

## Sesión mock

Cookie `httpOnly` first-party `ensambla_dev_user=<id dev_*>` seteada por un
server action desde el picker. `getCurrentUser()` en modo mock construye el
shape `User` desde `mock-users.ts` (emails `verified`) para que
`verifiedEmail()` y la vinculación F.1 operen sin cambios.

## Compatibilidad con tenancy/RLS (🔒)

Los ids mock (`dev_ceo@ensambla.dev` etc.) son strings opacos como los de
Clerk. `member.clerk_user_id` se siembra con esos ids y `set_config(
'app.current_user', ...)` los acepta tal cual. No se toca RLS ni invariantes.

## Riesgos

- El mock jamás debe colarse en producción: el gate de `NODE_ENV` es el
  doble candado (build + 404 del route).
- No usar ningún hook client-side de Clerk (hoy no existe); si llegara, el
  provider mock debe exponer ese contrato también.
