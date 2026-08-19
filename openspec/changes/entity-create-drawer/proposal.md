## Why

En Skills & Staffing, OKRs y Norte Estratégico, el alta de entidades (skill, objetivo, ciclo, north star, lever, pillar) se resuelve con un formulario embebido en una `Card` fija al costado de la lista/matriz correspondiente. A nivel de usabilidad esto genera un layout asimétrico y descolgado del contenido principal, no escala bien cuando el formulario crece más allá de 1-2 campos, y cada página resuelve el alta con su propio criterio en vez de un patrón único. Unificar el alta en un panel lateral (drawer) resuelve la asimetría visual, escala de 1 a 4+ campos sin rediseño, y da consistencia interaccional a toda la app.

## What Changes

- Se introduce un componente reusable de drawer overlay completo (panel deslizante desde la derecha, con scrim que atenúa el fondo), construido sobre el primitivo `Sheet` de shadcn/ui (aún no scaffoldeado en el repo).
- Cada alta pasa a dispararse con un botón "+ Nuevo/a `<entidad>`" ubicado junto al título de la lista/catálogo correspondiente, que abre el drawer con el formulario existente.
- **BREAKING**: se elimina la `Card` de formulario fija al costado de la lista en las páginas afectadas; el formulario deja de estar siempre visible y pasa a mostrarse solo dentro del drawer.
- Páginas afectadas y formularios que migran:
  - Skills & Staffing (`skills-y-staffing/page.tsx`): `DefineSkillForm`, `RenameSkillForm`, `AddSkillRequirementForm`, `SetSeniorityForm`.
  - OKRs (`okrs/page.tsx`): `CreateObjectiveForm`, `CreateCycleForm`, `ArchiveObjectiveForm`.
  - Norte Estratégico (`norte-estrategico/page.tsx`): `NorthStarForm`, `LeverForm` (y `strategy-form.tsx`/`pillar-form.tsx` si aplican al mismo patrón de alta).
- El comportamiento y la validación de cada formulario (server actions, `useActionState`) no cambian — solo cambia el contenedor visual que los aloja.
- Se documenta el patrón en `docs/design-system.md` como el mecanismo estándar de alta de entidades, reemplazando la mención genérica de "Modal / confirmaciones → Dialog / AlertDialog" para este caso de uso específico.

## Capabilities

### New Capabilities
- `entity-create-drawer`: patrón de UI reusable para el alta de entidades vía panel lateral overlay (trigger, apertura/cierre, foco, accesibilidad, comportamiento con 1 a N campos), y su aplicación en Skills & Staffing, OKRs y Norte Estratégico.

### Modified Capabilities
- (ninguna — `skills-matrix`, `okrs` y `strategy-northstar` no cambian sus reglas de negocio, solo el contenedor visual del formulario de alta)

## Impact

- **Nuevo componente**: `src/components/ui/sheet.tsx` (scaffold vía shadcn/ui) + un componente de aplicación tipo `src/components/entity-create-drawer.tsx` (o similar) que envuelve `Sheet` con el trigger y el layout estándar (header, body con scroll, footer con acciones).
- **Páginas modificadas**: `src/app/(app)/skills-y-staffing/page.tsx`, `src/app/(app)/okrs/page.tsx`, `src/app/(app)/norte-estrategico/page.tsx`, y sus respectivos `*-forms.tsx`.
- **Dependencias**: agrega el primitivo `Sheet` de shadcn/ui (Radix Dialog por debajo); no se ya usan otras dependencias nuevas.
- **Documentación**: actualización de `docs/design-system.md` (tabla de mapeo de componentes) para incorporar el drawer como patrón estándar de alta.
- **Sin impacto** en server actions, dominio, ni contratos de datos — cambio acotado a la capa de presentación (`ui`).
