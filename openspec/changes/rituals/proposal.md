# Proposal: rituals

## Why

Cerrado `teams-staffing` + `skills-matrix`, la secuencia del README sigue con
`rituals`: la cadencia operativa que convierte los datos en hábito. Este change
implementa el núcleo backend completo de `rituals` — ceremonias recurrentes por
cadencia, seguimiento de Blockers y retrospectivas con alerta de riesgo de
aprendizaje — como un slice vertical end-to-end. Depende de `identity-org`
(actor/rol/tenancy), `teams-staffing` (Team de pertenencia) y `okrs`
(Objective al que se asocia un Blocker), consumidos solo por sus `application/`.

## What Changes

- **Módulo nuevo `rituals`** (bounded context, `src/modules/rituals/`):
  - **Ceremonias (Ritual + ocurrencias):** definir una ceremonia recurrente que
    pertenece a un Team con un nombre y una cadencia (`Weekly` / `Biweekly` /
    `Monthly`). Al avanzar el calendario se **generan** sus ocurrencias con su
    fecha; una ocurrencia cuya fecha pasó sin haberse celebrado se **evalúa** y
    marca `overdue`.
  - **Blockers:** registrar un Blocker con **owner** (Member) y **fecha de
    creación**, asociarlo opcionalmente al **Objective** al que bloquea, y al
    resolverlo quitarlo de la **lista de abiertos** y contarlo en la **métrica
    de resueltos**.
  - **Retrospectivas:** registrar una retro por Team y **derivar** el flag de
    "riesgo de aprendizaje" cuando un Team lleva **dos ciclos sin
    retrospectiva** (nunca persisted: es un flag calculado).
- **DB + RLS 🔒 (ADR-0003):** tablas `ritual`, `ritual_occurrence`, `blocker`
  y `retrospective`, tenant-scoped, con política RLS `FOR ALL` sobre
  `organization_id` en la misma migración.
- **Permisos MVP:** Reutiliza el rol organizacional de `identity-org`
  (`Direccion` / `Lider` / `Colaborador` vía `requireActor`). Dirección y Líder
  escriben; Colaborador solo lectura.

## Out of scope (slices posteriores)

Toda la UI (vistas de cadencia/ceremonias, tablero de Blockers con su Objective,
retrospectivas), recordatorios programados (Vercel Cron/Inngest para la
**generación** automática por avance del calendario — este slice expone la
función de generación, no el scheduler), y el reflejo agregado en
`executive-dashboard` / correlaciones en `culture-enps`.

## Impact

- Specs afectadas: `rituals` (delta con todo el comportamiento de la capability).
- Código: `src/modules/rituals/` (nuevo), `prisma/schema.prisma` + migración
  aditiva. `okrs` y `teams-staffing` solo consumidos por su `application/`.
- Áreas 🔒: multi-tenancy/RLS, migración de DB, límites de módulos con
  `okrs`/`teams-staffing`.