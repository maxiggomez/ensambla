# teams-staffing (delta)

Delta de la capability `teams-staffing` para el change `teams-staffing-ui`.

## ADDED Requirements

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