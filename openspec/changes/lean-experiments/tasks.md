# Tasks: lean-experiments

Orden test-first (ADR-0006). Cada tarea de test precede a su implementación y
declara los Scenarios cubiertos. No se marca ninguna tarea hasta observar rojo →
verde y no se hace commit sin aprobación explícita.

## 1. Dominio puro: hipótesis, ciclo y aprendizaje

- [x] 1.1 **Test rojo** `hypothesis.test.ts` — Scenario **Hypothesis uses the
      structured format**: belief y expected outcome no vacíos se normalizan y
      renderizan como “We believe X → we expect Y”; cualquier campo vacío falla
- [x] 1.2 Implementar `domain/hypothesis.ts`
- [x] 1.3 **Test rojo** `experiment-lifecycle.test.ts` — Scenarios **Advance
      through states**, **Reject an invalid transition** y **Measuring requires
      metric and cutoff**: sólo acepta Hypothesis → Building → Measuring →
      Learned; rechaza skip/repeat/backward; Measuring exige `Measurement`
      válido + cutoff
- [x] 1.4 Implementar `domain/experiment-lifecycle.ts` usando el `Measurement`
      compartido sin modificarlo
- [x] 1.5 **Test rojo** `learning.test.ts` — Scenarios **Cannot close without
      structured learning and decision** y **Structured learning**: Believed,
      Tested y Learned no vacíos + decisión `persevere|pivot`; datos parciales o
      decisión inválida fallan
- [x] 1.6 Implementar `domain/learning.ts`

## 2. Schema y migración tenant-safe 🔒

- [x] 2.1 **Test rojo** `test/integration/lean-experiments-schema.test.ts` —
      Scenario **Cross-Organization experiment data is isolated**: las tablas
      aún no existen; luego verificará `organization_id NOT NULL`, ENABLE+FORCE
      RLS y políticas en Hypothesis/Experiment/Learning, relaciones compuestas
      Org+KR/Objective, unicidad uno-a-uno y constraints de estados/decision
- [x] 2.2 Agregar enums, modelos y relaciones Prisma y una migración aditiva
      `lean_experiments` con índices, composite foreign keys, constraints y RLS;
      regenerar el Prisma client
- [x] 2.3 Ejecutar 2.1 hasta verde antes de avanzar

## 3. Contrato público de contexto OKR

- [x] 3.1 **Test rojo** `test/integration/okrs-key-result-context.test.ts` —
      Scenarios **Hypothesis requires a visible KeyResult** y aislamiento:
      devuelve KR + Objective visibles, oculta drafts ajenos y datos de otra
      Organization, y resuelve un batch sin deep imports
- [x] 3.2 Implementar y exportar el resolver mínimo desde
      `okrs/application/`; actualizar su test de contrato público
- [x] 3.3 Ejecutar 3.1 hasta verde y confirmar límites ADR-0002 con lint dirigido

## 4. Crear y listar experimentos

- [x] 4.1 **Test rojo** `test/integration/lean-experiments-create.test.ts` —
      Scenarios **Hypothesis requires a visible KeyResult**, **Hypothesis uses
      the structured format**, **Board reflects lifecycle state** y
      **Cross-Organization experiment data is isolated**: crea en Hypothesis con
      links KR/Objective, rechaza id ausente/invisible/cross-tenant y lista sólo
      tarjetas del tenant en su columna
- [x] 4.2 Implementar `create-experiment`, `list-experiment-board`, repositorios,
      view models y exports públicos; validar contexto exclusivamente vía
      `okrs/application`
- [x] 4.3 Ejecutar 4.1 hasta verde y refactorizar sin cambiar el contrato

## 5. Transiciones y medición

- [x] 5.1 **Test rojo** `test/integration/lean-experiments-lifecycle.test.ts` —
      Scenarios **Advance through states**, **Reject an invalid transition**,
      **Measuring requires metric and cutoff**, **Board reflects lifecycle
      state** y aislamiento: persiste el próximo estado, mapea todas las variantes
      de `Measurement`, exige cutoff, rechaza skip/repeat/backward y hace
      compare-and-set ante dos transiciones stale
- [x] 5.2 Implementar `start-building` y `start-measuring` con repositorio de
      compare-and-set y mapeo compartido de `Measurement`
- [x] 5.3 Ejecutar 5.1 hasta verde y refactorizar manteniendo queries
      secuenciales dentro de cada transacción

## 6. Cierre y biblioteca de aprendizajes

- [x] 6.1 **Test rojo** `test/integration/lean-experiments-learning.test.ts` —
      Scenarios **Cannot close without structured learning and decision**,
      **Structured learning**, **Learnings library** y aislamiento: un cierre
      incompleto conserva Measuring; uno válido crea exactamente un Learning,
      mueve a Learned y la biblioteca muestra estructura + links KR/Objective
      sólo del tenant
- [x] 6.2 Implementar `close-experiment`, `list-learnings`, persistencia atómica
      del Learning y resolución batch del contexto OKR por interfaz pública
- [x] 6.3 Ejecutar 6.1 hasta verde y refactorizar

## 7. UI vertical Motor Lean

- [x] 7.1 **Test rojo UI** `src/app/(app)/motor-lean/motor-lean-ui.test.ts` —
      Scenarios **Board reflects lifecycle state** y **Learnings library**:
      exige board accesible de cuatro columnas, formularios/acciones con labels,
      estados vacío/carga/error, mensajes en español y tokens sin hex ad-hoc
- [x] 7.2 Implementar `/motor-lean`, server actions y componentes Radar para
      crear, avanzar, medir, cerrar y consultar aprendizajes; acciones explícitas
      accesibles, sin depender de drag-and-drop
- [x] 7.3 Ejecutar 7.1 hasta verde y verificar navegación/foco por teclado
- [x] 7.4 **Test Playwright rojo** `e2e/lean-experiments.spec.ts` — flujo visible
      Scenarios **Hypothesis uses the structured format**, **Advance through
      states**, **Measuring requires metric and cutoff**, **Structured learning**
      y **Learnings library**: crear desde un KR, avanzar, observar validación,
      medir, cerrar y encontrar el Learning con KR/Objective
- [x] 7.5 Ejecutar 7.4 hasta verde con el setup dev-auth existente

## 8. Verificación y review

- [x] 8.1 `npm run typecheck`
- [x] 8.2 `npm run lint` (incluye límites entre módulos)
- [x] 8.3 `npm run format:check`
- [x] 8.4 `npm run test` (unit + integración; todos los Scenarios verdes)
- [x] 8.5 `npm run test:e2e:dev-auth`
- [x] 8.6 `npm run build`
- [x] 8.7 `openspec validate --all --strict`
- [x] 8.8 Review read-only con `mg-pr-review` (obligatorio por RLS 🔒); corregir
      y reverificar cualquier hallazgo bloqueante
- [x] 8.9 Presentar DoD y pedir aprobación antes de commits; no push ni PR
