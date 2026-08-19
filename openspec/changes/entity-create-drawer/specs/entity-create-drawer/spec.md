## ADDED Requirements

### Requirement: Reusable entity-create drawer
The system SHALL provide a reusable overlay drawer component for entity-creation forms, anchored to the right edge of the viewport, spanning the full viewport height, with a scrim that dims the underlying page while open.

#### Scenario: Drawer opens over the full height
- **WHEN** a user opens the entity-create drawer
- **THEN** the drawer panel renders anchored to the right edge, spans the full viewport height, and a scrim dims the rest of the page

#### Scenario: Drawer scales from 1 to 4+ fields
- **WHEN** the drawer hosts a form with any number of fields from 1 up to 4 or more
- **THEN** the drawer renders all fields in a single scrollable body without changing panel width or requiring a different container

#### Scenario: Drawer body scrolls independently when content overflows
- **WHEN** the form content exceeds the available vertical space
- **THEN** only the drawer body scrolls; the drawer header and footer stay fixed in place

### Requirement: Drawer trigger replaces inline creation card
Each page that offers entity creation SHALL trigger the drawer from a "+ Nuevo/a `<entidad>`" button placed next to the corresponding list or catalog title, and SHALL NOT render the creation form as an always-visible card beside the list.

#### Scenario: Trigger opens the drawer with the creation form
- **WHEN** a user clicks the "+ Nuevo/a `<entidad>`" button next to a list
- **THEN** the entity-create drawer opens and displays that entity's creation form

#### Scenario: List area no longer reserves space for an inline form
- **WHEN** the drawer is closed
- **THEN** the page does not render a persistent form card next to the list, and the list/catalog occupies the space previously shared with that card

### Requirement: Drawer keyboard and focus behavior
The drawer SHALL trap keyboard focus within the panel while open, close on `Escape`, close when the scrim is clicked, and return focus to the triggering button when closed.

#### Scenario: Escape closes the drawer
- **WHEN** the drawer is open and the user presses `Escape`
- **THEN** the drawer closes and focus returns to the trigger button

#### Scenario: Clicking the scrim closes the drawer
- **WHEN** the drawer is open and the user clicks outside the panel, on the scrim
- **THEN** the drawer closes and focus returns to the trigger button

#### Scenario: Focus stays within the open drawer
- **WHEN** the drawer is open and the user tabs through focusable elements
- **THEN** focus cycles only among elements inside the drawer panel, never landing on elements behind the scrim

### Requirement: Drawer preserves existing form behavior
The drawer SHALL host each migrated form unchanged in validation, submission, and server-action behavior; only the visual container changes.

#### Scenario: Successful submission closes the drawer
- **WHEN** a hosted form's server action completes successfully
- **THEN** the drawer closes and the underlying list reflects the newly created entity

#### Scenario: Validation errors keep the drawer open
- **WHEN** a hosted form's server action returns a validation error
- **THEN** the drawer stays open and displays the error next to the relevant field, exactly as it did in the previous inline-card layout
