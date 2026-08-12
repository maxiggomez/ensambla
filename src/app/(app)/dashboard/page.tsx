import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import {
  listAtRiskKeyResults,
  listDueCheckInReminders,
  listObjectives,
} from "@/modules/okrs/application";
import { redirect } from "next/navigation";

import { resolveShellSession } from "../session";

export default async function DashboardPage() {
  const [user, session] = await Promise.all([getCurrentUser(), resolveShellSession()]);
  if (!user || !session) redirect("/sign-in");

  const [objectives, reminders] = await Promise.all([
    listObjectives({ actorClerkUserId: user.id }),
    listDueCheckInReminders({ actorClerkUserId: user.id }),
  ]);
  const risks =
    session.user.role === "Direccion"
      ? await listAtRiskKeyResults({ actorClerkUserId: user.id })
      : [];
  const published = objectives.filter((objective) => objective.status === "Published");
  const averageProgress =
    published.length === 0
      ? 0
      : published.reduce((total, objective) => total + objective.progress, 0) /
        published.length;

  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
          Dashboard
        </p>
        <h1 className="text-3xl md:text-5xl">El panorama de la organización</h1>
        <p className="text-base text-muted-foreground">
          Avance derivado, check-ins pendientes y señales de confianza que requieren atención.
        </p>
      </header>

      <section aria-label="Resumen de OKRs" className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Objetivos publicados" value={published.length.toString()} />
        <MetricCard label="Avance promedio" value={`${Math.round(averageProgress)}%`} />
        <MetricCard label="Check-ins desactualizados" value={reminders.length.toString()} />
      </section>

      {session.user.role === "Direccion" ? (
        <section aria-labelledby="risk-title" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="risk-title" className="text-2xl">
              Key Results en riesgo
            </h2>
            <Badge variant={risks.length > 0 ? "risk" : "ok"}>
              {risks.length > 0 ? `${risks.length} requieren atención` : "Sin riesgos críticos"}
            </Badge>
          </div>
          {risks.length === 0 ? (
            <Card>
              <CardContent className="py-7 text-center text-muted-foreground">
                La última confianza de todos los Key Results está en 5 o más.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {risks.map((risk) => (
                <Card key={risk.keyResultId}>
                  <CardHeader>
                    <CardTitle>{risk.keyResultTitle}</CardTitle>
                    <p className="text-sm text-muted-foreground">{risk.objectiveTitle}</p>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <span className="text-sm">Confianza reportada</span>
                    <Badge variant="risk">{risk.confidence}/10</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <p className="text-xs font-bold text-muted-foreground">{label}</p>
        <p className="text-4xl font-extrabold tracking-[-0.04em]">{value}</p>
      </CardContent>
    </Card>
  );
}
