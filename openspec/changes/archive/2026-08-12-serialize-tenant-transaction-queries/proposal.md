# Change: Serialize queries inside tenant transactions

## Why

Prisma interactive transactions use one PostgreSQL client. Three read paths call
`Promise.all` with queries on that same client, which emits a `pg` deprecation
warning today and will be rejected by `pg@9`. The affected paths also enforce the
RLS and eNPS anonymity invariants, so the fix must preserve their transaction
boundaries and observable results.

## What changes

- Execute strategic-map reads sequentially inside their tenant transaction.
- Execute ritual and occurrence reads sequentially inside their tenant transaction.
- Execute eNPS aggregate-input reads sequentially inside their tenant transaction.
- Replace the nested reminder-candidate relation load with explicit sequential OKR
  reads inside the same tenant transaction.
- Add deterministic regression tests that prove a second query never starts while
  the previous query on the same transaction client is pending.
- Preserve existing tenant isolation, OKR roll-up, eNPS suppression and API outputs.

## Impact

- Affected specs: `strategy-northstar`, `rituals`, `culture-enps`, `okrs`.
- Affected code: read orchestration in the three modules; no schema, migration,
  domain, UI or public API changes.
- Risk: multi-tenancy/RLS and anonymous eNPS aggregation remain inside the existing
  `withTenantForUser` transaction boundaries.
