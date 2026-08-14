## 1. Persistence and tenant invariants

- [x] 1.1 RED: add schema integration tests for the setup enums/table, one-row-per-Organization ownership, existing-Organization `Skipped` backfill, grants, and ENABLE + FORCE RLS
- [x] 1.2 GREEN: extend `prisma/schema.prisma`, add the migration, backfill existing Organizations, regenerate the client, and satisfy the schema/RLS tests
- [x] 1.3 REFACTOR: centralize setup row fixtures and rerun global RLS coverage without weakening any policy

## 2. Setup domain policy

- [x] 2.1 RED: add pure unit tests for company type/industry normalization, pending step transitions, Back restoration, completion, skip, and terminal-state immutability
- [x] 2.2 GREEN: implement the pure `OnboardingSetup` aggregate and transition policy in `src/modules/onboarding-setup/domain/`
- [x] 2.3 REFACTOR: consolidate status/step view types and keep the domain free of Prisma, Next.js, auth, and tenancy dependencies

## 3. Tenant-safe application slice

- [x] 3.1 RED: add PostgreSQL integration tests for first-entry idempotent bootstrap, persisted profile/review/back, completion, skip, Dirección-only mutations, and cross-Organization isolation
- [x] 3.2 GREEN: implement onboarding repository operations and public application use cases for bootstrap, read, save profile, Back, complete, and skip under authenticated tenant context
- [x] 3.3 REFACTOR: keep authorization/orchestration in application, Prisma IO in infrastructure, and cross-module imports limited to `identity-org/application`

## 4. Guided setup UI

- [x] 4.1 TEST-ALONGSIDE: add UI assertions for the pre-Organization form, Spanish company-profile/review steps, restored values, accessible Back/Skip/Finish actions, and Radar loading/error states
- [x] 4.2 IMPLEMENT: refactor `/onboarding` to route authenticated users among Organization creation, pending setup, and completed/skipped app entry through the onboarding public contract
- [x] 4.3 IMPLEMENT: add Zod-validated server actions and thin forms for save/advance, Back, Finish, and Skip without client-supplied Organization IDs
- [x] 4.4 VERIFY: run directed onboarding UI and application tests and confirm no template/import records are fabricated

## 5. First-entry Playwright flows

- [x] 5.1 TEST-ALONGSIDE: add a dev-auth E2E for new Organization → profile → review → Back with restored data → Finish
- [x] 5.2 TEST-ALONGSIDE: add an isolated retry-safe E2E for Skip → empty app and later access without forced onboarding
- [x] 5.3 IMPLEMENT: add isolated onboarding fixtures and route the spec exclusively through the dev-auth Playwright profile
- [x] 5.4 VERIFY: run the onboarding spec alone and then the complete dev-auth suite

## 6. Release verification and review

- [x] 6.1 Run generated-client checks, schema/RLS invariants, typecheck, lint/module boundaries, format check, all Vitest suites, relevant Playwright suites, build, skills anti-drift, and strict OpenSpec validation
- [x] 6.2 Run `mg-pr-review` read-only against the full diff, resolve blocking findings within the protocol limit, and re-run affected verifiers
- [x] 6.3 Record RED-to-GREEN evidence for every delta Scenario and leave task checkboxes synchronized only with objective green results

## RED → GREEN evidence

- **Offer setup on first entry:** application integration initially failed because the
  `onboarding-setup` public module did not exist; idempotent bootstrap/resume is now green in
  `onboarding-guided-setup.test.ts` and the new-Organization Playwright flow.
- **Skip setup:** the initial application/UI tests had no skip use case or action; the integration
  and retry-safe Playwright paths now prove `Skipped`, empty application records, and later access.
- **Go back without losing data:** the domain/application tests started red without a persisted
  transition; domain, PostgreSQL, and Playwright now restore both normalized profile fields.
- **Complete basic setup:** completion was absent in RED; domain/application tests plus Playwright
  now prove `Completed`, app entry, and zero fabricated Teams/Objectives/Skills.
- **Only Dirección mutates setup:** integration tests initially lacked the application contract;
  every mutation rejects Líder/Colaborador, access projection removes their controls, and the
  role-specific Playwright regression redirects away from the wizard.
- **Setup progress is tenant-isolated:** schema/application RED had no tenant table or repository;
  forced RLS, tenant-owned queries, and two-Organization integration coverage are green.
- **Existing Organizations are not forced into setup:** the first source-only check exposed no
  runtime grant evidence; the final test executes the migration over a pre-existing Organization
  and proves `Skipped`, typed defaults, grants, and forced RLS.

Final evidence: Prisma generation, typecheck, lint/module boundaries, formatting, skills
anti-drift, `git diff --check`, production build, OpenSpec strict 14/14, Vitest 470/470, dev-auth
Playwright 21/21, and `mg-pr-review` APPROVED.

## 7. Real-Clerk first-entry regression

- [x] 7.1 RED: preserve the CI failure showing that the identity E2E still waits for `/members`
  after Organization creation even though guided setup correctly remains pending at `/onboarding`
- [ ] 7.2 GREEN: make the real-Clerk identity flow distinguish Organization creation, pending
  guided setup, and terminal retry states, then leave onboarding through its public Skip control
- [ ] 7.3 VERIFY: run the directed identity/onboarding Playwright coverage, relevant static gates,
  strict OpenSpec validation, and an updated read-only `mg-pr-review`
