"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No pudimos cargar la configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Tus datos guardados siguen intactos. Podés volver a intentar.
          </p>
          <Button onClick={reset}>Intentar de nuevo</Button>
        </CardContent>
      </Card>
    </main>
  );
}
