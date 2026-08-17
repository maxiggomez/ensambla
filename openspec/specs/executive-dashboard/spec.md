# executive-dashboard Specification

## Purpose

La vista consolidada que "emerge" de las demás capabilities: una señal de cada capa
(OKRs, equipos, clima, aprendizaje), riesgos de desalineamiento automáticos y vistas por rol.

Depende de: `okrs`, `teams-staffing`, `rituals`, `culture-enps`, `lean-experiments`,
`skills-matrix`.
## Requirements
### Requirement: Consolidated view

The system SHALL recompute a Dirección dashboard from current tenant data on every request and
show: the arithmetic mean of published Objectives' derived progress; healthy and total Teams,
where a Team is healthy only when it is not over capacity and not at retrospective risk; the
latest culture/eNPS aggregate or its protected minimum-N state; and the number of Learnings from
the trailing 30 days with its change against the preceding 30 days. Empty source contexts SHALL
be represented explicitly and SHALL NOT be converted into fabricated values.

#### Scenario: Show consolidated view

- **GIVEN** a Dirección member whose Organization has published Objectives, Teams, a visible Pulse result, and Learnings
- **WHEN** they open the dashboard
- **THEN** they see global derived OKR progress, healthy and total Teams, the latest aggregate eNPS, and trailing-30-day learning velocity

#### Scenario: Widget reflects context change

- **GIVEN** a Dirección member has already viewed the dashboard
- **WHEN** source data changes in OKRs, Team capacity, culture/eNPS, or Learnings and the dashboard is requested again
- **THEN** the corresponding widget is recomputed from the changed source data

#### Scenario: Protect a suppressed eNPS result

- **GIVEN** the latest Pulse has fewer responses than the Organization minimum N
- **WHEN** an authorized member opens a dashboard that includes that Pulse scope
- **THEN** the culture widget reports a protected result and minimum N
- **AND** it does not expose a score, an individual response, or response identity

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

### Requirement: Role-based views

The system SHALL derive dashboard scope from the authenticated Member. Dirección SHALL receive
the Organization view; a Líder SHALL receive only Teams where they have the Lead assignment,
those Teams' objectives, safe culture aggregates and risks with suggested actions; and a
Colaborador SHALL receive only objectives they own, their derived load, participant-safe
Feedback summary, GrowthPlan, and pending Pulses. Role projections SHALL NOT include another
Team's scoped signals or another Member's private Feedback.

#### Scenario: Líder view

- **GIVEN** a Líder is Lead of one Team and is not Lead of another Team in the same Organization
- **WHEN** they open the dashboard
- **THEN** they see metrics, risks, and suggested actions for the Team they lead
- **AND** they do not receive the other Team's scoped metrics or risks

#### Scenario: Colaborador view

- **GIVEN** a Colaborador owns objectives and has Team load, private Feedback, a GrowthPlan, and a pending Pulse
- **WHEN** they open the dashboard
- **THEN** they see their objectives, derived load, participant-safe Feedback summary, GrowthPlan, and pending Pulse work

#### Scenario: Keep private role data out of broader views

- **GIVEN** Feedback content belongs to another Member in the same Organization
- **WHEN** Dirección or a Líder opens their dashboard
- **THEN** the dashboard does not include that Feedback body or participant-level activity

### Requirement: Tenant-safe dashboard projection

The system SHALL obtain every source signal through the source module's public application
interface under the authenticated actor's tenant context. Dashboard metrics, group descriptors,
and risks SHALL contain no records derived from another Organization, even when foreign IDs are
supplied to an aggregate input.

#### Scenario: Isolate dashboard data by Organization

- **GIVEN** equivalent dashboard source records exist in two Organizations
- **WHEN** a member of one Organization requests their dashboard
- **THEN** every metric, role-scoped item, and risk is derived only from their Organization

### Requirement: Privacy-safe Feedback health

The system SHALL evaluate group Feedback health through an aggregate application contract that
returns only group identifier, member count, and completed Feedback count since a requested
boundary. The contract SHALL validate supplied members against the actor's Organization and
SHALL NOT return Feedback bodies, classifications, authors, recipients, prompts, or request
content.

#### Scenario: Aggregate Feedback without private content

- **GIVEN** a Team's members have private Feedback inside the requested activity window
- **WHEN** dashboard Feedback health is requested for that Team
- **THEN** the result contains only the Team identifier, member count, and completed Feedback count
- **AND** no private Feedback field or participant-level activity is returned

