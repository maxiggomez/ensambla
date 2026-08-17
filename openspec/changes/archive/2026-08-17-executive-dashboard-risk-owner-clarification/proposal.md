## Why

The `executive-dashboard` spec promises a risk when a published KeyResult "has no Project moving
its Objective **or no accountable owner**". The implemented design (archived change
`2026-08-14-executive-dashboard`, `design.md`) deliberately treats the owning Objective's owner
as the only accountable owner and that `ownerId` is a NOT NULL foreign key, so a KeyResult can
never lack an accountable owner in stored data. The second branch of the trigger is therefore
not an independently observable, testable condition: the requirement overpromises behaviour the
data model cannot represent and leaves its scenario unmappable to a test.

## What Changes

- Reword the "Automatic misalignment risks" requirement so the `key-result-alignment` risk
  triggers on a published KeyResult with no Project moving its Objective, and state explicitly
  that the accountable owner is the required owner of the owning Objective (`okrs`) and is
  always present (no independent trigger, no fabricated data).
- Reword the "Generate a risk alert" scenario to the representable condition.
- No behaviour, code, schema, or migration change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `executive-dashboard`: clarify the alignment-risk trigger so the requirement matches the
  implemented derived-risk data model and remains scenario-testable.

## Impact

- Spec delta only, under `openspec/changes/executive-dashboard-risk-owner-clarification/`; synced
  to `openspec/specs/executive-dashboard/spec.md` on archive.
- No source-code, Prisma, RLS, or runtime change. Existing unit test
  `executive-dashboard/domain/dashboard-policy.test.ts` already maps the clarified scenario
  (published KeyResult without a Project → stable `key-result-alignment` critical risk with a
  suggested action, removed when resolved).