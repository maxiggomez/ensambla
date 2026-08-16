# Design: rituals-ui

## Contexto

Mismo patrón que el resto de las UIs: página server component que lee estado y
delega mutaciones a server actions; forms client con `useActionState`.

## Datos leídos por la página

- `listTeamCapacities` (`teams-staffing`) → teams para selector y flags.
- `listRituals` → ceremonias con ocurrencias y su status persistido.
- `listOpenBlockers` → tablero de Blockers abiertos (con Objective asociado).
- `countResolvedBlockers` → métrica derivada.
- `evaluateLearningRisks({ teamIds })` → flags por Team.
- `listObjectives` (`okrs`) → Objectives para el selector del Blocker.

## Estado de ocurrencia

`listRituals` devuelve el status persistido. La transición
Scheduled→Overdue es el caso de uso `evaluateRitualStatus` (solo
Dirección/Líder). La UI lo ofrece como acción "Evaluar estado / Avanzar
cadencia" por ceremonia; el resto de los roles lee los estados ya calculados.

## Forms / actions

- `createRitualAction` (team, name, cadence, startDate) —
  `generateOccurrencesAction` (ritualId, through today) —
  `evaluateRitualStatusAction` (ritualId) — `markHeldAction` (occurrenceId).
- `recordBlockerAction` (team, title, description?, objectiveId?) —
  `resolveBlockerAction` (blockerId).
- `recordRetrospectiveAction` (teamId, heldAt?).
- Cada action valida con Zod, resuelve el actor (`getAuthContext`) y hace
  `revalidatePath("/rituales")`.

## Visibilidad / autorización

- Render: Dirección y Líder ven controles de gestión (replica local de
  `canManageRituals`). La autorización efectiva la aplican los casos de uso.
- Colaborador: lectura pura (ceremonias, blockers, flags).

## Naming UI (es-LATAM)

"Rituales", "Ceremonia", "Cadencia", "Generar fechas", "Evaluar estado",
"Marcar realizada", "Vencida", "Bloqueo", "Dueño", "Resolver", "Resueltos",
"Retrospectiva", "Riesgo de aprendizaje".