## Context

The current `/dashboard` route reads OKRs directly and renders three OKR-only metrics plus
confidence alerts for Dirección. The remaining source capabilities now expose public
application contracts, so the dashboard can become the cross-context read model described by
the product spec without querying their repositories or duplicating their domain rules.

This change crosses module boundaries and consumes protected data. It must retain PostgreSQL
tenant isolation, use OKR progress already derived by the OKR domain, preserve eNPS
minimum-response suppression, and avoid exposing private Feedback while still deriving a Team
activity signal. It also must not reintroduce concurrent queries on a Prisma transaction client.

## Goals / Non-Goals

**Goals:**

- Provide one fresh, role-discriminated dashboard projection through a public
  `executive-dashboard/application` contract.
- Define deterministic metrics and prioritized risks from current source records.
- Scope Dirección, Líder, and Colaborador views before data reaches the UI.
- Derive Team feedback health from aggregate counts without returning Feedback bodies or
  participant-level activity.
- Render accessible Spanish Radar widgets with loading, empty, protected, and error states.

**Non-Goals:**

- Persist dashboard snapshots, risk rows, acknowledgements, or notification history.
- Add editable KeyResult ownership; the current model assigns the accountable owner to the
  owning Objective and enforces that relationship with a foreign key.
- Add predictive scoring, AI recommendations, configurable metric windows, or charts.
- Change source-module domain rules, eNPS thresholds, OKR roll-up, or role definitions.

## Decisions

### D1. A dedicated read-model module owns cross-context orchestration

Create `src/modules/executive-dashboard/` with pure policies in `domain/` and
`get-dashboard.ts` plus a public `application/index.ts` in `application/`. The application
query accepts only `actorClerkUserId` and returns a discriminated union keyed by
`Direccion | Lider | Colaborador`.

The query resolves the actor, gathers source projections through each module's public
`application/` interface, and passes normalized facts to the domain policy. The App Router
page imports only this query. This keeps UI free of business rules and preserves ADR-0002.

Alternative considered: keep orchestration in `page.tsx`. Rejected because it would place
role scoping, metric definitions, and risk policy in the UI and make non-UI verification hard.

### D2. Dashboard values are recomputed on every request

No dashboard or risk table is added. Every request reads current source projections and derives
the response. Source calls that share the injected Prisma client are awaited sequentially, not
placed in `Promise.all`, to retain deterministic database flow and avoid the `pg` concurrent
query deprecation that was fixed previously.

Alternative considered: persist a materialized snapshot. Rejected because it introduces stale
state, invalidation jobs, migrations, and a second source of truth before the MVP needs them.

### D3. Consolidated metrics have fixed MVP definitions

- **Global OKR progress:** arithmetic mean of published `Objective.progress` values returned by
  OKRs; drafts are excluded and each progress value remains the protected derived roll-up.
- **Team health:** a non-empty Team is healthy when it is neither over capacity nor at
  retrospective risk. The widget reports healthy and total Teams.
- **Culture/eNPS:** the latest launched pulse by source order is shown. A visible result exposes
  its score and participation; a suppressed result exposes only `protected` plus its minimum N.
- **Learning velocity:** number of Learnings created in the trailing 30 days, with the change
  against the preceding 30-day window. The application accepts an internal `now` dependency for
  deterministic tests; UI uses the current clock.

Empty sources produce explicit empty metrics rather than fabricated values.

### D4. Risks are pure, live, and deterministically prioritized

The domain receives normalized risk facts and emits `DashboardRisk` values with a stable ID,
kind, severity, subject, detail, and suggested action.

- `key-result-alignment`: a published KeyResult has no Project moving its Objective, or
  lacks an accountable owner. The existing Objective foreign key guarantees the owner in stored
  data, while `teams-staffing.evaluateAlignment` supplies the project-alignment branch.
- `team-capacity`: Team capacity is greater than 100%.
- `retrospective`: the rituals public policy marks the Team at risk after two cycles without a
  retrospective.
- `feedback-activity`: a non-empty Team has fewer completed Feedback items in the trailing
  30-day window than assigned members.

Alignment and capacity are `critical`; retrospective and feedback activity are `attention`.
Critical risks sort first, then by kind and stable subject ID. Suggested actions are fixed
Spanish copy selected by kind. Since risks are derived on read, resolving the source condition
removes the stable risk ID on the next request.

Alternative considered: a single numeric risk score. Rejected because arbitrary weights make
MVP behavior opaque and harder to verify.

### D5. Feedback health uses a group aggregate contract

Add `getFeedbackHealth` to `feedback-growth/application`. It accepts group descriptors
(`groupId`, unique `memberIds`) and a `since` boundary, validates members against the actor's
tenant, and returns only `groupId`, `memberCount`, and `completedFeedbackCount`. Its repository
uses aggregate counts and never selects `body`, classification, author, recipient, or request
content. Empty groups return zero and are not considered low-feedback risks.

The executive module obtains Team membership from `teams-staffing/application` and passes those
member IDs to this contract. This avoids a reverse dependency from feedback-growth to
teams-staffing and prevents participant-level Feedback data from crossing the module boundary.

Alternative considered: reuse `listPrivateFeedback`. Rejected because it is actor-participant
scoped, returns private content, and cannot safely represent Team health.

### D6. Role scoping happens in the application projection

- Dirección receives all tenant-wide widgets and risks.
- Líder receives only Teams where the actor has `TeamRole.Lead`, objectives for those Teams,
  their safe eNPS aggregates, and their risks translated into suggested actions.
- Colaborador receives only objectives they own, their own derived load, counts/summaries from
  participant-safe Feedback contracts, their GrowthPlan, and their pending Pulses. It receives
  neither organization risks nor another member's private Feedback.

The domain policy also filters normalized inputs by allowed Team and member IDs as defense in
depth. All source reads retain their own `withTenantForUser`/RLS enforcement.

### D7. The UI renders the returned union and no source-domain logic

Refactor `src/app/(app)/dashboard/page.tsx` into role sections composed from shared local
presentation components. Add route `loading.tsx` and `error.tsx`. Use the existing Card, Badge,
and Progress components and Radar semantic tokens; every risk state carries text/icon semantics,
and protected eNPS is labelled rather than shown as zero.

No interactive role switch is added: the authenticated Member role determines the projection.

## Risks / Trade-offs

- **Many source reads can make the page slower** → Keep each source read bounded, use aggregate
  queries for feedback, sequence only database operations that need safety, and verify the
  production build. A persisted read model remains a later optimization.
- **A rolling 30-day boundary can make tests time-sensitive** → Inject `now` into application
  and domain policies and use fixed clocks in tests.
- **A Team member can belong to several Teams** → Feedback activity is evaluated independently
  for each supplied group; no participant-level result is exposed.
- **Suppressed eNPS could be mistaken for no data** → Model `protected` separately from `empty`
  and test both the application contract and Spanish UI label.
- **Broad Dirección reads increase privacy risk** → The dashboard consumes only aggregate eNPS
  and Feedback health contracts; tests assert no Feedback body or response identity appears.
- **Current KeyResults have no independent owner field** → Treat the Objective owner as the
  accountable owner and document independent KR ownership as out of scope rather than adding an
  unapproved migration.

## Migration Plan

1. Deploy the new read-model and aggregate query with no schema changes.
2. Replace the dashboard route in the same release; existing navigation remains unchanged.
3. Roll back by reverting the route and module files. No data rollback is required.

## Open Questions

None for this change. The 30-day windows and deterministic risk priorities are fixed MVP policy
and can become Organization settings in a later OpenSpec change.
