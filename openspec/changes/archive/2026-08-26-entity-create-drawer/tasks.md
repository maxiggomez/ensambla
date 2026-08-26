## 1. Primitivo y componente compartido

- [x] 1.1 Scaffoldear el componente `Sheet` de shadcn/ui (`npx shadcn add sheet`) y validar que sus tokens de color/radio coinciden con `docs/design-system.md`.
- [x] 1.2 Escribir tests del componente reusable de drawer: contract por fuente (envuelve `Sheet`, panel derecho full-height, body scrollable entre header/footer) + cobertura e2e del comportamiento (trigger abre, `Escape` cierra, click en scrim cierra, foco vuelve al trigger, foco dentro del panel) antes de implementarlo.
- [x] 1.3 Implementar el componente de aplicación reusable (p. ej. `src/components/entity-create-drawer.tsx`) que envuelve `Sheet` con layout estándar: header (título + botón cerrar), body scrollable que aloja el formulario (submit primario), y footer con "Cancelar".
- [x] 1.4 Verificar que los tests de 1.2 pasan contra la implementación.

## 2. Migrar Skills & Staffing (referencia)

- [x] 2.1 Escribir/actualizar tests de `skills-y-staffing/page.tsx` para reflejar el nuevo flujo: botón "+ Nueva skill" abre el drawer con `DefineSkillForm`; envío exitoso cierra el drawer y refleja la skill en el catálogo; error de validación mantiene el drawer abierto con el error junto al campo.
- [x] 2.2 Reemplazar la `Card` fija de `DefineSkillForm` por el botón trigger junto al título "Catálogo de skills" y el drawer compartido.
- [x] 2.3 Decidir y aplicar el mismo tratamiento (drawer o interacción actual) para `RenameSkillForm`, `AddSkillRequirementForm` y `SetSeniorityForm`, documentando la decisión en el PR. *Decisión: quedan en su interacción actual (edición por entidad / control de gestión, no alta junto a lista).*
- [x] 2.4 Correr la app y verificar manualmente el flujo completo (abrir, crear, error, cerrar con Esc, cerrar con scrim) en Skills & Staffing. *Cubierto por e2e dev-auth.*

## 3. Migrar OKRs

- [x] 3.1 Escribir/actualizar tests de `okrs/page.tsx` equivalentes a 2.1 para `CreateObjectiveForm` y `CreateCycleForm`.
- [x] 3.2 Reemplazar las `Card` fijas correspondientes por el botón trigger y el drawer compartido.
- [x] 3.3 Decidir y aplicar el mismo tratamiento para `ArchiveObjectiveForm`. *Decisión: queda con su interacción actual (acción de archivado por entidad).*
- [x] 3.4 Verificar manualmente el flujo completo en OKRs, incluyendo que la tabla/lista de objetivos ya no comparte layout con un formulario fijo. *Cubierto por e2e dev-auth.*

## 4. Migrar Norte Estratégico

- [x] 4.1 Escribir/actualizar tests de `norte-estrategico/page.tsx` equivalentes a 2.1 para `NorthStarForm` y `LeverForm`.
- [x] 4.2 Reemplazar las `Card` fijas correspondientes por el botón trigger y el drawer compartido.
- [x] 4.3 Revisar si `strategy-form.tsx` / `pillar-form.tsx` siguen el mismo patrón de alta junto a una lista y migrarlos si corresponde; documentar si se excluyen y por qué. *Decisión: se excluyen — `StrategyForm` edita la estrategia dentro de su Card; `PillarForm`/`AssignForm` son acciones del encabezado del mapa, no altas junto a una lista.*
- [x] 4.4 Verificar manualmente el flujo completo en Norte Estratégico. *Cubierto por e2e dev-auth.*

## 5. Documentación y cierre

- [x] 5.1 Actualizar `docs/design-system.md`: agregar el drawer overlay como patrón estándar de alta de entidades, referenciando el componente compartido de 1.3.
- [x] 5.2 Correr lint completo (incluida la regla `ensambla/page-container`) y typecheck en las tres páginas migradas.
- [x] 5.3 Correr la suite de tests completa y confirmar que no quedan referencias a las `Card` de formulario fijo eliminadas.

## 6. Migrar Equipos & Proyectos (alta de Team y Project)

- [x] 6.1 Escribir/actualizar tests de `equipos-y-proyectos/page.tsx`: triggers "+ Nuevo equipo" y "+ Nuevo proyecto" abren el drawer con cada formulario; envío exitoso cierra el drawer y muestra la card del equipo/proyecto nuevo; `TeamForm` para edición sigue inline; Colaborador no ve los triggers.
- [x] 6.2 Implementar: reemplazar las `Card` fijas "Crear equipo"/"Crear proyecto" por los triggers y el drawer compartido; extraer `CreateTeamForm` (drawer-aware, cierra en éxito) y dejarlo compitiendo con la edición inline de `TeamForm`.
- [x] 6.3 Verificar manualmente el flujo completo en Equipos & Proyectos. *Cubierto por e2e dev-auth.*

## 7. Migrar Rituales (alta de ceremonia)

- [x] 7.1 Escribir/actualizar tests de `rituales/page.tsx`: trigger "+ Nueva ceremonia" abre el drawer con `CreateRitualForm`; envío exitoso cierra el drawer y muestra la card de la ceremonia nueva.
- [x] 7.2 Implementar: reemplazar la `Card` fija "Crear ceremonia" por el trigger y el drawer compartido; `CreateRitualForm` pasa a drawer-aware (cierra en éxito).
- [x] 7.3 Verificar manualmente el flujo completo en Rituales. *Cubierto por e2e dev-auth.*

## 8. Cierre del slice

- [x] 8.1 Actualizar `docs/design-system.md` (enumera las 5 páginas que adoptan el patrón).
- [x] 8.2 Correr la suite completa (typecheck, lint, format, unit, e2e dev-auth) y `openspec validate`.