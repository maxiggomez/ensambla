## Context

The repository already has tenant-scoped Members, Organization values, Projects, Objectives,
KeyResults, Skills, and Competencies behind public application contracts. Feedback & Carrera
is still a placeholder, Projects have no lifecycle state, and no persistence exists for
Feedback, requests, Kudos, or GrowthPlans.

This change crosses several bounded contexts but owns only feedback and growth data. It must
preserve ADR-0002 module boundaries, ADR-0003 tenant isolation, the private nature of
person-to-person Feedback, and the rule that GrowthPlan progress is derived rather than an
editable percentage.

## Goals / Non-Goals

**Goals:**

- Model Feedback, FeedbackRequest, Kudo, GrowthPlan, GrowthTarget, and GrowthEvidence as
  explicit tenant aggregates.
- Keep private Feedback visible only to author and recipient while making Kudos visible in
  Organization activity.
- Validate Members, Organization values, Projects, Objectives, KeyResults, and Skills only
  through their modules' public application contracts.
- Derive GrowthPlan skill gaps and progress from the competency matrix.
- Allow only received Feedback and closed Projects to act as plan evidence.
- Add the minimal Project lifecycle necessary to represent closed-project evidence.
- Provide an accessible Spanish (LATAM) vertical UI and deterministic automated coverage.

**Non-Goals:**

- Anonymous feedback, performance ratings, compensation, promotion workflows, review cycles,
  calibration, comments, reactions, notifications, email delivery, or file attachments.
- Editing or deleting delivered Feedback and Kudos.
- Assigning Members directly to Projects or inferring that a Member participated in a
  Project; evidence selection remains an explicit owner action.
- Automatically changing Competency levels from Feedback or evidence.
- Reopening a closed Project or implementing a general Project management workflow.

## Decisions

### 1. Separate private Feedback, directed requests, and public Kudos

`Feedback` stores author, recipient, body, classification, optional Project, optional Value
snapshot, and an optional unique request. `FeedbackRequest` stores requester, requested
Member, and prompt; pending versus fulfilled is derived from whether its Feedback relation
exists. `Kudo` stores giver, recipient, message, required Value snapshot, and at most one
Objective or KeyResult link.

Separate tables keep privacy and lifecycle rules explicit. A single polymorphic activity row
was rejected because nullable fields and a visibility flag would make accidental disclosure
more likely.

### 2. Treat Organization values as validated snapshots

Values currently live as a string array on Organization rather than identity-bearing rows.
Application cases read `getStrategy`, require an exact current value, and persist the string
snapshot. Existing records therefore remain meaningful if Dirección later edits the strategy.
Creating a new Value entity was rejected because it would expand the strategy capability and
migrate existing arrays without improving this slice.

### 3. Enforce privacy in application reads and tenancy in PostgreSQL

All new tables contain `organization_id`, use forced RLS policies, tenant-scoped indexes, and
composite foreign keys where they reference another tenant row. Application queries for
Feedback include `author_id = actor OR recipient_id = actor`; requests expose requester-owned
outbox and requested-Member inbox; Kudos are Organization-visible.

The database tenant session does not carry Member identity, so RLS enforces Organization
isolation while focused application tests enforce participant privacy. Broad tenant feedback
reads are not exported from the module.

### 4. Derive request state and GrowthPlan progress

A FeedbackRequest is pending until a unique Feedback points to it; no mutable status column is
needed. A GrowthPlan has a next milestone and one or more `GrowthTarget` rows. For every target,
the current level comes from `getCompetencyMatrix` (missing competency means level zero), the
gap is `max(target - current, 0)`, and overall progress is the average of
`min(current / target, 1)` for non-zero targets.

Storing progress was rejected because it would drift from the competency matrix. Evidence is
context, not an automatic skill-level mutation.

### 5. Represent evidence with an exclusive typed source

`GrowthEvidence` uses a closed source discriminator (`Feedback | Project`) plus nullable
typed foreign keys and a database CHECK requiring exactly the matching reference. Application
cases verify that Feedback belongs to the plan owner as recipient or that Project context is
Closed before insertion. A unique constraint prevents attaching the same source twice.

Generic JSON or EAV evidence was rejected because it weakens referential integrity and tenant
queries.

### 6. Add only Active → Closed to the Project lifecycle

`Project` receives a required `status` with default `Active`. The `teams-staffing` domain
allows only Active → Closed, and its existing Project management policy continues to allow
Dirección and Líder. Infrastructure uses an expected-status compare-and-set, while the public
application contract resolves `{ projectId, name, status }` for authenticated same-tenant
Members.

Feedback-growth never imports Project infrastructure or domain internals. A status supplied
by the Feedback UI without a public validation contract was rejected as forgeable.

### 7. Validate cross-module context before tenant writes

Feedback-growth uses `listMembers`, `getStrategy`, Project context, `getObjective`,
`getKeyResultContext`, and `getCompetencyMatrix` through public application exports. It then
opens its own `withTenantForUser` transaction and performs sequential reads/writes. Composite
tenant foreign keys protect against context becoming cross-tenant between validation and
persistence.

### 8. Use server-rendered role-neutral workflows

The route renders the actor's private Feedback, request inbox/outbox, Organization Kudo
activity, and own GrowthPlan. Server actions use Zod at the FormData boundary and call only
public application cases. Explicit labelled forms and buttons remain keyboard accessible;
empty, loading, error, and success feedback use existing Radar tokens and Spanish copy.

## Risks / Trade-offs

- **[Private Feedback could leak through an overly broad query]** → Keep participant filters
  inside dedicated repository functions, export no raw list, and test a third same-tenant
  Member as well as a cross-tenant Member.
- **[Organization values can change after validation]** → Persist an immutable validated
  snapshot; composite tenant references are not possible for the current string-array model.
- **[Cross-module validation and persistence are not one transaction]** → Use immutable IDs,
  tenant composite foreign keys, and deterministic not-found errors if referenced rows change.
- **[A Project can be attached without proof the owner worked on it]** → Make evidence an
  explicit owner-curated link and defer Project membership to a separate capability change.
- **[Progress with a target level of zero has ambiguous division]** → Allow levels zero to
  four but treat a zero target as fully satisfied and exclude it from the division denominator.
- **[Generated Prisma output creates a large diff]** → Regenerate with the repository's pinned
  Prisma version and keep source changes scoped through `.gitattributes` as already configured.

## Migration Plan

1. Add `ProjectStatus` and the non-null `Project.status` column with default `Active`.
2. Add FeedbackRequest, Feedback, Kudo, GrowthPlan, GrowthTarget, and GrowthEvidence tables,
   constraints, composite tenant foreign keys, indexes, and forced RLS policies.
3. Regenerate the checked-in Prisma client and deploy the application after the additive
   migration. Existing Projects remain Active and existing routes remain compatible.
4. Before data exists, rollback may drop the new tables/status column/enums. After data exists,
   prefer a forward fix and export because rollback would discard feedback and growth history.

## Open Questions

None. Manager-authored plans, notifications, Project participation, and automatic competency
updates remain outside this change until specified.
