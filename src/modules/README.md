# src/modules — bounded contexts (ADR-0002)

Un módulo por capability (`identity-org`, `okrs`, `teams-staffing`, …), cada uno con:

- `domain/` — entidades e invariantes.
- `application/` — casos de uso e **interfaz pública del módulo**.
- `infrastructure/` — repos Prisma, mapeos.

**Regla (verificada por lint):** otro módulo o la app solo pueden importar desde
`application/`. Prohibido el deep import a `domain/` o `infrastructure/` ajenos.
