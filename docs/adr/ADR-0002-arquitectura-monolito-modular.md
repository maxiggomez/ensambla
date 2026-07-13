# ADR-0002 · Arquitectura: monolito modular

**Estado:** Aceptado · **Fecha:** 2026-07-12

## Contexto

DDD-lite: el dominio es rico y se reparte en bounded contexts. El trabajo lo hacen
varios agentes en paralelo, y necesitamos fronteras claras para que no se pisen.
Microservicios serían overhead injustificado a nivel MVP sin presupuesto.

## Decisión

**Monolito modular**: una sola app desplegable, organizada por bounded context.

- Estructura: `src/modules/<contexto>/` (uno por capability: `okrs`, `teams-staffing`,
  `culture-enps`, etc.), cada módulo con capas `domain/`, `application/`, `infrastructure/`.
- `src/shared/` = shared kernel: `Measurement`, IDs, errores, contexto de tenant,
  utilidades comunes.
- **Regla de dependencia:** los módulos se comunican solo por interfaces públicas
  (`application/`), nunca importando internals de otro módulo. Se refuerza con reglas
  de lint (prohibir deep imports entre módulos).
- **Ownership:** un agente es dueño de un módulo end-to-end (vertical), no de una capa.
- Se puede extraer un módulo a servicio independiente más adelante sin reescribir el dominio.

## Consecuencias

- (+) Fronteras = unidades de trabajo aisladas para los agentes; menos conflictos de merge.
- (+) Despliegue y ops simples (una app).
- (−) Requiere disciplina de límites → se automatiza con lint/CI.

## Alternativas consideradas

- **Microservicios:** rechazado por overhead de infra/ops a nivel MVP.
- **Monolito sin módulos:** rechazado; borronea contextos y hace colisionar agentes.
