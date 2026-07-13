---
name: mg-eng-loop
description: Use this skill to implement any feature or bugfix through the project engineering loop - OpenSpec-first, strict TDD with a user-approved test plan, objective verification, and explicit stop conditions.
---

# mg-eng-loop — Engineering Loop de Ensambla

Usá esta skill para **toda** feature o bugfix. El protocolo es único; el tipo
(`feature` | `bugfix`) solo cambia de dónde sale el test rojo (Scenario nuevo vs
test de regresión).

Fuente de reglas permanentes: `AGENTS.md` (léelo primero) y los ADRs (`docs/adr/`).
TDD es obligatorio (ADR-0006): red → green → refactor, sin excepción en
dominio/aplicación e invariantes.

## Protocolo

### 1. DISCOVER

- Leé el pedido del usuario y clasificá el tipo (feature / bugfix).
- Explorá el código afectado con `grep`/`glob`/`read` dirigidos. Contexto chico.
- Specs on-demand: `openspec list` y abrí **solo** la spec de la capability
  afectada (`openspec/specs/<capability>/spec.md`). No leas todas las specs.
- Identificá si toca áreas de riesgo 🔒: multi-tenancy/RLS, anonimato eNPS,
  roll-up de OKRs, auth/Clerk, migraciones de DB, límites de módulos.

### 2. CAMINO

Clasificá y **frená para que el usuario confirme** (tu clasificación es solo una
recomendación; la elección del usuario manda):

- **CAMINO CORTO**: sin cambio de comportamiento observable ni impacto en spec
  (typo, estilo, tooltip, refactor interno). Sin OpenSpec change; cambio mínimo
  directo, un verifier dirigido, máx. 2 iteraciones. Nunca aplica si toca un
  área 🔒.
- **CAMINO COMPLETO**: todo lo demás (comportamiento nuevo, API/DB, validaciones,
  reglas de negocio, permisos, áreas 🔒). Sigue el protocolo entero.

Mostrá: resumen del cambio, spec afectada (o "ninguna"), riesgo + motivo, el
**mapa de impacto arquitectónico**, camino recomendado, y
`Elegí camino: [corto / completo]`. No avances hasta que elija.

**Mapa de impacto arquitectónico** (obligatorio en ambos caminos — el usuario
valida DÓNDE va el cambio antes de que exista código):

| Módulo / área | Capa | Qué cambia | Archivos previstos |
| ------------- | ---- | ---------- | ------------------ |

- Capas: `domain` · `application` · `infrastructure` · `shared/<lib>` ·
  `app (UI)` · `components`.
- Regla de ubicación (DDD, ADR-0002): reglas de negocio e invariantes →
  `domain/`; casos de uso/orquestación → `application/`; Prisma/IO →
  `infrastructure/` o `shared/db`; nunca lógica de dominio en handlers o UI.
- Si durante la implementación el impacto real difiere del mapa aprobado
  (módulo o capa nuevos), frená y volvé a presentar el mapa.

### 3. OPENSPEC (solo CAMINO COMPLETO)

- Creá o actualizá el OpenSpec change (`proposal.md`, delta specs con
  `## ADDED/MODIFIED/REMOVED Requirements` y al menos un `#### Scenario:` por
  requirement, `tasks.md` en orden test-first; `design.md` solo si es no trivial
  o toca áreas 🔒).
- Validá: `openspec validate <change-id> --strict`.
- Si ya existe un change activo que cubre el pedido, usalo; no dupliques.

### 4. PLAN DE TESTS → **GATE DE APROBACIÓN** (solo CAMINO COMPLETO)

Antes de escribir cualquier test o código, presentá el plan de tests derivado de
los Scenarios y **esperá la aprobación del usuario**:

| Scenario / bug | Test (archivo · nombre) | Nivel | Por qué va a fallar (rojo) |
| -------------- | ----------------------- | ----- | -------------------------- |

- Nivel: `unit` (dominio, Vitest) · `integration` (casos de uso + Postgres
  efímero, Vitest) · `e2e` (Playwright).
- En bugfix: el primer test es la **regresión** que reproduce el bug.
- Todo Scenario del delta debe mapear a ≥1 test. Las invariantes 🔒 tocadas
  llevan test obligatorio y no salteable.
