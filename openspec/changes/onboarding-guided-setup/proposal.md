## Why

New Organizations currently leave the bootstrap form directly for the members page, so the
specified guided setup, skip path, and back-without-data-loss behavior do not exist. This is the
largest first-entry gap in the MVP and blocks later template and import slices from having a
resumable setup foundation.

## What Changes

- Add a tenant-owned, resumable setup progress aggregate for a newly created Organization.
- Offer the guided setup immediately after Organization creation and on later visits while it is
  pending.
- Allow Dirección to save the current company-profile step, move backward without losing saved
  input, or skip setup and enter the empty application.
- Add Spanish Radar UI states for the setup shell, including loading, empty/error feedback, and
  accessible navigation.
- Add RLS, tenant-isolation, role-policy, integration, UI, and Playwright coverage for this slice.
- Keep template application and CSV/XLSX import out of this change; they remain subsequent
  `onboarding-setup` slices.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `onboarding-setup`: Make the guided setup explicitly resumable, Dirección-only for mutation,
  persisted per Organization, and offered after Organization creation until skipped or completed.

## Impact

- New `src/modules/onboarding-setup/` bounded context with domain, application, and infrastructure
  layers.
- New tenant-owned Prisma model, migration, RLS policy, and tenant-safe constraints.
- Existing `/onboarding` route and Organization creation action orchestrate through the new public
  application contract.
- New Vitest integration/unit tests and mock-auth Playwright coverage; Playwright routing config is
  extended for the new spec.
- No changes to eNPS anonymity, OKR roll-up, templates, imports, or external dependencies.
