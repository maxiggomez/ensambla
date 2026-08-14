import { Card, CardContent } from "@/components/ui/card";

export default function LoadingDashboard() {
  return (
    <main className="space-y-6" aria-busy="true" aria-label="Cargando dashboard">
      <p className="sr-only">Cargando dashboard</p>
      <div className="h-12 w-2/3 animate-pulse rounded-sm bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item}>
            <CardContent>
              <div className="h-24 animate-pulse rounded-sm bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
