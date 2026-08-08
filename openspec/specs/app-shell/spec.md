# app-shell Specification

## Purpose

Infraestructura de UI: el shell de la app autenticada (sidebar + topbar) que da
entrada a todas las capabilities del producto y enruta por rol con los permisos
existentes de `identity-org`. Las capabilities sin UI todavía responden con una
página placeholder.

## Requirements

### Requirement: Authenticated app navigation

The system SHALL provide an authenticated application shell with a sidebar and
topbar that allow the user to navigate between every product section. Sections
of capabilities not yet implemented SHALL render a placeholder page instead of
a missing route.

#### Scenario: User navigates from the members section to the dashboard
- GIVEN an authenticated user inside the app shell
- WHEN they open the navigation sidebar
- THEN every product section is listed
- AND selecting a section with no UI yet shows a placeholder page

### Requirement: Role-based navigation

The system SHALL restrict the visible navigation sections and their contents to
what the user's role allows: Dirección sees all sections; Líder sees the
sections scoped to their Team; Colaborador sees only their allowed scope.
Navigation SHALL use the existing permission rules of `identity-org`, not new
policy.

#### Scenario: Dirección sees all sections
- GIVEN a member with the Dirección role
- WHEN they open the app shell
- THEN all navigation sections are visible

#### Scenario: Colaborador sees only their scope
- GIVEN a member with the Colaborador role
- WHEN they open the app shell
- THEN sections outside their scope are not shown
