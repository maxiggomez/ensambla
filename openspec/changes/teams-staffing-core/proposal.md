# Proposal: teams-staffing-core

## Why

Cerrado `strategy-okrs-core`, la secuencia del README sigue con
`teams-staffing` + `skills-matrix`. Este change implementa el núcleo backend de
`teams-staffing`: Teams con membresía y capacity, y Projects vinculados a
Objectives con las alertas de alineamiento. `skills-matrix` será el change
siguiente (consume Teams y capacity de este).

## What Changes

- **Módulo nuevo `teams-staffing`**:
  - **Teams**: crear Team con nombre y descripción; asignar Members con un rol
    dentro del Team (`Lead` / `Contributor`) y un % de capacity por asignación.
  - **Capacity (derivada, nunca editada como total)**: capacity de un Team =
    suma de los % de sus asignaciones; la de una persona se reparte entre sus
    Teams; persona o Team con > 100% ⇒ flag `overloaded`.
  - **Projects ↔ Objectives**: crear Project y vincularlo a uno o más
    Objectives; alerta "project without OKR" para Projects sin vínculo; riesgo
    de desalineamiento para KeyResults de Objectives publicados sin ningún
    Project que los mueva (lectura de `okrs` solo vía su `application/`).
  - **Permisos MVP**: Dirección administra todo; Líder administra los Teams
    donde es `Lead`; Colaborador solo lectura.
- **DB + RLS 🔒 (ADR-0003)**: tablas `team`, `team_member`, `project`,
  `project_objective` tenant-scoped con política RLS en la misma migración.

## Out of scope (slices posteriores)

`skills-matrix` completa (competencias, staffing inteligente, gaps/bus factor),
reflejo en `executive-dashboard`, edición/baja de Teams y Projects, y toda la UI.

## Impact

- Specs afectadas: `teams-staffing` (delta con el subconjunto implementado).
- Código: `src/modules/teams-staffing/` (nuevo), `prisma/schema.prisma` +
  migración. `okrs` solo se consume por su interfaz pública existente.
- Áreas 🔒: multi-tenancy/RLS, migración de DB, límites de módulos con `okrs`.
