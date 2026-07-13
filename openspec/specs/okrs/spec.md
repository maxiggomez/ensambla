# okrs Specification

## Purpose

Gestionar el ciclo de vida de los objetivos y sus key results: definición en
cascada (Company / Area / Team / Person), key results con métricas tipadas,
check-ins con cadencia configurable, alineamiento hacia la North Star y cierre de
ciclo. El avance siempre se deriva de los datos, nunca se edita a mano.

Depende de: `identity-org` (roles, tenancy), `strategy-northstar` (North Star y
pilares), y del ADR de valores tipados (`Measurement`).

## Requirements

### Requirement: Objective creation and levels

The system SHALL allow creating an Objective at Company, Area, Team or Person
level, each with an assigned owner, and SHALL NOT allow publishing an Objective
without at least one KeyResult.

#### Scenario: Create objective with level and owner
- GIVEN a user with permission to create objectives
- WHEN they create an Objective with a level and an owner
- THEN the Objective is saved as a draft

#### Scenario: Reject publishing an objective without key results
- GIVEN an Objective in draft with no KeyResults
- WHEN the user attempts to publish it
- THEN the system rejects the action with a validation error

#### Scenario: Published objective visibility
- GIVEN a published Objective
- WHEN members open the objectives view
- THEN they see it according to their role permissions

### Requirement: Typed key results

The system SHALL support KeyResults whose measurement type is selected by the
user among Check, Percentage, Integer, Currency and Text. Numeric types (Percentage,
Integer, Currency) SHALL require a start value and a target value. Text/Milestone
type SHALL NOT require a numeric target.

#### Scenario: Numeric key result requires start and target
- GIVEN a KeyResult of type Percentage, Integer or Currency
- WHEN it is saved without a start value or a target value
- THEN the system marks it invalid and prevents publishing the objective

#### Scenario: Text key result without numeric target
- GIVEN a KeyResult of type Text
- WHEN it is saved without a numeric target
- THEN the system accepts it as valid

### Requirement: Progress roll-up

The system SHALL derive the progress of a KeyResult from its Measurement type and
the progress of an Objective from its KeyResults, and SHALL NOT allow editing the
Objective progress manually.

#### Scenario: Numeric key result recomputes progress
- GIVEN a numeric KeyResult with start and target values
- WHEN its current value is updated
- THEN the KeyResult progress and the parent Objective progress are recomputed automatically

#### Scenario: Check key result marks complete
- GIVEN a KeyResult of type Check
- WHEN it is marked as done
- THEN its progress becomes 100%
- AND the parent Objective progress is recomputed

#### Scenario: Text key result contributes by state
- GIVEN a KeyResult of type Text
- WHEN the Objective progress is computed
- THEN the Text KeyResult contributes 0% or 100% according to its state per the roll-up rule

### Requirement: Configurable check-in cadence

The system SHALL allow a Team lead to configure the check-in cadence (weekly,
biweekly or monthly) per Objective or Team, and this cadence SHALL govern reminders
and the "outdated" calculation. Weekly SHALL NOT be forced.

#### Scenario: Lead configures cadence
- GIVEN a Team lead
- WHEN they set the check-in cadence for an Objective or Team
- THEN reminders and the outdated calculation use that cadence

#### Scenario: Key result becomes outdated after configured period
- GIVEN a KeyResult under a configured cadence
- WHEN the configured period passes without a check-in
- THEN the KeyResult is marked "outdated"

### Requirement: Check-in with evidence and confidence

The system SHALL allow attaching a comment and/or evidence (link or file) to a
check-in, SHALL validate the entered value against the KeyResult type, and SHALL
flag the KeyResult "at risk" when confidence is below 5 of 10.

#### Scenario: Attach comment and evidence
- GIVEN a user recording a check-in on a KeyResult
- WHEN they add a comment and/or an evidence link or file
- THEN the comment and evidence are stored with the check-in

#### Scenario: Reject value not matching key result type
- GIVEN a check-in whose value does not match the KeyResult measurement type
- WHEN it is submitted
- THEN the system rejects it with a validation error

#### Scenario: Low confidence flags at risk
- GIVEN a check-in with confidence below 5 of 10
- WHEN it is submitted
- THEN the KeyResult is marked "at risk"
- AND it appears in the Dirección dashboard

### Requirement: Alignment cascade

The system SHALL show the alignment chain from a KeyResult up to the North Star,
and SHALL flag any Objective not linked to a higher Objective or Strategic Pillar
as "orphan".

#### Scenario: View alignment chain
- GIVEN a KeyResult linked into the cascade
- WHEN a member opens it
- THEN the chain up to the North Star is shown

#### Scenario: Orphan objective alert
- GIVEN an Objective not linked to any higher Objective or Pillar
- WHEN it is viewed
- THEN an "orphan objective" alert is shown

### Requirement: Cycle close

The system SHALL allow grading each KeyResult at the end of a cycle (achieved /
partial / not achieved), carrying a KeyResult over to the next cycle, and archiving
closed Objectives as consultable history.

#### Scenario: Grade key results at cycle end
- GIVEN an Objective at the end of its cycle
- WHEN Dirección grades each KeyResult
- THEN the grades are stored with the Objective

#### Scenario: Carry over a key result
- GIVEN a KeyResult in a closing Objective
- WHEN it is marked to carry over
- THEN it is copied into the next cycle

#### Scenario: Archive closed objective
- GIVEN a closed cycle
- WHEN the Objective is archived
- THEN it remains available as read-only history
