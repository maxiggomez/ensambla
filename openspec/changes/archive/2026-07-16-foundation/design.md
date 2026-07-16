# Design: foundation

Decisiones técnicas de este change. Respeta ADR-0001..0007.

## Estructura del repo (monolito modular)

```
src/
  app/                     # rutas Next.js (App Router)
  modules/
    identity-org/
      domain/              # entidades, invariantes (Organization, Member, Role)
      application/         # casos de uso + interfaces públicas del módulo
      infrastructure/      # Prisma repos, mapeo
  shared/                  # shared kernel
    measurement/           # value object Measurement (ADR-0004)
    tenancy/               # contexto de tenant por request
    ids/                   # tipos de IDs (branded types)
    errors/                # errores de dominio/aplicación
    db/                    # cliente Prisma + set de session var
test/                      # helpers de test, DB efímera
```

Regla de límites (ADR-0002): los módulos se importan solo por `application/`; se
prohíben deep imports con una regla de lint (`eslint-plugin-boundaries` o equivalente).

## Multi-tenancy (ADR-0003)

- Toda tabla de tenant lleva `organization_id uuid not null`.
- **RLS activo** con política `USING (organization_id = current_setting('app.current_org')::uuid)`.
- Por request: middleware obtiene la Organization del usuario autenticado y, dentro de
  la transacción, ejecuta `SET LOCAL app.current_org = <id>` antes de cualquier query.
- Helper central `withTenant(orgId, fn)` — ningún repo consulta sin pasar por él.
- CI incluye un test que verifica que una query sin tenant no devuelve datos de otra org.

## `Measurement` (ADR-0004)

- Unión discriminada de Zod por `type`: `Check | Percentage | Integer | Currency | Text`.
- Value object con `progress()` polimórfico y validación por tipo.
- Persistencia con columnas explícitas (queryables): `measurement_type`, `start_value`,
  `target_value`, `current_value` (numéricos nullable), `text_state`.
- Reutilizable por `okrs`, `strategy-northstar`, `lean-experiments`.

## Auth

- **Clerk** para autenticación (MVP, free tier). La **Organization y el Member son
  entidades de dominio propias** (source of truth en nuestra DB); Clerk resuelve login e
  identidad, y se sincroniza el usuario ↔ Member.
- Alternativa self-hosted: Auth.js (no bloquea el diseño; el contrato de "usuario
  autenticado → tenant" es el mismo).

## Migraciones y datos

- Prisma Migrate. Las políticas RLS se agregan por SQL en la migración.
- **Regla:** toda migración que crea una tabla de tenant DEBE incluir su política RLS
  (check en CI).

## Testing y CI (ADR-0006)

- **Vitest:** dominio (Measurement, invariantes) + integración (casos de uso, RLS contra
  Postgres efímero en Docker).
- **Playwright:** e2e del flujo de alta de organización y de invitación de miembro.
- **CI (GitHub Actions):** typecheck → lint (incl. límites de módulos) → Vitest →
  Playwright → build. Verde = Definition of Done.
