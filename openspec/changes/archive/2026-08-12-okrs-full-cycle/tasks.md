## 1. Baseline and domain cadence

- [x] 1.1 Run the existing OKR unit and integration suites and record the green core baseline
- [x] 1.2 Add failing unit tests for cadence validation, Objective-over-Team precedence, calendar due dates, no-cadence behavior, reminders, and outdated derivation
- [x] 1.3 Implement `domain/cadence.ts` with deterministic injected time and no persisted derived flags

## 2. Domain check-ins, alignment and cycle

- [x] 2.1 Add failing unit tests for confidence bounds, typed check-in values, evidence validation, latest-confidence risk, and archived read-only policy
- [x] 2.2 Implement `domain/check-in.ts` and extend KeyResult lifecycle policy minimally
- [x] 2.3 Add failing unit tests for Team scope, Objective hierarchy cycle detection, and orphan derivation
- [x] 2.4 Implement `domain/alignment.ts` and extend Objective validation/policy
- [x] 2.5 Add failing unit tests for cycle dates, complete grading, lifecycle transitions, and carry-over copies
- [x] 2.6 Implement `domain/cycle.ts` and `domain/cycle-close.ts`

## 3. Tenant persistence and RLS

- [x] 3.1 Add failing integration tests proving new OKR tables are absent/unusable and specifying tenant isolation plus audit immutability
- [x] 3.2 Extend Prisma models/enums for Team/parent/cycle links, cadence, check-ins, evidence, grading, carry-over, and audit without a persisted progress/risk/outdated field
- [x] 3.3 Add one additive migration with foreign keys, indexes, ENABLE/FORCE RLS, tenant policies, and insert/select-only audit policies
- [x] 3.4 Regenerate the Prisma client and make the persistence/RLS tests green

## 4. Objective scope and cadence application

- [x] 4.1 Add failing integration tests for explicit Team Objectives, same-tenant parent links, lead cadence authorization, precedence, due reminders, outdated status, and no-cadence behavior
- [x] 4.2 Extend Objective repositories/views and implement Team/parent association through public module contracts
- [x] 4.3 Implement cadence repositories and use cases, exporting them only through `okrs/application/index.ts`

## 5. Check-in application and risk

- [x] 5.1 Add failing integration tests for typed CheckIns, transactional Measurement update, comment/link/file evidence, confidence risk, latest-confidence clearing, Dirección risk listing, and archived rejection
- [x] 5.2 Implement check-in/evidence repositories and `recordCheckIn` as one tenant transaction
- [x] 5.3 Implement derived KeyResult risk/outdated views, due reminders, and Dirección at-risk listing without persisted flags

## 6. Alignment application

- [x] 6.1 Add failing integration tests for parent-chain traversal, pillar/North Star composition, orphan detection, cyclic-link rejection, and cross-tenant link rejection
- [x] 6.2 Implement parent-link repository/use case and derived alignment-chain composition through public application interfaces

## 7. Cycle close application

- [x] 7.1 Add failing integration tests for cycle creation, Dirección-only grading, incomplete-grade close rejection, successful close, carry-over provenance, archive, read-only history, and tenant isolation
- [x] 7.2 Implement cycle, grading, close, carry-over, archive, and history repositories/use cases
- [x] 7.3 Extend Objective/KeyResult views and mutation guards for `Closed` and `Archived`

## 8. Immutable audit trail

- [x] 8.1 Add failing integration tests that successful legacy and new mutations create complete audit events while failed mutations create none
- [x] 8.2 Implement the insert-only audit repository and write events transactionally from every OKR mutation
- [x] 8.3 Implement Dirección-only tenant audit history and prove no application update/delete operation exists

## 9. OKR workspace and Dirección dashboard

- [x] 9.1 Add UI tests alongside Spanish forms and views for Objective/KR creation, cadence, check-ins, evidence, alignment, cycle close, risk, history, and empty/loading/error states
- [x] 9.2 Replace the OKRs placeholder with server-loaded views, validated server actions, and focused Measurement/file client controls using existing Radar components/tokens
- [x] 9.3 Add the Dirección at-risk OKR summary to the dashboard through the OKR public application API
- [x] 9.4 Add Playwright scenarios for the primary create → publish → check-in → risk → close/archive flow and role/validation feedback

## 10. Verification and review

- [x] 10.1 Run targeted unit, integration, UI, and Playwright tests and confirm all changed Scenarios are green
- [ ] 10.2 Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`, `npm run test:e2e`, and `npm run build` (Clerk E2E pending: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` unavailable; dev-auth E2E 14/14 passed)
- [x] 10.3 Run `openspec validate --all --strict` and confirm no spec/task drift
- [x] 10.4 Run the read-only `mg-pr-review` protocol and resolve blocking findings within the allowed review rounds

## 11. Review follow-ups

- [x] 11.1 Prove cycle-close scenarios can run independently, then isolate their fixtures
- [x] 11.2 Add a failing UI contract test for one public evidence-size limit, then consume the domain constant through `okrs/application`
- [x] 11.3 Re-run focused and full verification plus read-only review
