## Context

`src/app/(app)/navigation.ts` tags each section with `scope: "all" | "management"` and
`sectionsForRole` hides `management` sections from Colaborador. Equipos & Proyectos and
Skills & Staffing were `management`, contradicting their capability specs that require
read-only access for every role. Both pages already gate management controls by role
(`skills-y-staffing/page.tsx` via `canManageSkills`/`canManageSeniority`,
`equipos-y-proyectos/page.tsx` via `canManageProjects`), so the content is read-only for
Colaborador; only the nav entry was missing.

## Decision

Adopt Option A:

- `equipos-y-proyectos` and `skills-y-staffing` become `scope: "all"` so Colaborador sees them
  in the sidebar; their management controls stay role-gated by the pages, so Colaborador
  reaches read-only content only.
- `miembros` remains `management`: the members page is an administrative surface (invitations,
  role management) that `identity-org` does not expose read-only to Colaborador.
- No changes to roles, permissions, or the two capability pages.

## Non-goals

- Adding read-only content to `Miembros`.
- Changing `identity-org` policy or roles.
- Re-routing or renaming any section.

## Risks

- None material: the same content was already reachable and read-only via direct URL; this only
  surfaces it in the sidebar. Role policy is unchanged.