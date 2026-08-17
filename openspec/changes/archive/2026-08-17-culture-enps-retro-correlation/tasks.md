## 1. Correlation domain slice

- [x] 1.1 RED: add unit tests in `src/modules/culture-enps/domain/correlation.test.ts` for the
      `overdue_retro` signal: a fall with an overdue retrospective emits
      `enps_drop_with_overdue_retro`; a fall without coincidence emits nothing; both signals
      coinciding emit both correlations (domain is pure, no DB)
- [x] 1.2 GREEN: extend `OperationalSignal` to a discriminated union and `correlateTeamEnps` to
      emit the overdue-retrospective correlation, keeping existing capacity output unchanged

## 2. Application slice

- [x] 2.1 RED: extend `test/integration/culture-enps-correlation.test.ts` with a Team that had
      no retrospective (overdue) and a visible eNPS fall → the analysis reports the
      `enps_drop_with_overdue_retro` correlation next to capacity; and a Team with a recent
      retrospective does not produce the overdue-retro correlation
- [x] 2.2 GREEN: source the retro risk via `rituals/application.evaluateLearningRisks` and feed
      the `overdue_retro` signal in `analyze-team-enps.ts`; update the application type export
      in `application/index.ts`

## 3. Verification and review

- [x] 3.1 Run the directed unit + integration suites, then `npm run typecheck`, `npm run lint`,
      `npm run format:check`, `npm run test`, and `openspec validate --all --strict`
- [x] 3.2 Run the read-only `mg-pr-review` over the diff and resolve findings
- [x] 3.3 After user approval, sync the delta to `openspec/specs/culture-enps/spec.md` and
      archive the change with `openspec archive`