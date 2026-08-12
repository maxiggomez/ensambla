## Context

The archived `strategy-okrs-core` change delivered tenant-scoped Objectives and
KeyResults, typed Measurements, publication policy, visibility, and the derived
roll-up. The main `okrs` specification also requires cadence, check-ins,
alignment, cycle close, and history, but no data model or UI exists for them.

The design must preserve three constraints: `Objective.progress` remains absent
from persistence and inputs; every tenant row is protected by PostgreSQL RLS;
and cross-module reads go only through public `application/` interfaces. The
current Team-level Objective has no Team reference and the current alignment
model has pillar links but no Objective parent, so both associations must become
explicit before cadence and alignment can be deterministic.

## Goals / Non-Goals

**Goals:**

- Complete every remaining Scenario in the main `okrs` specification.
- Keep outdated, at-risk, KeyResult progress, and Objective progress derived.
- Make cycle close and archived history explicit and auditable.
- Deliver a usable Spanish (LATAM) OKR workspace and Dirección risk summary.
- Add only tenant-scoped, additive database changes with RLS in the same migration.

**Non-Goals:**

- Email, push, or third-party notification delivery; this change exposes due
  reminder records for a scheduler/delivery adapter.
- Configurable KeyResult weights; roll-up remains an equal-weight average.
- External object-storage integration; file evidence is stored by the OKR
  evidence repository for the MVP and remains behind its interface.
- Editing `teams-staffing` or `strategy-northstar` internals.

## Decisions

### D1 — Explicit Objective scope and hierarchy

`Objective` gains nullable `team_id`, `parent_objective_id`, and `cycle_id`.
New Team-level Objectives require `team_id`; other levels reject it. A parent
must belong to the same tenant and cannot create a cycle. Application code
validates Team existence and membership through `teams-staffing/application`;
the OKR domain never imports another module.

Alternative considered: infer a Team from the owner. Rejected because a Member
may belong to multiple Teams and the association would be nondeterministic.

### D2 — Cadence is a tenant row with deterministic precedence

`OkrCadenceConfig` targets exactly one Objective or Team and stores `Weekly`,
`Biweekly`, or `Monthly`. Objective configuration overrides Team configuration.
When neither exists, the KeyResult is neither overdue nor reminder-due; the
system does not silently force weekly cadence. A Team cadence applies only to
Objectives whose explicit `team_id` matches.

Elapsed periods use calendar arithmetic from the latest check-in timestamp, or
from Objective publication when no check-in exists. Domain functions receive a
clock value so tests are deterministic. The application exposes due reminders;
delivery is outside this slice.

### D3 — Check-ins are append-only facts; risk and progress are derived

A `CheckIn` belongs to a KeyResult and stores the validated typed value,
confidence (0–10), optional comment, and timestamp. Recording a check-in and
updating the KeyResult's current Measurement columns happen in one tenant
transaction. `atRisk` is derived from the latest check-in confidence `< 5` and
is never persisted. `outdated` is derived from effective cadence and the latest
check-in/publication timestamp and is never persisted.

Alternative considered: persist `at_risk` and `outdated` flags. Rejected because
they would drift from confidence, cadence, and time.

### D4 — Evidence is modeled explicitly

`CheckInEvidence` uses a closed discriminator (`Link` or `File`). Link evidence
stores a validated HTTPS URL. File evidence stores filename, media type, size,
and bytes, capped at 5 MiB through one domain constant re-exported by the public
application API and enforced before the UI reads file bytes. Keeping file persistence
behind `check-in-repo.ts` lets a later change replace PostgreSQL bytes with
object storage without changing domain or application contracts.

Alternative considered: accept only a storage URL. Rejected for this slice
because no upload provider exists and the file Scenario would not be end-to-end.

Lifecycle integration scenarios create their own Objective/cycle fixtures so each
Scenario can run independently without relying on Vitest declaration order.

### D5 — Alignment is computed, not duplicated

The OKR module walks `parent_objective_id` inside its own repository and consumes
`getStrategicMap` through `strategy-northstar/application` for pillar and North
Star information. The application merges both views into an `AlignmentChain`.
An Objective is orphaned when it has neither a parent nor a Strategic Pillar
link. No orphan flag or rendered chain is stored.

### D6 — Cycles and close states are explicit

`OkrCycle` has a name, start, and end date. `ObjectiveStatus` becomes `Draft |`
`Published | Closed | Archived`; `KeyResultGrade` becomes `Achieved | Partial |`
`NotAchieved`. Dirección grades every KeyResult before close. Archive is allowed
only from `Closed`, and all mutation use cases reject archived Objectives.

Carry-over receives a destination cycle, creates or reuses a draft successor
Objective linked by `source_objective_id`, and copies the selected KeyResult as
a new draft KeyResult linked by `source_key_result_id`. Historical rows are not
mutated.

### D7 — Audit is immutable and transactional

`OkrAuditEvent` records tenant, actor, action, entity type/id, timestamp, and a
JSON metadata snapshot without secrets or file bytes. Every OKR mutation writes
its audit event in the same transaction. RLS provides tenant-scoped SELECT and
INSERT policies only; UPDATE and DELETE have no policies, making events immutable
for the application role. Dirección can list the tenant audit history.

### D8 — Public contracts and layer direction

Business rules live in `okrs/domain`; use cases orchestrate in
`okrs/application`; Prisma and row mapping remain in `okrs/infrastructure`.
The UI imports only `okrs/application`. Existing public Team and strategy reads
are consumed as-is. If their returned data proves insufficient, implementation
stops and the architectural impact map is re-approved before any foreign module
is changed.

### D9 — UI is server-first with focused client forms

`src/app/(app)/okrs/page.tsx` loads visible Objectives, cycles, and risk through
the public application API. Server actions validate `FormData` with Zod and call
use cases. Client components are limited to typed Measurement controls and file
selection. The page includes empty, loading, and error states and uses existing
Radar tokens and shadcn primitives without new design tokens.

## Risks / Trade-offs

- [Database growth from file evidence] → enforce a 5 MiB limit, keep bytes out of
  audit metadata, and isolate persistence behind a replaceable repository.
- [Recursive Objective hierarchy] → validate parent changes in domain/application
  and add a database self-reference; integration tests cover cycle rejection.
- [RLS omissions on new tables] → create ENABLE + FORCE RLS and policies in the
  same migration, plus cross-tenant tests for every new aggregate.
- [Derived time status can be flaky] → inject `now` into domain calculations and
  use fixed instants in tests.
- [Large vertical slice] → implement one Scenario group at a time in strict
  red/green order and keep the archived core behavior under regression tests.
- [Cross-module recursion] → alignment calls are composed at application level;
  `strategy-northstar` already consumes OKRs, so OKRs must not call its strategic
  map from inside an active tenant transaction.

## Migration Plan

1. Add nullable references and new tables/enums so existing rows remain valid.
2. Create indexes, foreign keys, ENABLE/FORCE RLS, and tenant policies in the
   same additive migration.
3. Regenerate Prisma client and deploy application code that understands both
   legacy null associations and new explicit associations.
4. New Team Objectives require a Team and new cycle operations require a cycle;
   existing Objectives remain readable and can be assigned through new use cases.

Rollback is application-first. The additive schema can remain unused; dropping
tables or columns is intentionally excluded from automated rollback.

## Open Questions

None. Any need to modify a dependency module or introduce external storage is a
stop condition requiring a revised impact map.
