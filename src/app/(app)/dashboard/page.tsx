import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import {
  getDashboard,
  type DashboardObjectiveView,
  type DashboardMetrics,
  type DashboardRisk,
  type DashboardTeamView,
  type DashboardView,
} from "@/modules/executive-dashboard/application";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const dashboard = await getDashboard({ actorClerkUserId: user.id });

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-6 py-10 md:px-10">
      {dashboard.role === "Colaborador" ? (
        <CollaboratorDashboard dashboard={dashboard} />
      ) : (
        <OrganizationDashboard dashboard={dashboard} />
      )}
    </main>
  );
}

function OrganizationDashboard({
  dashboard,
}: {
  dashboard: Extract<DashboardView, { role: "Direccion" | "Lider" }>;
}) {
  const direction = dashboard.role === "Direccion";
  return (
    <>
      <DashboardHeader
        eyebrow={direction ? "Dashboard · Dirección" : "Dashboard · Líder"}
        title={direction ? "Panorama de la organización" : "Tu Team en foco"}
        description={
          direction
            ? "Señales vivas de ejecución, capacidad, cultura y aprendizaje."
            : "Datos de los Teams que liderás, convertidos en próximas acciones."
        }
      />

      <section aria-labelledby="metrics-title" className="space-y-3">
        <h2 id="metrics-title" className="text-2xl">
          Señales consolidadas
        </h2>
        <MetricGrid metrics={dashboard.metrics} />
      </section>

      <TeamSection teams={dashboard.teams} />
      <ObjectiveSection objectives={dashboard.objectives} title="Objetivos en alcance" />
      <RiskSection risks={dashboard.risks} />
    </>
  );
}

