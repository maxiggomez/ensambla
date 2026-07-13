# teams-staffing Specification

## Purpose

Teams (con nombre y descripción), personas y proyectos vinculados a OKRs, más la
capacidad/carga. Aquí vive el diferencial de "quién trabaja en qué y hacia qué objetivo".

Depende de `identity-org` y `okrs`. Alimenta `executive-dashboard` y `skills-matrix`.

## Requirements

### Requirement: Team creation and membership

The system SHALL allow creating a Team with a name and a description, assigning people to
it with a role within the Team, and splitting a person's capacity across the Teams they
belong to.

#### Scenario: Create a team with name and description
- GIVEN a user with permission
- WHEN they create a Team
- THEN they can set a name and a description that represent it

#### Scenario: Assign people to a team
- GIVEN a Team
- WHEN people are assigned with a role within the Team
- THEN they become members of that Team

#### Scenario: Capacity split across teams
- GIVEN a person belonging to several Teams
- WHEN their capacity is computed
- THEN it is split across those Teams

### Requirement: Projects linked to objectives

The system SHALL allow linking a Project to one or more Objectives, SHALL flag a Project
not linked to any Objective, and SHALL surface a KeyResult with no Project moving it as a
misalignment risk.

#### Scenario: Link a project to objectives
- GIVEN a Project
- WHEN it is linked to one or more Objectives
- THEN the links are stored

#### Scenario: Project without OKR alert
- GIVEN a Project not linked to any Objective
- WHEN it is viewed
- THEN a "project without OKR" alert is shown

#### Scenario: Key result with no project
- GIVEN a KeyResult with no Project moving it
- WHEN alignment is evaluated
- THEN it appears as a misalignment risk

### Requirement: Capacity and load

The system SHALL compute a Team's capacity as the sum of its assignments and SHALL flag a
Team or person above 100% as "overloaded", reflected in the executive dashboard.

#### Scenario: Compute capacity
- GIVEN people assigned to projects
- WHEN capacity is computed
- THEN a Team's capacity equals the sum of its assignments

#### Scenario: Overload flag
- GIVEN a Team or person above 100% capacity
- WHEN capacity is evaluated
- THEN it is flagged "overloaded"
