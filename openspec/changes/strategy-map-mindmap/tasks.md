## 1. Preparación

- [ ] 1.1 Releer `openspec/specs/strategy-northstar/spec.md`, el delta de este change, `docs/design-system.md` y el mockup de referencia ("Mapa Estratégico Norte").
- [ ] 1.2 Confirmar los tipos que ya devuelven `getStrategicMap`/`getStrategy` (`StrategicMapView`): visión, North Star + progreso, pilares + objetivos + progreso, `unassignedObjectives`. No se modifican.
- [ ] 1.3 Identificar la lógica actual de color/estado por progreso y umbrales para reutilizarla (no duplicar).

## 2. Tests primero (test-alongside UI, ADR-0006)

- [ ] 2.1 Test: en `/norte-estrategico` el mapa estratégico se renderiza antes de las secciones de detalle.
- [ ] 2.2 Test: al cargar, el mapa muestra Visión y North Star expandidas y los pilares/objetivos colapsados (con contador de hijos ocultos).
- [ ] 2.3 Test: expandir el nodo North Star revela los nodos de pilar y los nodos de objetivos sin pilar.
- [ ] 2.4 Test: "contraer todo" deja visibles Visión y North Star; "expandir todo" muestra toda la cascada.
- [ ] 2.5 Test: los objetivos sin pilar aparecen como nodo propio colgando de la North Star, distinguidos de los pilares.
- [ ] 2.6 Test: el mapa no contiene controles de alta/edición (estrategia, North Star, lever, pilar, asignar objetivo).
- [ ] 2.7 Test: cada sección de Detalle arranca colapsada y su header la expande mostrando contenido + controles de edición.
- [ ] 2.8 Test: estados vacíos (sin North Star / sin pilares / sin objetivos) — el mapa muestra la raíz + guía y no rompe.
- [ ] 2.9 Test: sigue pasando el escenario de reads serializados del mapa (sin regresión).

## 3. Componente mapa mental

- [ ] 3.1 Crear `strategic-mindmap.tsx` (client component) que recibe `map: StrategicMapView` y arma el árbol Visión → North Star → Pilares → Objetivos (+ nodos "sin pilar" bajo North Star).
- [ ] 3.2 Estado de expansión con `useState<Set<string>>` inicializado con `{visionId, northStarId}`; toggle por nodo.
- [ ] 3.3 Controles "Expandir todo" / "Contraer todo" (contraer conserva Visión + North Star).
- [ ] 3.4 Nodo: kicker + título + (cuando aplica) barra de progreso + `%` + estado semántico (ícono/texto, no solo color); leyenda de umbrales en el mapa.
- [ ] 3.5 Botón de toggle por nodo con hijos: `aria-expanded`, `aria-controls`, `aria-label`, foco visible; colapsado muestra el número de hijos directos ocultos.
- [ ] 3.6 Conectores CSS (padre↔hijos) con ancho de nodo fijo y `align-items: center`; contenedor con `overflow-x: auto` y gutter para no recortar el toggle; `prefers-reduced-motion` respetado.
- [ ] 3.7 Estilos vía tokens del design system (tema claro Radar); sin hex hardcodeado.

## 4. Reescritura de `strategy-map.tsx` y `page.tsx`

- [ ] 4.1 Reemplazar el render de cards apiladas de `strategy-map.tsx` por `<StrategicMindmap>` (o dejar `strategy-map.tsx` como wrapper server que pasa el `map`).
- [ ] 4.2 En `page.tsx`, reordenar: header → sección Mapa estratégico → secciones de Detalle.
- [ ] 4.3 Quitar del bloque del mapa todos los triggers de alta/edición.

## 5. Secciones de Detalle colapsables

- [ ] 5.1 Crear `collapsible-section.tsx` (client): header `<button aria-expanded>` + chevron + cuerpo; prop `defaultOpen=false`.
- [ ] 5.2 Envolver Estrategia, North Star y Pilares en `<CollapsibleSection>` (colapsadas por default).
- [ ] 5.3 Agrupar con controles "Expandir todo" / "Contraer todo" para el bloque de Detalle.
- [ ] 5.4 Mover al cuerpo de cada sección los controles de edición/alta: `StrategyForm`, `NorthStarForm`, `LeverForm`, `PillarForm`, `AssignForm` — manteniendo server actions, `useActionState` y el `EntityCreateDrawer`.
- [ ] 5.5 Verificar el gating por rol (`isDirection`) y los estados vacíos con CTA guía.

## 6. Cierre

- [ ] 6.1 Todos los tests del punto 2 en verde + `npm run lint` + typecheck + build.
- [ ] 6.2 Actualizar `docs/design-system.md`: documentar los patrones "Strategy Mindmap" y "Collapsible section".
- [ ] 6.3 Revisar accesibilidad (teclado, foco, contraste AA) y responsive (mobile: mapa scrollea horizontal, body no).
- [ ] 6.4 `openspec validate strategy-map-mindmap --strict` y dejar el change listo para archivar.
