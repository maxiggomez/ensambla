## Why

Tres páginas (`norte-estrategico`, `okrs` y `dashboard`) renderizan su contenido en
un `<div className="flex flex-col gap-6">` (o `gap-7`) sin el contenedor estándar de
página, por lo que el contenido queda pegado a la sidebar y a la topbar del shell.
El resto de las páginas de la app (`rituales`, `feedback-y-carrera`, `equipos-y-proyectos`,
`motor-lean`, `skills-y-staffing`) usan `<main className="mx-auto flex w-full
max-w-[1180px] flex-col gap-10 px-6 py-10 md:px-10">`, que es el patrón que ya
documenta `docs/design-system.md` §4 ("contenido centrado máx. ~1180px").

## What Changes

- `src/app/(app)/norte-estrategico/page.tsx`: el wrapper `<div className="flex flex-col gap-6">`
  pasa a ser `<main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-6 py-10 md:px-10">`.
- `src/app/(app)/okrs/page.tsx`: el wrapper `<div className="flex flex-col gap-6">`
  pasa a ser el mismo `<main>` estándar.
- `src/app/(app)/dashboard/page.tsx`: el wrapper `<div className="flex flex-col gap-7">`
  pasa a ser el mismo `<main>` estándar.

Copy exacta del container de referencia. Sin cambios de lógica, data ni a11y.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `design-system`: nueva requirement SHALL que fija el contenedor de página
  estándar (máx. ~1180px, padding horizontal `px-6 md:px-10` y vertical `py-10`)
  para toda página del shell. Escenario que lo verifica en las páginas
  actualizadas.

## Impact

- Tres archivos UI + un delta de spec (`design-system`). Sin dominio,
  aplicación, infraestructura ni esquema. Sin áreas 🔒. No agrega quita
  requisitos de capability.