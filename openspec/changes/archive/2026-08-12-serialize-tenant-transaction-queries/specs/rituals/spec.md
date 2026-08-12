## MODIFIED Requirements

### Requirement: Ceremony cadence

The system SHALL generate rituals according to a configured cadence (e.g. weekly,
biweekly) and SHALL mark a ritual not held on its date as "overdue". Reads issued
within the same tenant transaction SHALL execute without overlapping queries on its
database client.

#### Scenario: Ritual list transaction reads are serialized

- GIVEN a member listing rituals inside their tenant context
- WHEN rituals and their occurrences are loaded
- THEN the ritual query completes before the occurrence query starts on that transaction
- AND the composed ritual list remains unchanged
