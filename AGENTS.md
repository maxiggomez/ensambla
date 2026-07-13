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

## Engineering loop (mg-eng-loop)

Toda feature o bugfix se trabaja con el loop del proyecto: skill **`mg-eng-loop`**
(protocolo: DISCOVER → CAMINO → OpenSpec → **PLAN DE TESTS con gate de aprobación
del usuario** → RED → GREEN → REFACTOR → VERIFY → REVIEW → cierre). La revisión
usa la skill **`mg-pr-review`** (read-only, estado final APPROVED/COMMENTS/BLOCKED).

Dos gates de usuario obligatorios: (1) elección de camino corto/completo, que
incluye el **mapa de impacto arquitectónico** (módulo + capa DDD + archivos
previstos) para validar dónde va el cambio, y (2) aprobación del plan de tests
antes de escribir código. La dirección de capas DDD (domain puro ← application
← infrastructure) la refuerza el lint además del protocolo.

### Harness adapter map

El protocolo vive **una sola vez** en `.agents/skills/` (fuente canónica) y cada
runtime tiene un adapter fino. Propagación: `scripts/sync-skills.sh`
(anti-drift: `scripts/sync-skills.sh --check`, corre en pre-commit).

| Primitiva  | Claude Code                    | OpenCode                     | Codex                                  | Qwen Code                                     |
| ---------- | ------------------------------ | ---------------------------- | -------------------------------------- | --------------------------------------------- |
| Loop       | `/mg-eng-loop`                 | `/mg-eng-loop`               | `/mg-eng-loop` (prompt)                | `/mg-eng-loop` (TOML)                         |
| Review     | `/mg-loop-review`              | `/mg-loop-review`            | `/mg-loop-review` (prompt)             | `/mg-loop-review` (TOML)                      |
| Skills     | `.claude/skills/` (synced)     | `.opencode/skills/` (synced) | `.codex/skills/` (synced)              | sin skills — el comando lee `.agents/skills/` |
| Contexto   | `CLAUDE.md` → este archivo     | este archivo (nativo)        | este archivo (nativo)                  | `.qwen/settings.json` → este archivo          |
| Guardrails | `.claude/settings.json` (deny) | `.opencode/opencode.json`    | `.codex/config.toml` (sandbox sin red) | `.qwen/settings.json` (excludeTools)          |

Las skills `openspec-*` las genera `openspec init` por runtime (difieren a
propósito) y quedan fuera del sync.

### Gate determinista

- **Pre-commit** (`.githooks/pre-commit`, habilitar con `scripts/setup-hooks.sh`):
  typecheck + lint + prettier sobre lo staged, anti-drift de skills y
  `openspec validate` si se tocó `openspec/`. Igual para todos los runtimes y
  commits manuales. Bypass de emergencia: `git commit --no-verify`.
- **CI** (`.github/workflows/ci.yml`): la batería completa. Verde = DoD.

### Hard rules del loop

Nunca trabajar sobre `main` · nunca `git push` · nunca commit sin aprobación ·
nunca tocar `.env`/secretos · nunca deshabilitar RLS ni saltear tests de
invariantes 🔒 · nunca `any` sin justificación aprobada.

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
