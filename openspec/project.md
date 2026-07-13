# Ensambla · Project Context (OpenSpec)

> Contexto permanente que todo agente lee antes de escribir código o specs.
> Producto: **Ensambla — Business Alignment & Agile People OS** para pymes.

## Propósito del producto

Conectar en un solo sistema la estrategia, los OKRs, los equipos, los proyectos,
la cultura y el aprendizaje de una pyme. Diferencial: no es un HRIS ni un software
de OKRs puro, sino el sistema operativo que une negocio + equipos + cultura con
lógica Lean/agile.

## Lenguaje ubicuo (usar estos términos en specs, código y UI)

- **Organization** — tenant. Todo dato pertenece a una y está aislado de las demás.
- **Member / Person** — persona dentro de una Organization.
- **Team** — unidad organizativa con **nombre y descripción**. (No usar "squad".)
- **Objective** — objetivo; nivel Company / Area / Team / Person; tiene un owner.
- **KeyResult (KR)** — resultado clave medible dentro de un Objective.
- **Measurement** — valor tipado reutilizable (ver ADR de valores tipados).
- **CheckIn** — actualización periódica de un KR (valor, confianza, comentario, evidencia).
- **Project** — iniciativa vinculada a uno o más Objectives.
- **Skill / Competency** — Competency = Person + Skill + Level (0–4).
- **Ritual** — ceremonia recurrente (check-in, retro, revisión).
- **Blocker** — impedimento con dueño y antigüedad.
- **Feedback / Kudo / GrowthPlan** — desarrollo y reconocimiento.
- **Pulse / PulseResponse** — medición de clima (eNPS).
- **Hypothesis / Experiment / Learning** — motor Lean.
- **NorthStar** — la métrica única que resume el valor entregado.

## Roles

- **Dirección** — ve y edita todo dentro de su Organization.
- **Líder** — edita OKRs, proyectos y personas de su Team.
- **Colaborador** — ve lo suyo y lo público; no edita OKRs de compañía.

## Invariantes transversales (SHALL respetarse en toda capability)

1. **Multi-tenancy:** aislamiento total de datos entre Organizations.
2. **Anonimato eNPS:** ninguna PulseResponse es recuperable a nivel individuo;
   los agregados requieren un N mínimo antes de mostrarse.
3. **Roll-up de Objectives:** el avance de un Objective se **deriva** de sus KRs;
   nunca se edita a mano. KRs de tipo Check/Texto aportan por estado (0/100).
4. **Editabilidad:** todo lo generado por template/import/IA es editable.
5. **Auditoría:** cambios en OKRs, permisos e importaciones quedan registrados.
6. **Idioma base:** español (LATAM).

## Stack (ver ADR-0001)

TypeScript full-stack: **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**,
**Prisma** sobre **PostgreSQL gestionado** (Neon/Supabase) con **RLS**, **Clerk/Auth.js**,
**Zod** para validación y tipos compartidos, **Vitest + Playwright** para tests.
Arquitectura: **monolito modular** (un módulo por bounded context).

## Convenciones de especificación

- Requirements en modo **SHALL**; scenarios en **GIVEN / WHEN / THEN / AND**.
- Una capability por carpeta en `openspec/specs/<capability>/spec.md`.
- Cada slice de construcción = un change en `openspec/changes/<change>/`.
- Cada Scenario mapea a un test automático (ver ADR-0006).
- **TDD obligatorio** (ADR-0006): primero el test que falla derivado del Scenario,
  luego la implementación (red → green → refactor). Test-first estricto en dominio/
  aplicación e invariantes; test-alongside permitido en UI/e2e. En `tasks.md`, la
  tarea de test va antes que la de implementación.

## ADRs (contexto arquitectónico permanente — leer antes de codificar)

- **ADR-0001** — Stack tecnológico (TypeScript full-stack).
- **ADR-0002** — Arquitectura: monolito modular, módulo por bounded context.
- **ADR-0003** — Multi-tenancy por Row-Level Security de Postgres.
- **ADR-0004** — Valores tipados (`Measurement`): unión discriminada cerrada, no EAV.
- **ADR-0005** — Anonimato del eNPS (desacople de identidad + N mínimo).
- **ADR-0006** — Testing: Scenarios de OpenSpec → tests (Vitest + Playwright).
- **ADR-0007** — Sistema de diseño (Tailwind + shadcn/ui + tokens). Guía: `docs/design-system.md`.

## Capabilities

`identity-org` · `onboarding-setup` · `strategy-northstar` · `okrs` ·
`teams-staffing` · `skills-matrix` · `rituals` · `feedback-growth` ·
`culture-enps` · `lean-experiments` · `executive-dashboard`

## Referencias

- Criterios de aceptación completos: `norte-criterios-de-aceptacion.md`
- Prototipo de UI (referencia visual): `norte-prototipo.html`, `norte-onboarding.html`
