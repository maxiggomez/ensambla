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

The system SHALL recommend at least one deterministic template based on the saved company type and industry, with a stable fallback when no exact match exists. Dirección SHALL be able to preview a template before explicitly applying it or to complete setup without one. Applying a template SHALL atomically create its Teams, sample NorthStar, draft Objectives with model KeyResults, and Skills taxonomy as ordinary editable entities owned by their respective capabilities. Application SHALL be tenant-isolated and restricted to Dirección, SHALL NOT overwrite non-empty target structures, and SHALL record the selected template with setup completion. Repeating the same confirmed application SHALL NOT create duplicates, while attempting to apply a different template after completion SHALL be rejected.

#### Scenario: Recommend a template
- **GIVEN** Dirección saved a company type and industry with a matching template
- **WHEN** the template step is shown
- **THEN** at least one matching template is marked as recommended

#### Scenario: Recommend a deterministic fallback
- **GIVEN** Dirección saved a company type and industry without an exact template match
- **WHEN** the template step is shown repeatedly
- **THEN** the same fallback template is marked as recommended each time

#### Scenario: Preview without materializing content
- **GIVEN** Dirección is reviewing a recommended template
- **WHEN** Dirección opens its preview
- **THEN** the preview lists the Teams, sample NorthStar, model Objectives and KeyResults, and Skills it would create
- **AND** no template content is persisted before explicit confirmation

#### Scenario: Apply a template
- **GIVEN** Dirección selects a template for an Organization whose target structures are empty
- **WHEN** Dirección confirms its application
- **THEN** the template Teams, sample NorthStar, draft Objectives with model KeyResults, and Skills taxonomy are created for that Organization
- **AND** the applied template is recorded while guided setup becomes complete
- **AND** either all template content and setup state are committed or none of them are

#### Scenario: Generated content remains editable
- **GIVEN** an Organization completed setup with a template
- **WHEN** an authorized Member edits a generated Team, NorthStar, Objective, KeyResult, or Skill through its owning capability
- **THEN** the edit follows the same rules as equivalent manually created content

#### Scenario: Only Dirección applies a template
- **GIVEN** a Member without Dirección authority can access the Organization
- **WHEN** that Member attempts to apply a template
- **THEN** the request is rejected
- **AND** no setup state or template content changes

#### Scenario: Preserve existing Organization structure
- **GIVEN** at least one target structure already contains Organization content
- **WHEN** Dirección attempts to apply a template
- **THEN** the application is rejected without overwriting or adding content
- **AND** guided setup remains pending

#### Scenario: Isolate template application by tenant
- **GIVEN** Dirección belongs to one Organization
- **WHEN** Dirección attempts to apply a template to another Organization
- **THEN** the request is rejected
- **AND** neither Organization is modified

#### Scenario: Retry the same template safely
- **GIVEN** a template application already completed successfully
- **WHEN** the same confirmation is retried
- **THEN** the operation succeeds without creating duplicate content

#### Scenario: Reject a different template after completion
- **GIVEN** a template application already completed successfully
- **WHEN** Dirección attempts to apply a different template
- **THEN** the request is rejected
- **AND** the previously generated content and recorded template remain unchanged

#### Scenario: Complete setup without a template
- **GIVEN** Dirección is reviewing available templates
- **WHEN** Dirección chooses to finish without applying one
- **THEN** guided setup becomes complete
- **AND** no template content or applied-template identity is persisted

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
