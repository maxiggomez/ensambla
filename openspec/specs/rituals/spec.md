# rituals Specification

## Purpose

La cadencia operativa que mantiene el sistema vivo: ceremonias, seguimiento de bloqueos y
retrospectivas. Convierte los datos en hábito.

Depende de `okrs` y `teams-staffing`. Alimenta `executive-dashboard` y `culture-enps`
(correlaciones).

## Requirements

### Requirement: Ceremony cadence

The system SHALL allow defining a recurring ceremony for a Team within an
Organization with a name and a configured cadence (weekly, biweekly), SHALL
generate the ceremony occurrences according to that cadence when the schedule
advances, and SHALL mark a ceremony occurrence not held on its scheduled date as
"overdue". Reads issued within the same tenant transaction SHALL execute without
overlapping queries on its database client.

#### Scenario: Generate rituals from cadence
- GIVEN a ceremony with a configured cadence
- WHEN the schedule advances
- THEN the corresponding ritual occurrences are generated with their scheduled dates

#### Scenario: Overdue ritual
- GIVEN a ritual occurrence not held on its scheduled date
- WHEN it is evaluated
- THEN it is marked "overdue"

#### Scenario: Hold a ritual
- GIVEN a ritual occurrence that was held
- WHEN it is recorded as held
- THEN it is marked "held"

#### Scenario: Rituals belong to a team of an organization
- GIVEN a ceremony defined for a Team of an Organization
- WHEN it is stored
- THEN it is stored under that Organization and Team

#### Scenario: Ritual list transaction reads are serialized
- GIVEN a member listing rituals inside their tenant context
- WHEN rituals and their occurrences are loaded
- THEN the ritual query completes before the occurrence query starts on that transaction
- AND the composed ritual list remains unchanged

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

The system SHALL record a retrospective per Team and SHALL flag a learning risk
when a Team goes two cycles without a retrospective.

#### Scenario: Record a retrospective
- GIVEN a Team that held a retrospective
- WHEN it is recorded
- THEN it is stored with the Team and its date

#### Scenario: Missing retrospective
- GIVEN a Team with two cycles without a retrospective
- WHEN cadence is evaluated
- THEN a learning risk is flagged

### Requirement: Tenant isolation

The system SHALL isolate all rituals data per Organization.

#### Scenario: Rituals data is tenant-isolated
- GIVEN two Organizations each with their own ceremonies, blockers and retrospectives
- WHEN a request is scoped to one Organization
- THEN the other Organization's rituals data is not accessible
