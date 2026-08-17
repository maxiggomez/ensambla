## Why

The app-shell "Role-based navigation" only filters by a coarse `management` tag, so
"Equipos & Proyectos" and "Skills & Staffing" are hidden from Colaborador. But their owning
specs require those sections to be readable by every role: `teams-staffing` ("Colaborador SHALL
see Teams and their members read-only without management controls") and `skills-matrix` ("the
matrix SHALL remain readable for every role", scenario "A Colaborador sees the matrix read-only").
The pages already render read-only for Colaborador; only the navigation hides them, contradicting
the capability specs.

## What Changes

- Change the navigation scope of `equipos-y-proyectos` and `skills-y-staffing` from
  `management` to `all`, so Colaborador finds them in the sidebar and their existing read-only
  content is reachable.
- `miembros` stays management-only (invitation management is Dirección; `identity-org` does not
  require Colaborador read access).
- Tests: update navigation expectations and the app-shell e2e Colaborador scenario.
- No content or permission change inside the two pages (already read-only for Colaborador).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: make explicit that Teams & Projects and Skills & Staffing are read-only in scope
  for Colaborador and that management-only sections (Miembros) are hidden.

## Impact

- `src/app/(app)/navigation.ts` — two `scope` tags.
- `src/app/(app)/navigation.test.ts` — management-only expectation shrinks to `Miembros`.
- `e2e/app-shell.spec.ts` — Colaborador scenario asserts both read-only sections are visible and
  `Miembros` stays hidden.
- No changes to `teams-staffing`, `skills-matrix`, roles/policy, or the shared kernel.