## MODIFIED Requirements

### Requirement: Role-based navigation

The system SHALL restrict the visible navigation sections and their contents to what the
user's role allows: Dirección sees all sections; Líder sees the sections scoped to their
Team; Colaborador sees the shared sections plus Equipos & Proyectos and Skills & Staffing
as read-only entries in their scope, and never the management-only sections. Navigation
SHALL use the existing permission rules of `identity-org`, not new policy.

#### Scenario: Dirección sees all sections

- GIVEN a member with the Dirección role
- WHEN they open the app shell
- THEN all navigation sections are visible

#### Scenario: Colaborador sees only their scope

- GIVEN a member with the Colaborador role
- WHEN they open the app shell
- THEN sections outside their scope are not shown

#### Scenario: Colaborador finds read-only Teams and Skills sections

- GIVEN a member with the Colaborador role
- WHEN they open the app shell
- THEN Equipos & Proyectos and Skills & Staffing are listed
- AND Miembros is not listed
- AND opening either read-only section shows their content without management controls