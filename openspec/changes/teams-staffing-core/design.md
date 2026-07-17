# Design: teams-staffing-core

## Contexto

Segundo módulo de negocio. Replica los patrones de `strategy-okrs-core`:
módulo DDD nuevo, tenancy vía `withTenantForUser`/`withTenant`, RLS en la
misma migración, cross-módulo solo por `application/` ajeno.

## Decisiones

### D1 — Capacity: % por asignación, totales siempre derivados

`team_member.capacity_percent` (entero 0–100) es el % de la persona dedicado a
ese Team. Todo total es derivado en lectura, nunca persistido:

- Capacity de un Team = suma de los `capacity_percent` de sus asignaciones.
- Carga de una persona = suma de sus `capacity_percent` en todos sus Teams
  (así se "reparte" su capacidad).
- `overloaded` = suma > 100 (persona o Team). Es un flag calculado, no columna.

Las reglas viven en `domain/capacity.ts` (funciones puras sobre listas de
asignaciones).

### D2 — Rol dentro del Team y permisos MVP

`TeamRole` = `Lead` | `Contributor` (distinto del rol organizacional de
`identity-org`). Política en `domain/team-policy.ts`:

- Crear Team: Dirección o Líder (org).
- Asignar/editar miembros de un Team: Dirección, o Líder (org) que sea `Lead`
  de ese Team.
- Crear Project y vincular Objectives: Dirección o Líder.
- Colaborador: solo lectura.

Se refinará cuando exista una relación explícita Líder ↔ Team.

### D3 — Alineamiento Projects ↔ OKRs

`project_objective` es una join table (project ↔ objective, única por par).
Alertas derivadas en lectura, sin columnas de estado:

- "project without OKR": Project sin filas en `project_objective`.
- "key result with no project": KeyResults de Objectives **publicados** que no
  tienen ningún Project vinculado. Se lee vía `listObjectives` de
  `okrs/application` (interfaz pública existente) — nunca tocando sus tablas.
- `project_objective.objective_id` no lleva FK cross-módulo "lógica": la FK de
  DB existe (integridad), pero el módulo valida el Objective vía la interfaz
  pública de `okrs` antes de vincular.

### D4 — RLS 🔒

Las cuatro tablas nuevas nacen con `ENABLE + FORCE ROW LEVEL SECURITY` y
política `FOR ALL` sobre `organization_id` en la misma migración (patrón
`member_tenant_all`). `team_member` y `project_objective` llevan su propio
`organization_id` para no depender de joins en la política. Unicidad:
`(team_id, member_id)` y `(project_id, objective_id)`.

### D5 — Validaciones de dominio

- `teamName`: no vacío (trim). `description` opcional.
- `capacityPercent`: entero en [0, 100] (el overload surge de la suma entre
  Teams, no de una asignación individual > 100).

## Nota de sync (cierre)

Igual que en `strategy-okrs-core`: las specs principales están seeded con el
estado final; al cerrar, el sync es merge manual que preserva lo fuera del
slice (reflejo en executive-dashboard, etc.).

## Riesgos

- 🔒 Tenancy: tests de aislamiento de integración para las cuatro tablas.
- Cross-módulo: la evaluación de alineamiento usa `listObjectives` con el actor
  real, así hereda su visibilidad (drafts propios incluidos para Dirección); el
  riesgo de KR sin Project se evalúa solo sobre publicados.
- Migración aditiva (solo CREATE): sin riesgo destructivo.
