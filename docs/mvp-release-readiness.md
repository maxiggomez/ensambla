# MVP release readiness

Audit date: 2026-08-14

## Outcome

The product is technically healthy, but it is not yet a complete user-operable MVP. Eight product
capabilities expose real end-to-end UI flows, including the basic guided onboarding slice. Three
capabilities have tested domain and application layers but still render an `UnderConstruction`
page. Onboarding templates and spreadsheet import remain separate release gaps.

## Capability matrix

| Capability | Domain/application evidence | User-flow evidence | Release status | Main gap |
| --- | --- | --- | --- | --- |
| `identity-org` | Unit, integration, RLS and member-linking suites | Members UI; conditional real-Clerk E2E | Partial | Permission changes are not audited; real-Clerk E2E is optional when CI secrets are absent |
| `onboarding-setup` | Resumable tenant-owned progress, RLS, role policy, migration backfill and CAS tests | Organization creation plus profile/review/back/finish/skip dev-auth E2E | Partial | Templates and CSV/XLSX mapping, preview, validation and import remain |
| `strategy-northstar` | Unit and integration suites | Real UI and dev-auth E2E | Ready | No release blocker found |
| `okrs` | Unit, integration, RLS, roll-up and immutable audit suites | Full-cycle UI and dev-auth E2E | Ready | No release blocker found |
| `teams-staffing` | Unit, integration, RLS, capacity and project suites | `UnderConstruction` page | Partial | No user-operable Team, assignment, Project or capacity UI |
| `skills-matrix` | Unit, integration, RLS, matching and gap suites | `UnderConstruction` page | Partial | No matrix, competency, staffing or gap UI |
| `rituals` | Unit, integration, RLS, ceremony, blocker and retro suites | `UnderConstruction` page | Partial | No ceremony, blocker or retrospective UI |
| `feedback-growth` | Unit, integration, privacy and RLS suites | Real UI and dev-auth E2E | Ready | No release blocker found |
| `culture-enps` | Unit, integration, anonymity, threshold and RLS suites | Real UI and dev-auth E2E | Ready | No release blocker found |
| `lean-experiments` | Unit, integration, RLS and lifecycle suites | Real UI and dev-auth E2E | Ready | No release blocker found |
| `executive-dashboard` | Unit, integration, role, privacy and tenancy suites | Real UI and dev-auth E2E | Ready | No release blocker found |

## Global invariant assessment

| Invariant / NFR | Evidence | Status |
| --- | --- | --- |
| Tenant isolation and RLS | Global RLS coverage plus capability-specific cross-Organization integration tests | Green |
| Anonymous eNPS and minimum N | Structural schema, immutable response, suppression and dashboard privacy tests | Green |
| Derived OKR roll-up | Shared `Measurement`, unit, integration and dashboard projection tests | Green |
| Typed `Measurement` reuse | Shared value object consumed by Strategy, OKRs and Lean experiments | Green |
| Auditability | Immutable OKR audit exists; permission and import audit do not | Blocked |
| Spanish LATAM UI | Implemented flows and placeholders use Spanish | Partial: three capabilities have no operative UI |
| Radar design system | Token/typography E2E plus UI source tests | Green for implemented views |

## Verification evidence

- Skills anti-drift: green.
- OpenSpec strict validation: 14/14.
- Typecheck, lint and formatting: green.
- Vitest: 119 files, 470 tests green.
- Playwright dev-auth: 21/21 green.
- Production build: green.
- Standard Clerk Playwright: not reproducible in this workspace because real Clerk keys are
  absent. The suite explicitly skips the identity flow when CI has only dummy keys, so a green
  CI run does not by itself prove real authentication, Organization creation and invitation.

## Prioritized release backlog

1. `onboarding-templates`: recommend and apply editable Organization templates through public
   application contracts.
2. `onboarding-import`: CSV/XLSX mapping, preview, row validation, idempotent upsert and immutable
   import audit.
3. `teams-staffing-ui`: replace the placeholder with Team, assignment, Project and capacity flows.
4. `skills-matrix-ui`: replace the placeholder with matrix, staffing suggestions and gap views.
5. `rituals-ui`: replace the placeholder with ceremony, blocker and retrospective flows.
6. `identity-permission-audit`: audit role changes and expose a Dirección-only history.
7. `release-ci-auth-gate`: make the real-Clerk smoke result explicit instead of silently skipping
   it when release credentials are not configured.
8. Refresh `README.md` and add deployment/runbook documentation after the user-operable gaps are
   closed.

Each behavioral item above must enter through `mg-eng-loop` independently, with its own
architecture map, OpenSpec change, approved test plan and review.
