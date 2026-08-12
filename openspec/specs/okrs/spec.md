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
without at least one KeyResult. Creation SHALL respect the role policy: Company
level requires Dirección; Area and Team levels require Dirección or Líder;
Person level is open to any role.
A Team-level Objective SHALL reference its Team explicitly, and an Objective MAY
reference a higher Objective in the same Organization.

#### Scenario: Create objective with level and owner
- GIVEN a user with permission to create objectives at the chosen level
- WHEN they create an Objective with a level and an owner
- THEN the Objective is saved as a draft

#### Scenario: Create Team objective with explicit Team
- GIVEN a user with permission to create a Team-level Objective
- WHEN they create it with a Team in their Organization
- THEN the Objective is saved with that Team association

#### Scenario: Reject Team objective without Team
- GIVEN a user creating a Team-level Objective
- WHEN they omit the Team association
- THEN the system rejects the action with a validation error

#### Scenario: Reject creation above the role's level
- GIVEN a user with the Colaborador role
- WHEN they attempt to create a Company-level Objective
- THEN the system rejects the action with a forbidden error

#### Scenario: Reject publishing an objective without key results
- GIVEN an Objective in draft with no KeyResults
- WHEN the user attempts to publish it
- THEN the system rejects the action with a validation error

#### Scenario: Published objective visibility
- GIVEN a published Objective and a draft Objective owned by someone else
- WHEN a Colaborador lists the objectives
- THEN they see the published Objective
- AND they do not see the other person's draft

#### Scenario: Objectives are tenant-isolated
- GIVEN two Organizations each with their own Objectives and KeyResults
- WHEN a request is scoped to one Organization
- THEN the other Organization's Objectives and KeyResults are not accessible

### Requirement: Typed key results

The system SHALL support KeyResults whose measurement type is selected by the
user among Check, Percentage, Integer, Currency and Text. Numeric types
(Percentage, Integer, Currency) SHALL require a start value and a target value
to be valid for publishing. Text/Milestone type SHALL NOT require a numeric
target. An incomplete KeyResult MAY be saved while the Objective is a draft.

#### Scenario: Numeric key result requires start and target
- GIVEN a KeyResult of type Percentage, Integer or Currency saved without a
  start value or a target value
- WHEN the user attempts to publish the Objective
- THEN the system marks the KeyResult invalid and prevents publishing

#### Scenario: Text key result without numeric target
- GIVEN a KeyResult of type Text
- WHEN it is saved without a numeric target
- THEN the system accepts it as valid for publishing

### Requirement: Progress roll-up

The system SHALL derive the progress of a KeyResult from its Measurement type
and the progress of an Objective as the average of its KeyResults' progress,
and SHALL NOT allow editing the Objective progress manually: the progress is
never stored nor accepted as input.

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

#### Scenario: Objective progress is derived, never stored
- GIVEN a published Objective with several KeyResults
- WHEN the Objective is read
- THEN its progress equals the average of its KeyResults' progress
- AND no use case or persisted field allows setting it directly

### Requirement: Configurable check-in cadence

The system SHALL allow a Team lead to configure the check-in cadence as weekly,
biweekly or monthly per Objective or Team. Objective cadence SHALL override Team
cadence; Team cadence SHALL apply only to Objectives associated with that Team.
The effective cadence SHALL govern due reminders and the derived outdated state.
When no cadence is configured, weekly SHALL NOT be forced and no reminder or
outdated state SHALL be produced. Reads issued within the same tenant transaction
SHALL execute without overlapping queries on its database client.

#### Scenario: Lead configures cadence
- GIVEN a Team lead
- WHEN they set the check-in cadence for an Objective or Team
- THEN reminders and the outdated calculation use that cadence

#### Scenario: Objective cadence overrides Team cadence
- GIVEN a Team cadence and a different cadence configured on one of its Objectives
- WHEN reminders and outdated status are calculated for that Objective
- THEN the Objective cadence is used

#### Scenario: Key result becomes outdated after configured period
- GIVEN a KeyResult under a configured cadence
- WHEN the configured period passes without a check-in
- THEN the KeyResult is marked "outdated"

