export default function OkrsLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando OKRs">
      <p className="text-sm font-bold text-muted-foreground">Cargando OKRs…</p>
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-32 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
