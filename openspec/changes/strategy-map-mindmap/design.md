## Context

`/norte-estrategico` (`src/app/(app)/norte-estrategico/`) es un React Server Component
que carga `getStrategy` + `getStrategicMap` (y `listObjectives` para Dirección) y renderiza
tres secciones apiladas: Estrategia, North Star y —al final— Mapa estratégico
(`strategy-map.tsx`), hoy una lista de cards sin conectores.

Restricciones:
- ADR-0001: Next App Router + Tailwind v4 + shadcn/ui. Sin librerías nuevas.
- ADR-0002: los módulos se consumen por `application/`. Esta feature no toca módulos.
- `docs/design-system.md`: identidad Radar, tema claro único, color = estado (con ícono/
  texto), `Button` variantes, `EntityCreateDrawer` para altas.
- El `Button` real: `h-8`, `rounded-lg` (18px), 14px/500; variante `default` = lima
  (`#CAFF47`, texto tinta); variante `outline` sobre papel.
- Referencia visual aprobada: artifact "Mapa Estratégico Norte" (mockup navegable con el
  árbol izquierda→derecha, expand/collapse y detalle colapsable).

## Goals / Non-Goals

**Goals:**
- Mapa estratégico como mapa mental navegable, primero en la página.
- Expand/collapse por nodo; estado inicial Visión + North Star.
- Detalle en secciones colapsables (colapsadas por default) que concentran las acciones.
- Cero cambios de dominio/aplicación/DB/API; accesible y coherente con el design system.

**Non-Goals:**
- No cambia `getStrategicMap`/`getStrategy` ni sus tipos.
- No persiste el estado de expansión (no hay preferencias de usuario).
- No hay pan/zoom, drag, ni layout radial. Árbol jerárquico simple.
- No se agregan acciones nuevas: son las mismas altas/ediciones ya existentes, reubicadas.
- No se toca el roll-up de progreso ni los umbrales de estado (se reusan los actuales).

## Decisions

### D1 — Layout: árbol izquierda→derecha con conectores CSS, no SVG ni librería
Nodo padre a la izquierda, `ul.children` a la derecha; conectores con
pseudo-elementos (`::before` horizontal, `::after` vertical con ajustes
`:first-child`/`:last-child`/`:only-child`). `align-items: center` en cada rama.
El contenedor scrollea en horizontal (`overflow-x: auto`) con gutter para que el
control de toggle no se recorte; el `<body>` nunca scrollea de lado.
*Alternativas:* React Flow / d3-hierarchy (dependencia pesada, contra ADR-0001);
SVG a mano (path data frágil y difícil de hacer responsive). Rechazadas.

### D2 — Estado de expansión: client component con `useState`, sin persistencia
`strategy-map.tsx` sigue recibiendo el `map` del server; un nuevo client component
(`strategic-mindmap.tsx`) mantiene un `Set<string>` de ids de nodo expandidos,
inicializado con `{visionId, northStarId}`. `expandAll`/`collapseAll` recalculan el set;
`collapseAll` conserva visión y North Star.
*Alternativa:* `<details>`/Radix Collapsible por nodo — más accesible de fábrica pero
complica `expand all`/`collapse all` global y el contador de hijos; se usa Radix solo si
aparece fricción de accesibilidad en el toggle.

### D3 — Secciones de Detalle colapsables
Un client component `collapsible-section.tsx` (header `<button aria-expanded>` + cuerpo)
envuelve cada sección; default `collapsed`. Un contenedor con `expandAll`/`collapseAll`.
El `page.tsx` (RSC) sigue renderizando los forms server-action adentro del cuerpo; el
drawer de alta no cambia.

### D4 — Ubicación y responsabilidades
`page.tsx` reordena: header → `<StrategicMindmap>` → secciones de Detalle. Los triggers
de alta/edición (`StrategyForm`, `NorthStarForm`, `LeverForm`, `PillarForm`, `AssignForm`)
se mueven al Detalle. El mapa queda 100% lectura.

### D5 — Nodos y estado
Cada nodo: kicker (Visión/North Star/Pilar/Objetivo/Sin pilar), título, y —cuando aplica—
barra + `%` + estado semántico. Los umbrales (`≥70` ok / `40–69` warn / `<40` risk) se
muestran como leyenda del mapa. Objetivos sin pilar: nodo con borde punteado colgando de
la North Star. Se reutiliza la lógica de color/estado ya presente en la app.

### D6 — Tests (ADR-0006, test-alongside en UI)
Extender `page-ui.test.ts` y agregar tests de componente para: orden de secciones,
estado inicial del mapa (solo visión + North Star), expandir un nodo revela hijos,
`collapse all` conserva la cima, ausencia de controles de edición en el mapa, secciones
de detalle colapsadas por default. Deriva 1:1 de los Scenarios del delta spec.

## Risks / Trade-offs

- **Conectores CSS se rompen con alturas de nodo muy dispares** → mantener nodos con
  ancho fijo y contenido acotado (título truncado / `line-clamp`), `align-items: center`
  por rama; verificar con datos reales (pilares con 0 y con muchos objetivos).
- **Árbol totalmente expandido es ancho** → scroll horizontal contenido + arranque
  colapsado mitigan; `collapse all` siempre disponible.
- **Estado de expansión no persiste** (se pierde al recargar) → aceptado; el default
  (visión + North Star) es el caso de uso principal "ver qué tenemos definido".
- **Accesibilidad del toggle** → `button` con `aria-expanded`/`aria-controls`, foco
  visible, `prefers-reduced-motion` respetado; si el patrón custom da problemas, migrar a
  Radix Collapsible (D2).
- **Empty states** (sin North Star / sin pilares / sin objetivos) → el mapa muestra la
  raíz + mensaje guía; las altas se hacen desde el Detalle. Cubrir en tests.

## Migration Plan

Cambio solo de UI, sin migración de datos ni feature flag. Deploy directo; rollback =
revertir el commit. Los tests verdes de los Scenarios del delta son la Definition of Done.

## Open Questions

- ¿"Expandir/contraer todo" del Detalle y del mapa son dos controles separados o uno
  solo? (propuesta: separados, cada bloque el suyo).
- ¿El nodo North Star colapsado cuenta como hijos solo los pilares, o pilares +
  objetivos-sin-pilar? (propuesta: hijos directos = pilares + nodos sin pilar).
