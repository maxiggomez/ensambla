# Design: Serialized tenant transaction reads

## Context

`@prisma/adapter-pg` binds an interactive Prisma transaction to one `pg.Client`.
Starting multiple queries on its `TransactionClient` concurrently queues work on
an already active client. `pg` deprecates this behavior and plans to remove it in
version 9.

The pool may still serve independent transactions concurrently. This change is
limited to query fan-out inside one transaction callback.

## Decisions

### D1 — Keep every query inside the current tenant transaction

The fix replaces intra-transaction `Promise.all` calls with explicit ordered
`await`s. It does not move a read before `set_config('app.current_org', ...)`, open
additional tenant transactions, or bypass RLS.

The OKR reminder query is a special case: Prisma expands its nested relation
`include` into overlapping driver queries. The repository instead loads Objectives,
cadences, KeyResults and CheckIns with explicit sequential queries and composes the
same reminder-candidate shape in memory.

### D2 — Test scheduling independently from database timing

Focused infrastructure/application tests use controlled pending query doubles.
They assert that query N+1 has not started before query N resolves, then assert the
existing composed output. Existing PostgreSQL integration suites remain the proof
for tenant isolation, roll-up and anonymity.

### D3 — No shared abstraction for three simple sequences

A generic sequential-query helper would hide ordinary control flow and enlarge the
shared kernel. Each module owns its explicit sequence. Independent transactions and
pool-level parallelism remain allowed.

## Risks and mitigations

- Slightly higher latency for these small read sets: accepted for driver correctness;
  future optimization should use one SQL query or relation load, not client overlap.
- Accidental movement outside RLS: prevented by leaving `withTenantForUser` and
  repository signatures unchanged and retaining integration tests.
- eNPS disclosure regression: existing minimum-N and tenant-isolation scenarios are
  mandatory verification gates.
- Reminder drift: existing cadence precedence, no-cadence and outdated scenarios
  remain mandatory verification gates.
