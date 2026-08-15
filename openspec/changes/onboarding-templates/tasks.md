## 1. Catalog and recommendation slice

- [x] 1.1 Add failing onboarding domain tests for exact profile matching, deterministic fallback, stable catalog keys, and complete preview blueprints
- [x] 1.2 Implement the pure versioned catalog and recommendation policy until the domain tests pass
- [x] 1.3 Refactor catalog types and Spanish presentation metadata without changing recommendation behavior

## 2. Setup state and persistence slice

- [x] 2.1 Add failing domain and integration tests for applying a template from Review, completing without one, same-key idempotency, different-key conflict, and compare-and-set concurrency
- [x] 2.2 Extend `OnboardingSetup` with nullable applied-template identity and implement the domain transitions
- [x] 2.3 Add the Prisma schema change and migration, regenerate the client, and adapt the tenant-scoped setup repository
- [x] 2.4 Add migration/RLS regression tests proving existing Organizations remain terminal and setup rows remain tenant-isolated

## 3. Transactional materialization slice

- [x] 3.1 Add failing integration tests for Dirección authorization, cross-tenant denial, empty-target preflight, and no modification of existing Organization content
- [x] 3.2 Add failing integration tests that assert all template Teams, NorthStar, draft Objectives/model KeyResults with audit events, and Skills are created as ordinary domain entities
- [x] 3.3 Add failing integration tests for same-confirmation duplicate prevention and injected late-failure rollback of every target row and setup state
- [x] 3.4 Implement narrow public application fragments in Teams, Strategy, OKRs, and Skills that validate emptiness and materialize their portion with a supplied tenant client
- [x] 3.5 Implement the onboarding application orchestrator and form validation to authorize Dirección, coordinate the shared transaction, map conflicts safely, and export only public application contracts
- [x] 3.6 Refactor shared orchestration types while preserving module-boundary lint rules and target domain ownership

## 4. Review UI slice

- [x] 4.1 Add failing component tests for recommended marking, deterministic fallback rendering, accessible preview content, explicit confirmation, pending/error states, and finish-without-template
- [x] 4.2 Implement the Spanish LATAM Review UI with Radar cards/dialog/feedback states using existing design-system tokens and components
- [x] 4.3 Add failing Playwright coverage for profile-to-recommendation, preview-without-writes, successful application, editable generated content, and retry-safe completion
- [x] 4.4 Complete the end-to-end UI wiring and accessibility refinements until component and Playwright scenarios pass

## 5. Objective verification and review

- [x] 5.1 Run focused domain, integration, migration/RLS, component, and Playwright suites and record green evidence for every delta scenario
- [x] 5.2 Run OpenSpec strict validation, generated-client drift check, typecheck, module-boundary lint, formatting, production build, full unit/integration suite, and full E2E suite
- [x] 5.3 Run `mg-pr-review` read-only against the delta, invariants, ADRs, and project conventions; resolve every blocking finding and rerun affected checks
- [x] 5.4 Present the final diff and verification evidence for explicit commit approval without pushing
