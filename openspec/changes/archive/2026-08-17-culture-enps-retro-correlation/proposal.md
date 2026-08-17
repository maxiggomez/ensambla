## Why

The `culture-enps` spec scenario "Correlate a falling eNPS" requires correlating a falling Team
eNPS with operational signals *"such as capacity or an overdue retro"*. The implementation only
covers the `over_capacity` branch: `domain/correlation.ts` accepts a single signal type and
`application/analyze-team-enps.ts` feeds it only with Team capacity. The overdue-retrospective
signal is already derivable through the `rituals` public application contract
(`evaluateLearningRisks`), so the missing branch is purely additive and does not change the
existing capacity correlation contract.

## What Changes

- Extend `OperationalSignal` to a discriminated union adding the `overdue_retro` signal and
  extend the correlation output to a union adding `enps_drop_with_overdue_retro`.
- Feed the overdue-retrospective risk into the correlation from `rituals/application`
  (ADR-0002: cross-module only via public application interfaces).
- Domesticate the failing-test list: unit + integration tests for the new branch.
- Domain/application only; no UI, schema, RLS, or migration change; the culture widget on the
  dashboard is untouched because `analyzeTeamEnps` is not rendered there.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `culture-enps`: make the concrete operational signals (Team over capacity, overdue
  retrospective) explicit in the "Results and drivers" requirement and its correlation
  scenario, matching the implementation.

## Impact

- `src/modules/culture-enps/domain/correlation.ts` — signal/output type union and derivation.
- `src/modules/culture-enps/application/analyze-team-enps.ts` — new sequential source read via
  `rituals/application.evaluateLearningRisks`; `application/index.ts` type export.
- Tests: `domain/correlation.test.ts` (unit) and `test/integration/culture-enps-correlation.test.ts`.
- No changes to `rituals`, `teams-staffing`, UI, `prisma/schema.prisma`, or migrations.
- Protected invariants affected: none (eNPS anonymity, minimum-N, RLS, and roll-up are
  untouched; correlation operates on derived visible aggregates only).