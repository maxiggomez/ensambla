## Why

AGENTS.md requires the UI to be written in Spanish (LATAM) with the product's
ubiquitous terms used consistently. A copy audit of `okrs` and
`feedback-y-carrera` found labels mixing grammar and languages ("Nuevo Objective",
"Kudo Objective", "Sin KeyResult"), which reads as unfinished/unpolished copy next
to the dominant canon of the product ("Objetivos", "Objetivo huérfano", "Nuevo Key
Result").

## What Changes

- `src/app/(app)/okrs/page.tsx`: the create-objective card title "Nuevo Objective"
  becomes "Nuevo Objetivo", consistent with the page headings and badges.
- `src/app/(app)/feedback-y-carrera/feedback-growth-forms.tsx`: the Kudo form
  labels and options are reworded to grammatical es-AR: "Objetivo (opcional)",
  "Sin objetivo", "Key Result (opcional)", "Sin Key Result".
- `src/app/onboarding/guided-setup-form.tsx`: section "Objectives y Key Results"
  becomes "Objetivos y Key Results".
- Tests updated to the new copy: `src/app/onboarding/onboarding-ui.test.ts` and
  `e2e/feedback-growth.spec.ts`. Copy-only, no behaviour or spec change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `onboarding-setup`: the section heading used by guided setup is reworded; no
  requirement or scenario changes.

## Impact

- Three UI files + two test files. No domain, application, infrastructure or
  schema change. No scenario added or removed.