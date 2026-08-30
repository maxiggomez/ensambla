## 1. Dominio y application — transiciones, edición y estado derivado (Slice A)

- [ ] 1.1 Extender `assertStatusTransition` (`domain/cycle-close.ts`) para aceptar `Draft → Archived`, `Published → Archived` y `Archived → Draft`, manteniendo las transiciones existentes; test-first en `cycle-close.test.ts`.
- [ ] 1.2 Crear helper puro `assertNoAlignmentCycle` (extraer de `linkObjectiveParent` si está inline) y sus tests.
- [ ] 1.3 Crear `domain/objective-derived-status.ts` con `objectiveDerivedStatus({ status, keyResults, atRisk, outdated })` → `"Borrador" | "EnRiesgo" | "Atencion" | "EnRitmo"`; tests cubriendo cada rama y el caso `Archived`.
- [ ] 1.4 Crear `application/update-objective.ts`: `updateObjective({ actorClerkUserId, objectiveId, patch })` con policy de nivel (reusar `objective-policy`), `assertMutableObjective`, Team explícito para `level === "Team"`, `assertNoAlignmentCycle`, normalización de título; registra `OBJECTIVE_UPDATED` con diff en `metadata`; mutación fallida no audita. Tests de éxito, forbidden, ciclo de alineamiento, archivado read-only, Team vacío.
- [ ] 1.5 Ajustar `application/archive-objective.ts` para no asumir `Closed` (sigue exigiendo Dirección); agregar `application/reactivate-objective.ts` (`Archived → Draft`, limpia `archivedAt`, audita `OBJECTIVE_REACTIVATED`). Tests incl. "non-Dirección no puede archivar".
- [ ] 1.6 Extender `ObjectiveView` / `toObjectiveView` con `ownerName`, `cycleName`, `keyResultCount` y `derivedStatus` (todos derivados, nada persistido); actualizar el repo/consulta para traer owner y cycle sin N+1.
- [ ] 1.7 Añadir `cycleId?` a `listObjectives` para filtrar por ciclo; test de aislamiento por ciclo y por tenant.
- [ ] 1.8 Exportar lo nuevo desde `application/index.ts` y `domain` según convención de módulo; `npm run lint`/typecheck verdes.
- [ ] 1.9 Agregar `OBJECTIVE_UPDATED` y `OBJECTIVE_REACTIVATED` al enum/acciones de auditoría y a los tests de "mutation creates audit event" / "failed mutation does not".

## 2. Server actions y wiring (Slice A → B)

- [ ] 2.1 `updateObjectiveAction` en `okrs/actions.ts` con validación Zod del patch parcial, mensajes de error en español (mapa `messageFor`), `revalidatePath` de `/okrs` y `/dashboard`.
- [ ] 2.2 `archiveObjectiveAction` ya existe: quitar cualquier gate de UI a `Closed`; agregar `reactivateObjectiveAction`.
- [ ] 2.3 Resolver el ciclo activo en `page.tsx`: `searchParams.cycle` → ciclo que contiene `now` → más reciente; pasar `cycleId` a `listObjectives`.

## 3. Vista principal `/okrs` (Slice B)

- [ ] 3.1 Barra de ciclo activo debajo del `<h1>`: nombre, rango de fechas, días restantes, avance agregado del ciclo, switcher (`?cycle=`), y "+ Nuevo ciclo" solo para Dirección (reusar `EntityCreateDrawer` + `CreateCycleForm`).
- [ ] 3.2 Tira de métricas del ciclo (objetivos, progreso promedio, KR en riesgo, check-ins vencidos) con la `Stats strip` del design system; todo derivado a read time.
- [ ] 3.3 Filtros: chips de estado (`Todos / En ritmo / Atención / En riesgo / Borradores / Archivados`) + selects de nivel y owner, como query params combinables con el ciclo.
- [ ] 3.4 `ObjectiveCard` rediseñada: título dominante, meta line (nivel, owner, ciclo, nº de KR), chip de estado derivado (color + ícono + texto), barra de progreso por estado.
- [ ] 3.5 Card colapsable con `<details>` (cerrada por defecto): fila-resumen con título, chip, `%` y roll-up corto de KR; al expandir, lista de KR con progreso, confianza y recencia del último check-in.
- [ ] 3.6 Menú de acciones `⋯` por objetivo (Radix `DropdownMenu`): Ver detalle, Editar objetivo, Cambiar de ciclo, Archivar, Cerrar ciclo — cada ítem visible según estado y rol (ocultar, no deshabilitar).
- [ ] 3.7 Drawer de edición sobre `EntityCreateDrawer`: form pre-cargado (título, nivel, owner, Team, ciclo, cadencia, alineamiento) → `updateObjectiveAction`; sección "zona sensible" con "Archivar objetivo".
- [ ] 3.8 `AlertDialog` de confirmación de archivado (copy del prototipo: baja lógica reversible, va a solo lectura, no borra); "Cerrar ciclo" mantiene su confirmación destructiva propia.
- [ ] 3.9 Filtro `Archivados`: listar objetivos archivados como entradas read-only (sin acciones de edición/check-in); decidir si reemplaza la sección "Historial archivado" (ver Open Question del design).
- [ ] 3.10 Estados vacíos y de error revisados (sin objetivos en el ciclo, sin ciclos aún) con CTA guía.

## 4. Panel de detalle del objetivo (Slice C)

- [ ] 4.1 Drawer de detalle (mismo `Sheet`, sin form de alta) disparado desde "Ver detalle"; header con título, estado y `%`.
- [ ] 4.2 Secciones colapsables con `<details>`, cerradas por defecto: Gestión (acciones), Alineamiento, Ciclo y cadencia, Key Results.
- [ ] 4.3 Escalera de alineamiento: North Star → Pilar → Objetivo superior → este objetivo → KRs (reusar `getAlignmentChain`).
- [ ] 4.4 Sección Key Results con historial de check-ins por KR: valor, confianza, comentario y evidencia (link/archivo) — nueva consulta `listCheckInHistory({ keyResultId })` o extensión de una existente; tests de la consulta.
- [ ] 4.5 Acciones del detalle reusan las server actions de la lista (sin duplicar lógica).

## 5. Specs, verificación y cierre

- [ ] 5.1 `npm test` y e2e de `okrs` (`e2e/okrs.spec.ts`) verdes; agregar/ajustar e2e para: switch de ciclo re-scopea la lista, editar objetivo, archivar con confirmación, expandir/colapsar objetivo y secciones del detalle.
- [ ] 5.2 `openspec validate okrs-management-ux --strict` verde; revisar que cada scenario de ambos spec deltas tenga cobertura de test.
- [ ] 5.3 Actualizar `docs/design-system.md` si aparece un patrón nuevo reutilizable (p. ej. "Objective row", "Collapsible section panel").
- [ ] 5.4 Correr `openspec archive okrs-management-ux` tras el merge y sincronizar `openspec/specs/okrs/spec.md` + `openspec/specs/okrs-management-ux/spec.md`.
