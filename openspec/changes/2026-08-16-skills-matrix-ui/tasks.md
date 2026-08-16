# Tasks: skills-matrix-ui

## 1. Contrato de diseño (UI source test, test-alongside)

- [x] 1.1 **Test** unit `skills-matrix-ui.test.ts` (estilo `okrs-ui.test.ts`):
  sin `UnderConstruction`, labels/fieldset, sin colores hardcodeados, strings
  es-LATAM ("Matriz de competencias", "Definir skill", "Sugerencias de
  staffing", "Gaps de cobertura"). (rojo)
- [x] 1.2 Page + forms + actions cumplen el contrato. (verde)

## 2. Catálogo de skills y matriz

- [x] 2.1 **Test** e2e: Dirección define una skill, registra competencia de un
  miembro y el nivel aparece en su fila. (rojo)
- [x] 2.2 `page.tsx` con catálogo + matriz (filtro por Team incluido) +
  `defineSkillAction`/`renameSkillAction`/`setCompetencyAction`. (verde)

## 3. Seniority (identity-org UI)

- [x] 3.1 **Test** e2e: Dirección setea seniority de un miembro en la matriz y
  queda persistida; Líder/Colaborador no ven el control. (rojo)
- [x] 3.2 Control de seniority + `setSeniorityAction` (vía
  `identity-org/application.setMemberSeniority`). (verde)

## 4. Staffing: necesidad, requisitos y sugerencias

- [x] 4.1 **Test** e2e: Dirección elige una necesidad (Project), registra un
  skill requerido y ve las sugerencias con el flag "Sin margen" cuando
  corresponde. (rojo)
- [x] 4.2 `StaffingForm` + `addSkillRequirementAction` + sección de sugerencias
  (consumiendo `suggestStaffing`). (verde)

## 5. Gaps de cobertura y bus factor

- [x] 5.1 **Test** e2e: con objetivos publicados y competencias que generan
  gap, las alertas de cobertura y bus factor se muestran. (rojo)
- [x] 5.2 Sección de gaps (consumiendo `evaluateGaps`). (verde)

## 6. Colaborador read-only

- [x] 6.1 **Test** e2e: Colaborador ve la matriz sin controles. (rojo)
- [x] 6.2 Render condicional por rol (Dirección/Líder vs Colaborador). (verde)

## 7. app-shell

- [x] 7.1 Actualizar `e2e/app-shell.spec.ts` (Skills & Staffing deja de ser
  placeholder) y spec delta de `app-shell` en este change.

## 8. Verificación

- [x] 8.1 `npm run typecheck` · `lint` · `format:check` · `test` ·
  `test:e2e:dev-auth` · `build` · `openspec validate --all --strict`.