- Cerrá con: `¿Apruebo el plan de tests? [sí / ajustar]`. **No escribas tests ni
  implementación hasta el OK.** Si el usuario ajusta, actualizá el plan y volvé
  a preguntar.

### 5. RED

- Escribí los tests aprobados. Corrélos y **mostrá que fallan por el motivo
  esperado** (pegá el error relevante). Si un test pasa en rojo, está mal
  escrito: corregilo antes de seguir.

### 6. GREEN

- Implementá el mínimo código para poner los tests en verde, una tarea de
  `tasks.md` a la vez, marcándolas al completarlas.
- Cambio mínimo y acotado: sin refactors no relacionados, sin tocar archivos
  ajenos al cambio, respetando el mapa de impacto aprobado.
- **Checklist DDD** (el lint refuerza los imports; esto es sobre dónde vive la
  lógica):
  - Reglas de negocio e invariantes en `domain/` — nunca en handlers, UI ni
    repos. `domain/` es puro: sin Prisma, sin Next, sin tenancy.
  - Casos de uso en `application/`: orquestan, no contienen reglas de dominio.
  - Prisma/IO solo en `infrastructure/` y `shared/db`; queries de tenant
    siempre vía `withTenant`.
  - Cross-módulo solo por `application/` ajeno.
  - Nombres del lenguaje ubicuo tal cual (`Team`, `Objective`, `KeyResult`,
    `Measurement`, `Member`, …).

### 7. REFACTOR

- Con los tests en verde, limpiá duplicación y nombres. Los tests no se tocan
  salvo que cambie el contrato (y eso vuelve al paso 4).

### 8. VERIFY

Corré el verifier más específico primero y después los relevantes:

- `npm run typecheck`
- `npm run lint` (incluye límites de módulos)
- `npm run format:check`
- `npm run test` (Vitest: unit + integration)
- `npm run test:e2e` (si el cambio toca UI o flujos)
- `npm run build` (si el cambio puede afectar el build)
- `openspec validate --all --strict` (si se tocaron artefactos OpenSpec)

Si algo falla: leé el error, aplicá la corrección más chica, iterá. Nunca
ignores un test que falla ni marques la tarea como completa con rojo.

### 9. REVIEW

- Ejecutá el protocolo de `mg-pr-review` sobre el diff (subagente si el runtime
  lo soporta; si no, pasada read-only en el mismo hilo con contexto fresco).
- Obligatorio en CAMINO COMPLETO si el diff toca áreas 🔒; recomendado siempre.
- Si devuelve BLOCKED: corregí, re-verificá y hacé **una** re-revisión acotada a
  lo que cambió. Máx. 2 rondas; si sigue BLOCKED, frená y escalá al usuario.

### 10. CIERRE (solo CAMINO COMPLETO)

- `tasks.md` al día; si el change quedó completo, ofrecé sync de specs y archive
  (flujo OpenSpec del proyecto). No archives sin confirmación del usuario.

### STOP CONDITIONS

Frená y resumí (qué se hizo, qué falta, qué decisión se necesita) cuando:

- El plan de tests o el proposal necesitan aprobación del usuario (gates 2 y 4).
- Todos los verifiers relevantes pasan (fin normal).
- Acumulás **3 iteraciones fallidas** de implementación sobre el mismo problema.
- El cambio requiere una decisión de producto o de arquitectura (nuevo ADR).
- No existe un verifier objetivo para validar el cambio.

## Hard Rules

- Nunca trabajes directo sobre `main`; pedí branch primero.
- Nunca `git push`. Nunca commits sin aprobación explícita.
- Nunca toques `.env`, secretos, credenciales ni config de producción.
- Nunca deshabilites RLS ni bypasses de tenancy, anonimato eNPS o roll-up 🔒.
- Nunca comandos destructivos de DB ni migraciones destructivas sin aprobación.
- Nunca `any` en TypeScript sin justificación explícita aprobada.
- Nunca marques tareas hechas con tests o verifiers en rojo.

## Output final

- Tipo (feature/bugfix) y camino usado (corto/completo).
- Mapa de impacto final (módulo/capa/archivos) y si difirió del aprobado.
- OpenSpec change usado (o "ninguno").
- Plan de tests aprobado y resultado (rojo→verde por test).
- Archivos modificados.
- Verifiers corridos y su estado.
- Review: estado final (o motivo por el que se salteó + comando manual
  `/mg-loop-review`).
- Riesgos pendientes.
