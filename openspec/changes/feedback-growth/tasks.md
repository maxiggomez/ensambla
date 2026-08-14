# Tasks: feedback-growth

Orden test-first (ADR-0006). Cada tarea de test precede a su implementación y declara los
Scenarios cubiertos. No se marca ninguna tarea hasta observar rojo → verde y no se hace
commit sin aprobación explícita.

## 1. Dominio puro: Feedback, Project y GrowthPlan

- [x] 1.1 **Test rojo** `src/modules/feedback-growth/domain/feedback.test.ts` — Scenarios
      **Give linked feedback**, **Classify feedback** y **Give a kudo tied to a value**:
      normaliza contenido no vacío, acepta sólo `strength|improvement`, exige valor no vacío
      para Kudo y rechaza autor igual a destinatario
- [x] 1.2 Implementar `domain/feedback.ts` y `domain/kudo.ts`
- [x] 1.3 **Test rojo** `src/modules/feedback-growth/domain/growth-plan.test.ts` — Scenarios
      **Define a growth plan** y **View plan progress**: exige hito y targets únicos 0–4,
      calcula gaps y progreso derivado, incluyendo competencia ausente y target cero
- [x] 1.4 Implementar `domain/growth-plan.ts` sin persistir porcentajes derivados
- [x] 1.5 **Test rojo** `src/modules/teams-staffing/domain/project.test.ts` — Scenarios
      **Close an active project** y **Reject repeated project closure**: permite únicamente
      `Active → Closed`
- [x] 1.6 Extender `teams-staffing/domain/project.ts` con el ciclo mínimo de Project

## 2. Schema, relaciones tenant-safe y RLS 🔒

- [x] 2.1 **Test rojo** `test/integration/feedback-growth-schema.test.ts` — Scenario
      **Cross-Organization feedback and growth data is isolated**: las tablas aún no existen;
      luego verificará `organization_id NOT NULL`, ENABLE+FORCE RLS y políticas en las seis
      tablas, FKs compuestas tenant-safe, exclusividad de GrowthEvidence, targets 0–4,
      request-feedback uno-a-uno y status de Project
- [x] 2.2 Agregar enums/modelos/relaciones Prisma y migración aditiva `feedback_growth` con
      constraints, índices, FKs compuestas y RLS; regenerar el Prisma client
- [x] 2.3 Ejecutar 2.1 hasta verde antes de avanzar

## 3. Cierre y contrato público de Project

- [x] 3.1 **Test rojo** `test/integration/teams-staffing-project-lifecycle.test.ts` — Scenarios
      **Close an active project**, **Reject repeated project closure** y **Project context
      remains tenant scoped**: permisos Dirección/Líder, compare-and-set, contexto público y
      ocultamiento cross-tenant
- [x] 3.2 Implementar `close-project`, `get-project-context`, repositorio y exports públicos
      dentro de `teams-staffing/application/`
- [x] 3.3 Ejecutar 3.1 hasta verde y confirmar límites ADR-0002 con lint dirigido

## 4. Dar, pedir y consultar Feedback privado

- [x] 4.1 **Test rojo** `test/integration/feedback-growth-feedback.test.ts` — Scenarios
      **Give linked feedback**, **Request feedback**, **Classify feedback**, **Fulfill a
      feedback request**, **Keep feedback private** y aislamiento: valida Members, Project y
      Value por contratos públicos; crea inbox/outbox; fulfillment atómico; autor/receptor sí,
      tercer Member y otra Organization no
- [x] 4.2 Implementar `give-feedback`, `request-feedback`, `list-private-feedback`,
      `list-feedback-requests` y repositorios tenant-scoped
- [x] 4.3 Ejecutar 4.1 hasta verde y refactorizar sin exportar lecturas amplias de Feedback

## 5. Kudos y actividad

- [x] 5.1 **Test rojo** `test/integration/feedback-growth-kudos.test.ts` — Scenarios **Give a
      kudo tied to a value**, **Show an objective-linked kudo in activity** y aislamiento:
      exige valor vigente, valida Objective/KeyResult visible, rechaza referencias ambiguas y
      muestra contexto sólo dentro de la Organization
- [x] 5.2 Implementar `give-kudo`, `list-kudo-activity`, persistencia y resolución batch de
      contexto exclusivamente por interfaces públicas
- [x] 5.3 Ejecutar 5.1 hasta verde y refactorizar manteniendo queries tenant-safe

## 6. GrowthPlans, progreso y evidencia

- [x] 6.1 **Test rojo** `test/integration/feedback-growth-plans.test.ts` — Scenarios **Define a
      growth plan**, **View plan progress**, **Feed progress with feedback**, **Feed progress
      with a closed project**, **Reject ineligible growth evidence** y aislamiento: targets de
      Skills válidas, upsert atómico, progreso derivado de Competencies, evidencia propia/no
      duplicada, rechazo de Feedback ajeno/Project Active/cross-tenant
- [x] 6.2 Implementar `define-growth-plan`, `get-growth-plan`, `add-growth-evidence`,
      repositorios y view models usando `getCompetencyMatrix` y Project context públicos
- [x] 6.3 Ejecutar 6.1 hasta verde y refactorizar sin almacenar gaps ni porcentaje

## 7. UI vertical Feedback & Carrera

- [x] 7.1 **Test rojo UI** `src/app/(app)/feedback-y-carrera/feedback-growth-ui.test.ts` —
      Scenarios de inbox, Feedback privado, actividad de Kudos y progreso: exige formularios
      etiquetados, clasificaciones textuales, secciones accesibles, estados vacío/carga/error,
      feedback en español y tokens Radar sin hex ad-hoc
- [x] 7.2 Implementar page, server actions con Zod, formularios y vistas para dar/pedir
      Feedback, cumplir requests, dar Kudos, consultar actividad y gestionar el GrowthPlan
- [x] 7.3 Ejecutar 7.1 hasta verde y verificar navegación/foco por teclado
- [x] 7.4 **Test Playwright rojo** `e2e/feedback-growth.spec.ts` — flujo visible: solicitar y
      cumplir Feedback clasificado, privacidad ante tercer Member, Kudo con Value/contexto,
      definir targets, cerrar Project, adjuntarlo y observar hito/gap/progreso
- [x] 7.5 Ejecutar 7.4 hasta verde con dev-auth y fixtures independientes

## 8. Verificación y review

- [x] 8.1 `npm run typecheck`
- [x] 8.2 `npm run lint` (incluye límites entre módulos)
- [x] 8.3 `npm run format:check`
- [x] 8.4 `npm run test` (unit + integración; todos los Scenarios verdes)
- [x] 8.5 `npm run test:e2e:dev-auth`
- [x] 8.6 `npm run build`
- [x] 8.7 `npx --yes @fission-ai/openspec@latest validate --all --strict`
- [x] 8.8 Review read-only con `mg-pr-review` (obligatorio por privacidad y RLS 🔒);
      corregir y reverificar cualquier hallazgo bloqueante
- [x] 8.9 Presentar DoD y pedir aprobación antes de commits; no push ni PR
