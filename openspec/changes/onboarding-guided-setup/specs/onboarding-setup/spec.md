## MODIFIED Requirements

### Requirement: Guided setup flow

The system SHALL persist one tenant-owned setup progress record per Organization and SHALL offer
its stepped setup flow immediately after a new Organization is created and on later visits while
the progress remains pending. Only Dirección SHALL mutate setup progress. The flow SHALL allow
Dirección to save company type and industry, move backward without losing saved data, finish the
basic setup, or skip it and access an empty application that remains configurable later. Existing
Organizations created before this flow is deployed SHALL NOT be forced into onboarding.

#### Scenario: Offer setup on first entry

- **GIVEN** a newly created Organization with pending setup progress
- **WHEN** its Dirección member enters after creation or revisits onboarding
- **THEN** the stepped setup flow is offered at the last persisted step

#### Scenario: Skip setup

- **GIVEN** a Dirección member in a pending setup flow
- **WHEN** they choose to skip it
- **THEN** setup progress is marked skipped
- **AND** they access the app with an empty structure and can configure it later

#### Scenario: Go back without losing data

- **GIVEN** Dirección saved company type and industry and advanced to the review step
- **WHEN** they go back to the company-profile step
- **THEN** the previously saved company type and industry are restored

#### Scenario: Complete basic setup

- **GIVEN** Dirección is reviewing valid persisted company-profile data
- **WHEN** they finish the basic setup
- **THEN** setup progress is marked completed
- **AND** they enter the application without templates or imported records being fabricated

#### Scenario: Only Dirección mutates setup

- **GIVEN** a Líder or Colaborador in an Organization
- **WHEN** they attempt to save, advance, complete, or skip setup progress
- **THEN** the system rejects the mutation with a forbidden error

#### Scenario: Setup progress is tenant-isolated

- **GIVEN** two Organizations with different setup progress and company-profile data
- **WHEN** a Member reads or mutates setup in one Organization
- **THEN** no progress or profile data from the other Organization is accessible

#### Scenario: Existing Organizations are not forced into setup

- **GIVEN** an Organization that existed before guided setup progress was introduced
- **WHEN** the migration is deployed and a Member enters the application
- **THEN** that Organization is treated as having skipped setup
- **AND** the Member is not redirected into the new flow
