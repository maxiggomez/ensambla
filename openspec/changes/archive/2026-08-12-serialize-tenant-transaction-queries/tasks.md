# Tasks: Serialize tenant transaction queries

## 1. Regression tests

- [x] 1.1 Add a failing focused test proving strategic-map reads do not overlap on one transaction client
- [x] 1.2 Add a failing focused test proving ritual/occurrence reads do not overlap on one transaction client
- [x] 1.3 Add a failing focused test proving eNPS aggregate-input reads do not overlap on one transaction client
- [x] 1.4 Add a failing focused test proving nested OKR reminder reads do not overlap on one transaction client

## 2. Minimal implementation

- [x] 2.1 Serialize strategic-map reads without changing the public view or RLS boundary
- [x] 2.2 Serialize ritual reads without changing occurrence composition or RLS boundary
- [x] 2.3 Serialize eNPS aggregate reads without changing anonymity, threshold or RLS behavior
- [x] 2.4 Serialize OKR reminder reads without changing cadence precedence, outdated derivation or RLS behavior

## 3. Verification and review

- [x] 3.1 Run focused ordering tests and affected PostgreSQL integration suites
- [x] 3.2 Run typecheck, lint, format, full Vitest suite and build
- [x] 3.3 Run `openspec validate --all --strict`
- [x] 3.4 Run read-only `mg-pr-review` and resolve blocking findings
