export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1180px] space-y-8 px-6 py-10 md:px-10">
      <p className="text-sm text-muted-foreground">{"Cargando skills y staffing…"}</p>
      <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </main>
  );
}