function CollaboratorDashboard({
  dashboard,
}: {
  dashboard: Extract<DashboardView, { role: "Colaborador" }>;
}) {
  return (
    <>
      <DashboardHeader
        eyebrow="Dashboard · Colaborador"
        title="Tu panorama personal"
        description="Tus objetivos, carga, conversaciones de crecimiento y pulsos pendientes."
      />
      <ObjectiveSection objectives={dashboard.objectives} title="Mis objetivos" />

      <section aria-label="Resumen personal" className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Mi carga"
          value={dashboard.load ? `${dashboard.load.load}%` : "Sin asignaciones"}
          detail={dashboard.load?.overloaded ? "Requiere reequilibrio" : "Dentro de capacidad"}
          tone={dashboard.load?.overloaded ? "risk" : "ok"}
        />
        <MetricCard
          label="Mi Feedback"
          value={`${dashboard.feedback.received} recibido`}
          detail={`${dashboard.feedback.given} dado · ${dashboard.feedback.pendingRequests} pendiente(s)`}
        />
        <MetricCard
          label="Pulsos pendientes"
          value={dashboard.pendingPulses.length.toString()}
          detail={
            dashboard.pendingPulses.length === 0 ? "Todo al día" : "Tu respuesta es anónima"
          }
          tone={dashboard.pendingPulses.length === 0 ? "ok" : "info"}
        />
      </section>

      <section aria-labelledby="growth-title" className="space-y-3">
        <h2 id="growth-title" className="text-2xl">
          Mi plan de crecimiento
        </h2>
        {dashboard.growthPlan ? (
          <Card>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground">Próximo hito</p>
                  <p className="font-bold">{dashboard.growthPlan.nextMilestone}</p>
                </div>
                <Badge variant="info">{dashboard.growthPlan.progress}% de progreso</Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-info"
                  style={{ width: `${dashboard.growthPlan.progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyCard>
            Sin datos todavía. Definí tu próximo hito en Feedback &amp; Carrera.
          </EmptyCard>
        )}
      </section>
    </>
  );
}

function DashboardHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="max-w-3xl space-y-3">
      <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
        {eyebrow}
      </p>
      <h1 className="text-3xl md:text-5xl">{title}</h1>
      <p className="text-base text-muted-foreground">{description}</p>
    </header>
  );
}

function MetricGrid({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Avance global de OKRs"
        value={metrics.okrs.status === "ready" ? `${Math.round(metrics.okrs.progress)}%` : "—"}
        detail={
          metrics.okrs.status === "ready"
            ? `${metrics.okrs.publishedObjectives} objetivo(s) publicado(s)`
            : "Sin datos todavía"
        }
      />
      <MetricCard
        label="Salud de Teams"
        value={
          metrics.teams.status === "ready"
            ? `${metrics.teams.healthy}/${metrics.teams.total}`
            : "—"
        }
        detail={metrics.teams.status === "ready" ? "Teams saludables" : "Sin datos todavía"}
        tone={
          metrics.teams.status === "ready" && metrics.teams.healthy < metrics.teams.total
            ? "warn"
            : "ok"
        }
      />
      <MetricCard
        label="Clima / eNPS"
        value={metrics.culture.status === "visible" ? `${metrics.culture.score}` : "—"}
        detail={cultureDetail(metrics.culture)}
        tone={metrics.culture.status === "visible" ? "info" : "secondary"}
      />
      <MetricCard
        label="Velocidad de aprendizaje"
        value={metrics.learning.status === "ready" ? metrics.learning.current.toString() : "—"}
        detail={
          metrics.learning.status === "ready"
            ? `${signed(metrics.learning.change)} vs. 30 días previos`
            : "Sin datos todavía"
        }
      />
    </div>
  );
}

function cultureDetail(culture: DashboardMetrics["culture"]): string {
  if (culture.status === "visible") return `${culture.participation}% de participación`;
  if (culture.status === "protected") {
    return `Resultado protegido · mínimo ${culture.minimumResponses} respuestas`;
  }
  return "Sin datos todavía";
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : value.toString();
}

function TeamSection({ teams }: { teams: DashboardTeamView[] }) {
  return (
    <section aria-labelledby="teams-title" className="space-y-3">
      <h2 id="teams-title" className="text-2xl">
        Salud de Teams
      </h2>
      {teams.length === 0 ? (
        <EmptyCard>Sin datos todavía. Creá un Team y asigná su capacidad.</EmptyCard>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.teamId}>
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{team.memberCount} integrante(s)</span>
                <Badge variant={team.overloaded ? "risk" : "ok"}>
                  {team.capacity}% de capacidad
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function ObjectiveSection({
  objectives,
  title,
}: {
  objectives: DashboardObjectiveView[];
  title: string;
}) {
  return (
    <section aria-labelledby="objectives-title" className="space-y-3">
      <h2 id="objectives-title" className="text-2xl">
        {title}
      </h2>
      {objectives.length === 0 ? (
        <EmptyCard>Sin datos todavía. Los objetivos en alcance aparecerán acá.</EmptyCard>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {objectives.map((objective) => (
            <Card key={objective.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <p className="font-bold">{objective.title}</p>
                <Badge variant={objective.progress < 50 ? "warn" : "ok"}>
                  {Math.round(objective.progress)}%
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function RiskSection({ risks }: { risks: DashboardRisk[] }) {
  return (
    <section aria-labelledby="risks-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="risks-title" className="text-2xl">
          Riesgos de desalineamiento
        </h2>
        <Badge variant={risks.length === 0 ? "ok" : "risk"}>
          {risks.length === 0 ? "Sin riesgos activos" : `${risks.length} requieren atención`}
        </Badge>
      </div>
      {risks.length === 0 ? (
        <Card>
          <CardContent role="status" className="text-center text-muted-foreground">
            No hay condiciones activas de desalineamiento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {risks.map((risk) => (
            <Card key={risk.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{risk.title}</CardTitle>
                  <Badge variant={risk.severity === "critical" ? "risk" : "warn"}>
                    {risk.severity === "critical" ? "Crítico" : "Atención"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">{risk.detail}</p>
                <p className="font-bold">Acción sugerida: {risk.suggestedAction}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = "secondary",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "secondary" | "ok" | "warn" | "risk" | "info";
}) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold text-muted-foreground">{label}</p>
          <Badge variant={tone}>{tone === "secondary" ? "Dato" : "Estado"}</Badge>
        </div>
        <p className="text-4xl font-extrabold tracking-[-0.04em]">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent role="status" className="py-7 text-center text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}
