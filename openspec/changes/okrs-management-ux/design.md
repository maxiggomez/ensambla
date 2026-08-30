## Context

`/okrs` ya cubre el ciclo completo (crear objetivo, KRs tipados, check-ins,
cadencia, cierre y archivado) pero la pantalla es difícil de escanear. Problemas
concretos observados:

- El título del objetivo se renderiza con `CardTitle` (`text-base font-medium`),
  se pierde frente a badges y barras.
- Los ciclos existen en el modelo (`OkrCycle`, `listOkrCycles`) pero la UI solo
  muestra un encabezado "Ciclos" sin listarlos ni permitir filtrar por ciclo.
- `archiveObjective` + `assertStatusTransition` solo permiten
  `Closed → Archived`, y la única acción de "baja" (`ArchiveObjectiveForm`) se
  renderiza en el bloque "Historial archivado" para objetivos `Closed`. No hay
  forma de editar un objetivo publicado ni de archivar uno en borrador.
- Toda la gestión (`ObjectiveControls`, `KeyResultControls`) se muestra siempre
  expandida dentro de cada card: mucho ruido.

Existe un prototipo aprobado (artifact "Rediseño OKRs", 3 artboards) que fija la
dirección visual. El design system es Radar (`docs/design-system.md`,
`src/app/globals.css`); el patrón de altas es `EntityCreateDrawer`.

Restricciones firmes:

- **ADR-0004**: el progreso del objetivo y del KR es derivado por roll-up
  (`objectiveProgress`, `keyResultProgress`), nunca persistido ni editable.
- Módulos con límites (`AGENTS.md`): la UI vive en `src/app/(app)/okrs`, la lógica
  en `src/modules/okrs`. TDD, un slice por agente.
- Auditoría inmutable: toda mutación de objetivo registra un evento
  (`insertAuditEvent`); una mutación fallida no registra nada.

## Goals / Non-Goals

**Goals:**

- Rediseñar `/okrs` según el prototipo: barra de ciclo, jerarquía del objetivo,
  filtros, tira de métricas, lista colapsable y panel de detalle.
- Agregar `updateObjective` (edición de campos del objetivo) con las policies de
  rol y los invariantes ya existentes.
- Permitir archivar (baja lógica reversible) desde `Draft` y `Published`, y
  reactivar un objetivo archivado a `Draft`.
- Exponer en `ObjectiveView` los datos que la vista necesita sin persistir nada
  derivado: `ownerName`, `cycleName`, `keyResultCount`, `derivedStatus`.

**Non-Goals:**

- No se cambia el modelo de progreso ni la máquina de estados
  `Draft → Published → Closed → Archived` (solo se agregan transiciones a/desde
  `Archived`).
- No se toca la lógica de check-ins, cadencia, grading ni carry-over.
- No se agrega búsqueda de texto libre ni vistas por persona/equipo nuevas.
- No hay cambios de esquema Prisma si el objetivo ya tiene `title`, `level`,
  `ownerId`, `teamId`, `cycleId`, `parentObjectiveId`, `archivedAt`.
- No se implementa drag-and-drop ni reordenamiento de objetivos.

## Decisions

### 1. `updateObjective` como caso de uso único en `application/`

Un solo `updateObjective({ actorClerkUserId, objectiveId, patch })` que acepta un
`patch` parcial (`title?`, `level?`, `ownerMemberId?`, `teamId?`, `cycleId?`,
`parentObjectiveId?`, `cadence?`). Reutiliza:

- `requireActor` + la policy de nivel de `objective-policy` (misma que
  `createObjective`) — para `level`.
- `assertMutableObjective(status)` — rechaza si `Archived`.
- El chequeo de ciclo de alineamiento de `linkObjectiveParent` (extraer a helper
  compartido `assertNoAlignmentCycle` si hoy está inline).
- `objectiveTitle()` para normalizar título.
- Team explícito para `level === "Team"`.

Registra `OBJECTIVE_UPDATED` con el diff de campos en el `metadata` del evento.

**Alternativa descartada:** un caso de uso por campo (`renameObjective`,
`reassignOwner`, …). Multiplicaría acciones, forms y tests sin beneficio; el
drawer edita todo junto.

### 2. Transiciones de archivado ampliadas

`assertStatusTransition` pasa a aceptar:

- `Published → Closed` (sin cambios)
- `Closed → Archived` (sin cambios)
- `Draft → Archived` y `Published → Archived` (nuevo)
- `Archived → Draft` (nuevo, reactivación)

`archiveObjective` deja de asumir `Closed`; sigue exigiendo rol Dirección
(`canEditOrganization`) y sigue seteando `archivedAt`. Nuevo `reactivateObjective`
limpia `archivedAt`, vuelve a `Draft` y registra `OBJECTIVE_REACTIVATED`.

El progreso "congelado" del objetivo archivado se logra sin persistir: la vista
de historial calcula el roll-up sobre los valores de KR tal como quedaron (los
KR de un objetivo archivado son read-only, así que el número no se mueve).

**Alternativa descartada:** un flag `isArchived` separado del `status`. Duplica
estado; `Archived` ya es parte del enum y de los invariantes de read-only.

