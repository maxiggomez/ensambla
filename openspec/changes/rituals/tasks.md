# Tasks: rituals

Orden test-first (ADR-0006): cada tarea de test va antes que su implementación.
Cada tarea mapea al Scenario indicado entre paréntesis (fuente: delta spec).

## 1. Dominio rituals (unit, puro)

- [x] 1.1 Test rojo `cadence.test.ts`: próxima fecha / ocurrencias generadas
      desde `startDate` según cadencia Weekly/Biweekly/Monthly hasta un
      `throughDate` (Scenario "Generate rituals from cadence")
- [x] 1.2 Implementar `domain/cadence.ts`
- [x] 1.3 Test rojo `ritual-status.test.ts`: ocurrencia con fecha pasada sin
      celebrar ⇒ `Overdue`; celebrada ⇒ `Held` (Scenarios "Overdue ritual" /
      "Hold a ritual")
- [x] 1.4 Implementar `domain/ritual-status.ts`
- [x] 1.5 Test rojo `blocker.test.ts`: registrar con status `Open`, owner y
      `createdAt`; resolver ⇒ `Resolved` + `resolvedAt`; link opcional a
      Objective (Scenarios "Record a blocker" / "Resolve a blocker" / "Blocker
      linked to an objective")
- [x] 1.6 Implementar `domain/blocker.ts`
- [x] 1.7 Test rojo `retrospective-risk.test.ts`: sin retro o ≥ 2 ciclos (>=
      2×cycleLength) ⇒ riesgo; < 2 ciclos ⇒ sin riesgo (Scenario "Missing
      retrospective")
- [x] 1.8 Implementar `domain/retrospective-risk.ts`

## 2. Schema y migración (🔒 RLS)

- [x] 2.1 Modelos Prisma `Ritual`, `RitualOccurrence`, `Blocker`,
      `Retrospective` (+ enums `RitualCadence`, `RitualOccurrenceStatus`,
      `BlockerStatus`); cada tabla con `organization_id` + referencias a
      `Team` (y `objective` en `blocker`)
- [x] 2.2 Migración aditiva con RLS (ENABLE + FORCE + política tenant FOR ALL)
      para las cuatro tablas en la misma migración; UNIQUE/índices
      (`ritual_occurrence (ritual_id, scheduled_date)`, etc.)

## 3. Aplicación ceremonias (integration, Postgres efímero)

- [x] 3.1 Tests rojos `create-ritual` / `generate-ritual-occurrences` /
      `evaluate-ritual-status` / `mark-ritual-held`: definir ceremonia de un
      Team con nombre + cadencia (pertenece a Org+Team); generar ocurrencias por
      cadencia; fecha pasada ⇒ `Overdue`; celebrar ⇒ `Held`; Colaborador
      forbidden; aislamiento entre tenants (Scenarios "Generate rituals from
      cadence" / "Overdue ritual" / "Hold a ritual" / "Rituals belong to a team
      of an organization" / "Rituals data is tenant-isolated")
- [x] 3.2 Implementar casos de uso + `infrastructure/ritual-repo.ts`
      (Team validaidado vía `teams-staffing/application`)

## 4. Aplicación blockers (integration)

- [x] 4.1 Tests rojos `record-blocker` / `list-open-blockers` (view con
      Objective asociado) / `resolve-blocker`: bloqueo con owner y `createdAt`;
      se asocia al Objective (validado vía `okrs/application`) y aparece
      asociado en la vista; al resolver sale de la lista abierta y suma a
      `countResolved`; aislamiento entre tenants (Scenarios "Record a blocker" /
      "Blocker linked to an objective" / "Resolve a blocker" / "Rituals data is
      tenant-isolated")
- [x] 4.2 Implementar casos de uso + `infrastructure/blocker-repo.ts` +
      `count-resolved-blockers`

## 5. Aplicación retrospectivas (integration)

- [x] 5.1 Tests rojos `record-retrospective` / `evaluate-retro-risk` (por Team,
      con flag derivado): registrar una retro; Team con 2 ciclos sin retro ⇒
      riesgo; con retro reciente ⇒ sin riesgo; aislamiento entre tenants
      (Scenarios "Record a retrospective" / "Missing retrospective" / "Rituals
      data is tenant-isolated")
- [x] 5.2 Implementar casos de uso + `infrastructure/retro-repo.ts` +
      `evaluate-learning-risks`

## 6. Interfaz pública del módulo

- [x] 6.1 `application/index.ts` expone los casos de uso y tipos del módulo
      (patrón cross-módulo ADR-0002)

## 7. Verificación

- [x] 7.1 `npm run typecheck` + `npm run lint` + `npm run format:check` en verde
- [x] 7.2 `npm run test` en verde (unit + integration)
- [x] 7.3 `openspec validate --all --strict` en verde
- [x] 7.4 Review con `mg-pr-review` (obligatorio: áreas 🔒)