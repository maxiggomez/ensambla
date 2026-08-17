## 1. Spec delta slice

- [x] 1.1 Write the MODIFIED delta for the "Automatic misalignment risks" requirement clarifying
      that the accountable owner is the required Objective owner (always present) and that the
      alignment risk triggers on a published KeyResult whose Objective is moved by no Project;
      reword the "Generate a risk alert" scenario to that representable condition
- [x] 1.2 Validate the change with `openspec validate executive-dashboard-risk-owner-clarification --strict` (valid)

## 2. Scenario-to-test mapping (no code change)

- [x] 2.1 Confirm the clarified "Generate a risk alert" scenario maps to the existing green unit
      test in `src/modules/executive-dashboard/domain/dashboard-policy.test.ts`
      ("generates stable suggested alerts in deterministic priority order", which seeds a
      published KeyResult without a Project) and that risk removal stays covered by
      "removes the stable risk when its source fact is resolved"
- [x] 2.2 Confirm the integration suite `test/integration/executive-dashboard.test.ts` does cover
      generation/resolution through the public application contract (with
      `executive-dashboard-roles.test.ts` and `executive-dashboard-tenancy.test.ts` for role and
      tenant scope)
- [x] 2.3 Run `npm run test` and record that unit + integration executive-dashboard suites are
      green (13/13 directed; full suite 124 files / 506 tests)

## 3. Verification and close

- [x] 3.1 Run `npm run typecheck`, `npm run lint`, `npm run format:check`, and
      `openspec validate --all --strict` (all pass)
- [x] 3.2 After user approval, sync the delta to `openspec/specs/executive-dashboard/spec.md` and
      archive the change with `openspec archive`