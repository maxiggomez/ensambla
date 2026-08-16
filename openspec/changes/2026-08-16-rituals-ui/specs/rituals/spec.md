# rituals (delta)

Delta de la capability `rituals` para el change `rituals-ui`.

## ADDED Requirements

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