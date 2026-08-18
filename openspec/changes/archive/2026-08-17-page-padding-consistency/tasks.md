## 1. Red (layout e2e, test-alongside de UI)

- [x] 1.1 RED: create `e2e/page-container.spec.ts` with a helper that asserts the
      standard page container on a route (single `<main>`, max-width 1180px,
      padding 40px all sides, horizontally centered). Test it on
      `/norte-estrategico`, `/okrs` and `/dashboard` (mock auth `dev_direccion`).
      Expected failure now: those pages render a bare `<div>` without `<main>`.

## 2. Green (page wrappers)

- [x] 2.1 Replace the wrapper in `src/app/(app)/norte-estrategico/page.tsx` with
      `<main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-6 py-10 md:px-10">`
- [x] 2.2 Replace the wrapper in `src/app/(app)/okrs/page.tsx` with the same `<main>`.
- [x] 2.3 Replace the wrapper in `src/app/(app)/dashboard/page.tsx` with the same `<main>`.
- [x] 2.4 Re-run `e2e/page-container.spec.ts` until green.

## 3. Verification and review

- [x] 3.1 Run `npm run typecheck`, `npm run lint`, `npm run format:check` and the
      relevant dev-auth e2e specs
- [x] 3.2 Run `openspec validate --all --strict`
- [x] 3.3 Run the read-only `mg-pr-review` over the diff and resolve findings.
- [ ] 3.4 After user approval, sync the `design-system` delta spec and archive the
      change (`openspec archive`)