# culture-enps Specification

## Purpose

El pulso de la cultura vía eNPS, medido de forma continua y cruzado con señales
operativas. El anonimato es una invariante estructural (ADR-0005).

Depende de `identity-org`. Se correlaciona con `teams-staffing` y `rituals`.

## Requirements

### Requirement: Launch a pulse

The system SHALL allow Dirección to launch a pulse to the people in a defined scope and
generate pulses according to a configured frequency.

#### Scenario: Launch a pulse
- GIVEN a user with the Dirección role
- WHEN they launch a pulse to a defined scope
- THEN it is sent to the people in that scope

#### Scenario: Recurring pulses
- GIVEN a configured frequency
- WHEN the schedule advances
- THEN pulses are generated according to that frequency

### Requirement: Respond anonymously

The system SHALL store each PulseResponse anonymously and immutably, SHALL never allow
viewing an individual response, and SHALL not show aggregated results for a group below a
**configurable minimum N** of responses (set per Organization; default 4).

#### Scenario: Anonymous immutable response
- GIVEN a person responding to a pulse
- WHEN the response is submitted
- THEN it is stored anonymously and cannot be modified

#### Scenario: No individual response access
- GIVEN any user
- WHEN they attempt to view an individual response
- THEN the system does not allow it under any circumstance

#### Scenario: Minimum N threshold
- GIVEN a group with fewer than the configured minimum N responses
- WHEN results are requested
- THEN no aggregated results are shown for that group

#### Scenario: Configure the minimum N
- GIVEN a user with the Dirección role
- WHEN they set the minimum N threshold for the Organization
- THEN aggregate visibility uses that configured threshold

### Requirement: Results and drivers

The system SHALL compute the eNPS (promoters − detractors) globally and by Team when there
are enough responses, group open comments into drivers/themes without exposing authorship,
and correlate a falling Team eNPS with operational signals.

#### Scenario: Compute eNPS
- GIVEN enough responses
- WHEN results are computed
- THEN the eNPS is calculated globally and by Team

#### Scenario: Group comments into drivers
- GIVEN open comments
- WHEN results are shown
- THEN they are grouped into drivers/themes without exposing authorship

#### Scenario: Correlate a falling eNPS
- GIVEN a Team eNPS that falls
- WHEN it is analyzed
- THEN the system can correlate it with operational signals such as capacity or an overdue retro
