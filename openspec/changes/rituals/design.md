# Design: rituals

## Contexto

Módulo de negocio que sigue los mismos patrones que `teams-staffing-core` y
`skills-matrix-core`: módulo DDD nuevo con capas `domain/` (puro) ·
`application/` (casos de uso) · `infrastructure/` (repos Prisma), tenancy vía
`withTenantForUser`/`withTenant`, RLS en la misma migración, y cross-módulo
solo por `application/` ajeno. Los datos del contexto ritual pertenecen a un
**Team** dentro de una **Organization** (todo con `organization_id`, ADR-0003).

## Decisiones

### D1 — Ceremonia = definición (`Ritual`) + ocurrencias generadas (`RitualOccurrence`)

Una ceremonia recurrente se modela en dos entidades:

- **`Ritual`** (definición): `teamId`, `name`, `cadence`
  (`RitualCadence` = `Weekly` | `Biweekly` | `Monthly`), `startDate`.
- **`RitualOccurrence`**: instancia programada con `ritualId` + `scheduledDate`
  y un `status` (`Scheduled` | `Held` | `Overdue`).

Al avanzar el calendario, `generateRitualOccurrences(ritualId, throughDate)`
genera ocurrencias `Scheduled` para cada fecha de cadencia entre `startDate` y
`throughDate` (lógica pura en `domain/cadence.ts`: próxima fecha desde una
fecha base según cadencia). Una ocurrencia `Scheduled` cuya fecha ya pasó se
**evalúa** (`evaluateRitualOccurrence`) y se **marca** `Overdue`; al celebrarse
se marca `Held`. El `status` es columna real porque el spec pide marcar
explícitamente `overdue`/held; no es un total derivado.

### D2 — Blockers: owner + fecha + vínculo opcional a Objective + resuelto

`Blocker`: `teamId`, `memberId` (owner), `objectiveId?` (asociación opcional al
Objective que bloquea), `title`, `description`, `status` (`Open` | `Resolved`),
`createdAt`, `resolvedAt?`. El owner se toma del actor (o se pasa explícito) y
`createdAt` se fija en la creación (Scenario "Record a blocker"). El vínculo al
Objective (Scenario "Blocker linked to an objective") se guarda en `objectiveId`
y se valida el Objective **vía la interfaz pública `okrs/application`**
(`getObjective`) — nunca tocando sus tablas; la FK de DB a `objective` existe
por integridad. La **métrica de resueltos** es un **conteo derivado** (no una
columna): `countResolvedBlocker` = Blockers con `status = Resolved`.

- `listOpenBlockers` devuelve los `Open` con la info del Objective asociado
  (nombre/id) para que aparezcan asociados (dashboard).
- `resolveBlocker(blockerId)` marca `Resolved` + `resolvedAt` → sale de la lista
  de abiertos y suma al conteo de resueltos.

### D3 — Retrospectivas: riesgo de aprendizaje derivado

`Retrospective`: `teamId` + `heldAt`. El régimen de ciclos se define con una
constante de dominio `RETRO_CYCLE_DAYS` (p.ej. 14, biweekly). El riesgo es un
**flag derivado** (sin columna): `evaluateRetroRisk({ lastRetroDate | null,
cycleLengthDays, now })` en `domain/retrospective-risk.ts` devuelve `true` si
desde la última retro transcurrieron ≥ 2 ciclos completos (o no hay retro y ya
venció el plazo de 2 ciclos). Un Team con 2 ciclos sin retro → se flaggea
(Scenario "Missing retrospective").

### D4 — RLS 🔒 (ADR-0003)

Las cuatro tablas (`ritual`, `ritual_occurrence`, `blocker`, `retrospective`)
nacen con `ENABLE + FORCE ROW LEVEL SECURITY` y política `FOR ALL` sobre
`organization_id` en la **misma migración** (patrón `member_tenant_all`).
Cada tabla lleva su propio `organization_id` (no depende de joins en la
política). `ritual_occurrence`, `blocker` y `retrospective` referencian a su
`Ritual`/`Team`, pero conservan `organization_id` propio para RLS.

### D5 — Permisos y validación de pertenencia

- Rol vía `requireActor` de `identity-org/application` (nos da `role` +
  `organizationId`). Dirección y Líder pueden escribir; Colaborador rechazado
  (`ApplicationError .../forbidden`).
- El `teamId` se valida como de la Organization del actor **vía la interfaz
  pública `teams-staffing/application`** (`listTeamAssignments(actorClerkUserId,
  teamId)` lanza `team-not-found` si el Team no pertenece al tenant) — sin
  deep-import a sus tablas.
- El `objectiveId` se valida vía `okrs/application` (`getObjective`).

### D6 — Measurement (ADR-0004)

Este slice **no** tiene campos con target/progreso numérico: la cadencia es un
enum, los estados/status son enums y las fechas son timestamps; la métrica de
resueltos es un **conteo**, no un `Measurement`. Por eso `Measurement` no se usa
en `rituals`; queda registrado explícito para que no se busque un uso forzado.

### D7 — Validaciones de dominio

- `ritualName`: no vacío (trim). `cadence`: ∈ {Weekly, Biweekly, Monthly}.
  `startDate`: fecha válida.
- `blockerTitle`: no vacío (trim). `description` opcional.
- `cycleLengthDays`: entero > 0.

## Nota de sync (cierre)

Igual que en slices previos: la spec principal se seeded con el estado final; al
cerrar, el sync incorpora solo lo del slice (la UI/reflejos quedan para
posteriores).

## Riesgos

- 🔒 Tenancy: tests de aislamiento de integración para las cuatro tablas
  (obligatorios, no salteables).
- Cross-módulo: validación de Team/Objective siempre por `application/` ajeno.
- Migración aditiva (solo CREATE): sin riesgo destructivo.