# Tasks: strategy-northstar

Orden test-first (ADR-0006). Cada tarea de test precede a su implementación y
declara el Scenario cubierto. No se marca ninguna tarea hasta observar rojo →
verde y no se hace commit sin aprobación explícita.

## 1. Dominio puro: VOs de la estrategia

- [x] 1.1 **Test rojo** `strategy-statement.test.ts` — Scenario **Define strategy
      statements**: normaliza espacios, rechaza strings vacíos y rechaza items
      vacíos en `values`; tolera ausencia de vision/mission
- [x] 1.2 Implementar `domain/strategy-statement.ts`
- [x] 1.3 **Test rojo** `input-lever.test.ts` — Scenario **Link an input lever to
      an objective**: nombre no vacío, `objectiveId` opcional
- [x] 1.4 Implementar `domain/input-lever.ts`
- [x] 1.5 **Test rojo** `strategic-pillar.test.ts` — Scenario **Group objectives
      under a pillar**: nombre no vacío, descripción opcional normalizada
- [x] 1.6 Implementar `domain/strategic-pillar.ts`
- [x] 1.7 Ejecutar 1.1/1.3/1.5 hasta verde

## 2. Schema y migración (invariantes 🔒)

- [x] 2.1 **Test rojo** `test/integration/strategy-northstar-schema.test.ts` —
      columnas `vision`/`mission`/`values` en `organization`; `ENABLE + FORCE
      RLS` y políticas `tenant_all` sobre `north_star_lever`, `strategic_pillar`
      y `pillar_objective`; `organization_id NOT NULL` y `@@unique`
      `[pillar_id, objective_id]`
- [x] 2.2 Agregar columnas/modelos/relaciones Prisma y migración aditiva
      `strategy_northstar_ui` con RLS; regenerar Prisma client
- [x] 2.3 Ejecutar 2.1 hasta verde antes de avanzar

## 3. Estatutos: definir y leer

- [x] 3.1 **Test rojo** `test/integration/define-strategy.test.ts` — Scenario
      **Define strategy statements**: Dirección define vision/misión/valores y
      cualquier miembro los lee; Líder/Colaborador reciben forbidden; la
      Organization B no ve los estatutos de A (tenancy 🔒)
- [x] 3.2 Implementar `define-strategy` + `get-strategy`, repos y exports
- [x] 3.3 Ejecutar 3.1 hasta verde y refactorizar

## 4. Input levers

- [x] 4.1 **Test rojo** `test/integration/input-lever.test.ts` — Scenarios
      **Link an input lever to an objective** y **North Star is
      tenant-isolated**: sin North Star da `no-north-star`; Dirección agrega lever
      con y sin objetivo; objetivo de otro tenant es rechazado; Líder/Colaborador
      forbidden; los levers de A no son visibles en B (🔒)
- [x] 4.2 Implementar `add-input-lever` (valida objetivo vía `okrs/getObjective`)
      y repo de levers
- [x] 4.3 Ejecutar 4.1 hasta verde y refactorizar

## 5. Pilares y asignación

- [x] 5.1 **Test rojo** `test/integration/strategic-pillar.test.ts` — Scenario
      **Group objectives under a pillar**: Dirección crea pilar y asigna
      objetivos; asignar dos veces el mismo objetivo rechaza
      (`already-assigned`); objetivo de otro tenant rechazado; Líder/Colaborador
      forbidden; pilares tenant-isolated (🔒)
- [x] 5.2 Implementar `create-strategic-pillar` + `assign-objective-to-pillar`
      y repos
- [x] 5.3 Ejecutar 5.1 hasta verde y refactorizar

## 6. Mapa estratégico

- [x] 6.1 **Test rojo** `test/integration/get-strategic-map.test.ts` — Scenario
      **View the strategic map**: la cascada expone visión → North Star →
      pilares → objetivos con `progress` real derivado (roll-up 🔒); levers bajo
      la North Star con su objetivo; objetivos sin pilar aparecen como
      unassigned; respeta visibilidad de okrs (drafts ajenos no visibles para
      Colaborador); mapa tenant-isolated (🔒)
- [x] 6.2 Implementar `get-strategic-map` consumiendo solo interfaces públicas
      de `okrs` y `identity-org`
- [x] 6.3 Ejecutar 6.1 hasta verde y refactorizar

## 7. UI vertical (test-alongside permitido)

- [x] 7.1 Implementar `/norte-estrategico` y server actions: guard auth con
      fallback `/onboarding`; Dirección ve formularios de estatutos, North Star
      (formulario `Measurement` tipado), levers y pilares; todo miembro ve la
      lectura y el mapa estratégico; mensajes en español, tokens Radar
- [x] 7.2 Test Playwright `e2e/strategy-northstar.spec.ts` (config dev-auth mock)
      — Scenarios **Define strategy statements**, **View the strategic map** y
      **Link an input lever to an objective**: Dirección define y ve la cascada;
      Colaborador lee sin formularios de edición
- [x] 7.3 Tests de componentes/acciones para permisos, mensajes y ausencia de
      estilos hex ad-hoc

## 8. Verificación y review

- [x] 8.1 `npm run typecheck`
- [x] 8.2 `npm run lint` (incluye límites entre módulos)
- [x] 8.3 `npm run format:check`
- [x] 8.4 `npm run test` (unit + integración; todos los Scenarios verdes)
- [x] 8.5 `npm run test:e2e:dev-auth`
- [x] 8.6 `npm run build`
- [x] 8.7 `openspec validate --all --strict`
- [ ] 8.8 Review read-only con `mg-pr-review` (obligatorio por RLS + tenancy 🔒);
      corregir y reverificar cualquier hallazgo bloqueante
- [ ] 8.9 Presentar DoD y pedir aprobación antes de commits atómicos; no push ni PR
