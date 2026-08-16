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

### Requirement: Ceremony UI

The system SHALL expose ceremony management in the application UI: a form to
define a recurring ceremony for a Team with a name and a configured cadence
(weekly, biweekly), a control to advance the schedule (generating the ceremony
occurrences up to today), a per-occurrence status shown as scheduled, held or
overdue, and a control to mark an occurrence as held. Ceremony management SHALL
be restricted to Dirección and Líder; every role SHALL read the ceremony list.

#### Scenario: Direction creates a ceremony and advances the schedule
- GIVEN a Dirección member and a Team
- WHEN they create a ceremony with a cadence and advance the schedule
- THEN the ceremony appears with its occurrences and each missed one is overdue

#### Scenario: A Member marks a ceremony occurrence as held
- GIVEN a scheduled or overdue ceremony occurrence
- WHEN it is marked as held from the UI
- THEN its status becomes held

### Requirement: Blockers UI

The system SHALL expose the blocker board in the application UI: a form to
record a Blocker (Team, title, description, and an optional Objective it
blocks), the list of open Blockers with their owner and creation date, a
control to resolve an open Blocker, and the derived resolved count. Blockers
SHALL be manageable by Dirección and Líder and readable by every role.

#### Scenario: Direction records and resolves a blocker
- GIVEN a Dirección member
- WHEN they record a Blocker linked to an Objective and later resolve it
- THEN the open list no longer shows it and the resolved count increases

### Requirement: Retrospectives UI

The system SHALL expose retrospectives in the application UI: a form to record
a retrospective per Team and the derived learning-risk flags (a Team at two
cycles without a retrospective). Recording SHALL be restricted to Dirección and
Líder; the flags SHALL be visible to every role.

#### Scenario: Direction records a retrospective and the risk clears
- GIVEN a Team flagged for missing retrospectives
- WHEN a retrospective is recorded for it
- THEN the risk flag for that Team disappears

### Requirement: Tenant isolation

The system SHALL isolate all rituals data per Organization.

#### Scenario: Rituals data is tenant-isolated
- GIVEN two Organizations each with their own ceremonies, blockers and retrospectives
- WHEN a request is scoped to one Organization
- THEN the other Organization's rituals data is not accessible
