# identity-org (delta)

Delta de `identity-org` para el change `skills-matrix-core`: seniority del
Member (decisión de producto tomada en el gate del change), insumo del match
de staffing.

## ADDED Requirements

### Requirement: Member seniority

The system SHALL allow recording an optional seniority for a Member (Junior,
SemiSenior or Senior), editable only by Dirección. Members without seniority
SHALL rank lowest in seniority-based ordering.

#### Scenario: Dirección sets a member's seniority
- GIVEN a user with the Dirección role
- WHEN they set a Member's seniority
- THEN the seniority is stored on the Member

#### Scenario: Non-Dirección cannot set seniority
- GIVEN a user with the Líder or Colaborador role
- WHEN they attempt to set a Member's seniority
- THEN the system rejects the action with a forbidden error
