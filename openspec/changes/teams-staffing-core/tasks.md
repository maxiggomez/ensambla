# Tasks: teams-staffing-core

Orden test-first (ADR-0006): cada tarea de test va antes que su implementación.

## 1. Dominio teams-staffing (unit, puro)

- [x] 1.1 Test rojo `capacity.test.ts`: capacity de Team = suma de asignaciones;
      carga de persona = suma entre Teams; overloaded si > 100 (no con 100);
      `capacityPercent` entero en [0, 100] (rechaza fuera de rango)
- [x] 1.2 Implementar `domain/capacity.ts`
- [x] 1.3 Test rojo `team.test.ts`: nombre no vacío (trim); descripción opcional;
      `TEAM_ROLES` = [Lead, Contributor]
- [x] 1.4 Implementar `domain/team.ts` y `domain/team-role.ts`
- [x] 1.5 Test rojo `team-policy.test.ts`: crear Team Dirección/Líder;
      asignar Dirección o Líder Lead del Team; Colaborador nunca
- [x] 1.6 Implementar `domain/team-policy.ts`
- [x] 1.7 Test rojo `alignment.test.ts`: project sin links ⇒ alerta; KRs de
      publicados sin Project ⇒ riesgo; publicados con Project no alertan
- [x] 1.8 Implementar `domain/alignment.ts`

## 2. Schema y migración (🔒 RLS)

- [x] 2.1 Modelos Prisma `Team`, `TeamMember`, `Project`, `ProjectObjective`
      (+ enum `TeamRole`); UNIQUE `(team_id, member_id)` y
      `(project_id, objective_id)`; sin columnas de totales/flags
- [x] 2.2 Migración con RLS (ENABLE + FORCE + política tenant FOR ALL) para las
      cuatro tablas en la misma migración

## 3. Aplicación teams (integration, Postgres efímero)

- [x] 3.1 Tests rojos `create-team` / `assign-team-member` / capacity:
      crear con nombre y descripción; Colaborador forbidden; asignar con rol y
      %; % fuera de rango falla; capacity de Team y carga por persona derivadas
      con flag overloaded; aislamiento entre tenants
- [x] 3.2 Implementar casos de uso + `infrastructure/team-repo.ts`

## 4. Aplicación projects + alineamiento (integration)

- [x] 4.1 Tests rojos `create-project` / `link-project-to-objectives` /
      `evaluate-alignment`: vincular a ≥1 Objective; project sin OKR alerta;
      KRs de Objective publicado sin Project como riesgo; aislamiento entre
      tenants
- [x] 4.2 Implementar casos de uso + `infrastructure/project-repo.ts`
      (Objectives validados vía `okrs/application`)

## 5. Verificación

- [x] 5.1 `npm run typecheck` + `npm run lint` + `npm run format:check` en verde
- [x] 5.2 `npm run test` en verde (unit + integration)
- [x] 5.3 `openspec validate --all --strict` en verde
- [x] 5.4 Review con `mg-pr-review` (obligatorio: áreas 🔒)
