import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-5">
      <header className="flex min-h-[76px] items-center justify-between border-b border-foreground/10">
        <Link href="/" className="inline-flex items-center gap-3 font-bold">
          <span className="grid size-9 place-items-center rounded-full bg-foreground text-xs tracking-tight text-primary">
            En
          </span>
          Ensambla
        </Link>
        <Button asChild variant="outline" className="border-foreground">
          <Link href="/sign-in">Ingresar</Link>
        </Button>
      </header>

      <main className="flex-1">
        <section className="max-w-[840px] pt-20 pb-14">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.13em] uppercase before:h-[3px] before:w-7 before:bg-accent before:content-['']">
            Alineación y personas, en un solo lugar
          </div>
          <h1 className="mt-4 mb-6 max-w-[790px] text-[clamp(42px,6.5vw,76px)] leading-[0.98] tracking-[-0.06em]">
            El sistema operativo de tu empresa, sin planillas sueltas.
          </h1>
          <p className="max-w-[680px] text-lg text-muted-foreground">
            Objetivos, equipos, clima y experimentos conectados a una misma estrategia. Creá tu
            organización e invitá a tu equipo en minutos.
          </p>
          <div className="mt-9">
            <Button
              asChild
              size="lg"
              data-testid="cta-primary"
              className="min-w-[225px] justify-between font-bold"
            >
              <Link href="/onboarding">
                Crear mi organización <span aria-hidden>↗</span>
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="flex min-h-16 items-center justify-between border-t border-foreground/10 text-sm text-muted-foreground">
        <span className="font-bold text-foreground">Ensambla</span>
        <p>Business Alignment &amp; Agile People OS para pymes.</p>
      </footer>
    </div>
  );
}
