## 1. Red (rule tests first)

- [x] 1.1 RED: create `tools/eslint/page-container.test.mjs` using ESLint
      `RuleTester` with the rule scenarios:
      - valid: standard `<main>` container (`mx-auto ... px-6 py-10 md:px-10`),
        Members-style narrower container with the same padding, culture-style
        wider container with the same padding
      - invalid: `<div>` root, `<main>` without `py-10`, `<main>` without
        `px-6 md:px-10`, `<main>` without `mx-auto`/`w-full`, page returning no
        `<main>` at all
      Run it: fails because the rule module does not exist yet.

## 2. Green (rule + registration + migration)

- [x] 2.1 Implement `tools/eslint/page-container.mjs`: find the default export,
      resolve the page function, read its returned JSX root and require
      `<main>` + `mx-auto` + `w-full` + `px-6` + `md:px-10` + `py-10`.
- [x] 2.2 Register the plugin and rule in `eslint.config.mjs` as `error` for
      `src/app/(app)/**/page.tsx`.
- [x] 2.3 Add the `eslint-rules` project to `vitest.config.ts` including
      `tools/eslint/**/*.test.mjs`.
- [x] 2.4 Migrate `src/app/(app)/members/page.tsx` and
      `src/app/(app)/culture-enps/page.tsx` to `px-6 py-10 md:px-10` (keeping
      their `max-w-*` and `min-h-screen`).
- [x] 2.5 Re-run the rule tests until green.

## 3. Verification and review

- [x] 3.1 Run `npm run lint` over the repo (real pages must comply), plus
      `npm run typecheck`, `npm run format:check` and `npm run test`.
- [x] 3.2 Run `openspec validate --all --strict`.
- [x] 3.3 Run the read-only `mg-pr-review` over the diff and resolve findings.
      Resolved: fail-open with `const Page = () => …; export default Page`
      (rule now resolves variable declarators; 2 extra RuleTester cases).
- [ ] 3.4 After user approval, sync the `design-system` delta spec and archive
      the change (`openspec archive`).