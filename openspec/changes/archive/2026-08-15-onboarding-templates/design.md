## Context

See `proposal.md` for motivation. Guided onboarding already persists tenant-owned progress and a company profile, and its Review step can complete or skip setup. The target artifacts belong to four separate bounded contexts whose current public commands each open their own transaction. Template application must preserve ADR-0002 module boundaries, PostgreSQL RLS, Dirección authorization, the OKR roll-up invariant, and all-or-nothing behavior across those contexts.

## Goals / Non-Goals

**Goals:**

- Keep template definition and recommendation deterministic and testable without infrastructure.
- Coordinate materialization through public application interfaces while each target module retains its domain validation and persistence ownership.
- Commit all generated artifacts and onboarding completion in one tenant-scoped transaction.
- Make application conflict-safe and retry-safe without special-casing generated entities after creation.
- Preserve the current Review completion path for Organizations that do not want a template.

**Non-Goals:**

- A user-authored template builder, template marketplace, or remote catalog.
- Importing members, assigning generated Teams, or publishing generated Objectives.
- Merging a template into existing Organization structure.
- Recommending templates with probabilistic or external AI services.
- Changing edit rules in the target capabilities.

## Decisions

### 1. Use a versioned in-code catalog and pure recommendation policy

The onboarding domain owns a closed catalog keyed by stable identifiers for `saas-product`, `services-agency`, and `commerce-retail`. Each definition contains display metadata and the semantic blueprint needed for preview/materialization. A pure policy ranks exact company-type/industry matches and otherwise returns a fixed fallback, making the same profile produce the same recommendation.

This is preferred over database-managed templates because the initial catalog changes with product releases, needs code review and automated coverage, and does not yet require tenant customization. It is preferred over AI matching because deterministic behavior is auditable and works without a new dependency.

### 2. Extend setup persistence with an applied template identity

`OnboardingSetup` gains a nullable `appliedTemplateKey` constrained to be present only with terminal completed status. Applying a template transitions Review/Pending to Completed and records the key in the same compare-and-set update used for progress concurrency. Completing without a template leaves it null.

The application handles terminal retries before checking whether targets are empty: Completed with the same key returns the existing result, while Completed with another key is a conflict. This is preferred over inferring idempotency from generated rows because ordinary editable entities may later be renamed or deleted.

### 3. Orchestrate one tenant transaction through public application fragments

`onboarding-setup/application` opens one `withTenantForUser` transaction, loads the tenant-scoped setup snapshot, checks Dirección authority, resolves the catalog definition, and invokes trusted template-materialization fragments exported only from each target module's `application/` boundary. Those fragments receive the shared tenant client, perform their module-specific empty-target check and writes through their own infrastructure adapters, and return created identifiers.

The fragments are internal application contracts, not UI-facing commands. They preserve the dependency direction (domain pure ← application ← infrastructure) and avoid deep imports across modules. Reusing current top-level commands was rejected because their independent transactions could expose partial setup. Moving target writes into onboarding was rejected because it would violate bounded-context ownership.

### 4. Fail closed on any non-empty target capability

Before writes, each target application fragment reports whether its Organization-owned target is empty. Template application proceeds only when Teams, NorthStar, Objectives/KeyResults, and Skills are all empty. A conflict names the capability that blocks application, and no merging or deletion occurs.

This conservative rule avoids ambiguous ownership and accidental overwrites. Supporting partial merge is deferred because it needs a separate product contract for duplicate detection and reconciliation.

### 5. Persist ordinary domain entities and preserve target invariants

Materializers invoke the same domain constructors/validation used by manual creation and persist the normal records. Objectives start in Draft, model KeyResults use valid `Measurement` definitions, and required audit events are written in the shared transaction. No template marker is added to target entities, so their existing authorization and editing behavior remains unchanged and no generated data bypasses the OKR roll-up rules.

This is preferred over a parallel template-record model because copied template data must become real operational content immediately.

### 6. Present recommendation and preview in the existing Review step

The onboarding Review UI loads the saved company profile and pure recommendations, marks the preferred card, and exposes an accessible preview dialog/list. Applying requires a separate confirmation action; preview never writes. The existing finish-without-template action remains available. UI copy stays Spanish LATAM and styling uses the Radar design-system tokens/components.

Keeping the feature in Review avoids changing the persisted step state machine solely for a presentation sub-step. A separate route or additional persisted step was rejected as unnecessary complexity for the two-step guided flow.

### 7. Enforce authorization, tenancy, and concurrency at the server boundary

UI visibility is advisory only. Every recommendation/application read is resolved from the authenticated actor's Organization, and application revalidates Dirección inside the tenant transaction. IDs supplied by the client never select another tenant. RLS remains enabled on every touched table, and the setup compare-and-set prevents two concurrent confirmations from both materializing content.

Structural writes also coordinate through a transaction-scoped PostgreSQL advisory lock derived from the tenant ID. Template application takes the blocking lock before its setup compare-and-set and empty-target preflight, so a retry waits and then resolves through the persisted setup state. Ordinary Team, NorthStar, Objective, and Skill creation takes the same lock non-blockingly after authorization: if template application already owns it, the manual command fails with a stable busy conflict; if the manual command wins first, template preflight observes the non-empty target and refuses to apply. The lock complements RLS and database constraints; it does not replace either invariant.

The orchestrator maps known authorization, conflict, and validation failures to stable form results; unexpected failures abort the transaction and surface a generic retry message without leaking tenant data.

## Risks / Trade-offs

- [A target fragment inserts before a later fragment fails] → All fragments share one database transaction, and integration tests inject a late failure to prove rollback of both target rows and setup state.
- [Cross-module application contracts become an informal shared service] → Keep them narrowly named for template materialization, export them only from `application/index.ts`, accept the shared tenant client explicitly, and forbid onboarding imports from target domain/infrastructure paths.
- [Concurrent manual creation races with template preflight] → Coordinate template and ordinary structural writes with the same tenant-keyed transaction advisory lock, then retain setup CAS, empty-target checks, and database constraints as defense in depth.
- [A future catalog edit changes retry interpretation] → Persist stable template keys and treat catalog definitions as versioned release data; never reuse a key for different semantics.
- [Existing rows conflict with the new setup constraint] → Add the nullable column first; existing Organizations are already terminal Skipped and remain valid because no key is required for Skipped.
- [Large templates increase transaction duration] → Initial templates are deliberately bounded; use bulk inserts where module invariants permit and keep external calls outside the transaction.

## Migration Plan

1. Add nullable `applied_template_key` to onboarding setup and a compatible status/key check constraint; regenerate the Prisma client.
2. Deploy catalog, public application fragments, orchestrator, and UI together. Existing Organizations retain their prior Completed/Skipped state and are never forced back into setup.
3. Verify RLS policies and tenant-safe relationships remain effective; no backfill is required.
4. Rollback application code first if necessary. The nullable column can remain harmlessly; a later migration may remove it only after confirming no applied-template values exist or after preserving their audit meaning elsewhere.
