"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[1180px] space-y-4 px-6 py-10 md:px-10">
      <h1 className="text-2xl">{"Algo salió mal"}</h1>
      <p className="text-muted-foreground">{"No pudimos cargar los rituales."}</p>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
