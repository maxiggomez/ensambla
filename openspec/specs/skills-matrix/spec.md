# skills-matrix Specification

## Purpose

El lenguaje común que conecta personas ↔ proyectos ↔ carrera: matriz de competencias,
staffing inteligente y detección de brechas. Diferencial frente a competidores de RRHH.

Depende de `identity-org`, `teams-staffing` y `okrs`. Alimenta `feedback-growth` (carrera).

## Requirements

### Requirement: Competency matrix

The system SHALL maintain a catalog of Skills per Organization and SHALL
record a Competency as Member + Skill + Level (0 to 4), unique per pair with
upsert semantics, and SHALL show a matrix of people × skills with levels,
filterable by Team. Defining skills and setting competencies SHALL be
restricted to Dirección and Líder.

#### Scenario: Record a competency
- GIVEN a person and a skill
- WHEN a level from 0 to 4 is set
- THEN a Competency of Member + Skill + Level is stored
- AND setting it again replaces the level

#### Scenario: Reject an out-of-range level
- GIVEN a person and a skill
- WHEN a level outside 0 to 4 is set
- THEN the system rejects it with a validation error

#### Scenario: View the matrix filtered by team
- GIVEN the competency matrix
- WHEN it is opened filtered by a Team
- THEN people × skills with their levels are shown only for that Team's members

#### Scenario: Skills and competencies are tenant-isolated
- GIVEN two Organizations each with their own skills and competencies
- WHEN a request is scoped to one Organization
- THEN the other Organization's skills and competencies are not accessible

### Requirement: Intelligent staffing

The system SHALL record required Skills on a Project or a KeyResult as a need,
and SHALL suggest people for a need ordered by match — skill level first, then
seniority, then availability (100 minus the person's load) — and SHALL flag a
suggested person with load at or above 100% as "no margin" while still
suggesting them.

#### Scenario: Suggest people for a need
- GIVEN a need with required skills and people with different levels,
  seniorities and availabilities
- WHEN staffing suggestions are requested
- THEN people with some level in the required skills are suggested ordered by
  skill level, then seniority, then availability

#### Scenario: No-margin flag
- GIVEN a suggested person whose assignments sum to 100% or more
- WHEN suggestions are shown
- THEN that person is flagged "no margin" and still appears in the list

### Requirement: Skill gaps

The system SHALL raise a coverage gap alert when a skill is required by two or
more published Objectives and fewer than two people cover it (level 3 or
higher), and SHALL flag a "bus factor" risk when a required skill is covered
by exactly one person.

#### Scenario: Coverage gap alert
- GIVEN a skill required by two published Objectives with fewer than two
  people at level 3 or higher
- WHEN gaps are evaluated
- THEN a coverage gap alert is raised for that skill

#### Scenario: Bus factor risk
- GIVEN a required skill covered by exactly one person at level 3 or higher
- WHEN gaps are evaluated
- THEN a "bus factor" risk is flagged for that skill

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
