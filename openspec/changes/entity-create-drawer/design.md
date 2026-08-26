## Context

Skills & Staffing, OKRs y Norte Estratégico resuelven hoy el alta de entidades con una `Card` de formulario fija junto a la lista (ver `skills-y-staffing/page.tsx`, `okrs/page.tsx`, `norte-estrategico/page.tsx`). Los formularios ya existen como client components con `useActionState` sobre server actions (`skills-forms.tsx`, `okr-forms.tsx`, `north-star-form.tsx`, `lever-form.tsx`) — este change no toca esa lógica, solo el contenedor visual.

El repo usa shadcn/ui (`components.json`, estilo `radix-nova`) pero todavía no tiene scaffoldeado ningún primitivo de overlay (`Dialog`, `Sheet`, `AlertDialog`). `docs/design-system.md` ya prevé "Modal / confirmaciones → Dialog / AlertDialog" como mapeo de intención, pero no cubre el caso de un panel lateral persistente para altas.

Toda página autenticada del app-shell está sujeta a la regla ESLint `ensambla/page-container` (root `<main>` con `mx-auto w-full px-6 py-10 md:px-10`). El drawer se renderiza en un overlay/portal, por lo que no debe alterar ese root ni su padding.

## Goals / Non-Goals

**Goals:**
- Un componente reusable de drawer overlay completo (right-anchored, full height, con scrim) que cualquier página pueda usar para altas de entidades.
- Migrar Skills & Staffing, OKRs, Norte Estratégico, Equipos & Proyectos y Rituales al nuevo patrón, eliminando las `Card` de formulario fijas de las altas.
- Que el drawer soporte de 1 a 4+ campos sin necesitar rediseño (scroll interno si el contenido excede el alto disponible).
- Accesibilidad básica: foco atrapado dentro del panel al abrir, cierre con `Esc`, cierre al click en el scrim, foco devuelto al trigger al cerrar.

**Non-Goals:**
- No se cambia la lógica de validación, los server actions, ni los contratos de datos de ningún formulario existente.
- No se resuelve en este change el patrón de edición/confirmación (`RenameSkillForm`, `ArchiveObjectiveForm` pueden quedar en su forma actual o migrar al mismo drawer si comparten trigger — se decide por página en tasks.md, no es una definición estructural nueva).
- No se introduce el drawer tipo "panel flotante", "push" ni "hoja inferior" evaluados durante el diseño — se descartaron a favor del overlay completo (ver Decisiones).

## Decisions

**1. Overlay completo (full-height, right-anchored, con scrim) sobre las otras 3 variantes evaluadas.**
Se probaron 4 variantes en un mock interactivo: overlay completo, panel flotante anclado al trigger, push lateral (sin scrim, corre el contenido) y hoja inferior. El overlay completo fue el único que se sostiene bien tanto con 1 campo como con 4+ campos sin scroll prematuro ni angostar el contenido de fondo. Se descarta panel flotante (necesita scroll interno con 4 campos), push (angosta contenido de listas/tablas anchas como OKRs) y hoja inferior (patrón mobile, no natural en desktop).

**2. Construir sobre el primitivo `Sheet` de shadcn/ui (Radix Dialog) en vez de un overlay hecho a mano.**
El repo ya está comprometido con shadcn/ui como sistema de componentes (`components.json`). `Sheet` da manejo de foco, `Esc`, scrim y animaciones de forma consistente con Radix, evitando reimplementar accesibilidad de overlay a mano. Alternativa considerada: extender `Dialog` (ya previsto en `docs/design-system.md`) centrado — se descarta porque `Dialog` es modal centrado, no lateral, y el mock ya validó que el lateral es el patrón elegido.

**3. Un solo componente de aplicación (`EntityCreateDrawer` o similar) que envuelve `Sheet` con el layout estándar (header + body scrollable + footer de acciones), reusado por las 3 páginas.**
Evita que cada página reinvente el layout del drawer (título, botón cerrar, footer con "Cancelar" — la acción primaria vive en el submit del formulario del body) y fija el patrón para futuras páginas que hoy no están en el alcance (dashboard, feedback, onboarding).

**4. El trigger es un botón "+ Nuevo/a `<entidad>`" junto al título de cada lista/catálogo, reemplazando la `Card` fija.**
Consistente con el mock evaluado con el usuario; mantiene la lista visible por defecto (ganancia principal frente al patrón actual, que siempre ocupa espacio con el formulario aunque no se esté usando).

## Risks / Trade-offs

