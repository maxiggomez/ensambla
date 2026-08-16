# teams-staffing Specification

## Purpose

Teams (con nombre y descripción), personas y proyectos vinculados a OKRs, más la
capacidad/carga. Aquí vive el diferencial de "quién trabaja en qué y hacia qué objetivo".

Depende de `identity-org` y `okrs`. Alimenta `executive-dashboard` y `skills-matrix`.

## Requirements

### Requirement: Team creation and membership

The system SHALL allow creating a Team with a name and a description, assigning
Members to it with a role within the Team (Lead or Contributor) and a capacity
percentage, and splitting a person's capacity across the Teams they belong to.
Team administration SHALL respect the role policy: Dirección and Líder can
create Teams; assignments are managed by Dirección or by a Líder who is Lead of
that Team; Colaborador is read-only.

#### Scenario: Create a team with name and description
- GIVEN a user with the Dirección or Líder role
- WHEN they create a Team with a name and a description
- THEN the Team is stored with that name and description

#### Scenario: Colaborador cannot create a team
- GIVEN a user with the Colaborador role
- WHEN they attempt to create a Team
- THEN the system rejects the action with a forbidden error

#### Scenario: Assign people to a team
- GIVEN a Team
- WHEN a Member is assigned with a role within the Team and a capacity percentage
- THEN they become a member of that Team with that role and capacity

#### Scenario: Capacity split across teams
- GIVEN a person assigned to several Teams with capacity percentages
- WHEN their load is computed
- THEN it equals the sum of their capacity percentages across those Teams

#### Scenario: Teams are tenant-isolated
- GIVEN two Organizations each with their own Teams and assignments
- WHEN a request is scoped to one Organization
- THEN the other Organization's Teams and assignments are not accessible

### Requirement: Projects linked to objectives

The system SHALL allow creating a Project and linking it to one or more
Objectives, SHALL flag a Project not linked to any Objective, and SHALL surface
a KeyResult of a published Objective with no Project moving it as a
misalignment risk.

#### Scenario: Link a project to objectives
- GIVEN a Project
- WHEN it is linked to one or more Objectives
- THEN the links are stored

#### Scenario: Project without OKR alert
- GIVEN a Project not linked to any Objective
- WHEN alignment is evaluated
- THEN a "project without OKR" alert is raised for it

#### Scenario: Key result with no project
- GIVEN a published Objective whose KeyResults have no Project linked to the Objective
- WHEN alignment is evaluated
- THEN those KeyResults appear as a misalignment risk

### Requirement: Capacity and load

The system SHALL compute a Team's capacity as the sum of its assignments'
capacity percentages, SHALL compute a person's load as the sum of their
assignments across Teams, and SHALL flag a Team or person above 100% as
"overloaded", reflected in the executive dashboard. Totals SHALL always be
derived, never stored nor edited.

#### Scenario: Compute capacity
- GIVEN people assigned to a Team with capacity percentages
- WHEN the Team's capacity is computed
- THEN it equals the sum of its assignments' percentages

#### Scenario: Overload flag
- GIVEN a Team or person whose assignments sum above 100%
- WHEN capacity is evaluated
- THEN it is flagged "overloaded"

#### Scenario: Individual assignment bounds
- GIVEN an assignment with a capacity percentage outside 0 to 100
- WHEN it is saved
- THEN the system rejects it with a validation error

### Requirement: Project lifecycle for growth evidence

The system SHALL create each Project in the Active state, SHALL allow Dirección or Líder to
move an Active Project to Closed, SHALL reject repeated closure, and SHALL expose Project
identity and state through the `teams-staffing` public application contract within the
actor's Organization.

#### Scenario: Close an active project

- **GIVEN** an Active Project and an actor allowed to manage Projects
- **WHEN** the actor closes the Project
- **THEN** its state becomes Closed

#### Scenario: Reject repeated project closure

- **GIVEN** a Project already in the Closed state
- **WHEN** an actor attempts to close it again
- **THEN** the system rejects the transition and preserves Closed

#### Scenario: Project context remains tenant scoped

- **GIVEN** Projects in two different Organizations
- **WHEN** a Member resolves Project context through the public contract
- **THEN** only Projects in that Member's Organization are returned

### Requirement: Teams UI

The system SHALL expose Team management in the application UI: a list of Teams
showing each Team's members with their Team role and capacity percentage plus
the derived Team capacity and its overload flag, a form to create (and edit) a
Team with a name and a description, and a form to assign a Member with a Team
role (Lead or Contributor) and a capacity percentage. The UI SHALL follow the
existing role policy: Dirección and Líder create Teams; assignments are managed
by Dirección or by a Líder who is Lead of that Team; Colaborador SHALL see
Teams and their members read-only without management controls.

#### Scenario: Direction creates a team from the UI
- GIVEN a Dirección member in the Teams page
- WHEN they submit the team creation form with a name and a description
- THEN the Team appears in the Teams list with zero members

#### Scenario: A Lead assigns a contributor with capacity
- GIVEN a Team where the actor is the Lead
- WHEN they assign a Member with the Contributor role and a capacity percentage
- THEN the assignment appears in the Team's member list with its capacity percentage

#### Scenario: Colaborador sees teams read-only
- GIVEN a Colaborador member
- WHEN they open Equipos & Proyectos
- THEN Teams and their members are visible without management controls

### Requirement: Projects and alignment UI

The system SHALL expose Project management in the application UI: a list of
Projects with their state, a form to create a Project, a form to link a Project
to one or more Objectives, and a control to close an Active Project restricted
to Dirección and Líder. The UI SHALL also show the derived alignment alerts: a
Project not linked to any Objective and the KeyResults of published Objectives
with no Project moving them.

#### Scenario: Direction creates and links a project
- GIVEN a Dirección member and an Objective
- WHEN they create a Project and link it to that Objective
- THEN the Project appears as Active and linked to the Objective

#### Scenario: Close an active project from the UI
- GIVEN an Active Project and a member allowed to manage Projects
- WHEN they close it from the UI
- THEN its state changes to Closed in the Project list

#### Scenario: Alignment alerts are shown
- GIVEN a published Objective whose KeyResults have no linked Project and a
  Project with no linked Objectives
- WHEN Equipos & Proyectos is opened
- THEN both misalignment alerts are shown
