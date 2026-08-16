# Tasks: rituals-ui

## 1. Contrato de diseño (UI source test, test-alongside)

- [x] 1.1 **Test** unit `rituals-ui.test.ts` (estilo `okrs-ui.test.ts`): sin
  `UnderConstruction`, labels/fieldset, sin colores hardcodeados, strings
  es-LATAM ("Crear ceremonia", "Marcar realizada", "Bloqueo", "Resolver",
  "Retrospectiva"). (rojo)
- [x] 1.2 Page + forms + actions cumplen el contrato. (verde)

## 2. Ceremonias: crear, avanzar cadencia y evaluar estado

- [x] 2.1 **Test** e2e: Dirección crea una ceremonia con cadencia semanal y
  fecha de inicio pasada, avanza la cadencia, y la ocurrencia vencida aparece
  como "Vencida"; la marca como realizada. (rojo)
- [x] 2.2 `page.tsx` + `CreateRitualForm` + `generateOccurrencesAction` +
  `evaluateRitualStatusAction` + `markHeldAction`. (verde)

## 3. Blockers: registrar, listar y resolver

- [x] 3.1 **Test** e2e: Dirección registra un Blocker vinculado a un Objective,
  aparece en el tablero y al resolverlo deja la lista abierta e incrementa el
  contador de resueltos. (rojo)
- [x] 3.2 `RecordBlockerForm` + `ResolveBlockerAction` + tablero +
  contador. (verde)

## 4. Retrospectivas y riesgo de aprendizaje

- [x] 4.1 **Test** e2e: un Team sin retros muestra el flag de riesgo; al
  registrar una retro desde la UI el flag desaparece. (rojo)
- [x] 4.2 `RecordRetrospectiveForm` + sección de flags vía
  `evaluateLearningRisks`. (verde)

## 5. app-shell

- [x] 5.1 Actualizar `e2e/app-shell.spec.ts` (Rituales deja de ser placeholder)
  y spec delta de `app-shell` en este change.

## 6. Verificación

- [x] 6.1 `npm run typecheck` · `lint` · `format:check` · `test` ·
  `test:e2e:dev-auth` · `build` · `openspec validate --all --strict`.