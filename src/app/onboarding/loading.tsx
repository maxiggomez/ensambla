import { Card, CardContent } from "@/components/ui/card";

export default function LoadingOnboarding() {
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-3xl items-center p-6"
      aria-busy="true"
      aria-label="Cargando configuración"
    >
      <Card className="w-full">
        <CardContent className="space-y-5">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    </main>
  );
}
