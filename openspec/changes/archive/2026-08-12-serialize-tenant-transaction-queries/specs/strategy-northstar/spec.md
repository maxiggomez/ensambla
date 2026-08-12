## MODIFIED Requirements

### Requirement: Strategic pillars and cascade

The system SHALL allow creating strategic pillars that group one or more Objectives,
and SHALL show the strategic map as the cascade Vision → North Star → Pillars → OKRs
with the real progress of each Objective. Reads issued within the same tenant
transaction SHALL execute without overlapping queries on its database client.

#### Scenario: Strategic map transaction reads are serialized

- GIVEN a member reading the strategic map inside their tenant context
- WHEN the map loads strategy, North Star, pillars and levers
- THEN each database query completes before the next query starts on that transaction
- AND the cascade and derived Objective progress remain unchanged
