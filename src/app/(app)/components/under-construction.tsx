import { Construction } from "lucide-react";

/**
 * Placeholder compartido de las capabilities sin UI todavía. Cada ruta del
 * menú responde con esta página; cuando la capability llegue, solo se
 * reemplaza su page.tsx.
 */
export function UnderConstruction({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-6 py-10 md:px-10">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
          En construcción
        </p>
        <h1 className="text-3xl md:text-5xl">{title}</h1>
        <p className="text-base text-muted-foreground">{description}</p>
      </header>

      <section
        data-testid="under-construction"
        className="flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-line bg-card p-10 text-center"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft">
          <Construction className="size-7 text-ink" aria-hidden />
        </span>
        <p className="max-w-md text-sm text-muted-foreground">
          Esta sección se habilita cuando la capability llegue a la app. Mientras tanto, el
          resto de la navegación sigue disponible.
        </p>
      </section>
    </main>
  );
}
