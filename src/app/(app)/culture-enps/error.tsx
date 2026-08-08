"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CultureEnpsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>No pudimos cargar Clima &amp; eNPS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Reintentá en unos segundos. Tus respuestas no se modificaron.
          </p>
          <Button onClick={reset}>Reintentar</Button>
        </CardContent>
      </Card>
    </main>
  );
}
