## Context

`openspec/specs/executive-dashboard/spec.md` (and the archived delta that produced it) states the
`key-result-alignment` risk triggers when "a published KeyResult has no Project moving its
Objective **or no accountable owner**". The authored decision for the change that implemented the
dashboard (`openspec/changes/archive/2026-08-14-executive-dashboard/design.md`) is explicit:

> "the existing Objective foreign key guarantees the owner in stored data" · "Add editable
> KeyResult ownership" is a **non-goal** · "Treat the Objective owner as the accountable owner
> and document independent KR ownership as out of scope rather than adding an unapproved
> migration".

The schema enforces this: `Objective.ownerId` is required and has a foreign key to `Member`
(`prisma/schema.prisma`). The `okrs` spec likewise requires every Objective to have "an assigned
owner". Consequently a published KeyResult's accountable owner always exists; "no accountable
owner" is not a constructible state and cannot be red/green tested.

## Decision

Adopt the implemented design and align the spec to it:

- The accountable owner of a KeyResult is the required owner of its owning Objective; it is
  always present and SHALL NOT add an independent trigger, simulated data, or a fabricated risk.
- The `key-result-alignment` risk derives from the one observable condition: a published
  KeyResult whose Objective is moved by no Project (`teams-staffing.evaluateAlignment`).
- The existing scenario-to-test mapping stands: `dashboard-policy.test.ts` (published KR without
  Project → stable critical risk, deterministic order, removal on resolve).

## Non-goals

- Adding per-KeyResult ownership (`KeyResult.ownerId`), a migration, or RLS changes.
- Changing `okrs`, `teams-staffing`, or any delivery capability.
- Changing risk severity, ordering, or suggested-action copy.

## Risks

- None of substance: the change narrows spec promises to the implementable derivation and keeps
  every existing dashboard scenario covered by green tests.