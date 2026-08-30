## Why

En `/norte-estrategico` el mapa estratégico está al final de la página y se muestra como
cajas apiladas sin conectores: no se ve la relación Visión → North Star → Pilares →
Objetivos, y para entender "qué tenemos definido" hay que scrollear hasta el fondo.
Queremos que la relación entre entidades sea lo primero y que sea navegable.

## What Changes

- El **mapa estratégico pasa a ser lo primero** de la página (debajo del header), antes de
  las secciones de detalle.
- El mapa se re-presenta como un **mapa mental navegable** (árbol izquierda→derecha):
  Visión como raíz, y ramas hacia North Star → Pilares → Objetivos, con conectores.
- Cada nodo con hijos se puede **expandir / contraer**; colapsado muestra el número de
  hijos ocultos. Controles "Expandir todo / Contraer todo".
- **Estado inicial del mapa:** solo Visión y North Star expandidas; pilares y objetivos
  colapsados.
- Los **objetivos sin pilar** aparecen en el mapa como nodo aparte (estilo punteado),
  colgando de la North Star.
- El **mapa es solo lectura + navegación**. Todas las acciones de alta y edición
  (estrategia, North Star, levers, pilares, asignar objetivo) viven en las **secciones de
  Detalle** debajo del mapa.
- Las **secciones de Detalle** (Estrategia, North Star, Pilares) pasan a ser **colapsables
  y vienen colapsadas por default**, con header clickeable y chevron. Controles
  "Expandir todo / Contraer todo".
- Progreso de North Star, pilares y objetivos con color semántico `ok / warn / risk` +
  porcentaje + leyenda de umbrales, según el design system.
- Botones: los triggers de alta usan la variante `default` (lima) del `Button`; los de
  editar/guardar, la misma variante para consistencia visual. Las altas siguen abriendo
  el `EntityCreateDrawer`.

Sin cambios de dominio, aplicación, base de datos ni API: `getStrategicMap` /
`getStrategy` ya devuelven todo lo necesario. Es un rediseño de UI.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities

- `strategy-northstar`: el requirement **"Strategic pillars and cascade"** cambia a nivel
  de comportamiento observable de UI: el mapa estratégico se presenta como mapa mental
  con nodos expandibles/contraíbles, con un estado de expansión inicial definido, ubicado
  al inicio de la página y en modo solo lectura; la edición de estrategia, North Star,
  levers y pilares se hace desde secciones de detalle colapsables debajo del mapa.

## Impact

- **UI (`src/app/(app)/norte-estrategico/`):**
  - `page.tsx` — reordena secciones (mapa primero), envuelve las secciones de detalle en
    un contenedor colapsable, mueve los triggers de alta/edición al detalle.
  - `strategy-map.tsx` — reescritura: árbol de nodos con expand/collapse en vez de cajas
    apiladas.
  - Nuevos componentes cliente para el estado de colapso (mapa y secciones de detalle).
  - `page-ui.test.ts` — actualizar/expandir cobertura.
- **Design system (`docs/design-system.md`):** documentar el patrón "Strategy Mindmap"
  (ya listado como pendiente junto a "Alignment Ladder") y "Collapsible section".
- **Sin impacto** en `src/modules/strategy-northstar/`, `okrs`, Prisma, ni endpoints.
- ADRs relevantes: ADR-0001 (stack shadcn), ADR-0002 (import por `application/`),
  ADR-0006 (TDD; test-alongside permitido en UI).
