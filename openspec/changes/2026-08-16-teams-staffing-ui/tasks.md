# Tasks: teams-staffing-ui

## 1. Contrato de diseño (UI source test, test-alongside)

- [x] 1.1 **Test** unit `teams-staffing-ui.test.ts` (estilo `okrs-ui.test.ts`):
  la página ya no usa `UnderConstruction`, tiene labels/fieldset, sin colores
  hardcodeados, y strings es-LATAM clave ("Crear equipo", "Asignar miembro",
  "Cerrar proyecto", "Alertas de alineamiento"). (rojo)
- [x] 1.2 Page + forms + actions cumplen el contrato. (verde)

## 2. Listado de equipos, miembros y capacidad

- [x] 2.1 **Test** e2e: Dirección abre Equipos & Proyectos y ve el listado de
  Teams con capacidad derivada. (rojo)
- [x] 2.2 `page.tsx` server component con teams + miembros + capacidad +
  overload. (verde)

## 3. Crear y editar un Team

- [x] 3.1 **Test** e2e: Dirección crea (y edita) un Team desde el UI y aparece
  en el listado. (rojo)
- [x] 3.2 `TeamForm` + `createTeamAction`/`updateTeamAction` + parser zod.
  (verde)

## 4. Asignar miembros al Team

- [x] 4.1 **Test** e2e: un Lead asigna un Contributor con capa; la carga se
  refleja en el % derivado. (rojo)
- [x] 4.2 `AssignMemberForm` + `assignTeamMemberAction`. (verde)

## 5. Proyectos: crear, vincular y cerrar

- [x] 5.1 **Test** e2e: Dirección crea un Project, lo vincula a un Objective y
  lo cierra. (rojo)
- [x] 5.2 `ProjectForm` + `LinkObjectiveForm` + `CloseProjectForm` + actions.
  (verde)

## 6. Alertas de alineamiento

- [x] 6.1 **Test** e2e: alertas "Project sin OKR" y "KR sin Project" visibles.
  (rojo)
- [x] 6.2 Sección de alertas consumiendo `evaluateAlignment`. (verde)

## 7. Colaborador read-only

- [x] 7.1 **Test** e2e: Colaborador ve Teams sin controles de gestión. (rojo)
- [x] 7.2 Render condicional por rol (Dirección/Líder vs Colaborador). (verde)

## 8. app-shell

- [x] 8.1 Actualizar `e2e/app-shell.spec.ts` (Equipos & Proyectos deja de ser
  placeholder) y spec delta de `app-shell` en este change.

## 9. Verificación

- [x] 9.1 `npm run typecheck` · `lint` · `format:check` · `test` ·
  `test:e2e:dev-auth` · `build` · `openspec validate --all --strict`.