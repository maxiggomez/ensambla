## MODIFIED Requirements

### Requirement: Results and drivers

The system SHALL compute the eNPS (promoters − detractors) globally and by Team when
there are enough responses, group open comments into drivers/themes without exposing
authorship, and correlate a falling Team eNPS with operational signals. Reads issued
within the same tenant transaction SHALL execute without overlapping queries on its
database client.

#### Scenario: Anonymous aggregate transaction reads are serialized

- GIVEN Dirección reading eNPS results inside their tenant context
- WHEN Organization settings, participation and anonymous responses are loaded
- THEN each database query completes before the next query starts on that transaction
- AND minimum-N suppression, anonymity and tenant isolation remain unchanged
