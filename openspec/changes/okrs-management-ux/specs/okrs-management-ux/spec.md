## ADDED Requirements

### Requirement: Active-cycle bar

The `/okrs` page SHALL render an active-cycle bar directly below the page title
and above the objective list. The bar SHALL show the selected cycle's name, its
date range, the days remaining until it ends, and the cycle's aggregate progress
(the average of its Objectives' derived progress). The bar SHALL provide a
switcher to change the selected cycle, and SHALL offer the "+ Nuevo ciclo"
trigger to Dirección. The selected cycle SHALL scope the objective list to the
Objectives in that cycle.

#### Scenario: Cycle bar shows the active cycle in context
- **WHEN** Dirección or a Líder opens `/okrs` with at least one cycle
- **THEN** the cycle bar renders below the page title showing the cycle name, date range, days remaining and aggregate progress

#### Scenario: Switching cycle re-scopes the list
- **WHEN** the user picks a different cycle from the switcher
- **THEN** the objective list shows only the Objectives assigned to that cycle

#### Scenario: New cycle trigger is limited to Dirección
- **WHEN** a user without the Dirección role views the cycle bar
- **THEN** the "+ Nuevo ciclo" trigger is not shown

### Requirement: Objective row hierarchy and derived status

Each Objective in the list SHALL present its title as the dominant element, with
a secondary meta line (level, owner, cycle, KeyResult count) and a derived status
chip. The status chip SHALL be computed from the Objective's state and its
KeyResults' roll-up — `Borrador` when unpublished, otherwise `En riesgo`,
`Atención` or `En ritmo` — and SHALL always pair colour with text or an icon.
The derived status SHALL NOT be persisted.

#### Scenario: Title is the dominant element
- **WHEN** an Objective renders in the list
- **THEN** its title is the largest, highest-weight text in the row, above the meta line

#### Scenario: Status chip reflects roll-up
- **WHEN** a published Objective has at least one KeyResult flagged at risk
- **THEN** its status chip reads `En riesgo` with a matching icon

#### Scenario: Draft objective shows draft status
- **WHEN** an Objective has not been published
- **THEN** its status chip reads `Borrador` regardless of KeyResult data

### Requirement: Collapsible objective list

Objectives in the list SHALL be collapsible and SHALL render collapsed by
default. The collapsed summary row SHALL show the title, status chip, derived
progress percentage and a short KeyResult roll-up. Expanding an Objective SHALL
reveal its KeyResults with per-KR progress, confidence and last-check-in recency.

#### Scenario: Objectives start collapsed
- **WHEN** the `/okrs` page loads
- **THEN** every Objective is collapsed, showing only its summary row

#### Scenario: Expanding reveals key results
- **WHEN** the user expands an Objective
- **THEN** its KeyResults are shown with progress, confidence and last-check-in recency

### Requirement: Objective action menu

Each Objective SHALL expose an action menu (`⋯`) offering, subject to the actor's
role and the Objective's state: view detail, edit objective, change cycle,
archive (logical delete) and close cycle. Actions that are not permitted for the
current state or role SHALL be hidden rather than shown disabled. Archiving SHALL
require confirmation through an `AlertDialog` that states the action is reversible
and does not delete data.

#### Scenario: Menu offers edit and archive for an active objective
- **WHEN** Dirección opens the action menu of a `Draft` or `Published` Objective
- **THEN** the menu offers "Editar objetivo" and "Archivar objetivo"

#### Scenario: Archive asks for confirmation
- **WHEN** the user chooses "Archivar objetivo"
- **THEN** an `AlertDialog` appears explaining that archiving is a reversible logical delete and moves the Objective to read-only history
- **AND** the Objective is archived only after the user confirms

#### Scenario: Close cycle is hidden for non-Dirección
- **WHEN** a user without the Dirección role opens an Objective's action menu
- **THEN** "Cerrar ciclo" is not present in the menu

### Requirement: Objective edit drawer

Editing an Objective SHALL happen in a right-anchored drawer built on the shared
`EntityCreateDrawer` pattern, hosting the fields defined by the `okrs`
capability's "Objective editing" requirement (title, level, owner, Team, cycle,
cadence, alignment). The drawer SHALL include a visually distinct "zona sensible"
that offers the Archive action, routed through the same confirmation dialog.

#### Scenario: Edit drawer opens with current values
- **WHEN** the user chooses "Editar objetivo"
- **THEN** the edit drawer opens pre-filled with the Objective's current field values

#### Scenario: Zona sensible offers archive
- **WHEN** the edit drawer is open for an Objective Dirección may archive
- **THEN** a "zona sensible" section offers "Archivar objetivo" and triggers the confirmation dialog

### Requirement: Cycle metrics strip

The `/okrs` page SHALL render a metrics strip for the selected cycle showing:
the number of Objectives in the cycle, the average derived progress, the count of
KeyResults at risk, and the count of overdue check-ins. Every metric SHALL be
derived at read time and none SHALL be persisted.

#### Scenario: Metrics strip summarises the selected cycle
- **WHEN** the `/okrs` page renders for a selected cycle
- **THEN** the strip shows objective count, average progress, at-risk KR count and overdue check-in count for that cycle

### Requirement: Objective status and level filters

The `/okrs` page SHALL let the user filter the objective list by derived status
(`Todos`, `En ritmo`, `Atención`, `En riesgo`, `Borradores`, `Archivados`) and by
level and owner. Filters SHALL combine with the selected-cycle scope. The
`Archivados` filter SHALL surface archived Objectives as read-only entries.

#### Scenario: Filter by status narrows the list
- **WHEN** the user selects the `En riesgo` status filter
- **THEN** the list shows only Objectives whose derived status is `En riesgo` within the selected cycle

#### Scenario: Archived filter shows read-only history
- **WHEN** the user selects the `Archivados` filter
- **THEN** archived Objectives are listed as read-only entries with no edit or check-in actions

### Requirement: Objective detail panel

Selecting "Ver detalle" SHALL open a detail panel for the Objective with
collapsible sections that are collapsed by default: Gestión (the action set),
Alineamiento (the ladder North Star → Pilar → higher Objective → this Objective →
KeyResults), Ciclo y cadencia, and Key Results (each KeyResult with its check-in
history including value, confidence, comment and evidence).

#### Scenario: Detail sections start collapsed
- **WHEN** the detail panel opens
- **THEN** every section is collapsed and can be expanded independently

#### Scenario: Alignment ladder shows the full chain
- **WHEN** the Alineamiento section is expanded for an aligned Objective
- **THEN** it shows the ordered chain from North Star down to the Objective's KeyResults

#### Scenario: Key result history shows check-ins with evidence
- **WHEN** the Key Results section is expanded
- **THEN** each KeyResult lists its check-ins with value, confidence, comment and any evidence link or file

### Requirement: Progress stays derived in the redesigned views

The redesigned `/okrs` views SHALL compute every progress value, percentage,
aggregate and derived status from the KeyResult roll-up at read time (ADR-0004),
and SHALL NOT persist them or make them editable through any of the new
affordances.

#### Scenario: No affordance edits progress
- **WHEN** a user interacts with any control in the redesigned list, drawer or detail panel
- **THEN** there is no way to set an Objective's or KeyResult's progress directly; it only changes by recording check-ins
