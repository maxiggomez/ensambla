# lean-experiments Specification

## Purpose

El motor Lean: hipótesis → experimento → medición → aprendizaje validado, atado a los
OKRs. Es lo que diferencia a Ensambla de "otro software de OKRs".

Depende de `okrs`. Reutiliza `Measurement` (ADR-0004). Alimenta `strategy-northstar`
(el aprendizaje vuelve a la estrategia) y `executive-dashboard`.

## Requirements

### Requirement: Create hypothesis

The system SHALL require a hypothesis to be linked to a KeyResult and recorded in the
form "We believe X → we expect Y".

#### Scenario: Hypothesis linked to a key result
- GIVEN a new hypothesis
- WHEN it is created without a linked KeyResult
- THEN the system rejects it

#### Scenario: Hypothesis format
- GIVEN a hypothesis
- WHEN it is recorded
- THEN it uses the form "We believe X → we expect Y"

### Requirement: Experiment lifecycle

The system SHALL move an experiment through the states Hypothesis → Building → Measuring →
Learned, and an experiment in "Measuring" SHALL have a typed Measurement and a cutoff date.

#### Scenario: Advance through states
- GIVEN an experiment
- WHEN it advances
- THEN it moves through Hypothesis → Building → Measuring → Learned

#### Scenario: Measuring requires metric and cutoff
- GIVEN an experiment in the Measuring state
- WHEN it is validated
- THEN it has a typed Measurement and a cutoff date

### Requirement: Close and learning

The system SHALL NOT allow closing an experiment without recording a learning and a
decision (persevere / pivot), SHALL store the learning as Believed / Tested / Learned /
Decision, and SHALL keep an archived learning consultable in the learnings library linked
to its KeyResult and Objective.

#### Scenario: Cannot close without decision
- GIVEN an experiment being closed
- WHEN a learning or a decision is missing
- THEN the system prevents closing it

#### Scenario: Structured learning
- GIVEN a closed experiment
- WHEN the learning is recorded
- THEN it uses the format Believed / Tested / Learned / Decision

#### Scenario: Learnings library
- GIVEN an archived learning
- WHEN the library is browsed
- THEN it is consultable and linked to its KeyResult and Objective
