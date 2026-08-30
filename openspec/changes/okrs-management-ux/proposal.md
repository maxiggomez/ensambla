## Why

La vista `/okrs` funciona pero cuesta leerla: el título del objetivo se pierde
como texto chico, los ciclos no se ven, y no hay una acción clara para editar un
objetivo ni para darlo de baja (archivar) salvo cuando ya está `Closed`. El
prototipo aprobado ("Rediseño OKRs") resuelve estos puntos y ordena la pantalla
para que Dirección y Líderes puedan escanear el estado del ciclo de un vistazo.

## What Changes

- **Barra de ciclo activo** debajo del título de la página: ciclo seleccionado,
  período, días restantes, avance del ciclo y un switcher entre ciclos. El ciclo
  elegido acota la lista de objetivos.
- **Jerarquía del objetivo**: el título pasa a ser el elemento dominante; la meta
  (nivel, owner, ciclo, nº de KR) y un **chip de estado derivado**
  (En ritmo / Atención / En riesgo / Borrador / Archivado) lo acompañan.
- **Objetivos colapsables** en la lista, colapsados por defecto, con fila-resumen
  (título, chip de estado, `%`, roll-up corto de KR).
- **Menú de acciones (⋯) por objetivo** con: ver detalle, editar objetivo,
  cambiar de ciclo, archivar (baja lógica), cerrar ciclo — cada acción visible
  según estado y rol.
- **Editar objetivo**: drawer de edición (patrón `EntityCreateDrawer`) para
  título, nivel, owner, ciclo, cadencia y alineamiento, con una "zona sensible"
  que ofrece Archivar. Confirmación de archivado vía `AlertDialog`.
- **Archivar desde más estados**: `archiveObjective` deja de exigir `Closed`;
  Dirección puede archivar un objetivo `Draft` o `Published`. Sigue siendo baja
  lógica reversible (queda en Historial en solo lectura), nunca borrado físico.
- **Filtros** por estado del objetivo y por nivel/owner; **tira de métricas** del
  ciclo (objetivos, progreso promedio, KR en riesgo, check-ins vencidos).
- **Panel de detalle del objetivo** con secciones colapsables (colapsadas por
  defecto): Gestión, Alineamiento (escalera North Star → Pilar → Objetivo → KR),
  Ciclo y cadencia, y Key Results con historial de check-ins.
- Se mantiene: progreso siempre **derivado del roll-up** (ADR-0004, nunca
  persistido ni editable), tokens del design system Radar, aislamiento por tenant
  y policies de rol existentes.

Sin **BREAKING**: es un rediseño de presentación más una ampliación de los
estados desde los que se puede editar/archivar. No cambia el modelo de progreso
ni la máquina de estados `Draft → Published → Closed → Archived`.

## Capabilities

### New Capabilities

- `okrs-management-ux`: Presentación e interacción de la pantalla `/okrs` — barra
  de ciclo con switcher, tira de métricas, filtros, lista de objetivos
  colapsables con fila-resumen y chip de estado derivado, menú de acciones por
  objetivo, y panel de detalle con secciones colapsables.

### Modified Capabilities

- `okrs`: Nueva requirement de **edición de objetivos** (campos editables por
  estado y rol; toda edición registra evento de auditoría). Se **modifica la
  requirement "Cycle close"** para permitir archivar un objetivo `Draft` o
  `Published` (no solo `Closed`), manteniendo el archivado como baja lógica
  reversible y de solo lectura.

## Impact

- **UI**: `src/app/(app)/okrs/page.tsx`, `okr-forms.tsx`, `actions.ts`; nuevos
  componentes de lista colapsable, menú de acciones y panel de detalle; reuso de
  `EntityCreateDrawer`, `AlertDialog`, `Badge`, `Card`.
- **Application/domain (`src/modules/okrs`)**: nuevo caso de uso
  `updateObjective` (título, nivel, owner, ciclo, alineamiento, cadencia);
  `archiveObjective` y `assertStatusTransition` ajustados para aceptar
  `Draft → Archived` y `Published → Archived`; helper de "estado derivado" del
  objetivo para el chip (En ritmo / Atención / En riesgo) sin persistirlo.
- **Vistas/consultas**: `listObjectives` y `listOkrCycles` — filtrado por ciclo y
  por estado; `ObjectiveView` expone `ownerName`, `cycleName`, `keyResultCount` y
  `derivedStatus`; nueva vista de detalle con historial de check-ins por KR.
- **Auditoría**: nuevas acciones `OBJECTIVE_UPDATED` (y `OBJECTIVE_ARCHIVED` ya
  existente) en el audit trail inmutable.
- **Specs**: `openspec/specs/okrs/spec.md` (delta) y nuevo
  `openspec/specs/okrs-management-ux/spec.md`.
- **Sin migraciones de datos nuevas** más allá de columnas ya existentes; no hay
  cambios de esquema si el objetivo ya tiene `title`, `level`, `ownerId`,
  `teamId`, `cycleId`, `parentObjectiveId`, `archivedAt`.
