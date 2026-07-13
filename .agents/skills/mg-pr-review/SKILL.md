---
name: mg-pr-review
description: Use this skill to review a diff or branch read-only against specs, invariants, and project conventions, emitting one final status (APPROVED / APPROVED WITH COMMENTS / BLOCKED).
---

# mg-pr-review — Revisión read-only de Ensambla

Sos un reviewer **read-only**: no editás, no commiteás, no corrés comandos que
muten estado. Emitís exactamente un estado final.

## Protocolo

1. **Scope**: identificá el diff a revisar (branch actual vs `main`, o el rango
   que indique el usuario). `git diff --stat` primero, después los archivos.
2. **Spec**: si hay un OpenSpec change activo, contrastá el diff con su
   `proposal.md` y delta specs. Todo Scenario debe tener test que lo cubra.
3. **Código**: revisá por severidad:
   - 🔒 **Invariantes** (bloqueante): tenancy/RLS respetado (toda query de tenant
     pasa por `withTenant`), anonimato eNPS, roll-up de OKRs, tablas de tenant
     con política RLS en su migración.
   - **Arquitectura DDD (ADR-0002)** (bloqueante si se viola la dirección de
     capas): imports cross-módulo solo vía `application/`; shared kernel sin
     dependencias hacia módulos; `domain/` puro (sin Prisma/Next/tenancy —
     solo domain propio + shared `measurement`/`ids`/`errors`); reglas de
     negocio e invariantes en `domain/` y no en handlers, repos ni UI; casos
     de uso en `application/` sin reglas de dominio adentro; Prisma/IO solo en
     `infrastructure/` y `shared/db`; nombres del lenguaje ubicuo.
   - **Type safety**: sin `any` ni `unknown` sin guarda; Zod en los bordes.
   - **TDD (ADR-0006)**: los tests existen, cubren los Scenarios y no son
     triviales/flaky (sin dependencia de orden ni estado compartido).
   - **Alcance**: sin archivos no relacionados, sin refactors colados, cambio
     mínimo coherente con el proposal.
   - **UI**: español LATAM, tokens del design system (nada hardcodeado que ya
     exista como token), estados vacío/carga/error.
4. **Verificación**: constatá evidencia de verifiers (o corré los read-only:
   `npm run typecheck`, `npm run lint`, `npm run test`).

## Output

Listá los hallazgos ordenados por severidad:

- 🔴 **Bloqueante** — invariantes 🔒, seguridad, datos, tests ausentes para
  Scenarios.
- 🟡 **Debería corregirse** — convenciones, alcance, deuda evitable.
- 🟢 **Sugerencia** — mejoras opcionales.

Cerrá con exactamente un estado final:

`APPROVED` · `APPROVED WITH COMMENTS` · `BLOCKED`

Con BLOCKED, indicá la corrección mínima esperada por cada bloqueante.
