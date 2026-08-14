# feedback-growth Specification

## Purpose

Feedback entre pares y de manager, reconocimientos, y planes de carrera conectados a
skills y proyectos reales. La carrera atada al trabajo cotidiano, no a un formulario anual.

Depende de `identity-org`, `teams-staffing` y `skills-matrix`.

## Requirements

### Requirement: Give and request feedback

The system SHALL allow an authenticated Organization Member to give private Feedback to
another Member in the same Organization, optionally linked to a Project and/or a current
Organization Value, SHALL classify it as a strength or an area to improve, and SHALL allow
a Member to request Feedback from a specific Member. A request SHALL remain pending in the
requested Member's inbox until Feedback fulfills it. Feedback SHALL be visible only to its
author and recipient.

#### Scenario: Give linked feedback

- **GIVEN** a Member giving Feedback to another Member in the same Organization
- **WHEN** they link it to a visible Project and/or a current Organization Value
- **THEN** the Feedback is stored with those links

#### Scenario: Request feedback

- **GIVEN** a Member requesting Feedback
- **WHEN** they request it from a specific Member in the same Organization
- **THEN** a pending request reaches that Member's inbox

#### Scenario: Classify feedback

- **GIVEN** Feedback marking a strength or an area to improve
- **WHEN** it is saved
- **THEN** it is stored with that classification

#### Scenario: Fulfill a feedback request

- **GIVEN** a pending Feedback request in a Member's inbox
- **WHEN** that Member gives Feedback through the request
- **THEN** the Feedback is linked to the request
- **AND** the request is no longer pending

#### Scenario: Keep feedback private

- **GIVEN** private Feedback between an author and a recipient
- **WHEN** another Member browses Feedback
- **THEN** that Feedback is not visible to the other Member

### Requirement: Kudos

The system SHALL allow an authenticated Organization Member to give a public Kudo to
another Member in the same Organization, SHALL require a current Organization Value, SHALL
allow an optional link to an Objective or KeyResult visible to the actor, and SHALL show the
Kudo in the Organization activity feed with its retained context.

#### Scenario: Give a kudo tied to a value

- **GIVEN** a Member giving a Kudo to another Member in the same Organization
- **WHEN** they associate it with a current Organization Value
- **THEN** the Kudo is stored with that Value

#### Scenario: Show an objective-linked kudo in activity

- **GIVEN** a Kudo associated with a visible Objective or KeyResult
- **WHEN** a Member browses Organization activity
- **THEN** the Kudo appears with the recipient and Objective or KeyResult context

### Requirement: Growth plan

The system SHALL allow a Member to define their GrowthPlan with a next milestone and target
levels from zero to four for specific Skills in the Organization competency matrix. It SHALL
derive each skill gap and overall progress from current Competency levels, SHALL allow
received Feedback and closed Projects in the same Organization to be attached as evidence,
and SHALL NOT allow evidence from another Member's Feedback or an active Project.

#### Scenario: Define a growth plan

- **GIVEN** a Member's GrowthPlan
- **WHEN** it is defined
- **THEN** it targets specific Skill levels from the competency matrix

#### Scenario: View plan progress

- **GIVEN** a GrowthPlan with current Competencies and target Skill levels
- **WHEN** its owner opens it
- **THEN** the next milestone and each Skill gap are shown
- **AND** overall progress is derived from current versus target levels

#### Scenario: Feed progress with feedback

- **GIVEN** Feedback received by the GrowthPlan owner
- **WHEN** the owner attaches it as plan evidence
- **THEN** it appears in the plan's evidence without changing the stored Competency levels

#### Scenario: Feed progress with a closed project

- **GIVEN** a Project in the Closed state
- **WHEN** a GrowthPlan owner attaches it as plan evidence
- **THEN** the closed Project appears in the plan's evidence

#### Scenario: Reject ineligible growth evidence

- **GIVEN** Feedback addressed to another Member or a Project still Active
- **WHEN** a GrowthPlan owner attempts to attach it
- **THEN** the system rejects the evidence and preserves the plan

### Requirement: Feedback and growth tenant isolation

The system SHALL store and access every FeedbackRequest, Feedback, Kudo, GrowthPlan,
GrowthTarget, and GrowthEvidence only within its Organization and SHALL prevent
cross-Organization references to Members, Projects, Values, Objectives, KeyResults, or
Skills.

#### Scenario: Cross-Organization feedback and growth data is isolated

- **GIVEN** Members and related data in two different Organizations
- **WHEN** either Member creates, reads, or links Feedback and Growth data
- **THEN** they can operate only on records and references belonging to their Organization
