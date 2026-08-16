export default function LoadingEquiposYProyectos() {
  return (
    <main className="mx-auto w-full max-w-[1180px] space-y-6 px-6 py-10 md:px-10">
      <p className="text-sm text-muted-foreground">{"Cargando equipos y proyectos…"}</p>
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    </main>
  );
}
