# skills-matrix (delta)

Delta de la capability `skills-matrix` para el change `skills-matrix-core`.
Cubre matriz de competencias, staffing inteligente y gaps (umbrales fijos MVP);
la UI y los umbrales configurables quedan para slices posteriores.

## ADDED Requirements

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
