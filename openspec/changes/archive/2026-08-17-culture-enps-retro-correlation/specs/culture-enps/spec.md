## MODIFIED Requirements

### Requirement: Results and drivers

The system SHALL compute the eNPS (promoters − detractors) globally and by Team when there
are enough responses, group open comments into drivers/themes without exposing authorship, and
SHALL correlate a falling Team eNPS with each coinciding operational signal: a Team over 100
percent capacity or a Team overdue its retrospective (at least two cycles without one). Reads
issued within the same tenant transaction SHALL execute without overlapping queries on its
database client.

#### Scenario: Compute eNPS

- GIVEN enough responses
- WHEN results are computed
- THEN the eNPS is calculated globally and by Team

#### Scenario: Group comments into drivers

- GIVEN open comments
- WHEN results are shown
- THEN they are grouped into drivers/themes without exposing authorship

#### Scenario: Correlate a falling eNPS

- **GIVEN** a Team eNPS that falls and the Team is over capacity or overdue a retrospective
- **WHEN** it is analyzed
- **THEN** coinciding capacity and overdue-retrospective signals are reported as correlations
- **AND** a falling eNPS with no coinciding operational signal produces no correlation

#### Scenario: Anonymous aggregate transaction reads are serialized

- GIVEN Dirección reading eNPS results inside their tenant context
- WHEN Organization settings, participation and anonymous responses are loaded
- THEN each database query completes before the next query starts on that transaction
- AND minimum-N suppression, anonymity and tenant isolation remain unchanged