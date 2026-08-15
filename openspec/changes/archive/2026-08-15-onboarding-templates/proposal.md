## Why

The guided setup currently captures the Organization profile but leaves Dirección with an empty workspace and no concrete starting structure. Industry-aware templates can shorten time-to-value while preserving Ensambla's domain rules and keeping every generated artifact editable.

## What Changes

- Recommend a deterministic onboarding template from the saved company type and industry, with a stable fallback when there is no exact match.
- Offer preview and explicit confirmation for three initial templates: SaaS de Producto, Servicios / Agencia, and Comercio / Retail.
- Apply a selected template atomically to create Teams, a sample NorthStar, draft Objectives with model KeyResults, and a Skills taxonomy.
- Allow Dirección to complete setup without a template.
- Protect existing Organization data: template application is Dirección-only, tenant-isolated, requires empty target structures, and never overwrites existing content.
- Make retries idempotent by recording the applied template; the same confirmation succeeds without duplicates and a later different template is rejected.
- Keep generated domain entities ordinary and editable through their owning capabilities.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `onboarding-setup`: Expand template-based setup with recommendation, preview, atomic materialization, authorization, isolation, editability, conflict protection, and idempotency requirements.

## Impact

- `src/modules/onboarding-setup/`: template catalog, recommendation, setup state, application orchestration, and persistence.
- Public `application/` interfaces in `teams-staffing`, `strategy-northstar`, `okrs`, and `skills-matrix` for transaction-coordinated template materialization without cross-module deep imports.
- `src/app/onboarding/`: Spanish LATAM recommendation, preview, confirmation, and completion UI using the existing design system.
- Prisma/PostgreSQL: nullable applied-template identity on onboarding setup, compatible constraints, migration, and generated client updates while preserving RLS.
- Unit, integration, and Playwright coverage for recommendation, authorization, atomicity, tenant isolation, idempotency, conflict protection, and editability.

