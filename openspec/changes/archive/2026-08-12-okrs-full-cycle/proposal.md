## Why

The existing `okrs` module implements the Objective → KeyResult core, but the
capability is not usable end-to-end: check-in cadence, evidence and confidence,
alignment, cycle close, audit history, and the UI are still missing. Completing
those requirements now turns the archived core into the full workflow defined by
the main `okrs` specification while preserving tenant isolation and derived
progress.

## What Changes

- Add Objective and Team check-in cadence with objective-level precedence,
  due-reminder calculation, and derived outdated status.
- Add typed KeyResult check-ins with comments, link or file evidence, confidence,
  and derived at-risk status; surface at-risk KeyResults to Dirección.
- Add explicit Team association and parent-Objective alignment so the chain from a
  KeyResult through higher Objectives or Strategic Pillars to the North Star can be
  read and orphan Objectives can be identified.
- Add OKR cycles, end-of-cycle grading, KeyResult carry-over, Objective close and
  read-only archival history.
- Add an immutable, tenant-scoped audit trail for OKR mutations.
- Replace the OKRs placeholder with a Spanish (LATAM) workspace covering creation,
  publishing, check-ins, alignment, risk, cycle close, and required UI states.
- Add RLS-protected persistence and automated unit, integration, UI, and end-to-end
  coverage for every affected Scenario.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `okrs`: Clarify the missing full-cycle behavior required to implement cadence
  precedence, Team and parent alignment, evidence persistence, immutable audit,
  and read-only lifecycle states without changing the roll-up invariant.

## Impact

- `src/modules/okrs/`: new domain policies, application use cases, public views,
  and tenant-scoped repositories; extensions to the existing lifecycle.
- `src/app/(app)/okrs/` and `src/app/(app)/dashboard/`: full OKR workspace and
  Dirección risk summary.
- `prisma/schema.prisma` and one additive migration: cycles, cadence, check-ins,
  evidence, audit, alignment fields, grading, and RLS policies.
- Public application interfaces of `identity-org`, `teams-staffing`, and
  `strategy-northstar` are consumed; their internal layers remain untouched.
- Areas under invariant protection: multi-tenancy/RLS, OKR progress roll-up,
  authorization, and auditability.
