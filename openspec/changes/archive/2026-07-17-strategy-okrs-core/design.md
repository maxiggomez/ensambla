# Design: strategy-okrs-core

## Contexto

Primer slice de negocio sobre la base de `foundation`. Reusa el shared kernel
`Measurement` (ADR-0004) tal cual está — `progress()` ya implementa el cálculo
polimórfico por tipo — y el patrón de tenancy `withTenant` + RLS (ADR-0003).

## Decisiones

### D1 — Roll-up 🔒: promedio simple, siempre derivado

ADR-0004 define el avance del Objective como "promedio ponderado" de sus KRs. En
este MVP no existen pesos configurables, así que **todos los KRs pesan igual**:
`objectiveProgress = avg(progress(kr.measurement))`. Los pesos explícitos, si
llegan, serán un change propio.

Garantías de "nunca se edita a mano":

- La tabla `objective` **no tiene columna de progreso**. El progreso se computa
  en `domain/roll-up.ts` a partir de los KRs leídos, en cada lectura.
- Ningún caso de uso acepta un progreso como input. No hay setter en dominio.
- `rollUp([])` = 0 (un draft sin KRs no avanza; publicar exige ≥1 KR).

### D2 — Persistencia del Measurement: columnas tipadas, no EAV

Por ADR-0004, `key_result` y `north_star` persisten el `Measurement` con
discriminador + columnas tipadas queryables:

- `measurement_type` (enum `MeasurementType`: Check/Percentage/Integer/Currency/Text)
- `start_value`, `target_value`, `current_value` → `DECIMAL` nullable (tipos numéricos)
- `check_done` → boolean nullable (Check)
- `text_state` (enum `TextState`: NotStarted/InProgress/Done) nullable (Text)

El mapeo fila ↔ `Measurement` vive en el dominio de cada módulo y valida con
`measurementSchema` al leer: una fila que no parsea es un bug, no un estado válido.

### D3 — KRs incompletos en draft, válidos para publicar

El Scenario de la spec dice que un KR numérico sin start/target "se marca
inválido y previene publicar". Entonces: un KR puede **guardarse incompleto**
mientras el Objective está en draft (columnas numéricas nullable), y
`publishObjective` valida que **todos** los KRs parseen como `Measurement`
válido; si alguno no, falla con error de validación y el Objective sigue draft.
El dominio expresa esto como `KeyResultDraft` (parcial) → `toMeasurement()`
(Either válido/inválido).

### D4 — North Star única por Organización, upsert de Dirección

`north_star` tiene `UNIQUE (organization_id)`. `defineNorthStar` es un upsert
(definir o redefinir) restringido a Dirección (`canEditOrganization`). Cualquier
`Measurement` de la unión es admisible como North Star (la spec pide current +
target: los tipos numéricos los traen; Check/Text quedan permitidos por la unión
cerrada y su progreso está definido).

### D5 — Permisos de creación de Objectives (MVP)

Sin capability `teams-staffing` todavía, `level` es un enum sin FK a Team.
Política mínima coherente con ORG-3 ("Colaborador cannot edit company
objectives"):

- `Company` → solo Dirección.
- `Area` / `Team` → Dirección o Líder.
- `Person` → cualquier rol.

Vive en `okrs/domain/objective-policy.ts`. Se refinará cuando existan Teams.

Visibilidad: los Objectives publicados los ve toda la Organización; los drafts,
solo su owner y Dirección (filtro en `listObjectives`).

### D6 — RLS 🔒

Las tres tablas nuevas nacen con `ENABLE + FORCE ROW LEVEL SECURITY` y una
política `FOR ALL USING/WITH CHECK (organization_id = app.current_org)` en la
**misma migración**, calcada de `member_tenant_all`. `key_result` referencia a
`objective` y además lleva su propio `organization_id` para que la política no
dependa de joins.

### D7 — Interfaz cross-módulo

`okrs` y `strategy-northstar` consumen `identity-org` solo por su
`application/index.ts` (ADR-0002). Se agregan al índice público
`requireActor` y `forbidden` (ya existen; hoy no están exportados).

## Nota de sync (cierre)

Las specs principales de `strategy-northstar` y `okrs` ya describen el estado
final del producto (seeded en el commit inicial). Los deltas de este change
cubren solo el subconjunto implementado; al cerrar, el sync debe **preservar**
en las specs principales los requirements/scenarios fuera de alcance (levers,
check-ins, ciclo, pilares) — merge manual confirmado por el usuario, como en
`foundation`.

## Riesgos

- 🔒 Roll-up: mitigado con unit tests de dominio obligatorios (D1) y ausencia de
  columna/API de progreso.
- 🔒 Tenancy: tests de aislamiento de integración para las tres tablas nuevas.
- Migración aditiva (solo CREATE): sin riesgo destructivo.
