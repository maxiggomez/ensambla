## MODIFIED Requirements

### Requirement: Create hypothesis

The system SHALL require each hypothesis to be linked to a KeyResult visible to the
acting Member in the same Organization, SHALL record non-empty belief and expected-outcome
fields that render as “We believe X → we expect Y”, and SHALL retain the linked Objective
context.

#### Scenario: Hypothesis requires a visible KeyResult

- **GIVEN** an Organization Member creating a hypothesis
- **WHEN** no KeyResult is supplied or the KeyResult is not visible to that Member
- **THEN** the system rejects the hypothesis

#### Scenario: Hypothesis uses the structured format

- **GIVEN** a visible KeyResult and non-empty belief and expected outcome
- **WHEN** the hypothesis is created
- **THEN** the system stores the two fields and presents them as “We believe X → we expect Y”
- **AND** retains links to the KeyResult and its Objective

### Requirement: Experiment lifecycle

The system SHALL move an experiment only through Hypothesis → Building → Measuring →
Learned, SHALL reject skipped, repeated, backward, or stale transitions, and SHALL require
a valid shared typed Measurement and a cutoff date before entering Measuring. The system
SHALL present active experiments grouped by their current lifecycle state.

#### Scenario: Advance through states

- **GIVEN** an experiment in a lifecycle state before Learned
- **WHEN** it advances to the immediately following state with the required data
- **THEN** the new state is persisted

#### Scenario: Reject an invalid transition

- **GIVEN** an experiment in a known lifecycle state
- **WHEN** a Member attempts to skip, repeat, reverse, or apply a stale transition
- **THEN** the system rejects the transition and preserves the current state

#### Scenario: Measuring requires metric and cutoff

- **GIVEN** an experiment in Building
- **WHEN** a Member attempts to enter Measuring without both a valid shared Measurement and a cutoff date
- **THEN** the system rejects the transition

#### Scenario: Board reflects lifecycle state

- **GIVEN** active experiments in different lifecycle states
- **WHEN** a Member opens the Motor Lean board
- **THEN** each experiment is shown in the column matching its persisted state

### Requirement: Close and learning

The system SHALL NOT move an experiment to Learned without non-empty Believed, Tested,
and Learned statements plus a persevere or pivot decision. It SHALL create one structured
Learning for a successfully closed experiment and SHALL keep that Learning consultable in
the Organization's library with its KeyResult and Objective links.

#### Scenario: Cannot close without structured learning and decision

- **GIVEN** an experiment in Measuring
- **WHEN** any learning statement or the persevere/pivot decision is missing
- **THEN** the system rejects closing and keeps the experiment in Measuring

#### Scenario: Structured learning

- **GIVEN** an experiment in Measuring and complete Believed, Tested, and Learned statements
- **WHEN** a Member closes it with a persevere or pivot decision
- **THEN** the experiment becomes Learned
- **AND** exactly one Learning is stored as Believed / Tested / Learned / Decision

#### Scenario: Learnings library

- **GIVEN** a learned experiment
- **WHEN** a Member browses the learning library
- **THEN** its structured Learning is consultable with links to its KeyResult and Objective

## ADDED Requirements

### Requirement: Lean experiment tenant isolation

The system SHALL store and access each Hypothesis, Experiment, and Learning only within
its Organization and SHALL prevent cross-Organization references to KeyResults or
Objectives.

#### Scenario: Cross-Organization experiment data is isolated

- **GIVEN** Members and OKR data in two different Organizations
- **WHEN** either Member creates, reads, or transitions Lean experiment data
- **THEN** they can operate only on records and OKR links belonging to their Organization
