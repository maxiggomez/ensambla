## 1. Primitivo y componente compartido

- [ ] 1.1 Scaffoldear el componente `Sheet` de shadcn/ui (`npx shadcn add sheet`) y validar que sus tokens de color/radio coinciden con `docs/design-system.md`.
- [ ] 1.2 Escribir tests para el componente reusable de drawer (trigger abre el panel, `Escape` cierra, click en scrim cierra, foco vuelve al trigger al cerrar, body scrollea independiente del header/footer) antes de implementarlo.
- [ ] 1.3 Implementar el componente de aplicación reusable (p. ej. `src/components/entity-create-drawer.tsx`) que envuelve `Sheet` con layout estándar: header (título + botón cerrar), body scrollable, footer con acción primaria y "Cancelar".
- [ ] 1.4 Verificar que los tests de 1.2 pasan contra la implementación.

## 2. Migrar Skills & Staffing (referencia)

- [ ] 2.1 Escribir/actualizar tests de `skills-y-staffing/page.tsx` para reflejar el nuevo flujo: botón "+ Nueva skill" abre el drawer con `DefineSkillForm`; envío exitoso cierra el drawer y refleja la skill en el catálogo; error de validación mantiene el drawer abierto con el error junto al campo.
- [ ] 2.2 Reemplazar la `Card` fija de `DefineSkillForm` por el botón trigger junto al título "Catálogo de skills" y el drawer compartido.
- [ ] 2.3 Decidir y aplicar el mismo tratamiento (drawer o interacción actual) para `RenameSkillForm`, `AddSkillRequirementForm` y `SetSeniorityForm`, documentando la decisión en el PR.
- [ ] 2.4 Correr la app y verificar manualmente el flujo completo (abrir, crear, error, cerrar con Esc, cerrar con scrim) en Skills & Staffing.

## 3. Migrar OKRs

- [ ] 3.1 Escribir/actualizar tests de `okrs/page.tsx` equivalentes a 2.1 para `CreateObjectiveForm` y `CreateCycleForm`.
- [ ] 3.2 Reemplazar las `Card` fijas correspondientes por el botón trigger y el drawer compartido.
- [ ] 3.3 Decidir y aplicar el mismo tratamiento para `ArchiveObjectiveForm`.
- [ ] 3.4 Verificar manualmente el flujo completo en OKRs, incluyendo que la tabla/lista de objetivos ya no comparte layout con un formulario fijo.

## 4. Migrar Norte Estratégico

- [ ] 4.1 Escribir/actualizar tests de `norte-estrategico/page.tsx` equivalentes a 2.1 para `NorthStarForm` y `LeverForm`.
- [ ] 4.2 Reemplazar las `Card` fijas correspondientes por el botón trigger y el drawer compartido.
- [ ] 4.3 Revisar si `strategy-form.tsx` / `pillar-form.tsx` siguen el mismo patrón de alta junto a una lista y migrarlos si corresponde; documentar si se excluyen y por qué.
- [ ] 4.4 Verificar manualmente el flujo completo en Norte Estratégico.

## 5. Documentación y cierre

- [ ] 5.1 Actualizar `docs/design-system.md`: agregar el drawer overlay como patrón estándar de alta de entidades, referenciando el componente compartido de 1.3.
- [ ] 5.2 Correr lint completo (incluida la regla `ensambla/page-container`) y typecheck en las tres páginas migradas.
- [ ] 5.3 Correr la suite de tests completa y confirmar que no quedan referencias a las `Card` de formulario fijo eliminadas.
