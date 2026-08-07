# Tasks: culture-enps

Orden test-first (ADR-0006). Cada tarea de test precede a su implementación y
declara el Scenario cubierto. No se marca ninguna tarea hasta observar rojo →
verde y no se hace commit sin aprobación explícita.

## 1. Dominio puro: tipos, políticas y agregación

- [x] 1.1 **Test rojo** `pulse.test.ts` — Scenarios **Launch a pulse** y
      **Recurring pulses**: scope Organization/Team consistente; frecuencia
      semanal/mensual/trimestral avanza en calendario; solo Dirección puede
      lanzar/configurar
- [x] 1.2 Implementar `domain/pulse.ts`, `domain/recurrence.ts` y
      `domain/pulse-policy.ts`
- [x] 1.3 **Test rojo** `pulse-response.test.ts` — Scenario **Anonymous immutable
      response**: rating es `Measurement<Integer>` fijo 0–10, rechaza valores
      fuera de rango y normaliza driver/comentario sin identidad
- [x] 1.4 Implementar `domain/pulse-response.ts` y `domain/driver.ts`
- [x] 1.5 **Test rojo** `enps.test.ts` — Scenarios **Minimum N threshold**,
      **Configure the minimum N** y **Compute eNPS**: N=3 suprime con default 4,
      N=4 muestra; umbral entero 4–100; promotores 9–10, pasivos 7–8,
      detractores 0–6; score y participación son `Measurement`
- [x] 1.6 Implementar `domain/enps.ts` y `domain/minimum-responses.ts`
- [x] 1.7 **Test rojo** `drivers.test.ts` — Scenario **Group comments into
      drivers**: agrupa por tema, conserva textos anónimos y no emite ids,
      timestamps ni autoría
- [x] 1.8 Implementar `domain/drivers.ts`
- [x] 1.9 **Test rojo** `correlation.test.ts` — Scenario **Correlate a falling
      eNPS**: una caída visible + capacity >100 genera coincidencia; sin caída
      o sin sobrecarga no genera alerta ni afirma causalidad
- [x] 1.10 Implementar `domain/correlation.ts`

## 2. Schema y migración (test-first de invariantes 🔒)

- [x] 2.1 **Test rojo** `test/integration/culture-enps-schema.test.ts` — Scenarios
      **Anonymous immutable response**, **No individual response access** y
      aislamiento transversal: tablas/columna aún no existen; luego verificará
      `organization_id NOT NULL`, ENABLE+FORCE RLS y políticas de las cuatro
      tablas; `pulse_response` sin columnas/FKs de identidad; trigger bloquea
      `UPDATE` y `DELETE`; checks de scope y rating tipado
- [x] 2.2 Agregar enums/modelos/relaciones Prisma y migración aditiva
      `culture_enps` con RLS, constraints, índices y trigger de inmutabilidad;
      regenerar Prisma client
- [x] 2.3 Ejecutar 2.1 hasta verde antes de avanzar

## 3. Lanzamiento y entrega

- [x] 3.1 **Test rojo** `test/integration/culture-enps-launch.test.ts` — Scenario
      **Launch a pulse**: Dirección lanza a Organization y Team, crea una
      participación pendiente por persona del scope; Líder/Colaborador reciben
      forbidden; Organization B no ve ni recibe datos de A
- [x] 3.2 Implementar `launch-pulse` + audiencia vía interfaces públicas de
      `identity-org/application` y `teams-staffing/application`, repos de pulse
      y participation, y exports públicos
- [x] 3.3 Ejecutar 3.1 hasta verde y refactorizar sin cambiar contrato

## 4. Recurrencia

- [x] 4.1 **Test rojo** `test/integration/culture-enps-recurrence.test.ts` —
      Scenario **Recurring pulses**: schedule vencido genera pulse y audiencia,
      avanza `nextRunAt`, un retry no duplica `(schedule, scheduledFor)` y cada
      tenant procesa solo sus schedules
