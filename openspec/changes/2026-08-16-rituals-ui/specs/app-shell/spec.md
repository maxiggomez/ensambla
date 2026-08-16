# app-shell (delta)

Delta de la capability `app-shell` para el change `rituals-ui`.

## MODIFIED Requirements

### Requirement: Authenticated app navigation

The system SHALL provide an authenticated application shell with a sidebar and
topbar that allow the user to navigate between every product section. Sections
of capabilities not yet implemented SHALL render a placeholder page instead of
a missing route. Rituales SHALL render the rituals and blockers UI (no longer
a placeholder).

#### Scenario: User navigates from the members section to the dashboard
- GIVEN an authenticated user inside the app shell
- WHEN they open the navigation sidebar
- THEN every product section is listed
- AND selecting a section with no UI yet shows a placeholder page

#### Scenario: User navigates to Rituales
- GIVEN an authenticated user inside the app shell
- WHEN they select the Rituales section
- THEN the rituals and blockers UI is shown instead of a placeholder