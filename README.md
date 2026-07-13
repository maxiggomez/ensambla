# Ensambla — Paquete de handoff (MVP)

**Business Alignment & Agile People OS** para pymes. Este repo es el punto de partida
spec-driven para que agentes de IA (Codex, OpenCode, Claude Code) construyan el MVP.

> El nombre **Ensambla** es provisional (pendiente verificación de dominio y marca).

## Orden de lectura para un agente

1. **`openspec/project.md`** — contexto permanente: propósito, lenguaje ubicuo, roles,
   invariantes, stack y convenciones. Leer siempre primero.
2. **`docs/adr/`** — decisiones arquitectónicas que toda feature respeta:
   - ADR-0001 Stack · ADR-0002 Monolito modular · ADR-0003 Multi-tenancy (RLS)
   - ADR-0004 Valores tipados (`Measurement`) · ADR-0005 Anonimato eNPS
   - ADR-0006 TDD & testing · ADR-0007 Sistema de diseño
3. **`docs/design-system.md`** — tokens, componentes (shadcn + custom) y patrones de UI.
4. **`openspec/specs/<capability>/spec.md`** — el comportamiento esperado por capability
   (Requirements SHALL + Scenarios GIVEN/WHEN/THEN).
5. **`openspec/changes/<change>/`** — el trabajo activo: `proposal.md` + `design.md` +
   `tasks.md` (ordenado test-first) + deltas de spec.

## Cómo se construye

- **Arrancar por `changes/foundation/`** (scaffolding, auth, tenancy, shared kernel, CI).
  Se hace **en serie** antes de paralelizar.
- Después, **un agente por capability/slice** (vertical, no por capa). Un slice = un change.
- **TDD obligatorio** (ADR-0006): el test que falla primero, luego la implementación.
- **Definition of Done:** todos los Scenarios del change pasan como tests verdes + CI en verde.

## Capabilities

`identity-org` · `onboarding-setup` · `strategy-northstar` · `okrs` · `teams-staffing` ·
`skills-matrix` · `rituals` · `feedback-growth` · `culture-enps` · `lean-experiments` ·
`executive-dashboard`

## Secuencia sugerida de construcción

1. `foundation` (identity-org + kernel + tenancy)
2. `strategy-northstar` + `okrs` (la espina estrategia→objetivos)
3. `teams-staffing` + `skills-matrix`
4. `rituals` · `feedback-growth` · `culture-enps` · `lean-experiments`
5. `executive-dashboard` (consolida las señales de las demás)
6. `onboarding-setup` (puede adelantarse como puerta de entrada comercial)

## Referencias

- Criterios de aceptación completos (validados): `norte-criterios-de-aceptacion.md`
- Prototipos de UI (referencia visual): `norte-prototipo.html`, `norte-onboarding.html`

## Estado

Paquete de especificación y diseño listo. **No incluye código todavía**: es el input para
que los agentes generen la implementación. Pendiente conocido: verificar nombre/dominio de
Ensambla. (Resueltos: "squad" → **Team** en los prototipos; umbral de N mínimo del eNPS
**configurable** por Organization, default 4.)
