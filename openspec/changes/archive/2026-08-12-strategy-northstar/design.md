# Design: strategy-northstar

## Contexto

`strategy-okrs-core` ya implementó North Star define/get (change archivado). Este
change completa la capability: estatutos, levers, pilares y mapa estratégico, más
la UI vertical. El progreso de objetivos siempre es derivado (roll-up 🔒,
ADR-0004) y el multi-tenancy se respeta con RLS en la misma migración (ADR-0003).

## Modelo de datos

```prisma
model Organization {
  // columnas nuevas (aditivas, sin RLS propia: la tabla raíz ya está scoped)
  vision   String? @db.Text
  mission  String? @db.Text
  values   String[] @default([])   // text[]
  northStar NorthStar?
  pillars  StrategicPillar[]
  leverLinks NorthStarLever[]
  pillarObjectiveLinks PillarObjective[]
}

model NorthStar {
  // + levers NorthStarLever[]
}

model NorthStarLever {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @map("organization_id") @db.Uuid
  northStarId    String @map("north_star_id") @db.Uuid
  northStar      NorthStar @relation(...)
  name           String
  objectiveId    String? @map("objective_id") @db.Uuid   // vínculo opcional a un Objective
  objective      Objective? @relation(...)
  createdAt      DateTime @default(now()) @map("created_at")
  @@index([organizationId])
  @@map("north_star_lever")
}

model StrategicPillar {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @map("organization_id") @db.Uuid
  name           String
  description    String? @db.Text
  objectiveLinks PillarObjective[]
  createdAt      DateTime @default(now()) @map("created_at")
  @@index([organizationId])
  @@map("strategic_pillar")
}

model PillarObjective {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @map("organization_id") @db.Uuid   // para que RLS no dependa de joins
  pillarId       String @map("pillar_id") @db.Uuid
  pillar         StrategicPillar @relation(...)
  objectiveId    String @map("objective_id") @db.Uuid
  objective      Objective @relation(...)
  createdAt      DateTime @default(now()) @map("created_at")
  @@unique([pillarId, objectiveId])
  @@index([organizationId])
  @@index([objectiveId])
  @@map("pillar_objective")
}
```

Las tres tablas nuevas llevan `ENABLE + FORCE ROW LEVEL SECURITY` y política
`tenant_all` sobre `app.current_org` (mismo patrón que `culture-enps`).

## Límites de módulos (ADR-0002)

`strategy-northstar` consume SOLO interfaces públicas:
- `identity-org/application`: `requireActor`, `canEditOrganization` (rol).
- `okrs/application`: `getObjective` (validar que el `objectiveId` existe y es
  del tenant, respetando visibilidad) y `listObjectives` (progreso real para el
  mapa). Nunca `okrs/infrastructure`.

El mapa no persiste progreso: cada `ObjectiveView` trae su `progress` derivado por
roll-up.

## Casos de uso (application)

- `define-strategy(actor, { vision?, mission?, values? })` — Dirección; upsert en
  `Organization` del tenant.
- `get-strategy(actor)` — lectura para todo miembro.
- `add-input-lever(actor, { name, objectiveId? })` — Dirección; requiere North Star
  existente (`strategy-northstar/no-north-star`); valida `objectiveId` con
  `getObjective` si viene.
- `create-strategic-pillar(actor, { name, description? })` — Dirección.
- `assign-objective-to-pillar(actor, { pillarId, objectiveId })` — Dirección;
  valida objetivo con `getObjective`; rechaza duplicado
  (`strategy-northstar/already-assigned`).
- `get-strategic-map(actor)` — devuelve `{ strategy, northStar?, pillars[],
  unassignedObjectives[] }`; junta pillar-links con `listObjectives` para exponer
  el `progress` real; levers bajo la North Star con su objetivo vinculado.

## Dominio (VOs puros, sin Prisma)

- `strategy-statement({ vision?, mission?, values })`: normaliza (trim), rechaza
  strings vacíos, items de `values` no vacíos.
- `input-lever({ name, objectiveId? })`: nombre no vacío.
- `strategic-pillar({ name, description? })`: nombre no vacío, descripción opcional.

## UI (`src/app/strategy-northstar/`)

- `page.tsx` (server component): guard `currentUser()` → `/sign-in`, fallback
  `linkMembershipsForUser`/`/onboarding` (mismo patrón que `/culture-enps`);
  `getStrategy`, `getNorthStar`, `getStrategicMap`; `isDirection` para condicionar
  formularios.
- `actions.ts` (`"use server"`): `defineStrategyAction`, `defineNorthStarAction`,
  `addInputLeverAction`, `createStrategicPillarAction`,
  `assignObjectiveToPillarAction`; mensajes de error en español mapeando códigos
  `DomainError`/`ApplicationError`.
- Forms (client): `strategy-form.tsx`, `north-star-form.tsx` (formulario de
  `Measurement` tipado con variantes check/percentage/integer/currency/text),
  `lever-form.tsx`, `pillar-form.tsx`; `strategy-map.tsx` para la cascada.
- Componentes/tokens existentes del design system (Card, tokens Radar, español
  LATAM). Test-alongside permitido en UI.

## Tests (test-first, ADR-0006)

- `unit` (Vitest, dominio puro): `strategy-statement.test.ts`,
  `input-lever.test.ts`, `strategic-pillar.test.ts`.
- `integration` (Vitest + Postgres efímero): `strategy-northstar-schema.test.ts`
  (RLS/columnas 🔒), `define-strategy.test.ts`, `input-lever.test.ts`,
  `strategic-pillar.test.ts`, `get-strategic-map.test.ts` (incluye tenancy 🔒 y
  visibilidad de drafts vía okrs).
- `e2e` (Playwright, config dev-auth mock): Dirección define estatutos + North
  Star + pilar y ve el mapa; Colaborador lee sin formularios de edición.
