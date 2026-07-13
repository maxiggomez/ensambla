# ADR-0004 · Valores tipados (`Measurement`)

**Estado:** Aceptado · **Fecha:** 2026-07-12

## Contexto

El usuario define el tipo de ciertos campos: un Key Result puede ser Check (boolean),
Porcentaje, Número entero, Moneda o Texto/Hito, y el patrón se repite en otros lados
(North Star, métrica de un Experimento). Hay que evitar la tentación de un EAV genérico
que destruiría tipos, queries e invariantes.

## Decisión

Modelar una **unión discriminada cerrada** llamada `Measurement`, en el shared kernel:

- Tipos permitidos (conjunto cerrado): `Check`, `Percentage`, `Integer`, `Currency`, `Text`.
- Se implementa como **discriminated union de Zod** + value object con **cálculo de
  progreso polimórfico** por tipo:
  - `Check` → 0% o 100%.
  - `Percentage` / `Integer` / `Currency` → `(actual − inicial) / (target − inicial)`.
  - `Text` → sin progreso numérico; estado (sin empezar / en curso / hecho).
- **Persistencia:** discriminador de tipo + valor tipado validado (columnas tipadas o
  JSON validado por Zod), siempre queryable. **No** EAV genérico.
- **Reutilización:** el mismo `Measurement` lo usan `okrs`, `strategy-northstar` y
  `lean-experiments`. Una sola fuente de verdad; agregar un tipo = tocar un solo lugar.
- **Regla de roll-up (🔒):** en un Objective, los KRs `Check`/`Text` aportan 0% o 100%
  según estado; el avance del Objective es el promedio ponderado de sus KRs y nunca se edita a mano.

**Campos custom arbitrarios** definidos por el usuario (metadatos sin target ni progreso)
son un problema **distinto**: si alguna vez se necesitan, van en una capability aislada de
Custom Fields (`FieldDefinition` + `FieldValue` tipado). **Diferido a post-MVP.**

## Consecuencias

- (+) Seguridad de tipos e invariantes preservadas; consistencia entre contextos gratis.
- (+) Los agentes tienen un único patrón que replicar, no tres soluciones divergentes.
- (−) Un tipo nuevo requiere tocar el value object central (aceptable y explícito).

## Alternativas consideradas

- **EAV genérico:** rechazado; flexibilidad a costa de tipos, queries e invariantes.
- **Un modelo por tipo (sin unión):** duplicación y roll-up inconsistente; rechazado.
