## MODIFIED Requirements

### Requirement: Drawer trigger replaces inline creation card
The system SHALL trigger entity creation from a "+ Nuevo/a `<entidad>`" button placed next
to the corresponding list or catalog title, and SHALL NOT render the creation form as an
always-visible card beside the list.

#### Scenario: Strategic pillar creation and assignment adopt the drawer
- **GIVEN** the Norte Estratégico page with the Mapa estratégico title
- **WHEN** Dirección clicks the "+ Nuevo pilar" trigger next to the title
- **THEN** the entity-create drawer opens with the pillar creation form
- **AND** while the drawer is closed no always-visible pillar-creation form is rendered next to the map
- **AND** Dirección can create a pillar and close the drawer on success
- **AND** Dirección can open a "+ Asignar objetivo" trigger next to the title to assign an existing Objective to a pillar, closing the drawer on success
- **AND** the previously always-visible inline pillar-creation and assignment forms are removed
