# ADR-0003 · Multi-tenancy

**Estado:** Aceptado · **Fecha:** 2026-07-12

## Contexto

Cada Organization es un tenant y sus datos deben estar totalmente aislados
(invariante 🔒). Debe ser barato de operar y difícil de romper por error de un agente.

## Decisión

**Base única, esquema compartido, aislamiento por Row-Level Security (RLS) de Postgres.**

- Toda tabla con datos de tenant lleva `organization_id` (not null).
- Se activan **políticas RLS** que filtran por `organization_id` = el tenant del request.
- La app setea el tenant en el contexto de sesión de la conexión (variable de sesión)
  en cada request, tomado del usuario autenticado.
- Ninguna query de negocio puede acceder a datos sin el filtro de tenant: lo garantiza
  la DB, no la aplicación.
- Toda migración que crea una tabla de tenant DEBE incluir su política RLS.

## Consecuencias

- (+) Aislamiento reforzado en la capa de datos; un bug de app no expone datos cruzados.
- (+) Costo mínimo (una sola base).
- (−) Hay que setear el tenant de sesión en cada request y no olvidar la política en migraciones
  → se cubre con un helper central y un check en CI.

## Alternativas consideradas

- **Schema-por-tenant / base-por-tenant:** mayor aislamiento pero overhead de operación
  y migraciones a escala; rechazado a nivel MVP.
