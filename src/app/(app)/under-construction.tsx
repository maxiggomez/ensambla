/**
 * Placeholder de capabilities sin UI (app-shell). Cada ruta del menú responde;
 * cuando la capability llegue, reemplaza su página.
 */
export function UnderConstruction({ label }: { label: string }) {
  return (
    <section className="max-w-2xl space-y-4">
      <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
        Sección del roadmap
      </p>
      <h1 className="text-3xl md:text-5xl">{label}</h1>
      <p role="status" className="text-base text-muted-foreground">
        En construcción. Esta sección llega en un próximo slice del producto.
      </p>
    </section>
  );
}
