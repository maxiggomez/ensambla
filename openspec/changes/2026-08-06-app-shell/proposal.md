# Proposal: app-shell

> **ESTADO: PENDIENTE — propuesta registrada, no implementada.** Empezar solo
> vía el loop mg-eng-loop (plan de tests con aprobación previa).

## Why

La app autenticada no tiene shell: solo existen `/`, `/sign-in`, `/onboarding` y
`/members`. Tras el login, el usuario aterriza en `/members` sin navegación ni
menú de acciones. Sin un layout de app, cada capability futura queda como isla
sin entrada. El prototipo `norte-prototipo.html` define el target: sidebar con
las secciones del producto, topbar y avatar con rol.

## What Changes

- **Layout de app autenticado** (`src/app/(app)/`): sidebar + topbar aplicados a
  todas las rutas dentro de la app, con el gateway de auth ya existente
  (`src/lib/auth`, soporta mock y Clerk).
- **Sidebar con las secciones del producto**: Dashboard, Norte estratégico,
  OKRs, Equipos & Proyectos, Rituales, Feedback & Carrera, Clima & eNPS,
  Motor Lean, Skills & Staffing + Miembros. Íconos lucide-react, tokens del
  design system, español LATAM.
- **Placeholders "En construcción"** para las capabilities que aún no tienen UI:
  cada ruta del menú responde, y cuando una capability llegue solo reemplaza su
  página.
- **Navegación por rol (🔒)**: Dirección ve todas las secciones; Líder ve las
  suyas scoped a su Team; Colaborador solo lo que su rol permite. Reutiliza
  `canEditOrganization`/permisos de `identity-org`.
- **Identidad en el shell**: avatar + nombre + rol del usuario, y en modo mock
  el acceso a "Cambiar usuario (dev)".

## Capabilities

### ADDED: `app-shell`

Nueva capability de infraestructura de UI: el layout de navegación de la app
autenticada y el enrutamiento por rol.

## Non-goals

- No implementar el contenido de ninguna capability (OKRs, Equipos, etc.) — solo
  el shell y sus placeholders.
- No tocar el dominio ni invariantes de tenancy (el routing por rol usa los
  permisos existentes, no políticas nuevas).

## Impact

- `src/app/(app)/layout.tsx` y rutas placeholder, componentes `Sidebar`/`Topbar`,
  uso de permisos de `identity-org`, `src/components/` (design system).
- Tests e2e (navegación + placeholders) y unit (filtro de secciones por rol).
