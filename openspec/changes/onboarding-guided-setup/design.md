## Context

The current `/onboarding` route only creates an Organization through the public
`identity-org/application` API and redirects to `/members`. There is no `onboarding-setup` module,
progress persistence, or test coverage for the existing guided-flow requirement. The new state is
tenant data and must follow ADR-0002, ADR-0003, ADR-0006, and the Radar UI contract.

## Goals / Non-Goals

**Goals:**

- Establish a bounded context and persistence foundation that later template/import slices can
  extend without moving setup policy into Next.js handlers.
- Make first entry resumable and deterministic for new Organizations while preserving existing
  Organizations' current navigation.
- Keep all setup reads and writes tenant-scoped, Dirección-authorized, and test-first.
- Provide a complete basic path: profile → review → finish, plus skip.

**Non-Goals:**

- Recommending or applying templates.
- Parsing, mapping, previewing, validating, or importing CSV/XLSX files.
- Creating Teams, North Star, OKRs, or Skills as a side effect of basic setup.
- Adding permission/import audit events; those belong to their prioritized release slices.

## Decisions

### D1. `onboarding-setup` owns a small explicit aggregate

Create `OnboardingSetup` with one row per Organization, status (`Pending`, `Completed`,
`Skipped`), current step (`CompanyProfile`, `Review`), nullable normalized `companyType` and
`industry`, and timestamps. Domain functions validate profile fields and legal transitions;
application use cases authorize and orchestrate; the repository owns Prisma IO.

This keeps setup state out of cookies, query strings, UI components, and the `identity-org`
aggregate. A generic JSON draft was rejected because the known first-step fields deserve typed,
queryable columns and later slices can add explicit state when needed.

### D2. Existing Organizations are backfilled as skipped; new setup is started idempotently

The migration creates and RLS-protects the tenant table, then inserts `Skipped` progress for every
existing Organization. The Organization-creation action calls an idempotent onboarding bootstrap
after `identity-org` succeeds and redirects to the setup route. The setup page also uses the same
idempotent bootstrap when a just-created Organization has no row, recovering safely if the two
application calls were interrupted.

A database trigger was rejected because it would hide a cross-context side effect below both
application contracts. Expanding `identity-org` to own setup state was rejected because it reverses
the intended module dependency.

### D3. Every use case resolves actor, role, and tenant before repository access

The public application contract exposes `startOnboardingSetup`, `getOnboardingSetup`,
`saveCompanyProfile`, `completeOnboardingSetup`, and `skipOnboardingSetup`. Each mutation requires
Dirección through `identity-org/application`, then executes under `withTenantForUser`. The table has
`organization_id NOT NULL`, a unique Organization relationship, composite-safe ownership, and
`ENABLE` plus `FORCE ROW LEVEL SECURITY` policies.

`startOnboardingSetup` is idempotent and returns an existing row unchanged. Reads never accept an
Organization ID from the client; scope comes from the authenticated actor.

### D4. The page is server-owned; forms are thin validated adapters

`/onboarding` keeps its pre-Organization creation state. For a Member with setup progress it renders
the role-appropriate server projection: pending Dirección sees the wizard, completed/skipped setup
redirects to `/members`, and non-Dirección never receives mutation controls. Zod parses every
FormData boundary before calling application use cases. Client state is limited to submission
feedback; persisted application state is the source of truth.

The company-profile step captures company type and industry, the review step renders their saved
values, and Back is a persisted transition. Finish marks the aggregate completed without creating
template/import data.

### D5. Test levels follow the invariant boundary

Pure domain tests cover normalization and the state machine. PostgreSQL integration tests cover
authorization, idempotence, persistence, back/restore, existing-Organization backfill, RLS and
cross-tenant rejection. UI source/component tests cover Spanish Radar states and thin module
dependencies. A dev-auth Playwright scenario covers create Organization → profile → back → finish
and a separate retry-safe path covers skip.

## Risks / Trade-offs

- [Organization succeeds but setup bootstrap is interrupted] → The route repeats the idempotent
  bootstrap; no duplicate row can exist because Organization ownership is unique.
- [Existing users are unexpectedly redirected] → Migration backfills every existing Organization
  as `Skipped` and an integration test verifies it before application changes ship.
- [A future template/import slice needs more steps] → Persist a semantic step enum and add explicit
  migrations; do not store an untyped draft bag.
- [Cross-module orchestration leaks internals] → App and onboarding code import only public
  `identity-org/application` contracts; lint remains the enforcement gate.
- [The setup page becomes a second source of Organization identity] → Actor and tenant are always
  derived from authentication; no client-supplied Organization ID is accepted.

## Migration Plan

1. Add the enum types, tenant table, unique Organization relationship and indexes.
2. Backfill one `Skipped` row for every existing Organization inside the migration.
3. Enable and force RLS, add tenant policies, grants, and schema invariant tests.
4. Deploy application use cases and UI after the migration.
5. Rollback application code first. If database rollback is required before real onboarding data
   exists, remove the isolated setup table and enums; no existing Organization data is modified.
