# okrs (delta)

Delta de la capability `okrs` para el change `strategy-okrs-core`. Cubre el árbol
Objective → KeyResults con Measurement tipado y el roll-up 🔒; check-ins con
cadencia/evidencia/confianza, cascada de alineamiento y cierre de ciclo quedan
para slices posteriores.

## ADDED Requirements

### Requirement: Objective creation and levels

The system SHALL allow creating an Objective at Company, Area, Team or Person
level, each with an assigned owner, and SHALL NOT allow publishing an Objective
without at least one KeyResult. Creation SHALL respect the role policy: Company
level requires Dirección; Area and Team levels require Dirección or Líder;
Person level is open to any role.

#### Scenario: Create objective with level and owner
- GIVEN a user with permission to create objectives at the chosen level
- WHEN they create an Objective with a level and an owner
- THEN the Objective is saved as a draft

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
- GIVEN a published Objective with a numeric KeyResult with start and target values
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
