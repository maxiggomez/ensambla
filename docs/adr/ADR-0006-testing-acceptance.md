# ADR-0006 · TDD, testing y criterios de aceptación

**Estado:** Aceptado · **Fecha:** 2026-07-12

## Contexto

Los agentes necesitan poder **autoverificarse**. Los Scenarios de OpenSpec
(GIVEN/WHEN/THEN) ya describen el comportamiento esperado: deben convertirse en
tests automáticos para cerrar el loop spec → código. Además queremos que el código
se escriba **guiado por los tests** (TDD), no con los tests como agregado posterior.

## Decisión

**TDD obligatorio para toda funcionalidad.** El flujo por defecto es
**red → green → refactor**: primero se escribe el test que falla derivado del
Scenario, luego el código mínimo para pasarlo, luego se refactoriza.

- **Test-first estricto** en la capa de **dominio/aplicación e invariantes**
  (value objects como `Measurement`, roll-up de OKRs, RLS/tenancy, anonimato eNPS).
  Acá el test se escribe **antes** de la implementación, sin excepción.
- **UI/e2e:** los tests son obligatorios pero pueden escribirse **junto** a la
  implementación (test-alongside), no test-first estricto.
- Cada **Scenario** de una spec mapea a al menos un test automático.
- **Herramientas:** Vitest (dominio + integración con DB de test), Playwright (e2e de
  flujos clave: crear objetivo, check-in, importación, onboarding).
- **En `tasks.md`:** la tarea de escribir el/los tests va **antes** que la de
  implementar; el agente sigue ese orden.
- **Definition of Done de un change:** todos sus Scenarios pasan como tests verdes,
  y los tests fueron escritos siguiendo el orden test-first donde aplica.
- Los tests de invariantes 🔒 (tenancy, anonimato eNPS, roll-up) son obligatorios y
  no se pueden saltear.

## Consecuencias

- (+) El agente valida su propio trabajo contra los criterios antes del review humano.
- (+) Los criterios de aceptación dejan de ser documentación muerta.
- (−) Hay que mantener los tests al día con cada delta de spec (parte del DoD).
