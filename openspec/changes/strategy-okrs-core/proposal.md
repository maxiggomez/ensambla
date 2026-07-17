# Proposal: strategy-okrs-core

## Why

Con `foundation` e `identity-org` cerrados, sigue la primera capability de negocio
según la secuencia del README: `strategy-northstar` + `okrs`. Este change implementa
el slice núcleo: la North Star de la Organización como `Measurement` tipado
(ADR-0004) y el árbol Objective → KeyResults con la regla de roll-up 🔒 (el avance
de un Objective se deriva de sus KRs y nunca se edita a mano).

## What Changes

- **Módulo nuevo `strategy-northstar`**: definir/actualizar la North Star
  (una sola por Organización, solo Dirección) como `Measurement` tipado con valor
  actual y target; lectura para toda la Organización.
- **Módulo nuevo `okrs`**: crear Objectives con nivel (Company/Area/Team/Person)
  y owner; KeyResults tipados por `Measurement` (los numéricos exigen start y
  target para publicar; Text no exige target numérico); publicar exige ≥1 KR
  válido; actualizar el valor de un KR recomputa su progreso y el del Objective.
- **Roll-up 🔒 (ADR-0004)**: progreso del KR derivado de su `Measurement`
  (`shared/measurement`); progreso del Objective = promedio de sus KRs, derivado
  siempre, sin columna persistida ni API de edición manual.
- **DB + RLS 🔒 (ADR-0003)**: tablas `north_star`, `objective`, `key_result`
  tenant-scoped con políticas RLS en la misma migración (patrón `member_tenant_all`).
- **Interfaz pública de `identity-org`**: exportar `requireActor`/`forbidden`
  desde `application/index.ts` para reuso cross-módulo.

## Out of scope (slices posteriores)

Visión/misión/valores, pilares y mapa estratégico, palancas North Star→Objective,
check-ins (cadencia, evidencia, confianza, outdated/at-risk), cierre de ciclo,
alerta de objetivo huérfano, y toda la UI.

## Impact

- Specs afectadas: `strategy-northstar`, `okrs` (deltas con el subconjunto
  implementado en este slice).
- Código: `src/modules/strategy-northstar/`, `src/modules/okrs/` (nuevos),
  `prisma/schema.prisma` + migración, un export en
  `src/modules/identity-org/application/index.ts`.
- Áreas 🔒: roll-up de OKRs, multi-tenancy/RLS, migración de DB.
