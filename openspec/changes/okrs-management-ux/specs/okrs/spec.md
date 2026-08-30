## ADDED Requirements

### Requirement: Objective editing

The system SHALL allow editing an existing Objective's title, level, owner, Team,
OKR cycle and higher-Objective alignment. Editing SHALL respect the same role
policy as creation (Company level requires Dirección; Area and Team require
Dirección or Líder; Person is open to any role) and SHALL preserve every existing
invariant: a Team-level Objective keeps an explicit Team, an alignment change
that would create a cycle is rejected, and an archived Objective stays read-only.
Progress remains derived by roll-up and is never editable. Every successful edit
SHALL append an `OBJECTIVE_UPDATED` event to the immutable audit trail.

#### Scenario: Owner edits objective fields
- GIVEN a `Draft` or `Published` Objective and a user with permission at its level
- WHEN they change the title, owner, cycle or alignment
- THEN the Objective is saved with the new values
- AND an `OBJECTIVE_UPDATED` audit event is recorded

#### Scenario: Reject edit that exceeds the role's level
- GIVEN a user with the Colaborador role
- WHEN they attempt to raise an Objective to Company level
- THEN the system rejects the action with a forbidden error

#### Scenario: Reject alignment edit that creates a cycle
- GIVEN two Objectives already linked A → B
- WHEN a user edits B to align it under A
- THEN the system rejects the action with a validation error

#### Scenario: Reject editing an archived objective
- GIVEN an archived Objective
- WHEN a user attempts to edit any of its fields
- THEN the system rejects the action with a read-only error

#### Scenario: Team objective keeps an explicit Team after edit
- GIVEN a Team-level Objective
- WHEN a user edits it and clears the Team association
- THEN the system rejects the action with a validation error

#### Scenario: Failed edit does not create an audit event
- GIVEN an edit that fails validation or authorization
- WHEN the mutation is attempted
- THEN no `OBJECTIVE_UPDATED` audit event is recorded

## MODIFIED Requirements

### Requirement: Cycle close

The system SHALL organize Objectives in dated OKR cycles. At the end of a cycle,
Dirección SHALL grade every KeyResult as achieved, partial or not achieved before
closing its Objective. A KeyResult MAY be carried into a destination cycle as a
new draft linked to its source.

Archiving an Objective is a reversible logical delete, never a physical delete.
Dirección MAY archive an Objective from any of the states `Draft`, `Published` or
`Closed`; the Objective then leaves the active list and remains available as
read-only history with its derived progress frozen at the moment of archival.
Dirección MAY reactivate an archived Objective, which restores it to `Draft`.
Archiving and reactivation each append an audit event.

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

#### Scenario: Archive a draft or published objective
- GIVEN a `Draft` or `Published` Objective
- WHEN Dirección archives it
- THEN the Objective moves to `Archived`, leaves the active list, and remains available as read-only history
- AND an `OBJECTIVE_ARCHIVED` audit event is recorded

#### Scenario: Archive closed objective
- GIVEN a closed cycle
- WHEN the Objective is archived
- THEN it remains available as read-only history

#### Scenario: Non-Dirección cannot archive
- GIVEN a user without the Dirección role
- WHEN they attempt to archive an Objective
- THEN the system rejects the action with a forbidden error

#### Scenario: Reactivate an archived objective
- GIVEN an archived Objective
- WHEN Dirección reactivates it
- THEN the Objective returns to `Draft` and becomes editable again
- AND an audit event is recorded

#### Scenario: Reject mutation of archived objective
- GIVEN an archived Objective
- WHEN a user attempts to edit it or record a check-in
- THEN the system rejects the action with a read-only error
