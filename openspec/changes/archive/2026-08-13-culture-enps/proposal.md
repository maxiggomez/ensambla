# Proposal: culture-enps

## Why

Ensambla necesita medir el clima de forma continua y convertir una caída de eNPS
en una señal operativa accionable, sin comprometer la confianza de las personas.
Este change entrega la capability `culture-enps` como slice vertical completo:
lanzamiento y recurrencia de pulsos, respuesta anónima, resultados protegidos por
umbral, drivers y correlación con capacidad.

El anonimato no se resuelve ocultando datos en la UI: se garantiza por el modelo
de datos, que separa participación de respuesta, no guarda una relación entre
persona y `PulseResponse`, impide mutar respuestas y no ofrece lecturas
individuales (ADR-0005).

## What Changes

- **Módulo nuevo `culture-enps`**:
  - Dirección puede lanzar un `Pulse` para toda la Organization o para un Team.
    La entrega es in-app mediante participaciones pendientes para las personas
    del alcance.
  - Dirección puede configurar una recurrencia semanal, mensual o trimestral;
    el generador de vencimientos crea pulsos idempotentes según la frecuencia.
  - Cada persona destinataria puede enviar una única respuesta con rating eNPS
    0–10 modelado como `Measurement<Integer>`, comentario opcional y driver.
  - La respuesta queda anónima e inmutable. La participación se marca por
    separado y no existe clave ni relación respuesta ↔ persona.
  - Dirección puede configurar el N mínimo por Organization (default y piso
    seguro: 4). Por debajo del umbral no se devuelven score, distribución,
    comentarios ni conteos del grupo.
  - Se calcula eNPS global y por Team, se agrupan comentarios por driver y se
    detecta una correlación cuando cae el eNPS de un Team cuya capacidad supera
    100%.
- **Persistencia + RLS 🔒**: modelos tenant-scoped para pulses, schedules,
  participaciones y respuestas, con RLS en la misma migración. Trigger de DB
  bloquea `UPDATE` y `DELETE` de `pulse_response`.
- **UI Radar** en español: bandeja y formulario de respuesta anónima; panel de
  Dirección para lanzar/configurar pulsos y consultar resultados/estados
  suprimidos, usando tokens y componentes existentes del design system.

## Out of scope

- Envío por email/Slack y la configuración del proveedor de jobs/cron. El caso
  de uso idempotente de generación queda listo para ser invocado por el runner
  de plataforma cuando se configure.
- Correlación con retros vencidas: `rituals` aún no está implementado. Este
  slice cubre la señal de capacidad existente a través de la interfaz pública
  de `teams-staffing`.
- Clasificación automática por IA de texto libre. En este slice la persona
  selecciona un driver y los comentarios se agrupan por ese tema.
- Reflejo de eNPS en `executive-dashboard` y notificaciones fuera de la app.

## Impact

- Spec afectada: `culture-enps` (delta que cubre sus nueve Scenarios).
- Código nuevo: `src/modules/culture-enps/` y `src/app/culture-enps/`.
- Persistencia: `prisma/schema.prisma` + migración aditiva.
- Dependencias leídas solo por sus interfaces públicas:
  `identity-org/application` (audiencia/actor) y
  `teams-staffing/application` (alcance Team/capacidad).
- Sin cambios en otras capabilities ni en el shared kernel; `Measurement` se
  consume tal como existe.
- Áreas 🔒: multi-tenancy/RLS, anonimato eNPS, inmutabilidad y migración de DB.
