## MODIFIED Requirements

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
