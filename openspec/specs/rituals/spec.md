# rituals Specification

## Purpose

La cadencia operativa que mantiene el sistema vivo: ceremonias, seguimiento de bloqueos y
retrospectivas. Convierte los datos en hábito.

Depende de `okrs` y `teams-staffing`. Alimenta `executive-dashboard` y `culture-enps`
(correlaciones).

## Requirements

### Requirement: Ceremony cadence

The system SHALL generate rituals according to a configured cadence (e.g. weekly,
biweekly) and SHALL mark a ritual not held on its date as "overdue".

#### Scenario: Generate rituals from cadence
- GIVEN a configured cadence
- WHEN the schedule advances
- THEN the corresponding rituals are generated

#### Scenario: Overdue ritual
- GIVEN a ritual not held on its date
- WHEN it is evaluated
- THEN it is marked "overdue"

### Requirement: Blockers

The system SHALL record a Blocker with an owner and a creation date, associate a Blocker
that stops an Objective with that Objective, and remove a resolved Blocker from the open
list counting it in the resolved metric.

#### Scenario: Record a blocker
- GIVEN an impediment
- WHEN it is recorded
- THEN it has an owner and a creation date

#### Scenario: Blocker linked to an objective
- GIVEN a Blocker stopping an Objective
- WHEN it is viewed
- THEN it appears associated with that Objective in the dashboard

#### Scenario: Resolve a blocker
- GIVEN an open Blocker
- WHEN it is resolved
- THEN it leaves the open list and counts in the resolved metric

### Requirement: Retrospectives

The system SHALL flag a learning risk when a Team goes two cycles without a retrospective.

#### Scenario: Missing retrospective
- GIVEN a Team with two cycles without a retrospective
- WHEN cadence is evaluated
- THEN a learning risk is flagged
