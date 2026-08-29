# Pillar alta por drawer — Design

## Context

En `norte-estrategico`, la creación del pilar estratégico y la asignación de un objetivo
a un pilar se renderizaban como formularios inline en el encabezado del **Mapa
estratégico**. El design-system (sección 3) y la spec `entity-create-drawer` definen el
alta de entidades como un panel lateral disparado por un botón "+ Nuevo/a `<entidad>`"
junto al título, tal como ya lo hacían "+ Nueva North Star" y "+ Nuevo lever" en la misma
página. Este change alinea el pilar y la asignación con ese patrón.

## Decisión

No introduce arquitectura nueva ni toca reglas de negocio. Reutiliza el componente
compartido `EntityCreateDrawer` (Panel lateral sobre `Sheet`, `src/components/entity-create-drawer.tsx`)
y el patrón drawer-aware de `NorthStarForm`/`LeverForm`:

- `PillarForm` y `AssignForm` pasan a usar `useEntityCreateDrawerClose()` y cierran el
  drawer cuando `state.success` (mismo patrón que `NorthStarForm`).
- En `page.tsx`, el bloque inline del encabezado del Mapa estratégico se reemplaza por
  dos `EntityCreateDrawer` con triggers "+ Nuevo pilar" y "+ Asignar objetivo", visibles
  solo para el rol Dirección (igual que el resto de las altas de la cima de la cascada).

## Alcance / no-alcance

- **In**: solo capa de presentación (`page.tsx`, `pillar-form.tsx`) + tests.
- **Fuera de alcance**: `domain/`, `application/`, `infrastructure/` y los server actions
  de `actions.ts` no cambian. No toca invariantes 🔒 (multi-tenancy/RLS, eNPS, roll-up OKRs).

## Alternativas descartadas

- Mantener inline (status quo): contradice el design-system y la spec `entity-create-drawer`.
- Drawer único que combine creación y asignación: acopla dos flujos distintos; se prefiere
  un trigger por acción, consistente con la convención general de la app.
