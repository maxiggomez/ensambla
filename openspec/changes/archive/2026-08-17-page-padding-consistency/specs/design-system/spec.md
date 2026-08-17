# design-system (delta)

Delta de la capability `design-system` para el change `page-padding-consistency`.

## ADDED Requirements

### Requirement: Consistent page container

Every page rendered inside the authenticated app shell SHALL use the same page
container: a `<main>` element centered with a maximum width of ~1180px
(`max-w-[1180px]`), horizontal padding `px-6 md:px-10` and top/bottom padding
`py-10`. Content SHALL therefore never sit flush against the sidebar or the
topbar.

#### Scenario: Norte estratégico uses the standard page container
- GIVEN the authenticated app shell
- WHEN the Norte estratégico page renders
- THEN its content is centered inside a main container with max width ~1180px
- AND it keeps the standard horizontal and vertical padding instead of touching
  the sidebar or topbar

#### Scenario: OKRs uses the standard page container
- GIVEN the authenticated app shell
- WHEN the OKRs page renders
- THEN its content is centered inside a main container with max width ~1180px
- AND it keeps the standard horizontal and vertical padding instead of touching
  the sidebar or topbar

#### Scenario: Dashboard uses the standard page container
- GIVEN the authenticated app shell
- WHEN the Dashboard page renders
- THEN its content is centered inside a main container with max width ~1180px
- AND it keeps the standard horizontal and vertical padding instead of touching
  the sidebar or topbar