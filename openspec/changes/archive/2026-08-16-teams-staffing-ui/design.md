# Design: teams-staffing-ui

## Contexto

El módulo ya expone todo lo necesario por `application/`. La página es una
composición (server component) que lee estado y delega las mutaciones a server
actions; las forms son client components con `useActionState` (patrón idéntico
a `feedback-y-carrera/`).

## Datos leídos por la página

- `listMembers` (`identity-org`) → para el selector de persona y el actor.
- `listTeamCapacities` → teams con capacidad derivada + overload.
- `listTeamAssignments({teamId})` por team → miembros con rol y %.
- `listProjectContexts` → proyectos con estado.
- `listObjectives` (`okrs`) → objetivo a vincular y KRs para alertas.
- `evaluateAlignment` → `projectsWithoutOkr` + `keyResultsWithoutProject`.

## Visibilidad / autorización

- Render: la página replica de forma local (solo para mostrar/ocultar) las
  policies de `teams-staffing/domain/team-policy.ts`: Dirección y Líder ven
  controles de crear/editar/proyectos; para asignar miembros, un Líder además
  debe ser Lead del Team (su assignment `role === "Lead"`). La autorización
  efectiva la aplican igual los casos de uso (`teams-staffing/forbidden`).
- Colaborador: lectura pura, sin forms.

## Forms / actions

- `createTeamAction` / `updateTeamAction` / `assignTeamMemberAction` /
  `createProjectAction` / `linkProjectToObjectivesAction` /
  `closeProjectAction`. Cada action resuelve el actor (`getAuthContext`),
  valida con Zod (parsers en `form-input.ts`) e invoca el contrato; responde
  `{ success | error }` y `revalidatePath("/equipos-y-proyectos")`.
- Añadir un vínculo Project→Objective es agregativo (mismo form re-usa
  `linkProjectToObjectives`); no se implementa desvincular en este slice
  (no existe caso de uso).

## Naming UI (es-LATAM)

"Equipos & Proyectos", "Equipo", "Miembros del equipo", "Rol", "% de carga",
"Capacidad del equipo", "overloaded", "Proyecto", "Estado", "Vincular a un
Objective", "Cerrar proyecto", "Alertas de alineamiento".