- [x] 4.2 Implementar `configure-pulse-schedule` y `generate-due-pulses` con
      reloj inyectable, lock e idempotencia
- [x] 4.3 Ejecutar 4.1 hasta verde y refactorizar

## 5. Respuesta anónima e inmutable 🔒

- [x] 5.1 **Test rojo** `test/integration/culture-enps-response.test.ts` — Scenario
      **Anonymous immutable response**: destinatario envía una vez; queda
      `responded` por separado; response persiste `Measurement` y no identidad;
      segundo envío falla; SQL directo no puede actualizar ni borrar
- [x] 5.2 Implementar `list-pending-pulses` y `submit-pulse-response` con claim
      atómico de participación + inserción anónima en la misma transacción
- [ ] 5.3 **Test rojo estructural** `culture-enps-public-api.test.ts` + assertion
      e2e de route inexistente — Scenario **No individual response access**:
      ninguna exportación, server action ni route permite leer una
      `PulseResponse`; el submit tampoco devuelve id o contenido persistido
- [ ] 5.4 Cerrar la interfaz pública `application/index.ts` y las actions para
      exponer solo pendientes, submit y agregados; ejecutar 5.1/5.3 en verde

## 6. Umbral configurable y resultados

- [x] 6.1 **Test rojo** `test/integration/culture-enps-results.test.ts` — Scenarios
      **Minimum N threshold**, **Configure the minimum N**, **Compute eNPS** y
      **Group comments into drivers**: default 4; con 3 no salen score,
      distribución, conteo ni comentarios; con 4 calcula global/Team y agrupa;
      Dirección configura N=5 solo para su Organization y la visibilidad cambia
- [x] 6.2 Implementar `configure-minimum-responses`, queries agregadas en repo y
      `get-enps-results`; validar threshold antes de materializar el view model
- [x] 6.3 Ejecutar 6.1 hasta verde y refactorizar

## 7. Correlación con capacity

- [x] 7.1 **Test rojo** `test/integration/culture-enps-correlation.test.ts` —
      Scenario **Correlate a falling eNPS**: dos pulses Team visibles muestran
      caída; `listTeamCapacities` reporta >100 y el resultado incluye una
      coincidencia operativa sin datos individuales; Team estable no alerta
- [x] 7.2 Implementar `analyze-team-enps` consumiendo exclusivamente
      `teams-staffing/application`; no tocar internals ni `rituals`
- [x] 7.3 Ejecutar 7.1 hasta verde y refactorizar

## 8. UI vertical (test-alongside permitido)

- [x] 8.1 Implementar `/culture-enps` y server actions: estados vacío/carga/error,
      bandeja de pulses, formulario 0–10 + driver/comentario + aviso de
      anonimato; panel Dirección para launch/schedule/N y resultados
      globales/Team suprimidos o visibles, usando shadcn/tokens Radar
- [ ] 8.2 Test Playwright `e2e/culture-enps.spec.ts` — Scenarios **Launch a
      pulse**, **Anonymous immutable response**, **Minimum N threshold** y
      **Compute eNPS**: Dirección lanza, destinatario responde sin recibir id,
      el panel oculta resultados bajo N y los muestra al alcanzar el umbral
- [x] 8.3 Test de componentes/acciones para permisos, mensajes en español,
      navegación por teclado, labels/foco y ausencia de estilos hex ad-hoc

## 9. Verificación y review

- [x] 9.1 `npm run typecheck`
- [x] 9.2 `npm run lint` (incluye límites entre módulos)
- [x] 9.3 `npm run format:check`
- [x] 9.4 `npm run test` (unit + integración; todos los Scenarios verdes)
- [ ] 9.5 `npm run test:e2e`
- [x] 9.6 `npm run build`
- [x] 9.7 `openspec validate --all --strict`
- [x] 9.8 Review read-only con `mg-pr-review` (obligatorio por RLS + anonimato 🔒);
      corregir y reverificar cualquier hallazgo bloqueante
- [ ] 9.9 Presentar DoD y pedir aprobación antes de commits atómicos; no push ni PR
