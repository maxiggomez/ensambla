"use client";

import { Button } from "@/components/ui/button";

export default function FeedbackYCarreraError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[1180px] space-y-4 px-6 py-10 md:px-10">
      <h1>{"No pudimos cargar Feedback & Carrera"}</h1>
      <p className="text-muted-foreground">Intentá nuevamente en unos segundos.</p>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
