# design-system

## Purpose

Identidad visual de Ensambla como contrato verificable: los tokens Radar
(tinta/papel/lima) y la tipografía Inter deben llegar efectivamente al render.
La guía viva de tokens, componentes y patrones es `docs/design-system.md`
(ADR-0007); esta spec fija lo mínimo que toda página debe cumplir.

## Requirements

### Requirement: Radar visual identity tokens

The UI SHALL render using the Radar identity tokens as the single source of
truth: ink `#18231d` as foreground, paper `#f7f9f6` as app background, lime
`#caff47` as primary action color, and no component SHALL hardcode the retired
indigo palette.

#### Scenario: Tokens applied to the rendered page
- GIVEN any page of the app
- WHEN it renders in the browser
- THEN the body background resolves to the paper token
- AND the primary action button background resolves to the lime token
- AND the body text color resolves to the ink token

### Requirement: Typography actually loaded

The UI SHALL render all text in the Inter font family (with the system stack
as fallback), instead of the browser default serif.

#### Scenario: Inter applied to body text
- GIVEN any page of the app
- WHEN it renders in the browser
- THEN the computed font-family of the body starts with Inter

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
