# Tasks: design-system-radar

> Orden test-first (ADR-0006). El estilo es UI: test-alongside permitido, pero
> los Scenarios del delta van con e2e que arrancan en rojo.

## 1. Tests (rojo)

- [x] 1.1 **Test** e2e `design-tokens.spec.ts`: fondo papel, botón primario lima,
  texto ink y font-family Inter en la página renderizada. (rojo: hoy índigo + serif)

## 2. Tokens y tipografía (verde)

- [x] 2.1 Reescribir tokens en `globals.css` (shadcn vars + `@theme`): paleta
  Radar, radios/sombras, gradiente lima de fondo; fix del `--font-sans` circular.
- [x] 2.2 Cargar Inter con `next/font` en `layout.tsx` y aplicarla.

## 3. Páginas

- [x] 3.1 Home `/`: hero Radar (eyebrow, titular apretado, CTA lima) con links a
  sign-in/onboarding.
- [x] 3.2 `/onboarding` y `/members`: aplicar identidad (cards, botón lima, badge
  de rol verde suave) sin tocar labels ni flujos (e2e existentes intactos).

## 4. Docs

- [x] 4.1 `docs/design-system.md`: tokens y patrones actualizados (fuente de
  verdad para próximas capabilities).
- [x] 4.2 ADR-0007: nota de actualización de la identidad visual.

## 5. Verificación

- [x] 5.1 typecheck + lint + format + Vitest (46) en verde.
- [x] 5.2 e2e completo en verde: smoke + identity-org (sin ediciones) + design-tokens.
