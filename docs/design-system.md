# Ensambla · Design System

Guía viva de UI. Fuente de verdad visual para los agentes. Identidad **Radar**
(2026-07): tinta verde-oscura sobre papel, acento lima, Inter con titulares
apretados. Los prototipos `norte-*.html` siguen valiendo como referencia de
**layout e interacción**, no de paleta. Stack: Tailwind v4 + shadcn/ui + Recharts.

> Terminología: la UI usa **Team** (no "squad").

---

## 1. Principios

- **Claridad ejecutiva:** densidad de información alta pero legible; el dato manda.
- **Color con significado:** el color comunica estado (ok / atención / riesgo), nunca
  decora. Siempre acompañado de ícono o texto (no depender solo del color).
- **Jerarquía por peso y tamaño**, no por saturación de color.
- **Consistencia sobre creatividad:** un componente, un patrón, en todos lados.

---

## 2. Tokens

### Color

Neutrales:

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#18231D` | texto principal (tinta verde-oscura) |
| `ink-2` | `#475249` | texto secundario / labels de campo |
| `muted` | `#647068` | texto terciario |
| `line` | `#DCE3DD` | bordes / divisores |
| `bg` | `#F7F9F6` | fondo de app (papel) |
| `card` | `#FFFFFF` | superficies |
| `deep` | `#18231D` | sidebar / superficies oscuras (misma tinta) |

Marca y acento (la marca es **lima**; los CTAs llevan texto tinta, no blanco):

| Token | Hex | Uso |
|---|---|---|
| `brand` | `#CAFF47` | primario (acciones); texto siempre `ink` |
| `brand-2` | `#A7E419` | hover / detalles (guión del eyebrow, ring de foco) |
| `brand-soft` | `#EDF6DD` | fondos suaves (badges, chips activos, step pills) |

Semánticos (cada uno con variante `-soft` para fondos):

| Token | Base | Soft | Significado |
|---|---|---|---|
| `success` / `ok` | `#10B981` | `#E6F7F0` | en ritmo / saludable |
| `warning` / `warn` | `#F59E0B` | `#FEF4E2` | atención / en riesgo leve |
| `danger` / `risk` | `#A43B32` | `#FFF0ED` | crítico / bloqueo |
| `info` | `#0EA5E9` | `#E5F5FD` | informativo / en proceso |

Escala de niveles (matriz de skills, heatmaps): `#EEF2EA` (0) → `#EDF6DD` (1) →
`#D9EFA0` (2) → `#A7E419` (3) → `#588016` (4).

Fondo de página: papel con brillo lima sutil —
`radial-gradient(circle at 90% 1%, rgb(202 255 71 / 25%), transparent 23rem)`
sobre `bg` (ya aplicado globalmente en `globals.css`; no repetir por página).

### Tipografía

- **Familia:** **Inter** (via `next/font`, variable `--font-inter`) con fallback
  al system stack. Ya cableada a `--font-sans` en el `@theme`.
- **Titulares:** peso 800 con letter-spacing negativo fuerte; el hero usa
  `clamp(42px, 6.5vw, 76px)`, tracking `-0.06em`, line-height `0.98`.
  `h1–h3` llevan `font-extrabold tracking-tight` por regla global.
- **Escala:**

| Rol | Tamaño | Peso |
|---|---|---|
| Hero / display | 42–76px (clamp) | 800 |
| Display / número KPI grande | 28–52px | 800 |
| Título de sección (h2) | 22–30px | 800 |
| Título de card (h3) | 14px | 700 |
| Cuerpo | 13–14px | 500 |
| Small / labels | 11.5–12px | 700 |

- Números y métricas siempre en peso 800 con `letter-spacing` negativo (`-0.04em`).
- **Eyebrow** (kicker sobre títulos): uppercase, 12px, peso 800,
  `letter-spacing .13em`, precedido por un guión de 28×3px en `brand-2`.

### Espaciado, radios y sombras

- **Spacing base:** múltiplos de 4. Gaps de grilla 14–18px; padding de card
  `clamp(22px, 4vw, 42px)` en paneles principales, 18px en cards internas.
- **Radios:** `sm` 10px (inputs, botones) · default 18px (cards/paneles) ·
  12px (cards internas) · pill 100px · círculo 50%.
- **Sombras:** `sm` = `0 18px 50px rgb(24 35 29 / 8%)` ·
  `lg` = `0 24px 70px rgb(24 35 29 / 12%)`. Difusas y suaves, nunca duras.

### Snippet — `globals.css` (variables shadcn; fuente de verdad real en el repo)

```css
:root {
  --background: #F7F9F6;  --foreground: #18231D;
  --card: #FFFFFF;        --card-foreground: #18231D;
  --primary: #CAFF47;     --primary-foreground: #18231D;
  --secondary: #EDF6DD;   --secondary-foreground: #18231D;
  --muted: #EEF2EA;       --muted-foreground: #647068;
  --accent: #A7E419;      --accent-foreground: #18231D;
  --destructive: #A43B32; --destructive-foreground: #FFFFFF;
  --border: #DCE3DD;      --input: #CCD5CE;
  --ring: #A7E419;        --radius: 18px;
}
```

