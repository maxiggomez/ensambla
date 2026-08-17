## MODIFIED Requirements

### Requirement: Automatic misalignment risks

The system SHALL derive a stable prioritized risk when a published KeyResult has no Project
moving its Objective, a Team exceeds 100 percent capacity, a Team is at retrospective risk after
two cycles without a retrospective, or a non-empty Team has fewer completed Feedback items than
assigned members in the trailing 30 days. The accountable owner of a KeyResult is the required
owner of its owning Objective, which `okrs` requires to have an assigned owner, so it is always
present; the accountable-owner condition SHALL NOT add an independent trigger or a fabricated
risk. Alignment and capacity risks SHALL be critical and precede retrospective and low-feedback
attention risks; ties SHALL use a deterministic kind and subject order. Every risk SHALL include
a suggested action and SHALL disappear on the first dashboard request after its source condition
is resolved.

#### Scenario: Generate a risk alert

- **GIVEN** a published KeyResult whose Objective is moved by no Project, a Team over capacity, an overdue retro, or a group with low feedback
- **WHEN** risks are evaluated
- **THEN** a prioritized risk alert is generated

#### Scenario: Generate prioritized risk alerts

- **GIVEN** a published KeyResult without a Project moving it, an over-capacity Team, a Team at retrospective risk, and a Team with low Feedback activity
- **WHEN** dashboard risks are evaluated
- **THEN** a stable alert with a suggested action is generated for each source condition
- **AND** critical alignment and capacity alerts precede attention alerts in deterministic order

#### Scenario: Resolve a risk

- **GIVEN** a source condition produced an active dashboard risk
- **WHEN** the source condition is resolved and the dashboard is requested again
- **THEN** that risk's stable identifier is absent from the new risk list