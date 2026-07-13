# AGENTS.md — Ensambla

Instrucciones para agentes de código (Codex, OpenCode, Claude Code) que trabajan en este
repo. Léelo antes de escribir cualquier línea.

> **Ensambla** — Business Alignment & Agile People OS para pymes. Nombre provisional.

## Orden de lectura (obligatorio, en este orden)

1. `openspec/project.md` — contexto permanente: propósito, lenguaje ubicuo, roles,
   invariantes, stack y convenciones.
2. `docs/adr/` — decisiones arquitectónicas que TODA feature respeta (ADR-0001 a 0007).
3. `docs/design-system.md` — tokens, componentes y patrones de UI.
4. `openspec/specs/<capability>/spec.md` — el comportamiento esperado de la capability
   en la que trabajás (Requirements SHALL + Scenarios GIVEN/WHEN/THEN).
5. `openspec/changes/<change>/` — el trabajo activo: `proposal.md`, `design.md`,
   `tasks.md` (test-first) y los deltas de spec.

## Reglas de comportamiento (no negociables)

- **TDD (ADR-0006):** primero el test que falla derivado del Scenario, luego la
  implementación (red → green → refactor). Test-first estricto en dominio/aplicación e
  invariantes; test-alongside permitido en UI. En `tasks.md`, la tarea de test va antes.
- **Un slice = un agente, end-to-end (vertical).** No repartir por capa. No tocar módulos
  de otra capability sin pasar por su interfaz pública.
- **Límites de módulos (ADR-0002):** los módulos se importan solo por `application/`.
  Prohibido el deep import entre módulos (lo verifica el lint).
- **Respetar las invariantes 🔒** (ver `project.md`): multi-tenancy, anonimato eNPS,
  roll-up de OKRs. Sus tests son obligatorios y no se saltean.
- **Idioma:** UI en español (LATAM); código y specs en inglés técnico; términos del
  lenguaje ubicuo tal cual (`Team`, `Objective`, `KeyResult`, `Measurement`, …).
- **Definition of Done de un change:** todos sus Scenarios pasan como tests verdes + CI
  en verde. No marcar tareas como hechas si algo falla.

## Stack (ADR-0001)

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui · Prisma + PostgreSQL (RLS) ·
Clerk (auth) · Zod · Vitest + Playwright · Recharts. Monolito modular
(`src/modules/<contexto>/`, `src/shared/`).

## Getting started

1. **Empezá por `openspec/changes/foundation/`** (scaffolding, auth, tenancy, shared
   kernel con `Measurement`, CI). Se hace en serie, antes de paralelizar.
2. Seguí `foundation/tasks.md` en orden, test-first.
3. Al cerrar `foundation` (CI verde + tests de tenancy verdes) → gate de review humano.
4. Después, un agente por capability según la secuencia del `README.md`:
   `strategy-northstar` + `okrs` → `teams-staffing` + `skills-matrix` →
   `rituals` · `feedback-growth` · `culture-enps` · `lean-experiments` →
   `executive-dashboard`. `onboarding-setup` puede adelantarse.

## Referencias

- Criterios de aceptación completos: `docs/norte-criterios-de-aceptacion.md` (o raíz).
- Prototipos de UI (referencia visual): `norte-prototipo.html`, `norte-onboarding.html`.
