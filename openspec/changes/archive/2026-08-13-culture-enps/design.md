# Design: culture-enps

## Contexto

`culture-enps` es un bounded context nuevo con dominio, aplicación e
infraestructura propios. Depende de `identity-org` para actor/audiencia y de
`teams-staffing` para alcance y capacidad, siempre por sus exports de
`application/` (ADR-0002). `rituals` no existe todavía en este worktree y queda
fuera del cambio.

La dificultad central es sostener simultáneamente tres propiedades: una persona
responde una sola vez, la respuesta nunca se atribuye a esa persona y ningún
grupo chico filtra resultados. Las tres se refuerzan en dominio, aplicación y
base de datos.

## Mapa de impacto arquitectónico

| Módulo / área | Capa | Qué cambia | Archivos previstos |
| ------------- | ---- | ---------- | ------------------- |
| `culture-enps` | `domain` | Pulse, recurrencia, rating tipado, eNPS, umbral, drivers, correlación y políticas | `src/modules/culture-enps/domain/*.ts` + tests |
| `culture-enps` | `application` | Lanzar/generar, responder, configurar N, listar pendientes y obtener agregados | `src/modules/culture-enps/application/*.ts` |
| `culture-enps` | `infrastructure` | Repos tenant-scoped; queries agregadas sin API individual | `src/modules/culture-enps/infrastructure/*.ts` |
| Persistencia | `shared/db` | Modelos Prisma y migración RLS/inmutabilidad | `prisma/schema.prisma`, `prisma/migrations/<timestamp>_culture_enps/migration.sql` |
| Cultura | `app (UI)` | Gestión/resultados y respuesta anónima | `src/app/culture-enps/**` |
| Verificación | tests | Unit, integración Postgres y Playwright | `src/modules/culture-enps/domain/*.test.ts`, `test/integration/culture-enps-*.test.ts`, `e2e/culture-enps.spec.ts` |
| Dependencias | interfaces públicas | Miembros, asignaciones y capacidad | sin cambios en otros módulos |

## Decisiones

### D1 — Alcance explícito y entrega in-app

`PulseScope` es una unión cerrada:

- `Organization`: audiencia = Members activos de la Organization.
- `Team`: audiencia = Members asignados al Team.

Lanzar un pulse crea el `Pulse` y una fila `PulseParticipation` por destinatario.
Esas filas son la bandeja in-app y registran únicamente si la persona respondió.
No guardan ni reciben un `pulse_response_id`.

Dirección es el único rol que puede lanzar y configurar. Una persona solo puede
responder si tiene participación pendiente en ese pulse. Para evitar dobles
respuestas en concurrencia, la aplicación reclama atómicamente la participación
pendiente antes de insertar la respuesta dentro de la misma transacción.

### D2 — Anonimato estructural e inmutabilidad 🔒

`PulseParticipation` contiene `member_id`, `pulse_id` y únicamente el booleano
`responded` (sin timestamp que permita correlacionar envíos).
`PulseResponse` contiene `organization_id`, `pulse_id`, el `team_id` heredado
del alcance Team, rating, driver, comentario y `submitted_at`; **no contiene**
`member_id`, `participation_id`, email, auth id ni otra identidad.

No hay FK, token compartido ni identificador que conecte ambas tablas. La
transacción marca participación e inserta respuesta, pero no devuelve un id de
respuesta al cliente. `application/index.ts` exporta únicamente lecturas
agregadas; no existe caso de uso, route ni acción para obtener una respuesta
individual.

La tabla `pulse_response` no tiene `updated_at`. Un trigger `BEFORE UPDATE OR
DELETE` rechaza mutaciones para cualquier rol de DB. La aplicación solo posee
operaciones de inserción y agregación. Los comentarios salen únicamente dentro
de un resultado que superó el umbral y sin metadatos de autoría.

### D3 — Rating y resultados usan `Measurement` (ADR-0004)

El rating se valida como un `Measurement` cerrado:

```ts
{ type: "integer", start: 0, target: 10, current: score }
```

El dominio exige exactamente ese rango y un `current` entero entre 0 y 10. La
persistencia reutiliza el patrón discriminador + columnas tipadas del shared
kernel (`measurement_type`, `start_value`, `target_value`, `current_value`,
campos no aplicables en null), con un `CHECK` adicional para la forma eNPS.

El resultado también expone el score como
`Measurement<Integer>({ start: -100, target: 100, current: enps })`; la
participación se expone como `Measurement<Percentage>`. No se persisten scores
ni porcentajes derivados.

### D4 — Cálculo eNPS y umbral seguro configurable

- Promotor: rating 9–10.
- Pasivo: rating 7–8.
- Detractor: rating 0–6.
- `eNPS = round((promotores / N - detractores / N) * 100)`.

