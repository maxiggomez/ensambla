## 1. Copy expectations first

- [ ] 1.1 RED: update `src/app/onboarding/onboarding-ui.test.ts` to expect the section
      heading "Objetivos y Key Results" (fails against current "Objectives y Key Results")
- [ ] 1.2 RED: update `e2e/feedback-growth.spec.ts` to select the Kudo objective field by
      "Objetivo (opcional)" (fails against current label)

## 2. Green copy harmonization

- [ ] 2.1 Change "Nuevo Objective" to "Nuevo Objetivo" in
      `src/app/(app)/okrs/page.tsx` and keep the sibling "Nuevo Key Result" untouched
- [ ] 2.2 Reword the Kudo form in `src/app/(app)/feedback-y-carrera/feedback-growth-forms.tsx`
      to "Objetivo (opcional)", "Sin objetivo", "Key Result (opcional)", "Sin Key Result"
- [ ] 2.3 Change "Objectives y Key Results" to "Objetivos y Key Results" in
      `src/app/onboarding/guided-setup-form.tsx`
- [ ] 2.4 Re-run `onboarding-ui.test.ts` and the feedback-growth e2e flow

## 3. Verification and review

- [ ] 3.1 Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`, and
      `openspec validate --all --strict`
- [ ] 3.2 Run the read-only `mg-pr-review` over the diff and resolve findings
- [ ] 3.3 After user approval, archive the change with `openspec archive --skip-specs` and
      commit (no spec delta was produced)