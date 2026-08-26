# Notas de trazabilidad — Change entity-create-drawer

Interpretaciones registradas a lo largo del trabajo en este change (el usuario
no decide código; estas son notas técnicas de cobertura).

## Decisiones resumidas (ver `design.md` para el detalle)

- Drawer anclado a la derecha (`side="left"` descartado en DISCOVER, gabinete
  visual contemplado solo como refactor posterior, dejar para cuando sea pedido);
  footer en `skipNavigation` para no acuñar un `Banner` que hoy nadie usa.
- Forms que SOLO intersecan con navegación (ciclos, objetivos OKR) quedan como
  cards al pie del listado: cerrar su drawer pondría al usuario en un estado
  donde la form dejó de ser accionable (ver "Resolved Decisions" en `design.md`).
- El drawer cierra únicamente por el efecto gateado en `state.success` de los
  forms; JAMÁS por `state.error`. Garantía estructural documentada en esta nota.
- La redirección nativa de `createObjectiveAction` / `createCycleAction` cierra
  el drawer en los pasos de "éxito" que ya existían en el flujo de la card.

## Mapeo Scenario → Test

Escenarios de `spec.md` y su cobertura:

1. **Entity creation retires the panel, reuses shared primitives** — contract
   en `src/components/entity-create-drawer.test.tsx` (fuente: `Sheet`, panel
   derecho, body scrollable entre header/footer) + e2e en
   `e2e/skills-matrix.spec.ts` ("Dirección define skills…"), `e2e/okrs.spec.ts`
   y `e2e/strategy-northstar.spec.ts` (triggers `+ Nuevo/a X`,
   `getByRole("dialog")`).
2. **FORCE_scales_4plus_fields** — estructura de body `overflow-y-auto` (contract
   fuente) + OKR direction de 6 campos en e2e.
3. **FORCE_body_axis_scrolls_independent** — contract fuente (header/footer
   fijos, body scrollable).
4. **Escape, scrim & focus** — e2e `e2e/skills-matrix.spec.ts` ("se puede cerrar
   con") verificando blur fuera del panel, `Escape`, click en scrim, foco
   devuelto al trigger, foco dentro del panel al abrir. El unit source-contract
   complementa midiendo el layout, no el comportamiento (delegado a Radix).
5. **Validation errors keep the drawer open** — `e2e/skills-matrix.spec.ts`:
   test "un error de servidor mantiene el drawer abierto con el error junto al
   campo" (submit programático con `required` removido → status inline no vacío
   y drawer visible) + ajuste documentado en `design.md` (cierre SOLO en
   `state.success`; `defineSkill` sin validación de duplicados y `required`
   blockea client-side; errors alcanzables de norte-estratégico redirigen en
   ciclos/objetivos OKR por comportamiento previo).
6. **Visual hierarchy, empty-state inherits, list** — e2e existentes de listado
   (skills, OKRs, north-star) cubren heading + cards; empty-state hereda de la
   página y no cambió.
7. **Fillable-skills empty-state satisfaction** — e2e pre-existente
   `e2e/skills-matrix.spec.ts` ("vacío inherit", "mostrar show optimal"):
   agregar una skill con el drawer cumple el empty-state de Fillable Skills.

## Mapeo Scenario → Test (slice 2: Equipos & Proyectos + Rituales)

1. **Team, project and ceremony creation pages adopt the drawer** — e2e
   `e2e/teams-staffing.spec.ts` (triggers `+ Nuevo equipo` / `+ Nuevo proyecto`,
   drawer se cierra en éxito, `team-card-<name>` / `project-card-<name>`
   visibles en el listado) y `e2e/rituals.spec.ts` (`+ Nueva ceremonia`, card de
   la ceremonia visible). Contracts fuente: `page-ui.test.ts` (Equipos &
   Proyectos) y `rituals-ui.test.ts` (Rituales) — trigger presente, `EntityCreateDrawer`
   presente, `CardTitle>Crear …` ausente.
2. **Inline editing keeps the inline form** — e2e `teams-staffing.spec.ts`
   ("Dirección administra…"): `team-card` muestra heading "Editar equipo" +
   botón "Guardar cambios" dentro de la card (no drawer) + contract `page-ui.test.ts`.

## Decisiones slice 2 (ver `design.md`)

- **`CreateTeamForm`**: el alta de equipo no reusa `TeamForm` porque
  `useEntityCreateDrawerClose()` lanza fuera del drawer (contrato del shared) y
  `TeamForm` también vive inline para editar. Se extrajo `TeamFormFields`
  (shared) y `CreateTeamForm` es el wrapper drawer-aware. `TeamForm` quedó de
  edición (team requerido).
- **Ids únicos para el drawer de equipo**: `idBase="create-team"` evita los ids
  `team-name`/`team-description` duplicados entre el drawer y cada form de
  edición inline (el `htmlFor` asociaba al primer elemento → e2e colgaba
  esperando el label dentro del dialog).
- **Post-submit**: con el cierre del drawer, el e2e dejó de afirmar el mensaje
  inline ("Equipo creado.") y pasa a afirmar la entidad en el listado
  (`team-card-…`/`project-card-…`/card de ceremonia).

## Evidencia de verificación

- `npm run typecheck` ✓ · `npm run lint` ✓ · `npm run format:check` ✓
- `npm run test` → 127 archivos / 533 tests ✓ (más contract nuevos de Equipos &
  Proyectos y Rituales)
- `npx next build` ✓
- E2E dev-auth (suite completa, `playwright.dev-auth.config.ts`): 39/39 ✓
  (incluye las 8 specs transversales + los tests de listado de las 3 páginas;
  triggers por `getByRole("button")`, dialogs por `getByRole("dialog")`)
- `openspec validate entity-create-drawer --strict` ✓