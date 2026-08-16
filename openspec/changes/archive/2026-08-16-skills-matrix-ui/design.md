# Design: skills-matrix-ui

## Contexto

Mismo patrón que `feedback-y-carrera/` y `teams-staffing-ui`: página server
component que lee estado y delega mutaciones a server actions; forms client con
`useActionState`.

## Datos leídos por la página

- `listMembers` (`identity-org`) → filas + actor + seniority por miembro.
- `getCompetencyMatrix({ teamId? })` (`skills-matrix`) → skills + rows.
- `listProjectContexts` (`teams-staffing`) y `listObjectives` (`okrs`, para
  sus KeyResults) → necesidad de staffing (Project o KR).
- `evaluateGaps` → `coverageGaps` + `busFactorRisks`.
- `suggestStaffing({ projectId | keyResultId })` → sugerencias ordenadas.

## Visibilidad / autorización

- Render: Dirección y Líder ven controles de definir skill/competencia/staffing
  (replica local de `canManageSkills`). Seniority: solo Dirección (replica de
  `canManageMembers`). El backend aplica igual `skills-matrix/forbidden` /
  `identity-org/forbidden` en los casos de uso.
- Colaborador: matriz legible, sin controles.

## Forms / actions

- `defineSkillAction` / `renameSkillAction` / `setCompetencyAction` /
  `setSeniorityAction` / `addSkillRequirementAction`. Cada action valida con
  Zod (parsers en `form-input.ts`), resuelve el actor y hace
  `revalidatePath("/skills-y-staffing")`. El nivel y la seniority se parsean
  con `z.coerce.number()/z.enum` para acotar a 0–4 y a
  Junior/SemiSenior/Senior.
- Sugerencias: form que elige la necesidad (select del tipo + id) y muestra el
  resultado sobre el mismo page (server render del estado actual, no AJAX).

## Naming UI (es-LATAM)

"Skills", "Matriz de competencias", "Nivel", "Seniority", "Definir skill",
"Renombrar skill", "Registrar competencia", "Necesidad", "Proyecto/Key Result",
"Sugerencias de staffing", "Sin margen", "Gaps de cobertura", "Riesgo bus factor".