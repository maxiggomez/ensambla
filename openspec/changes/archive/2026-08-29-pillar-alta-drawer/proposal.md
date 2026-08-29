## Why

En la pantalla `norte-estrategico`, la creación de un pilar estratégico (`PillarForm`,
"Crear pilar") y la asignación de un objetivo a un pilar (`AssignForm`, "Asignar al
pilar") se renderizan como formularios inline junto al título del **Mapa estratégico**.
Esto contradice el patrón estándar de alta de entidades del design-system (sección 3):
el alta se dispara con un botón "+ Nuevo/a `<entidad>`" junto al título y se resuelve en
el panel lateral `EntityCreateDrawer`, tal como ya lo hacen "+ Nueva North Star" y
"+ Nuevo lever" en la misma página. El change `entity-create-drawer` (2026-08-26) dejó
pendiente explícitamente la migración de `PillarForm`/`AssignForm` con la decisión
registrada "son acciones del encabezado del mapa"; este change revierte esa decisión para
alinear ambas acciones con el diseño de alta de alta fidelidad.

## What Changes

- `PillarForm` ("Crear pilar") se migra de formulario inline a un `EntityCreateDrawer`
  disparado por un botón "+ Nuevo pilar" junto al título "Mapa estratégico".
- `AssignForm` ("Asignar al pilar") se migra de formulario inline a un `EntityCreateDrawer`
  disparado por un botón "+ Asignar objetivo" junto al título "Mapa estratégico".
- Ambos formularios pasan a cerrar el drawer tras un submit exitoso
  (`useEntityCreateDrawerClose` cuando `state.success`), igual que `NorthStarForm`.
- No cambia la lógica de negocio ni los server actions: solo cambia el contenedor visual
  del formulario (ADR-0002: presentación). El comportamiento y la validación se conservan.

## Capabilities

### Modified Capabilities
- `entity-create-drawer`: la página `norte-estrategico` completa su adopción del patrón
  de alta por drawer; el pilar pasa a ser una entidad de alta con trigger "+ Nuevo pilar".
  (Sin cambios en las reglas de negocio de `strategy-northstar`.)

## Impact

- **Páginas/modificadas** (app UI · componentes):
  - `src/app/(app)/norte-estrategico/page.tsx`
  - `src/app/(app)/norte-estrategico/pillar-form.tsx`
- **Tests**:
  - `src/app/(app)/norte-estrategico/page-ui.test.ts` (contract por fuente)
  - `e2e/strategy-northstar.spec.ts` (flujo e2e dev-auth del drawer de pilar)
- **Sin impacto** en `domain/`, `application/`, `infrastructure/`, ni en los server
  actions de `actions.ts` (se conservan). Sin tocar áreas 🔒 (multi-tenancy, eNPS, OKRs).
