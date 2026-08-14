## Why

Ensambla already models Members, Projects, Organization values, and the competency matrix,
but feedback and career growth remain a placeholder. This change connects everyday work and
recognition to explicit development targets so Members can act on feedback instead of losing
it in disconnected conversations or annual forms.

## What Changes

- Add private, classified Feedback between Organization Members, optionally linked to a
  Project and/or a current Organization Value.
- Add directed FeedbackRequests with a pending inbox and fulfillment through Feedback.
- Add public Kudos linked to an Organization Value and optionally to an Objective or
  KeyResult, and surface them in the Organization activity feed.
- Add GrowthPlans with concrete Skill target levels, a next milestone, derived skill gaps,
  and evidence from received Feedback or closed Projects.
- Add the minimal Active → Closed Project lifecycle and public Project context needed to
  validate growth evidence without crossing module boundaries.
- Replace the Feedback & Carrera placeholder with an accessible Spanish (LATAM) workflow for
  feedback, requests, kudos, activity, and growth-plan progress.
- Persist every new aggregate behind PostgreSQL RLS and tenant-safe composite relationships.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `feedback-growth`: Make feedback, requests, kudos, plan targets, evidence, visibility, and
  tenant isolation implementation-ready.
- `teams-staffing`: Add a guarded Project closure and a public tenant-safe Project context so
  only closed Projects can feed GrowthPlan progress.

## Impact

- New `src/modules/feedback-growth/` bounded context with domain, application, and
  infrastructure layers.
- Focused additions to `src/modules/teams-staffing/` for Project lifecycle and its public
  application contract; existing consumers remain compatible.
- Reuse of existing public contracts from `identity-org`, `strategy-northstar`,
  `skills-matrix`, and `okrs`; no deep imports into those modules.
- New Prisma enums, tenant tables, composite foreign keys, constraints, indexes, RLS
  policies, and an additive migration.
- The `/feedback-y-carrera` route gains forms, inboxes, activity, empty/loading/error states,
  and GrowthPlan views.
- New domain, PostgreSQL integration, RLS, UI, and Playwright coverage.
- Route the Feedback & Carrera Playwright scenario exclusively through the mock-auth profile;
  the Clerk profile must ignore every spec that depends on the development user picker.
