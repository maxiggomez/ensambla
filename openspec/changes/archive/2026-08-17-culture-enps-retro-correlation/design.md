## Context

The culture-enps spec already promises correlation with "an overdue retro"; the implemented
domain only models `over_capacity`. Rituals exposes the derived signal through
`evaluateLearningRisks` → `{ teamId, atRisk }` (≥ 2 cycles without a retrospective,
`rituals/domain/retrospective-risk.ts`). Correlations are derived on read from visible
aggregates only and never expose individual responses (ADR-0005).

## Game

- Expose `eNPS` correlation as a discriminated output union: capacity and overdue-retrospective
  correlations, each `relationship: "coincidence"`, carrying the typed `enpsChange`
  (ADR-0004).
- The overdue-retrospective correlation is emitted only when the Team is at retrospective risk
  and the latest visible Team eNPS fell against the immediately previous one; a fall with no
  coinciding signal produces none.
- `analyzeTeamEnps` keeps its sequential tenant-safe reads: pulse ids → each visible result →
  capacities → retro risk; no concurrent queries on a transaction client.

## Non-goals

- Changing the capacity correlation output, eNPS computation, minimum-N suppression, or
  anonymity.
- Widening the `rituals` contract (the boolean `atRisk` signal is enough).
- Any UI, schema, or migration change.

## Risks

- None material. The union is backward compatible for existing consumers of the capacity
  correlation (integration suite keeps green for the existing shape).