### 3. Estado derivado del objetivo (`derivedStatus`) calculado en la vista

Helper puro en `domain/` (`objectiveDerivedStatus`) que toma
`{ status, keyResults }` y devuelve
`"Borrador" | "EnRiesgo" | "Atencion" | "EnRitmo"`:

- `status !== "Published"` no publicado → `Borrador` (o `Archivado` se maneja
  aparte por `status`).
- algún KR marcado at-risk (misma señal que `listAtRiskKeyResults`: última
  confianza ≤ umbral) → `EnRiesgo`.
- algún KR "desactualizado" (reminder vencido) o progreso del objetivo por debajo
  del esperado para el punto del ciclo → `Atencion`.
- si no → `EnRitmo`.

Se expone en `ObjectiveView.derivedStatus` y **no** se guarda. El chip en la UI
mapea a los tokens `ok/warn/risk` + ícono + texto (regla de color semántico del
design system).

**Alternativa descartada:** calcular el chip en el componente React a partir de
`riskIds`/`outdatedIds` sueltos (como hoy). Queda lógica de negocio en la vista y
no es testeable en aislamiento.

### 4. Filtro por ciclo en `listObjectives`

`listObjectives` acepta `cycleId?`. La página resuelve el ciclo activo así:
`searchParams.cycle` → si no, el ciclo cuyo rango incluye `now` → si no, el más
reciente (`listOkrCycles` ya ordena `startsAt desc`). El switcher es un
`<select>`/menú que setea `?cycle=<id>` (server component, sin estado cliente).

`derivedStatus`, nivel y owner se filtran en el server component a partir de la
lista ya cargada (son pocos objetivos por ciclo); los filtros son query params
(`?status=`, `?level=`, `?owner=`) para que la vista siga siendo server-first.

### 5. Colapsables con `<details>` nativo, no estado cliente

Tanto las cards de objetivo como las secciones del panel de detalle usan
`<details>`/`<summary>` (o el `Collapsible` de Radix si ya está en el repo) con
cierre por defecto. Sin JS de estado, funciona en server components, accesible.
El prototipo ya valida esta interacción.

### 6. Panel de detalle: ruta vs. drawer

El detalle abre como **drawer** (mismo `Sheet` que `EntityCreateDrawer`, sin el
form de alta) disparado desde "Ver detalle". Alternativa: una ruta
`/okrs/[objectiveId]`. Se elige drawer para no perder el contexto de la lista y
reusar el patrón; si más adelante se necesita deep-link, se agrega la ruta que
renderiza el mismo panel.

## Risks / Trade-offs

- **[El estado derivado "Atención" depende de "progreso esperado según el punto
  del ciclo", que hoy no existe]** → v1 usa solo señales binarias que ya
  existen (at-risk, desactualizado). El umbral por avance del ciclo queda como
  Open Question; si no se resuelve, `Atencion` = "tiene KR desactualizado pero
  ninguno at-risk".
- **[Ampliar `assertStatusTransition` puede romper tests existentes de la
  máquina de estados]** → los tests de `cycle-close.test.ts` se actualizan en el
  mismo slice; las transiciones viejas se mantienen válidas, solo se agregan.
- **[Archivar desde `Published` puede confundirse con "cerrar ciclo"]** → el
  `AlertDialog` explicita la diferencia (archivar = sale de la lista, reversible,
  no califica; cerrar = requiere grading, es fin de ciclo). Copys del prototipo.
- **[Filtros como query params → muchas combinaciones de URL]** → aceptable; la
  vista es server-first y los params son opcionales con defaults claros.
- **[Reactivar a `Draft` puede sorprender si el objetivo estaba `Published`]** →
  documentado en el copy de la acción; v1 mantiene la regla simple (siempre a
  `Draft`), revisable si molesta.

## Migration Plan

1. Slice A (dominio/application): `assertStatusTransition` ampliado +
   `updateObjective` + `reactivateObjective` + `objectiveDerivedStatus` +
   campos nuevos en `ObjectiveView`. Tests primero. Sin cambios de UI.
2. Slice B (vista principal): rediseño de `page.tsx` — barra de ciclo, filtros,
   tira de métricas, lista colapsable, menú de acciones, drawer de edición.
3. Slice C (panel de detalle): drawer de detalle con secciones colapsables e
   historial de check-ins por KR.

Cada slice es desplegable solo. Sin migración de datos. Rollback: revertir el
slice; los datos no cambian de forma.

## Open Questions

- ¿El estado `Atencion` debe incorporar un umbral de "avance esperado vs. punto
  del ciclo"? Si sí, ¿lineal sobre el rango del ciclo?
- ¿La reactivación debería volver al estado previo (`Published`) en vez de
  `Draft` cuando el objetivo tenía KRs válidos?
- ¿El filtro `Archivados` vive en `/okrs` o se mantiene la sección "Historial
  archivado" separada? (el prototipo lo unifica como filtro).
- ¿"Cambiar de ciclo" desde el menú abre el drawer de edición enfocado en ese
  campo, o es un mini-popover propio?
