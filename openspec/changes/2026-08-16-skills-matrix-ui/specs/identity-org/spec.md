# identity-org (delta)

Delta de la capability `identity-org` para el change `skills-matrix-ui`.

## MODIFIED Requirements

### Requirement: Member seniority

The system SHALL allow recording an optional seniority for a Member (Junior,
SemiSenior or Senior), editable only by Dirección. Members without seniority
SHALL rank lowest in seniority-based ordering. The UI SHALL expose a
seniority control for Dirección in the skills matrix; Líder and Colaborador
SHALL NOT see it.

#### Scenario: Dirección sets a member's seniority
- GIVEN a user with the Dirección role
- WHEN they set a Member's seniority
- THEN the seniority is stored on the Member

#### Scenario: Non-Dirección cannot set seniority
- GIVEN a user with the Líder or Colaborador role
- WHEN they attempt to set a Member's seniority
- THEN the system rejects the action with a forbidden error

#### Scenario: Direction records a member's seniority from the UI
- GIVEN a Dirección member in the Skills page
- WHEN they set the seniority (Junior, SemiSenior or Senior) of a Member
- THEN the seniority is stored and available for staffing ordering

#### Scenario: Non-Direction members do not see the seniority control
- GIVEN a Líder or Colaborador member
- WHEN they open the Skills page
- THEN no seniority management control is shown