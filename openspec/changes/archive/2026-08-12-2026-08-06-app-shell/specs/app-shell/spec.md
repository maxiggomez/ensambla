# app-shell (delta)

Delta de la capability `app-shell` para el change `app-shell`. **ACTIVO** —
captura el contrato esperado según las decisiones aprobadas en el loop.

## ADDED Requirements

### Requirement: Authenticated app navigation

The system SHALL provide an authenticated application shell with a sidebar and
topbar that allow the user to navigate between every product section. Sections
of capabilities not yet implemented SHALL render a placeholder page instead of
a missing route. The authenticated sections SHALL be grouped under an app route
group with a shell layout that guards auth (redirect to `/sign-in`) and
membership (redirect to `/onboarding` when the user has no member).

#### Scenario: User navigates from the members section to the dashboard
- GIVEN an authenticated user inside the app shell
- WHEN they open the navigation sidebar
- THEN every product section is listed
- AND selecting a section with no UI yet shows a placeholder page

#### Scenario: Logging in lands on the app home
- GIVEN a user signing in (mock picker or CTA of the home page)
- WHEN the session is established
- THEN they land on `/dashboard` inside the app shell

### Requirement: Role-based navigation

The system SHALL restrict the visible navigation sections to what the user's
role allows: Dirección sees all sections; Líder and Colaborador see all sections
except the management-only section "Miembros". Navigation SHALL use the existing
permission rules of `identity-org` (`canEditOrganization`/`canManageMembers`),
not new policy.

#### Scenario: Dirección sees all sections
- GIVEN a member with the Dirección role
- WHEN they open the app shell
- THEN all navigation sections are visible

#### Scenario: Colaborador sees only their scope
- GIVEN a member with the Colaborador role
- WHEN they open the app shell
- THEN sections outside their scope (the management section) are not shown
- AND the same applies to the Líder role
