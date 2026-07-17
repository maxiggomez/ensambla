# Tasks: strategy-okrs-core

Orden test-first (ADR-0006): cada tarea de test va antes que su implementación.

## 1. Dominio okrs (unit, puro)

- [x] 1.1 Test rojo `roll-up.test.ts`: promedio simple de progresos (numérico,
      check, text por estado), `rollUp([]) === 0`, resultado en [0, 100]
- [x] 1.2 Implementar `domain/roll-up.ts` (🔒) sobre `shared/measurement`
- [x] 1.3 Test rojo `key-result.test.ts`: draft numérico sin start/target es
      inválido para publicar; text sin target numérico es válido; check válido;
      `toMeasurement()` mapea draft válido a `Measurement`
- [x] 1.4 Implementar `domain/key-result.ts` (draft parcial → validación por tipo)
- [x] 1.5 Test rojo `objective.test.ts`: publicar exige ≥1 KR y todos válidos;
      niveles y owner; sin setter de progreso
- [x] 1.6 Implementar `domain/objective.ts`
- [x] 1.7 Test rojo `objective-policy.test.ts`: Company solo Dirección;
      Area/Team Dirección o Líder; Person cualquier rol
- [x] 1.8 Implementar `domain/objective-policy.ts`

## 2. Dominio strategy-northstar (unit, puro)

- [x] 2.1 Test rojo `north-star.test.ts`: nombre no vacío + `Measurement` válido;
      rechaza measurement malformado
- [x] 2.2 Implementar `domain/north-star.ts`

## 3. Schema y migración (🔒 RLS)

- [x] 3.1 Modelos Prisma `NorthStar`, `Objective`, `KeyResult` + enums
      (`MeasurementType`, `TextState`, `ObjectiveLevel`, `ObjectiveStatus`);
      `north_star` con UNIQUE(organization_id); sin columna de progreso
- [x] 3.2 Migración con RLS (ENABLE + FORCE + política tenant FOR ALL) para las
      tres tablas en la misma migración

## 4. Aplicación okrs (integration, Postgres efímero)

- [x] 4.1 Tests rojos `create-objective` / `add-key-result` /
      `publish-objective`: crear draft con nivel y owner; policy por rol
      (Colaborador no crea Company); publicar sin KRs falla; publicar con KR
      numérico incompleto falla; publicar con KRs válidos pasa
- [x] 4.2 Implementar casos de uso + `infrastructure/objective-repo.ts` y
      `key-result-repo.ts` (vía `withTenant`)
- [x] 4.3 Tests rojos `update-key-result-value` / `list-objectives` /
      `get-objective`: actualizar valor recomputa progreso del KR y del
      Objective; check done → 100; text por estado; drafts solo owner/Dirección;
      aislamiento entre tenants
- [x] 4.4 Implementar `update-key-result-value`, `list-objectives`,
      `get-objective` (progreso derivado en lectura)

## 5. Aplicación strategy-northstar (integration)

- [x] 5.1 Tests rojos `define-north-star` / `get-north-star`: Dirección define;
      redefinir reemplaza (sigue habiendo una sola); Líder/Colaborador reciben
      forbidden; cualquier miembro lee; aislamiento entre tenants
- [x] 5.2 Implementar casos de uso + `infrastructure/north-star-repo.ts`

## 6. Interfaz cross-módulo

- [x] 6.1 Exportar `requireActor` y `canEditOrganization` en
      `identity-org/application/index.ts` y consumirlos desde los módulos nuevos
      (cada módulo define su propio error forbidden con código propio)

## 7. Verificación

- [x] 7.1 `npm run typecheck` + `npm run lint` + `npm run format:check` en verde
- [x] 7.2 `npm run test` en verde (unit + integration)
- [x] 7.3 `openspec validate --all --strict` en verde
- [x] 7.4 Review con `mg-pr-review` (obligatorio: áreas 🔒)