#### Scenario: No cadence does not force weekly
- GIVEN a KeyResult with no Objective or Team cadence
- WHEN a week passes without a check-in
- THEN the KeyResult is not marked outdated
- AND no check-in reminder is produced

#### Scenario: Reminder candidate transaction reads are serialized
- GIVEN a member evaluating due check-in reminders inside their tenant context
- WHEN Objectives, cadences, KeyResults and latest CheckIns are loaded
- THEN each database query completes before the next query starts on that transaction
- AND cadence precedence, reminders and outdated derivation remain unchanged

### Requirement: Check-in with evidence and confidence

The system SHALL allow recording an append-only CheckIn on a KeyResult with a
typed value, confidence from 0 through 10, and an optional comment. A CheckIn MAY
contain link evidence or file evidence, which SHALL be stored with it. The value
SHALL match the KeyResult Measurement type. The KeyResult SHALL be derived as
"at risk" when the latest confidence is below 5 of 10.

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

#### Scenario: Latest confidence clears risk
- GIVEN an at-risk KeyResult
- WHEN a newer check-in is submitted with confidence of at least 5
- THEN the KeyResult is no longer marked "at risk"

### Requirement: Alignment cascade

The system SHALL allow linking an Objective to a higher Objective in the same
Organization and SHALL show the alignment chain from a KeyResult through parent
Objectives or its Strategic Pillar up to the North Star. It SHALL reject cyclic
Objective links and SHALL derive any Objective with neither a higher Objective
nor a Strategic Pillar link as "orphan".

#### Scenario: View alignment chain
- GIVEN a KeyResult linked into the cascade
- WHEN a member opens it
- THEN the chain up to the North Star is shown

#### Scenario: Orphan objective alert
- GIVEN an Objective not linked to any higher Objective or Pillar
- WHEN it is viewed
- THEN an "orphan objective" alert is shown

#### Scenario: Reject cyclic objective alignment
- GIVEN two Objectives in the same Organization
- WHEN a link would make either Objective its own ancestor
- THEN the system rejects the link with a validation error

### Requirement: Cycle close

The system SHALL organize Objectives in dated OKR cycles. At the end of a cycle,
Dirección SHALL grade every KeyResult as achieved, partial or not achieved before
closing its Objective. A KeyResult MAY be carried into a destination cycle as a
new draft linked to its source. A closed Objective MAY be archived and SHALL then
remain available as read-only history.

#### Scenario: Grade key results at cycle end
- GIVEN an Objective at the end of its cycle
- WHEN Dirección grades each KeyResult
- THEN the grades are stored with the Objective

#### Scenario: Reject close with ungraded key results
- GIVEN an Objective with one or more ungraded KeyResults
- WHEN Dirección attempts to close it
- THEN the system rejects the action with a validation error

#### Scenario: Carry over a key result
- GIVEN a KeyResult in a closing Objective
- WHEN it is marked to carry over into a destination cycle
- THEN it is copied as a new draft KeyResult linked to its source
- AND the historical KeyResult remains unchanged

#### Scenario: Archive closed objective
- GIVEN a closed cycle
- WHEN the Objective is archived
- THEN it remains available as read-only history

#### Scenario: Reject mutation of archived objective
- GIVEN an archived Objective
- WHEN a user attempts to edit it or record a check-in
- THEN the system rejects the action with a read-only error

### Requirement: Immutable OKR audit trail

The system SHALL record every mutation to Objectives, KeyResults, check-ins,
cadence, alignment, grading, carry-over and archival as an immutable audit event
in the same transaction. Audit events SHALL be tenant-isolated and SHALL expose
their history only to Dirección.

#### Scenario: Mutation creates audit event
- GIVEN an authorized member mutating an OKR aggregate
- WHEN the mutation succeeds
- THEN an audit event records the actor, action, entity and timestamp

#### Scenario: Failed mutation does not create audit event
- GIVEN an OKR mutation that fails validation or authorization
- WHEN the transaction is rolled back
- THEN no audit event is recorded

#### Scenario: Audit events are immutable and tenant-isolated
- GIVEN audit events in two Organizations
- WHEN Dirección reads their Organization audit history
- THEN only their Organization events are returned
- AND no application operation can update or delete an event
