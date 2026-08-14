## 1. Privacy-safe Feedback health slice

- [x] 1.1 RED: add integration tests for group Feedback counts, rolling-window exclusion, output shape, and cross-tenant member rejection in `test/integration/feedback-growth-health.test.ts`
- [x] 1.2 GREEN: add the aggregate repository query, `getFeedbackHealth` application contract, validation, and public export without selecting private Feedback fields
- [x] 1.3 REFACTOR: remove duplicate group/member normalization while keeping the directed Feedback health integration suite green

## 2. Dashboard domain policies slice

- [x] 2.1 RED: add pure unit tests for published Objective progress, Team health, fixed learning windows, empty/protected culture states, and deterministic risk generation/removal in `src/modules/executive-dashboard/domain/dashboard-policy.test.ts`
- [x] 2.2 RED: add pure unit tests for Dirección, Líder Team scope, Colaborador personal scope, and suggested actions in `src/modules/executive-dashboard/domain/dashboard-scope.test.ts`
- [x] 2.3 GREEN: implement pure metric, risk-priority, and role-scope policies in `src/modules/executive-dashboard/domain/`
- [x] 2.4 REFACTOR: consolidate stable dashboard view types and clock/window helpers while all domain tests remain green

## 3. Executive dashboard application slice

- [x] 3.1 RED: add Dirección integration scenarios for consolidated current metrics, fresh recomputation, protected eNPS, prioritized risks, risk resolution, and derived OKR roll-up in `test/integration/executive-dashboard.test.ts`
- [x] 3.2 RED: add Líder and Colaborador integration scenarios for Team/personal scoping and the absence of another Member's private Feedback in `test/integration/executive-dashboard-roles.test.ts`
- [x] 3.3 RED: add an Organization-isolation regression, including foreign Feedback-health member IDs, in `test/integration/executive-dashboard-tenancy.test.ts`
- [x] 3.4 GREEN: implement the sequential `getDashboard` orchestrator and its public `application/index.ts`, consuming other modules only through public application contracts
- [x] 3.5 REFACTOR: reduce repeated source reads and mapping without concurrent queries on a transaction client, then rerun all dashboard and protected-invariant integration tests

## 4. Dashboard UI slice

- [x] 4.1 TEST-ALONGSIDE: add `executive-dashboard-ui.test.ts` assertions for Spanish role sections, protected/empty/error/loading states, accessible semantics, Radar tokens, and the single executive-dashboard application dependency
- [x] 4.2 IMPLEMENT: refactor `dashboard/page.tsx` to render the role-discriminated projection and local presentation components without business rules
- [x] 4.3 IMPLEMENT: add `dashboard/loading.tsx` and `dashboard/error.tsx` with accessible Spanish feedback and retry behavior
- [x] 4.4 VERIFY: run the directed UI and application tests and confirm the three role projections render from their contract

## 5. Role flow acceptance

- [x] 5.1 TEST-ALONGSIDE: add `e2e/executive-dashboard.spec.ts` covering Dirección consolidated widgets, Líder Team scope/actions, Colaborador personal sections, and protected content absence using the existing dev-auth database
- [x] 5.2 IMPLEMENT: include the dashboard spec in the dev-auth Playwright configuration and isolate its fixture state from other specs
- [x] 5.3 VERIFY: run the dashboard Playwright spec alone, then the complete dev-auth Playwright suite

## 6. Verification and review

- [x] 6.1 Run typecheck, lint/module boundaries, format check, unit/integration tests, relevant protected-invariant suites, production build, and strict OpenSpec validation
- [x] 6.2 Run `mg-pr-review` read-only against the full diff, resolve its blocking findings, stop after the protocol limit, and complete the user-authorized final focused review
- [x] 6.3 Record RED-to-GREEN evidence for every delta Scenario and leave all completed task checkboxes synchronized with objective verifier results

## RED → GREEN Evidence

- Feedback health: 3 tests failed because `getFeedbackHealth` did not exist, then passed with aggregate-only tenant validation.
- Dashboard domain: 8 tests failed because metric, risk, and role-scope policies did not exist, then passed with pure deterministic policies.
- Dashboard application: 4 tests failed because the public application module did not exist; after orchestration, one Líder scope regression exposed and fixed an out-of-scope retrospective before all 4 passed.
- Tenant isolation: the expanded 2-test PostgreSQL regression passes with equivalent OKR, Team, protected Pulse, Learning, and risk signals in two Organizations plus explicit rejection of a foreign Feedback-health Member.
- UI contract: 3 tests pass for Spanish role views, protected/empty/loading/error states, accessibility, Radar tokens, and the single public dashboard dependency.
- Browser acceptance: the directed flow passes 1/1 and the complete dev-auth suite passes 18/18 across Dirección, Líder, and Colaborador.
- Final verification: Vitest 115 files / 445 tests, typecheck, lint, format, build, OpenSpec 14/14 strict, diff check, and skill anti-drift all pass; final `mg-pr-review` status is `APPROVED`.
