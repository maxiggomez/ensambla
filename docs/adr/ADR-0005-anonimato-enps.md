# ADR-0005 · Anonimato del eNPS

**Estado:** Aceptado · **Fecha:** 2026-07-12

## Contexto

El eNPS solo funciona si la gente confía en que es anónimo. Es una invariante 🔒:
ninguna respuesta debe poder atribuirse a un individuo, ni siquiera por Dirección.

## Decisión

- **Desacople de identidad:** `PulseResponse` se guarda **sin** referencia a la persona
  que respondió. La participación se registra por separado, solo como booleano
  "respondió / no respondió", sin vincular respuesta ↔ persona.
- **Umbral de N mínimo:** los resultados agregados (global o por team) solo se muestran
  si el grupo tiene al menos **N** respuestas (default 4, configurable por Organization).
  Por debajo del umbral, no se muestran resultados de ese grupo.
- **Sin endpoints individuales:** no existe ningún endpoint que devuelva una respuesta
  individual. La regla se refuerza en el diseño de datos, no por convención.
- Los comentarios abiertos se muestran sin autoría y se agregan en drivers/temas.

## Consecuencias

- (+) El anonimato queda garantizado estructuralmente, no por buena voluntad.
- (−) Algunos cortes analíticos quedan limitados por el umbral de N (es el precio correcto).

## Alternativas consideradas

- **Guardar identidad y "prometer" no mostrarla:** rechazado; un bug o un acceso admin
  rompería la invariante.
