# executive-dashboard Specification

## Purpose

La vista consolidada que "emerge" de las demás capabilities: una señal de cada capa
(OKRs, equipos, clima, aprendizaje), riesgos de desalineamiento automáticos y vistas por rol.

Depende de: `okrs`, `teams-staffing`, `rituals`, `culture-enps`, `lean-experiments`,
`skills-matrix`.

## Requirements

### Requirement: Consolidated view

The system SHALL show, in the Dirección dashboard, the global OKR progress, team health,
culture/eNPS and learning velocity, and reflect a change in any context in the
corresponding widget.

#### Scenario: Show consolidated view
- GIVEN a user with the Dirección role
- WHEN they open the dashboard
- THEN global OKR progress, team health, culture/eNPS and learning velocity are shown

#### Scenario: Widget reflects context change
- GIVEN a change of data in any context
- WHEN the dashboard is viewed
- THEN the corresponding widget reflects it

### Requirement: Automatic misalignment risks

The system SHALL generate a prioritized risk alert when a KeyResult has no project/owner,
a Team exceeds capacity, a retro is overdue, or a group has low feedback, and remove a
risk once resolved.

#### Scenario: Generate a risk alert
- GIVEN a KeyResult without project/owner, a Team over capacity, an overdue retro, or a group with low feedback
- WHEN risks are evaluated
- THEN a prioritized risk alert is generated

#### Scenario: Resolve a risk
- GIVEN an active risk
- WHEN it is resolved
- THEN it disappears from the list

### Requirement: Role-based views

The system SHALL show a Líder the same data scoped to their Team and translated into
suggested actions, and show a Colaborador their objectives, load, feedback, growth and pulse.

#### Scenario: Líder view
- GIVEN a member with the Líder role
- WHEN they open their view
- THEN they see data scoped to their Team translated into suggested actions

#### Scenario: Colaborador view
- GIVEN a member with the Colaborador role
- WHEN they open their view
- THEN they see their objectives, load, feedback, growth and pulse
