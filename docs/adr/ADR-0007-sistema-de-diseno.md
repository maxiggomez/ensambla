# ADR-0007 · Sistema de diseño

**Estado:** Aceptado · **Fecha:** 2026-07-12

## Contexto

La UI la construyen varios agentes. Sin un sistema visual compartido, cada uno
inventa colores, espaciados y componentes → UI inconsistente. Ya existe una
dirección visual validada en el prototipo (`norte-prototipo.html`,
`norte-onboarding.html`); no hay que rediseñar, hay que extraer y formalizar.

## Decisión

- **Base:** Tailwind CSS + **shadcn/ui** (coherente con el stack de ADR-0001).
- **Tokens:** los del prototipo se exponen como **variables CSS** (tema shadcn en
  `globals.css`) y como extensión del **theme de Tailwind**. Fuente única de verdad;
  ningún componente hardcodea hex.
- **Gráficos:** Recharts (dashboards, sparklines) sobre los mismos tokens.
- **Guía viva:** `docs/design-system.md` define tokens, inventario de componentes
  (mapeo a shadcn + componentes custom) y patrones de layout/estados.
- **Iteración:** se congela este sistema como base y se pule *contra* él durante el
  build; no se re-itera de cero antes de construir.
- **Terminología:** la UI usa **Team** (no "squad"), alineado al lenguaje ubicuo.

## Consecuencias

- (+) UI consistente entre agentes; un solo lugar para cambiar un token.
- (+) shadcn da componentes accesibles listos; menos código que un agente puede romper.
- (−) El prototipo (CSS a mano) hay que traducirlo a Tailwind/shadcn una vez (tarea acotada).

## Alternativas consideradas

- **MUI / Chakra:** más pesados y menos Tailwind-native; rechazados.
- **CSS a mano (como el prototipo):** no reutilizable ni consistente entre agentes.
