## MODIFIED Requirements

### Requirement: Configurable check-in cadence

The system SHALL allow a Team lead to configure the check-in cadence as weekly,
biweekly or monthly per Objective or Team. Objective cadence SHALL override Team
cadence; Team cadence SHALL apply only to Objectives associated with that Team.
The effective cadence SHALL govern due reminders and the derived outdated state.
When no cadence is configured, weekly SHALL NOT be forced and no reminder or
outdated state SHALL be produced. Reads issued within the same tenant transaction
SHALL execute without overlapping queries on its database client.

#### Scenario: Reminder candidate transaction reads are serialized

- GIVEN a member evaluating due check-in reminders inside their tenant context
- WHEN Objectives, cadences, KeyResults and latest CheckIns are loaded
- THEN each database query completes before the next query starts on that transaction
- AND cadence precedence, reminders and outdated derivation remain unchanged
