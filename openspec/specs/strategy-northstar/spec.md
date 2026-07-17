# strategy-northstar Specification

## Purpose

La cima de la cascada de alineamiento: visión, misión, valores, la North Star (métrica
tipada) y los pilares estratégicos. Todo objetivo baja de acá.

Reutiliza el value object `Measurement` (ADR-0004). Se relaciona con `okrs` (los
objetivos son las palancas de la North Star).

## Requirements

### Requirement: Vision, mission and values

The system SHALL allow Dirección to define the Organization's vision, mission and values,
visible to the whole Organization.

#### Scenario: Define strategy statements
- GIVEN a user with the Dirección role
- WHEN they set vision, mission and values
- THEN they become visible to the whole Organization

### Requirement: North Star metric

The system SHALL define the North Star as a typed Measurement (ADR-0004) with a current
value and a target, exactly one per Organization, and SHALL allow only Dirección to
define or redefine it. Every member of the Organization SHALL be able to read it. The
system SHALL allow adding input levers each linkable to an Objective.

#### Scenario: Define the North Star
- GIVEN a user with the Dirección role and no North Star defined
- WHEN they define the North Star with a name and a typed Measurement
- THEN it is stored as a typed Measurement with current value and target
- AND any member of the Organization can read it

#### Scenario: Redefining replaces the single North Star
- GIVEN an Organization with a North Star already defined
- WHEN Dirección defines the North Star again
- THEN the previous definition is replaced
- AND the Organization still has exactly one North Star

#### Scenario: Non-Dirección cannot define the North Star
- GIVEN a user with the Líder or Colaborador role
- WHEN they attempt to define the North Star
- THEN the system rejects the action with a forbidden error

#### Scenario: North Star is tenant-isolated
- GIVEN two Organizations each with their own North Star
- WHEN a request is scoped to one Organization
- THEN the other Organization's North Star is not accessible

#### Scenario: Link an input lever to an objective
- GIVEN a North Star input lever
- WHEN it is linked to an Objective
- THEN the Objective appears as a lever under the North Star in the strategic map

### Requirement: Strategic pillars and cascade

The system SHALL allow creating strategic pillars that group one or more Objectives, and
SHALL show the strategic map as the cascade Vision → North Star → Pillars → OKRs with the
real progress of each Objective.

#### Scenario: Group objectives under a pillar
- GIVEN a strategic pillar
- WHEN Objectives are assigned to it
- THEN the pillar groups those Objectives

#### Scenario: View the strategic map
- GIVEN the strategic map
- WHEN a user opens it
- THEN the cascade Vision → North Star → Pillars → OKRs is shown with each Objective's progress
