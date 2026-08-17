## 1. Navigation expectations slice

- [x] 1.1 RED: update `src/app/(app)/navigation.test.ts` so Colaborador's navigation includes
      `equipos-y-proyectos` and `skills-y-staffing` (read-only scope) and the management-only
      list is exactly `["miembros"]`
- [x] 1.2 GREEN: change the two section `scope` tags in `src/app/(app)/navigation.ts` from
      `management` to `all`; re-run the navigation unit suite

## 2. Browser acceptance slice

- [x] 2.1 RED: adjust the Colaborador scenario in `e2e/app-shell.spec.ts` to assert the Equipos &
      Proyectos and Skills & Staffing links are visible and read-only content renders without
      management controls, while Miembros is hidden
- [x] 2.2 VERIFY: run the app-shell Playwright flow on the dev-auth config

## 3. Verification and review

- [x] 3.1 Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`, and
      `openspec validate --all --strict`
- [x] 3.2 Run the read-only `mg-pr-review` over the diff and resolve findings
- [ ] 3.3 After user approval, sync the delta to `openspec/specs/app-shell/spec.md` and archive
      the change with `openspec archive`