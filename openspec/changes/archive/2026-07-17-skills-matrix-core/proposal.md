# Proposal: skills-matrix-core

## Why

Con `teams-staffing-core` implementado, cierra el par de la secuencia del
README: `skills-matrix`, el lenguaje común personas ↔ proyectos ↔ carrera.
Slice backend, como los anteriores.

## What Changes

- **Módulo nuevo `skills-matrix`**:
  - **Matriz de competencias**: `Skill` (catálogo por Organización) y
    `Competency` = Member + Skill + Level (0–4), única por par; vista matriz
    personas × skills, filtrable por Team (miembros vía `teams-staffing`).
  - **Staffing inteligente**: skills requeridas sobre un Project o un
    KeyResult (`SkillRequirement`); sugerencias de personas ordenadas por
    match — nivel de skill, seniority y disponibilidad (100 − carga de
    `teams-staffing`) — con flag **"no margin"** para carga ≥ 100 (se sugiere
    igual, marcada).
  - **Gaps**: alerta de cobertura cuando ≥ 2 OKRs publicados requieren una
    skill con cobertura < 2 personas (nivel ≥ 3), y riesgo **"bus factor"**
    cuando una skill requerida depende de exactamente 1 persona con nivel ≥ 3.
- **`identity-org`: seniority en `Member`** (decisión de usuario en gate):
  campo opcional `seniority` (`Junior` / `SemiSenior` / `Senior`), editable
  solo por Dirección (`setMemberSeniority`); entra en el orden de match.
- **DB + RLS 🔒 (ADR-0003)**: tablas `skill`, `competency`,
  `skill_requirement` tenant-scoped con RLS en la misma migración; ALTER
  aditivo de `member` (columna nullable `seniority`).

## Out of scope (slices posteriores)

Umbrales de gaps configurables, sugerencias de formación/carrera
(`feedback-growth`), reflejo en `executive-dashboard`, y toda la UI.

## Impact

- Specs afectadas: `skills-matrix` (delta core) e `identity-org` (delta:
  seniority).
- Código: `src/modules/skills-matrix/` (nuevo), `src/modules/identity-org/`
  (seniority), `prisma/schema.prisma` + migración.
- Áreas 🔒: multi-tenancy/RLS, migración de DB, límites de módulos
  (`teams-staffing`, `okrs`, `identity-org`).
