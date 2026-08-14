# onboarding-setup Specification

## Purpose

Reflejar la empresa en el sistema con mínima fricción: flujo guiado por pasos,
templates por tipo de empresa, e importación de CSV/XLSX con mapeo de columnas y
validación. Referencia visual: `norte-onboarding.html`.

Depende de `identity-org`. Reutiliza `strategy-northstar`, `teams-staffing`,
`skills-matrix` para poblar la estructura.

## Requirements

### Requirement: Guided setup flow

The system SHALL persist one tenant-owned setup progress record per Organization and SHALL offer
its stepped setup flow immediately after a new Organization is created and on later visits while
the progress remains pending. Only Dirección SHALL mutate setup progress. The flow SHALL allow
Dirección to save company type and industry, move backward without losing saved data, finish the
basic setup, or skip it and access an empty application that remains configurable later. Existing
Organizations created before this flow is deployed SHALL NOT be forced into onboarding.

#### Scenario: Offer setup on first entry

- **GIVEN** a newly created Organization with pending setup progress
- **WHEN** its Dirección member enters after creation or revisits onboarding
- **THEN** the stepped setup flow is offered at the last persisted step

#### Scenario: Skip setup

- **GIVEN** a Dirección member in a pending setup flow
- **WHEN** they choose to skip it
- **THEN** setup progress is marked skipped
- **AND** they access the app with an empty structure and can configure it later

#### Scenario: Go back without losing data

- **GIVEN** Dirección saved company type and industry and advanced to the review step
- **WHEN** they go back to the company-profile step
- **THEN** the previously saved company type and industry are restored

#### Scenario: Complete basic setup

- **GIVEN** Dirección is reviewing valid persisted company-profile data
- **WHEN** they finish the basic setup
- **THEN** setup progress is marked completed
- **AND** they enter the application without templates or imported records being fabricated

#### Scenario: Only Dirección mutates setup

- **GIVEN** a Líder or Colaborador in an Organization
- **WHEN** they attempt to save, advance, complete, or skip setup progress
- **THEN** the system rejects the mutation with a forbidden error

#### Scenario: Setup progress is tenant-isolated

- **GIVEN** two Organizations with different setup progress and company-profile data
- **WHEN** a Member reads or mutates setup in one Organization
- **THEN** no progress or profile data from the other Organization is accessible

#### Scenario: Existing Organizations are not forced into setup

- **GIVEN** an Organization that existed before guided setup progress was introduced
- **WHEN** the migration is deployed and a Member enters the application
- **THEN** that Organization is treated as having skipped setup
- **AND** the Member is not redirected into the new flow

### Requirement: Start from template

The system SHALL recommend at least one template based on company type and industry,
pre-load its structure (teams, sample North Star, model OKRs, skills taxonomy) when
chosen, and keep everything editable.

#### Scenario: Recommend a template
- GIVEN the user provides company type and industry
- WHEN templates are shown
- THEN at least one matching template is recommended

#### Scenario: Apply a template
- GIVEN a chosen template
- WHEN it is applied
- THEN teams, a sample North Star, model OKRs and a skills taxonomy are pre-loaded
- AND all generated content remains editable

### Requirement: Spreadsheet import with column mapping

The system SHALL detect columns of an uploaded CSV/XLSX and propose an automatic mapping
to Ensambla fields, SHALL block continuing while a required field (Name, Email) is
unmapped, SHALL exclude columns set to "ignore", and SHALL show a preview of the first
rows as they will be imported.

#### Scenario: Auto-map on upload
- GIVEN a user uploads a CSV/XLSX
- WHEN the file is read
- THEN columns are detected and an automatic mapping is proposed

#### Scenario: Block on unmapped required field
- GIVEN a required field (Name or Email) left unmapped
- WHEN the user tries to continue
- THEN the system blocks until it is resolved

#### Scenario: Ignore a column
- GIVEN a column mapped to "ignore"
- WHEN the import runs
- THEN that column is not imported

### Requirement: Import validation

The system SHALL list rows with a missing email separately and not import them until
fixed, SHALL merge duplicates by email, SHALL import only valid rows and report the
total, and SHALL allow re-importing to update without creating duplicates.

#### Scenario: Rows with missing email
- GIVEN rows without an email
- WHEN validation runs
- THEN those rows are listed apart and not imported until corrected

#### Scenario: Merge duplicates
- GIVEN duplicate rows by email
- WHEN the import runs
- THEN they are merged into a single record

#### Scenario: Re-import updates
- GIVEN a prior import
- WHEN the same data is re-imported
- THEN existing records are updated without creating duplicates
