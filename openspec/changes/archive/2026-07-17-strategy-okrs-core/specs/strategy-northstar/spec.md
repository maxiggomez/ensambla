# strategy-northstar (delta)

Delta de la capability `strategy-northstar` para el change `strategy-okrs-core`.
Cubre solo la definición de la North Star; palancas (levers), pilares y
visión/misión/valores quedan para slices posteriores.

## ADDED Requirements

### Requirement: North Star metric

The system SHALL define the North Star as a typed Measurement (ADR-0004) with a
current value and a target, exactly one per Organization, and SHALL allow only
Dirección to define or redefine it. Every member of the Organization SHALL be
able to read it.

#### Scenario: Define the North Star
- GIVEN a user with the Dirección role and no North Star defined
- WHEN they define the North Star with a name and a typed Measurement
- THEN it is stored as a typed Measurement with current value and target
- AND any member of the Organization can read it

#### Scenario: Redefining replaces the single North Star
- GIVEN an Organization with a North Star already defined
- WHEN Dirección defines the North Star again
- THEN the previous definition is replaced
- AND the Organization still has exactly one North Star

#### Scenario: Non-Dirección cannot define the North Star
- GIVEN a user with the Líder or Colaborador role
- WHEN they attempt to define the North Star
- THEN the system rejects the action with a forbidden error

#### Scenario: North Star is tenant-isolated
- GIVEN two Organizations each with their own North Star
- WHEN a request is scoped to one Organization
- THEN the other Organization's North Star is not accessible
