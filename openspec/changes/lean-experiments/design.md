## Context

The repository already has a stable OKR module, typed `Measurement` persistence helpers,
tenant-scoped application transactions, and a Radar app shell. `/motor-lean` is currently
only a placeholder. Lean experiments need a new bounded context while preserving ADR-0002
module boundaries, ADR-0003 tenant isolation, and ADR-0004's single measurement model.

The capability crosses one module boundary: every hypothesis must reference a KeyResult
and its Objective. The Lean module must not query OKR infrastructure directly. All tenant
tables must carry `organization_id`, use RLS, and prevent cross-Organization references.

## Goals / Non-Goals

**Goals:**

- Represent the hypothesis, experiment lifecycle, and structured learning as explicit
  domain concepts.
- Enforce ordered state transitions and the prerequisites for Measuring and Learned in a
  pure domain layer.
- Reuse the shared `Measurement` union and persistence mapping unchanged.
- Make every persisted relationship tenant-safe and test it against PostgreSQL RLS.
- Expose an accessible Spanish (LATAM) board and learning library through the existing app
  shell.
- Preserve the `KeyResult` and `Objective` trace needed by the future executive dashboard.

**Non-Goals:**

- Experiment assignment, comments, attachments, reminders, notifications, or external
  integrations.
- Editing or reopening an experiment after it reaches Learned.
- Drag-and-drop as the only lifecycle interaction; explicit buttons remain the accessible
  source of truth.
- Changes to `Measurement` kinds or their progress calculation.
- Learning-velocity widgets in the executive dashboard.

## Decisions

### 1. Use a three-entity aggregate with one-to-one lifecycle records

`Hypothesis` stores `belief`, `expectedOutcome`, `keyResultId`, and `objectiveId`.
`Experiment` owns the status plus the optional typed measurement and cutoff. `Learning`
is created exactly once when the experiment becomes Learned and stores `believed`,
`tested`, `learned`, and `decision`.

This structure makes the ubiquitous concepts queryable and prevents a partially closed
experiment from masquerading as a learning. A single wide experiment row was considered,
but it would rely on many nullable columns and application convention to distinguish a
valid learning.

### 2. Keep the transition rules pure and make writes compare-and-set

The domain accepts only `Hypothesis → Building → Measuring → Learned`. Entering Measuring
requires a valid shared `Measurement` plus a cutoff date. Entering Learned requires all
three learning statements and a `persevere` or `pivot` decision.

Infrastructure updates include the expected current status in the write predicate. A
concurrent stale transition therefore fails instead of skipping or overwriting a state.
Allowing arbitrary status updates in application handlers was rejected because it would
duplicate the invariant across entry points.

### 3. Reuse the shared Measurement columns unchanged

Experiment metrics use the existing discriminated union and
`measurementToColumns`/`measurementFromColumns`. Prisma stores the discriminator and
typed nullable columns, never generic EAV or unvalidated JSON. Metric columns are null
until Measuring and become immutable after Learned.

### 4. Enforce tenant ownership at both application and database boundaries

Every new table contains `organization_id`, has indexes and forced RLS policies based on
the existing tenant session setting, and uses Organization-scoped uniqueness where a
composite relationship is needed. The hypothesis's KeyResult and Objective references
include `organization_id`, preventing a row in one Organization from referencing OKR data
from another even if an ID is known.

Application entry points run through `withTenantForUser`. Reads and writes within one
transaction are awaited sequentially to preserve the serialized-query contract of the
PostgreSQL client.

### 5. Add a minimal OKR application read contract

`okrs/application` exposes a query that resolves a visible KeyResult to its ID, title,
Objective ID, and Objective title for the current actor. Lean application cases use that
contract before persisting a hypothesis and when presenting board/library context. No
Lean file imports OKR domain or infrastructure internals.

The existing `listObjectives` contract supplies selectable active KeyResults to the UI;
the focused resolver handles validation and retained context. Direct Prisma reads from
the Lean module were rejected because they violate ADR-0002.

### 6. Use server-rendered views and explicit lifecycle actions

The Motor Lean page renders four status columns, creation and transition forms, empty,
loading, and error states, plus a learning library. Server actions authenticate through
the existing auth adapter and call only public application interfaces. Status text and
form feedback are Spanish (LATAM), and status is never communicated by color alone.

The first version does not require client-side drag-and-drop. This keeps keyboard access
and server-side validation straightforward while retaining the Kanban information model.

### 7. Membership and visible-KR access are the authorization boundary

The current capability spec defines no additional role restriction. Any authenticated
Organization Member may create and advance an experiment only when the linked KeyResult
is visible through the OKR public contract. This avoids inventing a Dirección/Líder-only
rule; a future role restriction would require its own spec change.

## Risks / Trade-offs

- **[Cross-module context can become stale between validation and persistence]** → Store
  immutable IDs, enforce tenant-safe foreign keys, and resolve current titles through the
  OKR public contract when reading.
- **[Concurrent lifecycle actions can race]** → Use expected-status compare-and-set and
  return a deterministic stale-transition application error.
- **[Composite tenant foreign keys add redundant unique indexes]** → Accept the small
  storage cost for database-enforced cross-tenant safety.
- **[A cutoff date has timezone ambiguity]** → Accept an ISO date from UI and normalize it
  to a UTC instant at the application boundary.
- **[A board query could trigger many OKR context lookups]** → Resolve unique KeyResult IDs
  in a sequential batched public query rather than one transaction per card.

## Migration Plan

1. Add non-destructive enums and tables for hypotheses, experiments, and learnings.
2. Add tenant-scoped indexes, composite foreign keys, and forced RLS policies in the same
   migration.
3. Generate Prisma types and deploy application code after the migration; existing rows
   and routes are unaffected because the new tables start empty.
4. Rollback before data is created by dropping only the new tables/enums and redundant
   composite unique indexes. After production data exists, prefer a forward fix and data
   export over destructive rollback.

## Open Questions

None. Role-specific management, reopening, and collaboration features remain explicitly
outside this change until specified.