- **[Riesgo] El formulario deja de estar siempre visible → puede reducir descubribilidad del alta.** Mitigación: el botón "+ Nuevo/a X" se ubica en la misma posición donde hoy está la Card, con label explícito, y sigue el layout de todas las páginas migradas para generar reconocimiento del patrón.
- **[Riesgo] `Sheet` de shadcn/ui aún no está scaffoldeado — puede traer configuración/tokens que choquen con el tema actual (`radar`/`radix-nova`).** Mitigación: scaffoldear primero, validar tokens de color/radio contra `docs/design-system.md`, y ajustar antes de aplicar a las 3 páginas.
- **[Riesgo] Migrar 3 páginas en un mismo change aumenta el diff y la superficie de regresión visual.** Mitigación: `tasks.md` secuencia la migración página por página (Skills primero, como referencia validada en el mock), cada una verificable de forma independiente.
- **[Trade-off] Formularios de edición/archivado que hoy también viven en Card (`RenameSkillForm`, `ArchiveObjectiveForm`) quedan fuera de un criterio único** — se resuelve por página en tasks.md en vez de forzar una regla estructural que no fue validada con el usuario.

## Migration Plan

1. Scaffoldear `Sheet` de shadcn/ui y construir el componente de aplicación reusable del drawer.
2. Migrar Skills & Staffing (página de referencia validada en el mock).
3. Migrar OKRs.
4. Migrar Norte Estratégico.
5. Migrar Equipos & Proyectos (alta de Team y Project).
6. Migrar Rituales (alta de ceremonia).
7. Actualizar `docs/design-system.md` con el patrón documentado.

No requiere rollback de datos ni migración de esquema — es un cambio de presentación reversible por revert de commit si algo regresiona visualmente.

## Resolved Decisions (al implementar cada página)

- **Skills & Staffing:** solo `DefineSkillForm` migra al drawer. `RenameSkillForm`
  (edición por skill), `SetSeniorityForm` (control de gestión de seniority) y
  `AddSkillRequirementForm` (alto dentro de la sección de sugerencias) quedan
  con su interacción actual.
- **OKRs:** migran `CreateCycleForm` y `CreateObjectiveForm`. `ArchiveObjectiveForm`,
  `AddKeyResultForm` y los controles de gestión quedan con su interacción actual.
- **Norte Estratégico:** migran `NorthStarForm` y `LeverForm`. `StrategyForm`
  (edición de la estrategia en su Card), `PillarForm` y `AssignForm` (acciones del
  encabezado del mapa) quedan con su interacción actual.
- **Equipos & Proyectos:** migran las altas de `Team` ("+ Nuevo equipo") y de
  `Project` ("+ Nuevo proyecto"). `AssignMemberForm`, `LinkObjectiveForm`,
  `CloseProjectForm` y la edición inline de `TeamForm` (dentro de la card del
  equipo) quedan con su interacción actual.
- **Equipos & Proyectos (reuso de `TeamForm`):** `TeamForm` se usa en dos
  contextos — alta (botón trigger) y edición inline dentro de la card del
  equipo. Como `useEntityCreateDrawerClose()` lanza error fuera de un drawer
  (contrato del componente compartido, para detectar usos huérfanos), la alta
  queda en un componente propio (`CreateTeamForm`, drawer-aware) que cierra en
  éxito; `TeamForm` para edición se mantiene intacto e inline. Es la única
  forma migrada con doble contexto; el resto de las formas migradas solo viven
  dentro del drawer.
- **Rituales:** migra la alta de ceremonia ("+ Nueva ceremonia",
  `CreateRitualForm`). `RecordBlockerForm`, `RecordRetrospectiveForm`,
  `ScheduleActions` y el resto de controles quedan con su interacción actual.
- **Cierre post-submit:** los formularios migrados que devuelven estado vía
  `useActionState` cierran el drawer en éxito usando el context del drawer
  (`useEntityCreateDrawerClose`); los que redirigen (`createCycleAction`,
  `createObjectiveAction`) cierran por la propia redirección. No se cambió
  ninguna server action ni validación. Con el cierre, el feedback de éxito
  desaparece junto al drawer: la verificación e2e pasa a afirmar la entidad
  nueva en el listado (card del Team/Project, card de la Ceremonia) en vez del
  mensaje inline previo.
- **Caso de error ("drawer se mantiene abierto"):** los formularios migrados
  muestran el error inline dentro del body del drawer (feedback de estado
  existente). En OKRs el error conserva el comportamiento previo de redirección
  con banner (`?error=`), probado en e2e (Colaborador → "No tenés permiso").
  Las validaciones por campo siguen bloqueadas por el navegador (`required`),
  como antes del cambio.

## Open Questions

- ¿Los formularios de edición/archivado por entidad (rename, archive) migran al mismo drawer o quedan con su interacción actual? Se resuelve al implementar cada página, no bloquea el resto del change.