`organization.enps_minimum_responses` tiene default 4. Dirección puede elevarlo
o cambiarlo, pero el dominio acepta solo enteros entre 4 y 100: la
configurabilidad nunca puede debilitar el piso de anonimato.

La consulta evalúa el umbral por grupo (Organization o Team) antes de construir
el resultado. Si no alcanza N devuelve solo `{ status: "suppressed",
minimumResponses }`; no devuelve score, distribución, comentarios ni cantidad
exacta de respuestas.

### D5 — Recurrencia idempotente

`PulseSchedule` guarda alcance, frecuencia (`Weekly | Monthly | Quarterly`),
`next_run_at` y estado. `generateDuePulses(now)` toma schedules vencidos con
bloqueo de fila, crea el pulse y avanza `next_run_at` por intervalos calendario.
La unicidad `(schedule_id, scheduled_for)` hace el proceso reintentable sin
duplicados. El reloj se inyecta para tests deterministas.

El caso de uso queda en la interfaz pública para un runner de plataforma; este
change no agrega secretos ni configuración de producción para cron.

### D6 — Drivers sin atribución

La respuesta admite un driver de conjunto cerrado (`Recognition`,
`GoalClarity`, `CareerGrowth`, `Workload`, `Coordination`, `Other`) y un
comentario opcional. Al mostrar resultados, los comentarios se agrupan por
driver y cada grupo contiene cantidad y textos anónimos. Ninguna salida incluye
ids de response, timestamps individuales ni datos de participación.

### D7 — Correlación con señales operativas

El dominio compara el eNPS visible de un Team con su medición visible anterior.
Solo si cae, evalúa señales operativas. En este slice el adapter de aplicación
consume `listTeamCapacities` de `teams-staffing/application`; una capacidad
mayor a 100 genera la correlación `TeamEnpsDrop + OverCapacity`.

La función de dominio recibe una lista tipada de señales, por lo que una futura
señal `OverdueRetro` podrá entrar desde `rituals/application` sin cambiar el
modelo ni importar internals. No se modifica `teams-staffing` ni `rituals`.

### D8 — RLS y modelo de datos 🔒

Modelos tenant-scoped:

- `Pulse`: scope, `team_id?`, estado, apertura, cierre opcional,
  `schedule_id?`, `scheduled_for?`.
- `PulseSchedule`: scope, `team_id?`, frecuencia, próxima ejecución, activo.
- `PulseParticipation`: pulse + member + booleano `responded`, única por
  `(pulse_id, member_id)`.
- `PulseResponse`: pulse + team snapshot opcional + columnas `Measurement` +
  driver/comentario + fecha de envío; sin identidad y sin campos mutables.

Cada tabla lleva `organization_id NOT NULL`, `ENABLE ROW LEVEL SECURITY`,
`FORCE ROW LEVEL SECURITY` y política `FOR ALL` por `app.current_org` en la
misma migración. Las tablas puente llevan su propio `organization_id` para que
RLS no dependa de joins. Checks de consistencia exigen Team para scope Team y
lo prohíben para scope Organization.

La migración es aditiva: cuatro tablas, enums, índices, políticas, trigger y la
columna con default en `organization`. No borra ni reescribe datos existentes.

### D9 — UI Radar y estados

`/culture-enps` resuelve al actor autenticado y presenta:

- a cualquier destinatario: pulses pendientes, escala 0–10, driver, comentario
  y aviso explícito de anonimato;
- a Dirección: formulario de lanzamiento/recurrencia, configuración de N y
  resultados globales/por Team;
- para grupos bajo N: estado suprimido, sin métricas parciales;
- estados vacío, carga y error con componentes shadcn existentes.

Se usan `Card`, `Button`, `Input`, `Label`, tokens semánticos y patrones de
KPI/alerta del design system. No se hardcodean colores ni se copian los colores
obsoletos del prototipo.

## Riesgos y mitigaciones

- **Reidentificación por modelo de datos 🔒**: test de schema confirma ausencia
  de identidad/FK en `pulse_response`; test de interfaz confirma que no existe
  lectura individual.
- **Mutación de respuestas 🔒**: tests de aplicación y SQL directo verifican
  que no hay segundo envío y que DB rechaza `UPDATE`/`DELETE`.
- **Filtración por grupos chicos 🔒**: tests explícitos para N=3 con default 4,
  N=4 visible y threshold configurado por Organization, incluyendo aislamiento.
- **Carrera de doble respuesta**: claim condicional de participación dentro de
  transacción y constraint único de participación.
- **Duplicación de recurrencia**: índice único y bloqueo de schedule.
- **Correlación falsa**: solo se informa coincidencia, no causalidad, y solo con
  dos mediciones visibles comparables.

## Nota de sync (cierre)

La spec principal ya describe el estado final. Al cerrar el change, el sync
preservará ese texto y el archive se hará únicamente con aprobación del usuario.
