# teams-staffing (delta)

Delta de la capability `teams-staffing` para el change `teams-staffing-core`.
Cubre Teams + membership + capacity y Projects ↔ Objectives con alertas;
el reflejo en `executive-dashboard` y la UI quedan para slices posteriores.

## ADDED Requirements

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
"overloaded". Totals SHALL always be derived, never stored nor edited.

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
