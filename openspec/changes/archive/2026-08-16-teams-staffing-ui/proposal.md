# Proposal: teams-staffing-ui

## Why

`teams-staffing` tiene dominio/aplicación/infra y RLS completos y probados, pero
la ruta `/equipos-y-proyectos` renderiza el placeholder `UnderConstruction`
(`mvp-release-readiness`: "No user-operable Team, assignment, Project or
capacity UI"). Sin UI, la capability no es usable por la dirección ni los
líderes: no se pueden armar equipos, asignar personas con su carga, ni vincular
proyectos a OKRs.

## What Changes

- **UI completa de Teams** en `/equipos-y-proyectos`: listado de Teams con sus
  miembros (rol dentro del Team + % de capacidad) y la capacidad derivada con
  flag de overload; formularios de creación/edición de Team y de asignación de
  un Member con rol y % de capacidad.
- **UI de Proyectos**: crear Project (estado Active), listar Projects con su
  estado, vincularlo a uno o más Objectives, y cerrarlo (Dirección o Líder).
- **Alertas de alineamiento**: Projects sin OKR y KeyResults de Objectives
  publicados sin Project que los mueva (derivadas en lectura vía
  `evaluateAlignment`).
- **Visibilidad por rol**: reutiliza las policies existentes — Dirección y
  Líder administran (crear/editar equipo, asignar, proyectos); Colaborador solo
  lectura. La autorización real la sigue aplicando la capa `application/`.

No cambia el backend: solo se consumen los contratos públicos existentes de
`teams-staffing` (y `identity-org`/`okrs` para members/objetivos).

## Capabilities

### MODIFIED: `teams-staffing`

Nuevos requirements de UI (mismo modulo, sin tocar dominio). Se reemplaza el
placeholder de `app-shell` para esta ruta.

## Non-goals

- No tocar `src/modules/teams-staffing/**` (domain/application/infrastructure):
  los casos de uso y políticas ya existen y siguen siendo la autoridad.
- No planificador de capacidad visual más allá de los % y flags derivados.
- No paginación ni búsqueda.
- Una sola página (no vistas anidadas por Team) en este slice.

## Impact

- `src/app/(app)/equipos-y-proyectos/` (nueva página + actions + forms +
  parsers + test de contrato UI).
- `e2e/teams-staffing.spec.ts` (nuevo) y `e2e/app-shell.spec.ts` (deja de
  asumir placeholder en esta ruta).
- `playwright.dev-auth.config.ts` (testMatch nuevo). `app-shell` spec y delta.