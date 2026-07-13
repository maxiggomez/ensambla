# Ensambla · Design System

Guía viva de UI. Fuente de verdad visual para los agentes. Referencia visual:
`norte-prototipo.html` y `norte-onboarding.html`. Stack: Tailwind + shadcn/ui + Recharts.

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
| `ink` | `#0F1222` | texto principal |
| `ink-2` | `#3A3F52` | texto secundario |
| `muted` | `#6B7186` | texto terciario / labels |
| `line` | `#E7E9F0` | bordes / divisores |
| `bg` | `#F6F7FB` | fondo de app |
| `card` | `#FFFFFF` | superficies |
| `deep` | `#171532` | sidebar / superficies oscuras |

Marca y acento:

| Token | Hex | Uso |
|---|---|---|
| `brand` | `#4F46E5` | primario (acciones, activos) |
| `brand-2` | `#6366F1` | gradientes / hover |
| `brand-soft` | `#EEF0FE` | fondos suaves de marca |
| `accent` | `#8B5CF6` | acento (clima/eNPS, Lean) |

Semánticos (cada uno con variante `-soft` para fondos):

| Token | Base | Soft | Significado |
|---|---|---|---|
| `success` / `ok` | `#10B981` | `#E6F7F0` | en ritmo / saludable |
| `warning` / `warn` | `#F59E0B` | `#FEF4E2` | atención / en riesgo leve |
| `danger` / `risk` | `#EF4444` | `#FDECEC` | crítico / bloqueo |
| `info` | `#0EA5E9` | `#E5F5FD` | informativo / en proceso |

Escala de niveles (matriz de skills, heatmaps): `#EEF0F5` (0) → `#DEE0FB` (1) →
`#B3B8F0` (2) → `#7C82E6` (3) → `#4F46E5` (4).

### Tipografía

- **Familia:** system stack (`-apple-system, "Segoe UI", Inter, Roboto, …`). Alternativa: Inter.
- **Escala:**

| Rol | Tamaño | Peso |
|---|---|---|
| Display / número KPI grande | 30–52px | 800 |
| Título de página (h2) | 23px | 800 |
| Título de card (h3) | 14px | 700 |
| Cuerpo | 13–14px | 500 |
| Small / labels | 11.5–12px | 600 |

- Números y métricas siempre en peso 800 con `letter-spacing` negativo leve (`-0.3px`).

### Espaciado, radios y sombras

- **Spacing base:** múltiplos de 4. Gaps de grilla 16px; padding de card 18px (compacto)
  a 26px (destacado).
- **Radios:** `sm` 10px · `md` (default) 14px · pill 20px · círculo 50%.
- **Sombras:** `sm` = `0 1px 2px rgba(16,18,34,.04), 0 8px 24px rgba(16,18,34,.05)` ·
  `lg` = `0 12px 40px rgba(16,18,34,.10)`.

### Snippet — `globals.css` (variables shadcn + extra semánticos)

```css
:root {
  --background: #F6F7FB;  --foreground: #0F1222;
  --card: #FFFFFF;        --card-foreground: #0F1222;
  --primary: #4F46E5;     --primary-foreground: #FFFFFF;
  --muted: #EEF0F5;       --muted-foreground: #6B7186;
  --accent: #8B5CF6;      --border: #E7E9F0;
  --destructive: #EF4444; --destructive-foreground: #FFFFFF;
  /* semánticos extra (no vienen en shadcn) */
  --success: #10B981; --success-soft: #E6F7F0;
  --warning: #F59E0B; --warning-soft: #FEF4E2;
  --danger:  #EF4444; --danger-soft:  #FDECEC;
  --info:    #0EA5E9; --info-soft:    #E5F5FD;
  --radius: 14px;
}
```

### Snippet — `tailwind.config.ts` (extend)

```ts
theme: { extend: {
  colors: {
    brand:   { DEFAULT: "#4F46E5", soft: "#EEF0FE", 2: "#6366F1" },
    accent:  "#8B5CF6",
    ok:      { DEFAULT: "#10B981", soft: "#E6F7F0" },
    warn:    { DEFAULT: "#F59E0B", soft: "#FEF4E2" },
    risk:    { DEFAULT: "#EF4444", soft: "#FDECEC" },
    info:    { DEFAULT: "#0EA5E9", soft: "#E5F5FD" },
    ink:     { DEFAULT: "#0F1222", 2: "#3A3F52" },
    line:    "#E7E9F0", deep: "#171532",
  },
  borderRadius: { md: "14px", sm: "10px" },
}}
```

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
