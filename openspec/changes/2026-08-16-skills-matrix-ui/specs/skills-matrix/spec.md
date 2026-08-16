# skills-matrix (delta)

Delta de la capability `skills-matrix` para el change `skills-matrix-ui`.

## ADDED Requirements

### Requirement: Competency matrix UI

The system SHALL expose the competency matrix in the application UI: the
catalog of Skills with controls to define and rename a Skill, a matrix of
people × skills with their levels filterable by Team, and a control to record a
Competency level (0 to 4) for a Member and Skill. Defining skills and setting
competencies SHALL be restricted to Dirección and Líder in the UI, and the
matrix SHALL remain readable for every role.

#### Scenario: Direction defines a skill and records a competency
- GIVEN a Dirección member in the Skills page
- WHEN they define a Skill and set a level from 0 to 4 for a Member
- THEN the Skill appears in the catalog and the level appears in that Member's matrix row

#### Scenario: The matrix is filtered by team
- GIVEN a matrix with Members from more than one Team
- WHEN a Team filter is selected
- THEN only that Team's Members remain in the matrix

#### Scenario: A Líder records a competency
- GIVEN a Líder member
- WHEN they set a competency level for a Member and Skill
- THEN the level is stored

#### Scenario: A Colaborador sees the matrix read-only
- GIVEN a Colaborador member
- WHEN they open the matrix
- THEN levels are visible without controls to define skills or set competencies

### Requirement: Staffing suggestions UI

The system SHALL expose staffing suggestions in the application UI: choosing a
staffing need (a Project or a KeyResult) SHALL show the people suggested for it
ordered by skill level, then seniority, then availability, flagging a suggested
person at or above 100% load as "no margin" while still suggesting them. The UI
SHALL also expose registering a required Skill on the chosen need.

#### Scenario: Direction requests staffing suggestions for a need
- GIVEN a need (Project or KeyResult) with people holding the required skills
- WHEN suggestions are requested from the UI
- THEN people are listed ordered by level, seniority and availability with the "no margin" flag

### Requirement: Skill gaps UI

The system SHALL expose the derived skill gaps in the application UI: coverage
gaps (a skill required by two or more published Objectives covered by fewer
than two people at level 3 or higher) and "bus factor" risks (a required skill
covered by exactly one person).

#### Scenario: Coverage and bus factor risks are shown
- GIVEN published Objectives and competencies producing a coverage gap and a bus factor risk
- WHEN the Skills page is opened
- THEN both alerts are shown