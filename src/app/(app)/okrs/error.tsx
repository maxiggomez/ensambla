"use client";

import { Button } from "@/components/ui/button";

export default function OkrsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="space-y-3 rounded-xl bg-risk-soft p-6">
      <h2 className="text-xl">No pudimos cargar los OKRs</h2>
      <p className="text-sm text-muted-foreground">
        Reintentá. Si el problema continúa, revisá la conexión con la organización.
      </p>
      <Button type="button" variant="outline" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
