# app-shell (delta)

Delta de la capability `app-shell` para el change `skills-matrix-ui`.

## MODIFIED Requirements

### Requirement: Authenticated app navigation

The system SHALL provide an authenticated application shell with a sidebar and
topbar that allow the user to navigate between every product section. Sections
of capabilities not yet implemented SHALL render a placeholder page instead of
a missing route. Skills & Staffing SHALL render the skills matrix and staffing
UI (no longer a placeholder).

#### Scenario: User navigates to Skills & Staffing
- GIVEN an authenticated user inside the app shell
- WHEN they select the Skills & Staffing section
- THEN the skills matrix and staffing UI is shown instead of a placeholder