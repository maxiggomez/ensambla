# design-system (delta)

Delta de la capability `design-system` para el change `design-system-radar`.

## ADDED Requirements

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
