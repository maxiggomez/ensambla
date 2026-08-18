# design-system (delta)

Delta de la capability `design-system` para el change `page-container-lint`.

## MODIFIED Requirements

### Requirement: Consistent page container

Every page rendered inside the authenticated app shell SHALL use the same page
container contract: a `<main>` element as the root of the page component,
horizontally centered (`mx-auto`), full width (`w-full`), with horizontal
padding `px-6 md:px-10` and top/bottom padding `py-10`. Content SHALL therefore
never sit flush against the sidebar or the topbar. The maximum content width is
a page-intent decision (standard ~1180px; focused pages such as Members use a
tighter container) and SHALL NOT justify dropping the padding contract. A
custom ESLint rule SHALL flag any `page.tsx` inside the shell whose root
container violates this contract.

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

#### Scenario: Members keeps the padding contract on a narrower container
- GIVEN the authenticated app shell
- WHEN the Members page renders
- THEN its content uses the standard horizontal and vertical padding even
  though its container is narrower than the default

#### Scenario: Clima & eNPS keeps the padding contract on a wider container
- GIVEN the authenticated app shell
- WHEN the Clima & eNPS page renders
- THEN its content uses the standard horizontal and vertical padding even
  though its container is wider than the default

#### Scenario: The linter flags a page that drops the container contract
- GIVEN a `page.tsx` inside the app shell
- WHEN its root container is not a `<main>` with the standard padding classes
- THEN the custom ESLint rule reports an error