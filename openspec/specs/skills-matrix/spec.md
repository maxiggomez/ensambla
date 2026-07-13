# skills-matrix Specification

## Purpose

El lenguaje común que conecta personas ↔ proyectos ↔ carrera: matriz de competencias,
staffing inteligente y detección de brechas. Diferencial frente a competidores de RRHH.

Depende de `identity-org`, `teams-staffing` y `okrs`. Alimenta `feedback-growth` (carrera).

## Requirements

### Requirement: Competency matrix

The system SHALL record a Competency as Person + Skill + Level (0 to 4) and SHALL show a
matrix of people × skills with levels, filterable by Team.

#### Scenario: Record a competency
- GIVEN a person and a skill
- WHEN a level from 0 to 4 is set
- THEN a Competency of Person + Skill + Level is stored

#### Scenario: View the matrix filtered by team
- GIVEN the competency matrix
- WHEN it is opened and filtered by a Team
- THEN people × skills with their levels are shown for that Team

### Requirement: Intelligent staffing

The system SHALL suggest people for a need (a KeyResult or Project without owner with
required skills), ordered by match considering skill level, seniority and availability,
and SHALL flag a suggested person at 100% capacity as "no margin".

#### Scenario: Suggest people for a need
- GIVEN a need with required skills
- WHEN staffing suggestions are requested
- THEN people are suggested ordered by match on skill level, seniority and availability

#### Scenario: No-margin flag
- GIVEN a suggested person at 100% capacity
- WHEN suggestions are shown
- THEN that person is flagged "no margin" even if their skill is high

### Requirement: Skill gaps

The system SHALL raise a gap alert when several OKRs require a skill without enough
coverage, and SHALL flag a "bus factor" risk when a critical skill depends on a single person.

#### Scenario: Coverage gap alert
- GIVEN several OKRs requiring a skill without enough coverage
- WHEN gaps are evaluated
- THEN a gap alert is raised

#### Scenario: Bus factor risk
- GIVEN a critical skill held by a single person
- WHEN gaps are evaluated
- THEN a "bus factor" risk is flagged
