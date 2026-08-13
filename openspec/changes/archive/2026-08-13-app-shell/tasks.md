# Tasks: app-shell

> **IMPLEMENTADO — change cerrado.** No se puede modificar. Solo lectura para documentación y referencia.

## 1. Estructura del shell

- [x] 1.1 **Test** e2e: `/members` (y rutas autenticadas) renderizan el shell
  con sidebar y topbar. (rojo)
- [x] 1.2 `src/app/(app)/layout.tsx` + componentes `Sidebar`/`Topbar` con
  tokens del design system. (verde)

## 2. Navegación y placeholders

- [x] 2.1 **Test** e2e: cada sección del sidebar lleva a su ruta; las
  capabilities sin UI muestran placeholder "En construcción". (rojo)
- [x] 2.2 Rutas placeholder para: Dashboard, Norte estratégico, OKRs,
  Equipos & Proyectos, Rituales, Feedback & Carrera, Clima & eNPS, Motor Lean,
  Skills & Staffing. (verde)

## 3. Navegación por rol 🔒

- [x] 3.1 **Test** unit: el filtro de secciones según rol (Dirección todas;
  Líder/Colaborador scoped) usando permisos de `identity-org`. (rojo)
- [x] 3.2 Filtro de secciones por rol aplicado en el shell. (verde)

## 4. Identidad en el shell

- [x] 4.1 Avatar + nombre + rol del usuario; en modo mock acceso a
  "Cambiar usuario (dev)". (test-alongside, UI)

## 5. Verificación

- [x] 5.1 `npm run typecheck` · `npm run lint` · `npm run format:check` ·
  `npm run test` · `npm run test:e2e:dev-auth` · `npm run build` ·
  `openspec validate --all --strict`.
