# Proposal: rituals-ui

## Why

`rituals` tiene dominio/aplicación/infra y RLS completos y probados, pero la
ruta `/rituales` renderiza el placeholder `UnderConstruction`
(`mvp-release-readiness`: "No ceremony, blocker or retrospective UI"). Sin UI,
la cadencia operativa (ceremonias, blockers, retros) no es usable: los datos
solo se escriben por contrato.

## What Changes

- **UI de ceremonias** en `/rituales`: definir un Ritual por Team con nombre y
  cadencia (weekly/biweekly), avanzar la cadencia desde la UI (generar
  ocurrencias hasta hoy), evaluar/mostrar el estado por ocurrencia
  (Scheduled/Held/Overdue) y marcarla como realizada.
- **UI de Blockers**: registrar un Blocker (Team, título, descripción,
  Objective opcional que bloquea), tablero de abiertos (con dueño y fecha) y
  resolución; contador de resueltos.
- **UI de retrospectivas y aprendizaje**: registrar una Retrospectiva por Team
  y mostrar los flags derivados de riesgo de aprendizaje (Team sin retro).

No cambia el backend: solo se consumen los contratos públicos existentes de
`rituals` (y `teams-staffing`/`okrs` para teams/objetivos).

## Capabilities

### MODIFIED: `rituals`

Nuevos requirements de UI. Se reemplaza el placeholder de `app-shell` para
esta ruta.

## Non-goals

- No tocar `src/modules/rituals/**` (domain/application/infrastructure).
- No scheduler/cron: la generación de ocurrencias se dispara desde la UI
  (caso de uso existente) hasta hoy; el runner de plataforma queda para otro
  slice.
- No notificaciones.

## Impact

- `src/app/(app)/rituales/` (nueva página + actions + forms + parsers + test de
  contrato UI).
- `e2e/rituals.spec.ts` (nuevo) y `e2e/app-shell.spec.ts` (deja de asumir
  placeholder en esta ruta).
- `playwright.dev-auth.config.ts` (testMatch nuevo). Spec delta de `rituals` y
  `app-shell`.