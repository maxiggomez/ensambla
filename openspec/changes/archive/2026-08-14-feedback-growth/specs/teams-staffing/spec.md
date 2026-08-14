## ADDED Requirements

### Requirement: Project lifecycle for growth evidence

The system SHALL create each Project in the Active state, SHALL allow Dirección or Líder to
move an Active Project to Closed, SHALL reject repeated closure, and SHALL expose Project
identity and state through the `teams-staffing` public application contract within the
actor's Organization.

#### Scenario: Close an active project

- **GIVEN** an Active Project and an actor allowed to manage Projects
- **WHEN** the actor closes the Project
- **THEN** its state becomes Closed

#### Scenario: Reject repeated project closure

- **GIVEN** a Project already in the Closed state
- **WHEN** an actor attempts to close it again
- **THEN** the system rejects the transition and preserves Closed

#### Scenario: Project context remains tenant scoped

- **GIVEN** Projects in two different Organizations
- **WHEN** a Member resolves Project context through the public contract
- **THEN** only Projects in that Member's Organization are returned
