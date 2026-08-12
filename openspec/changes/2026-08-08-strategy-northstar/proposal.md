# Proposal: strategy-northstar

## Why

La capability `strategy-northstar` está implementada solo en su núcleo (definir y
leer la North Star como `Measurement` tipado, change archivado
`strategy-okrs-core`). La spec define el resto del slice vertical: visión, misión
y valores; input levers de la North Star vinculables a un `Objective`; pilares
estratégicos que agrupan objetivos; y el mapa estratégico con la cascada
Vision → North Star → Pillars → OKRs con progreso real derivado (roll-up 🔒).
Todo esto — backend y UI — es lo que entrega este change.

## What Changes

- **Módulo `strategy-northstar`** (extensión):
  - `define-strategy` / `get-strategy`: Dirección define (o redefine) visión,
    misión y valores de la Organization; cualquier miembro los lee.
  - `add-input-lever`: Dirección agrega un input lever bajo la North Star y
    puede vincularlo a un `Objective` (validado dentro del tenant vía la
    interfaz pública de `okrs`).
  - `create-strategic-pillar` / `assign-objective-to-pillar`: Dirección crea
    pilares y agrupa objetivos; un objetivo no puede estar dos veces en el
    mismo pilar.
  - `get-strategic-map`: cualquier miembro lee la cascada completa con el
    progreso real de cada objetivo consumido por la interfaz pública de
    `okrs` (roll-up 🔒, nunca persistido).
- **Persistencia + RLS 🔒**: columnas `vision`/`mission`/`values` en
  `Organization`; modelos `NorthStarLever`, `StrategicPillar` y
  `PillarObjective`, tenant-scoped con `ENABLE + FORCE ROW LEVEL SECURITY` y
  políticas en la misma migración (ADR-0003).
- **UI Radar en español** (`/norte-estrategico`): vista de estrategia
  (estatutos + North Star con progreso y levers) y mapa estratégico; edición
  solo para Dirección, lectura para todos. Server actions con mensajes en
  español, usando tokens y componentes del design system.
- **Auth**: página y actions usan el gateway `src/lib/auth` (soporta mock y
  Clerk), mismo patrón de `currentUser()`/`auth()` con fallback a
  `/onboarding` que `/culture-enps`.

## Out of scope

- `app-shell` (navegación lateral) — ya mergeado en `main`. Esta página vive
  como ruta dentro del shell en `/norte-estrategico`, igual que `/culture-enps`.
- Gestión de `Objective`/`KeyResult` (crear, publicar, check-ins): pertenece a
  `okrs`; acá solo se consumen como progreso visible.
- "Orphan objective" y demás alertas de alineamiento de `okrs`.

## Impact

- Spec afectada: `strategy-northstar` (delta: ADDED Vision/mission/values y
  Strategic pillars and cascade; MODIFIED North Star metric con levers).
- Código nuevo: `src/modules/strategy-northstar/{domain,application,infrastructure}`
  (extensiones) y `src/app/(app)/norte-estrategico/`.
- Persistencia: `prisma/schema.prisma` + migración aditiva con RLS.
- Dependencias leídas solo por interfaces públicas: `identity-org/application`
  (actor/permisos) y `okrs/application` (`getObjective`, `listObjectives`).
