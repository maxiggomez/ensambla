# Tasks: skills-matrix-core

Orden test-first (ADR-0006): cada tarea de test va antes que su implementación.

## 1. Dominio skills-matrix (unit, puro)

- [x] 1.1 Test rojo `competency.test.ts`: level entero en [0, 4] (rechaza fuera
      de rango); `skillName` no vacío (trim)
- [x] 1.2 Implementar `domain/competency.ts` y `domain/skill.ts`
- [x] 1.3 Test rojo `matching.test.ts`: orden lexicográfico (nivel promedio →
      seniority → disponibilidad → nombre); excluye promedio 0; "no margin" con
      carga ≥ 100 pero sigue sugerida; seniority sin dato rankea último
- [x] 1.4 Implementar `domain/matching.ts`
- [x] 1.5 Test rojo `gaps.test.ts`: gap si skill requerida por ≥ 2 Objectives
      publicados y cobertura < 2 (nivel ≥ 3); bus factor con exactamente 1
      persona de cobertura; sin falsos positivos con cobertura suficiente
- [x] 1.6 Implementar `domain/gaps.ts` (constantes de umbral nombradas)

## 2. Dominio identity-org: seniority (unit)

- [x] 2.1 Test rojo `seniority.test.ts`: valores válidos Junior/SemiSenior/
      Senior; rank Senior > SemiSenior > Junior > sin dato
- [x] 2.2 Implementar `domain/seniority.ts`

## 3. Schema y migración (🔒 RLS)

- [x] 3.1 Modelos Prisma `Skill`, `Competency`, `SkillRequirement` (+ enum
      `Seniority`, columna nullable en `member`); UNIQUE (member, skill) y
      requirement por par; CHECK "project XOR key result"
- [x] 3.2 Migración con RLS (ENABLE + FORCE + política tenant) para las tres
      tablas nuevas; ALTER aditivo de `member`

## 4. Aplicación identity-org: seniority (integration)

- [x] 4.1 Test rojo `set-member-seniority`: Dirección setea; Líder/Colaborador
      forbidden
- [x] 4.2 Implementar `setMemberSeniority` y exportarlo en el índice público

## 5. Aplicación skills-matrix: matriz (integration)

- [x] 5.1 Tests rojos `define-skill` / `set-competency` /
      `get-competency-matrix`: upsert de nivel; nivel fuera de rango falla;
      matriz filtrada por Team; permisos (Colaborador no define);
      aislamiento entre tenants
- [x] 5.2 Implementar casos de uso + `infrastructure/skill-repo.ts` y
      `competency-repo.ts`

## 6. Aplicación skills-matrix: staffing y gaps (integration)

- [x] 6.1 Tests rojos `add-skill-requirement` / `suggest-staffing` /
      `evaluate-gaps`: sugerencias ordenadas (nivel → seniority →
      disponibilidad); no margin con carga ≥ 100; gap de cobertura y bus
      factor con los umbrales; aislamiento entre tenants
- [x] 6.2 Implementar casos de uso + `infrastructure/requirement-repo.ts`
      (Objectives publicados vía `okrs/application`; loads vía
      `teams-staffing/application`)

## 7. Verificación

- [x] 7.1 `npm run typecheck` + `npm run lint` + `npm run format:check` en verde
- [x] 7.2 `npm run test` en verde (unit + integration)
- [x] 7.3 `openspec validate --all --strict` en verde
- [x] 7.4 Review con `mg-pr-review` (obligatorio: áreas 🔒)
