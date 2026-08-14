## Why

Ensambla already captures execution, capacity, culture, rituals, feedback, and learning,
but Dirección, Líderes, and Colaboradores still have to inspect those contexts separately.
The dashboard must turn those existing signals into one role-safe operating view that makes
misalignment visible and actionable without weakening tenancy, feedback privacy, eNPS
anonymity, or OKR roll-up.

## What Changes

- Add a consolidated Dirección dashboard with global OKR progress, Team health,
  culture/eNPS, and learning velocity widgets derived from current source data.
- Add prioritized, live misalignment risks for unowned or project-less KeyResults,
  over-capacity Teams, overdue retrospectives, and Teams with low feedback activity.
- Remove risks automatically from the view when their source condition is resolved.
- Add role-scoped dashboard projections: Team data and suggested actions for Líderes;
  personal objectives, load, feedback, growth, and pending pulse work for Colaboradores.
- Add a privacy-safe feedback-health application contract that exposes aggregate activity
  only, never private Feedback content.
- Replace the current partial dashboard page with accessible Radar widgets and explicit
  loading, empty, and error states.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `executive-dashboard`: Make widget metrics, risk evaluation, resolution behavior, and
  role-specific projections precise and automatically verifiable.

## Impact

- New `src/modules/executive-dashboard/` bounded context with pure domain policies and a
  public application query that orchestrates other modules through their `application/`
  contracts.
- Focused additions to the public `feedback-growth/application/` contract and its
  infrastructure repository for aggregate activity counts.
- Dashboard UI under `src/app/(app)/dashboard/`, plus Vitest integration/unit tests and a
  Playwright role-view flow.
- No database migration or new runtime dependency is expected; all values and risks are
  derived from existing tenant-scoped records.
- Protected invariants affected: multi-tenancy/RLS, eNPS minimum-N suppression, private
  Feedback visibility, and derived OKR progress.
