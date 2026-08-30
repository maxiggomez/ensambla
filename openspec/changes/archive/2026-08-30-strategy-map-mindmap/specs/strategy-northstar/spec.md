## MODIFIED Requirements

### Requirement: Strategic pillars and cascade

The system SHALL allow creating strategic pillars that group one or more Objectives, and
SHALL show the strategic map as the cascade Vision → North Star → Pillars → OKRs with the
real progress of each Objective. Reads issued within the same tenant transaction SHALL
execute without overlapping queries on its database client.

On the `/norte-estrategico` page the strategic map SHALL be presented as an interactive
mind map placed before the strategy detail sections. The map SHALL render the cascade as
a node tree — Vision as the root, branching to the North Star, then to Pillars, then to
each Pillar's Objectives — with visible connectors between a node and its children.
Objectives not assigned to any Pillar SHALL appear as their own nodes hanging from the
North Star, visually distinguished from Pillars.

Every node that has children SHALL be independently expandable and collapsible. A
collapsed node SHALL indicate how many direct children are hidden. When the page loads,
only the Vision and the North Star SHALL be expanded; Pillars and Objectives SHALL start
collapsed. The map SHALL offer "expand all" and "collapse all" controls; "collapse all"
SHALL keep the Vision and North Star visible.

The strategic map SHALL be read-only: it SHALL NOT contain controls to create or edit
strategy, the North Star, input levers, Pillars, or Objective assignments. Those actions
SHALL live in the strategy detail sections below the map.

The strategy detail sections (strategy statements, North Star, Pillars) SHALL each be a
collapsible section that starts collapsed, with a clickable header that toggles it and an
"expand all" / "collapse all" control for the group. Creating entities from a detail
section SHALL continue to use the shared entity-create drawer.

Node progress for the North Star, Pillars and Objectives SHALL be shown as a percentage
together with a semantic status (on-track / attention / at-risk) conveyed by more than
color alone, with the status thresholds stated in the map.

#### Scenario: Group objectives under a pillar
- GIVEN a strategic pillar
- WHEN Objectives are assigned to it
- THEN the pillar groups those Objectives

#### Scenario: View the strategic map as a mind map
- GIVEN a member opening `/norte-estrategico`
- WHEN the page loads
- THEN the strategic map appears before the strategy detail sections
- AND it renders the cascade Vision → North Star → Pillars → OKRs as a node tree with connectors and each Objective's progress
- AND only the Vision and North Star nodes are expanded, with Pillars and Objectives collapsed

#### Scenario: Expand a collapsed node
- GIVEN the strategic map with the North Star node collapsed showing its hidden-children count
- WHEN the user expands the North Star node
- THEN its child Pillar nodes and any unassigned-Objective nodes become visible

#### Scenario: Collapse all keeps the top of the cascade visible
- GIVEN the strategic map with several nodes expanded
- WHEN the user activates "collapse all"
- THEN every node collapses except that the Vision and the North Star remain visible

#### Scenario: Unassigned objectives hang from the North Star
- GIVEN an Objective not assigned to any Pillar
- WHEN the user views the strategic map
- THEN that Objective appears as its own node under the North Star, distinguished from Pillar nodes

#### Scenario: The map has no editing controls
- GIVEN a user with the Dirección role viewing the strategic map
- WHEN they look at the map
- THEN the map offers no control to create or edit strategy, the North Star, levers, Pillars or Objective assignments
- AND those controls are available in the strategy detail sections below the map

#### Scenario: Detail sections start collapsed
- GIVEN a member opening `/norte-estrategico`
- WHEN the page loads
- THEN each strategy detail section is collapsed
- AND activating a section header expands it to reveal its content and any editing controls

#### Scenario: Strategic map transaction reads are serialized
- GIVEN a member reading the strategic map inside their tenant context
- WHEN the map loads strategy, North Star, pillars and levers
- THEN each database query completes before the next query starts on that transaction
- AND the cascade and derived Objective progress remain unchanged
