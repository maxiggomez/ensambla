# feedback-growth Specification

## Purpose

Feedback entre pares y de manager, reconocimientos, y planes de carrera conectados a
skills y proyectos reales. La carrera atada al trabajo cotidiano, no a un formulario anual.

Depende de `identity-org`, `teams-staffing` y `skills-matrix`.

## Requirements

### Requirement: Give and request feedback

The system SHALL allow giving feedback linked to a Project and/or a company Value, allow
requesting feedback from a specific person, and classify feedback as a strength or an area
to improve.

#### Scenario: Give linked feedback
- GIVEN a member giving feedback
- WHEN they link it to a Project and/or a Value
- THEN the feedback is stored with those links

#### Scenario: Request feedback
- GIVEN a member requesting feedback
- WHEN they request it from a person
- THEN the request reaches that person

#### Scenario: Classify feedback
- GIVEN feedback marking a strength or an area to improve
- WHEN it is saved
- THEN it is stored classified as such

### Requirement: Kudos

The system SHALL allow giving a Kudo associated with a company Value, and reflect a Kudo
associated with an objective/result in the team's activity.

#### Scenario: Give a kudo tied to a value
- GIVEN a member giving a Kudo
- WHEN they associate it with a Value
- THEN the Kudo is stored with that Value

### Requirement: Growth plan

The system SHALL define a growth plan targeting specific skill levels from the matrix,
allow feedback and closed projects to feed its progress, and show the next milestone and
the skill gap to work on.

#### Scenario: Define a growth plan
- GIVEN a member's growth plan
- WHEN it is defined
- THEN it targets specific skill levels from the competency matrix

#### Scenario: View plan progress
- GIVEN a growth plan
- WHEN it is opened
- THEN the next milestone and the skill gap to work on are shown
