import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  getCultureEnpsSettings,
  listPendingPulses,
  listPulseResults,
} from "@/modules/culture-enps/application";
import { listMembers } from "@/modules/identity-org/application";
import { listTeamCapacities } from "@/modules/teams-staffing/application";
import { ApplicationError } from "@/shared/errors";
import { verifiedEmail } from "@/lib/verified-email";
import { linkMembershipsForUser } from "@/shared/tenancy";

import { LaunchForm, ScheduleForm, ThresholdForm } from "./management-forms";
import { ResponseForm } from "./response-form";

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

export default async function CultureEnpsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  let members;
  try {
    members = await listMembers({ actorClerkUserId: user.id });
  } catch (error) {
    if (!isNoMember(error)) throw error;
    const linked = await linkMembershipsForUser(user.id, verifiedEmail(user));
    if (linked === 0) redirect("/onboarding");
    members = await listMembers({ actorClerkUserId: user.id });
  }
  const actor = members.find((member) => member.clerkUserId === user.id);
  const isDirection = actor?.role === "Direccion";
  const pending = await listPendingPulses({ actorClerkUserId: user.id });
  const [results, settings, teams] = isDirection
    ? await Promise.all([
        listPulseResults({ actorClerkUserId: user.id }),
        getCultureEnpsSettings({ actorClerkUserId: user.id }),
        listTeamCapacities({ actorClerkUserId: user.id }),
      ])
    : [[], null, []];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
          Clima &amp; eNPS
        </p>
        <h1 className="text-3xl md:text-5xl">El pulso continuo de la cultura</h1>
        <p className="text-base text-muted-foreground">
          Medí qué tan probable es que las personas recomienden trabajar acá, con anonimato
          estructural y señales operativas.
        </p>
      </header>

      <section aria-labelledby="pending-title" className="space-y-4">
        <h2 id="pending-title" className="text-2xl">
          Mis pulsos pendientes
        </h2>
        {pending.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                No tenés pulsos pendientes. Cuando haya uno nuevo, aparecerá acá.
              </p>
            </CardContent>
          </Card>
        ) : (
          pending.map((pulse) => (
            <Card key={pulse.pulseId} className="shadow-sm">
              <CardHeader>
                <CardTitle>Tu voz importa</CardTitle>
                <CardDescription>
                  {pulse.scope.type === "team"
                    ? "Pulso de tu Team"
                    : "Pulso de toda la organización"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponseForm pulseId={pulse.pulseId} />
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {isDirection && settings ? (
        <>
          <section aria-labelledby="manage-title" className="space-y-4">
            <h2 id="manage-title" className="text-2xl">
              Gestionar pulsos
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Lanzar ahora</CardTitle>
                  <CardDescription>Entrega in-app al alcance elegido.</CardDescription>
                </CardHeader>
                <CardContent>
                  <LaunchForm teams={teams} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Anonimato</CardTitle>
                  <CardDescription>El piso seguro nunca baja de 4.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ThresholdForm minimumResponses={settings.minimumResponses} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recurrencia</CardTitle>
                  <CardDescription>Generación semanal, mensual o trimestral.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScheduleForm />
                </CardContent>
              </Card>
            </div>
          </section>
          <section aria-labelledby="results-title" className="space-y-4">
            <h2 id="results-title" className="text-2xl">
              Resultados
            </h2>
            {results.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground">
                    Lanzá el primer pulso para empezar a medir.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {results.map((view) => (
                  <Card key={view.pulseId} data-testid={`pulse-result-${view.pulseId}`}>
                    <CardHeader>
                      <CardTitle>
                        {view.scope.type === "team" ? "eNPS del Team" : "eNPS global"}
                      </CardTitle>
                      <CardDescription>Pulse {view.pulseId.slice(0, 8)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {view.result.status === "suppressed" ? (
                        <div className="rounded-sm bg-warn-soft p-4">
                          <p className="font-bold text-ink">Resultados protegidos</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Todavía no hay respuestas suficientes. Se muestran desde N=
                            {view.result.minimumResponses}.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-bold text-muted-foreground">eNPS</p>
                              <p className="text-4xl font-extrabold tracking-[-0.04em]">
                                {view.result.score.current > 0 ? "+" : ""}
                                {view.result.score.current}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground">
                                Participación
                              </p>
                              <p className="text-4xl font-extrabold tracking-[-0.04em]">
                                {view.result.participation.current}%
                              </p>
                            </div>
                          </div>
                          <div>
                            <h3 className="mb-2">Drivers</h3>
                            {view.result.drivers.map((group) => (
                              <div key={group.driver} className="border-t py-2">
                                <p className="font-bold">
                                  {group.driver} · {group.count}
                                </p>
                                {group.comments.map((comment, index) => (
                                  <blockquote
                                    key={index}
                                    className="mt-1 text-sm text-muted-foreground"
                                  >
                                    “{comment}”
                                  </blockquote>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
