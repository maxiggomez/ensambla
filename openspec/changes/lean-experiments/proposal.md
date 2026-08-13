## Why

Ensambla already connects strategy and measurable OKRs, but it still lacks the Lean loop
that turns a KeyResult assumption into a measured experiment and a reusable learning. This
change completes that differentiating workflow now that OKRs and the shared `Measurement`
model are stable.

## What Changes

- Add hypotheses that are always linked to a visible KeyResult and record belief plus
  expected outcome explicitly.
- Add the experiment lifecycle Hypothesis → Building → Measuring → Learned with guarded
  transitions.
- Require a typed `Measurement` and cutoff date before an experiment enters Measuring.
- Require a structured learning and a persevere/pivot decision before an experiment can
  become Learned.
- Add an Organization-scoped experiment board and a learning library that retain the
  KeyResult and Objective context.
- Replace the Motor Lean placeholder with a Spanish (LATAM), accessible workflow using the
  existing Radar design system.
- Persist all new tenant data behind PostgreSQL RLS and cover cross-Organization isolation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lean-experiments`: Make the existing hypothesis, lifecycle, measurement, closing, and
  learning-library requirements implementation-ready, including tenant isolation and
  KeyResult/Objective traceability.

## Impact

- New `src/modules/lean-experiments/` bounded context with domain, application, and
  infrastructure layers.
- A minimal read contract added to `src/modules/okrs/application/` so the new module can
  validate and display KeyResult and Objective context without deep imports.
- New Prisma models, enums, indexes, foreign keys, and RLS policies in a non-destructive
  migration.
- Existing `src/shared/measurement` is reused unchanged for experiment metrics.
- The `/motor-lean` route gains server actions, forms, lifecycle board, and learning library.
- New unit, PostgreSQL integration, RLS, UI, and Playwright coverage.
