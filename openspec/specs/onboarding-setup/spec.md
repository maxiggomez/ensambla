# onboarding-setup Specification

## Purpose

Reflejar la empresa en el sistema con mínima fricción: flujo guiado por pasos,
templates por tipo de empresa, e importación de CSV/XLSX con mapeo de columnas y
validación. Referencia visual: `norte-onboarding.html`.

Depende de `identity-org`. Reutiliza `strategy-northstar`, `teams-staffing`,
`skills-matrix` para poblar la estructura.

## Requirements

### Requirement: Guided setup flow

The system SHALL offer a stepped setup flow to new Organizations, allow skipping it
(accessing the app empty and configuring later), and allow going back without losing
already-entered data.

#### Scenario: Offer setup on first entry
- GIVEN a newly created Organization
- WHEN a user enters for the first time
- THEN the stepped setup flow is offered

#### Scenario: Skip setup
- GIVEN the setup flow
- WHEN the user chooses to skip it
- THEN they access the app with an empty structure and can configure later

#### Scenario: Go back without losing data
- GIVEN a completed step
- WHEN the user goes back
- THEN the previously entered data is preserved

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