Los tokens de marca/semánticos viven en el `@theme` del mismo archivo
(`--color-brand`, `--color-ok`, …). Tailwind v4: no hay `tailwind.config.ts`;
todo token nuevo se agrega ahí. Ningún componente hardcodea hex.

---

## 3. Componentes

### Mapeo a shadcn/ui (usar tal cual, tematizados con los tokens)

| Elemento del prototipo | Componente shadcn |
|---|---|
| Card / panel | `Card` |
| Botón (primary / ghost / outline) | `Button` (variants) |
| Tag / badge de estado | `Badge` (variants ok/warn/risk/info) |
| Chips seleccionables (onboarding) | `ToggleGroup` / `Toggle` |
| Selector de rol (Dirección/Líder/Colab) | `Tabs` o `ToggleGroup` |
| Dropdown de mapeo de columnas | `Select` |
| Barra de progreso | `Progress` (color por estado) |
| Tabla (matriz, previews) | `Table` |
| Avatar / iniciales | `Avatar` |
| Modal / confirmaciones | `Dialog` / `AlertDialog` |
| Toast | `Sonner` |
| Input / textarea | `Input` / `Textarea` |
| Tooltip | `Tooltip` |

### Patrones de identidad Radar (construir sobre tokens)

- **Eyebrow / kicker** — guión lima + texto uppercase sobre el título principal.
- **Step pill** — número de sección (`01`, `02`) en pastilla `brand-soft` con
  texto verde oscuro, junto al h2.
- **Check chips** — opciones seleccionables como pastillas redondeadas; activa =
  borde y fondo `brand-soft`.
- **Stats strip** — grilla de métricas separada por líneas de 1px (`line` como
  fondo, celdas `card`).
- **CTA primario** — lima con texto tinta, flecha `↗` a la derecha,
  `translateY(-1px)` en hover.

> ⚠️ El lima nunca funciona como color de **texto** sobre fondos claros
> (contraste ~1.2). Links y variantes `link`/ghost de Button van en
> `text-foreground` o verde oscuro (`#588016`), no `text-primary`.

### Componentes custom (no existen en shadcn — construir sobre tokens)

- **KPI Stat Card** — label + número grande (800) + delta con color/flecha + sparkline.
- **Skill Matrix** — heatmap persona × skill con la escala de niveles 0–4.
- **Kanban de experimentos** — columnas por etapa con tarjetas arrastrables.
- **Alignment Ladder** — escalera KR → Objetivo → North Star con conectores.
- **BML Cycle** — diagrama circular Construir/Medir/Aprender.
- **Live Preview Panel** — panel oscuro que se puebla en vivo (onboarding).
- **Wizard Progress Spine** — barra de pasos con estados done/active/pending.
- **Risk/Alert Item** — ícono + título + detalle, tonal por severidad.

---

## 4. Patrones de layout

- **App shell:** sidebar `deep` de 248px (nav + identidad) + topbar de 64px (título,
  contexto de período, acciones) + contenido centrado máx. ~1180px.
- **Vistas por rol:** un selector segmentado cambia contexto (Dirección / Líder /
  Colaborador); la data se acota al alcance del rol, mismo sistema visual.
- **Wizard (onboarding):** progress spine arriba + dos columnas (conversación / preview
  en vivo); pasos con avance no forzado y salteable.
- **Grillas:** 2, 3 o 4 columnas (`g2/g3/g4`) y layout 1.6fr:1fr para "detalle + panel".

---

## 5. Estados y uso del color

- **Estados obligatorios por vista:** vacío (con CTA guía), carga (skeletons), error.
- **Regla de color semántico:** todo estado por color va **con ícono o texto**
  (ej.: riesgo = rojo + ícono de alerta). Nunca solo color.
- **Vacío con intención:** los estados vacíos guían la primera acción (ej. "Cargá tu
  primer objetivo"), coherente con el onboarding.

---

## 6. Accesibilidad e i18n

- Contraste AA en texto; foco visible en todo elemento interactivo; navegación por teclado.
- No depender solo del color (ya cubierto por la regla semántica).
- **Idioma base español (LATAM)**; textos externalizados desde el día uno para futura i18n.
- Componentes shadcn (Radix) ya traen roles ARIA y manejo de foco — no reinventar.

---

## 7. Gráficos

- **Recharts** para dashboards y sparklines, tematizado con los tokens (mismos colores
  semánticos). Mantener los gráficos simples y legibles (líneas, barras, mini-áreas),
  sin librerías pesadas adicionales.

---

## 8. Referencia

Prototipo navegable como referencia visual y de interacción: `norte-prototipo.html`
(app, S0–S7, 3 roles) y `norte-onboarding.html` (first-run). Al construir, alinear
"squad" → **Team** en la UI.
