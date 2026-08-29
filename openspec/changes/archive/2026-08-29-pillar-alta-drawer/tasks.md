# Pillar alta por drawer — Tasks (test-first)

## 1. Tests

- [x] 1.1 Actualizar `src/app/(app)/norte-estrategico/page-ui.test.ts`: el contract por
      fuente exige que el pilar y la asignación se disparan desde `EntityCreateDrawer`
      con triggers "+ Nuevo pilar" y "+ Asignar objetivo" junto al título del Mapa
      estratégico, y que `PillarForm`/`AssignForm` son drawer-aware (cierran en éxito).
      **Rojo**: `PillarForm` y `AssignForm` hoy no se envuelven en el drawer.
- [x] 1.2 Actualizar `e2e/strategy-northstar.spec.ts`: Dirección crea el pilar desde el
      drawer "+ Nuevo pilar", el drawer se cierra en éxito y el pilar aparece en el mapa;
      el formulario inline deja de existir; Líder no ve los triggers. **Rojo**: hoy el
      pilar se crea inline y no hay botón "+ Nuevo pilar".

## 2. Implementación

- [x] 2.1 En `src/app/(app)/norte-estrategico/pillar-form.tsx`: envolver `PillarForm` y
      `AssignForm` para que se usen dentro del `EntityCreateDrawer` y cierren con
      `useEntityCreateDrawerClose()` cuando `state.success`.
- [x] 2.2 En `src/app/(app)/norte-estrategico/page.tsx`: reemplazar el bloque inline de
      `PillarForm`/`AssignForm` del encabezado del Mapa estratégico por dos
      `EntityCreateDrawer` con triggers "+ Nuevo pilar" (title "Nuevo pilar") y
      "+ Asignar objetivo" (title "Asignar objetivo a un pilar"), solo para Dirección.
- [x] 2.3 Correr los tests de 1.1 y 1.2 hasta verde.

## 3. Verificación

- [x] 3.1 `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`.
- [x] 3.2 `npm run test:e2e` (estrategia-northstar) y `openspec validate --all --strict`.
