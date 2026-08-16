import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { verifiedEmail } from "@/lib/verified-email";
import { listMembers } from "@/modules/identity-org/application";
import { listObjectives } from "@/modules/okrs/application";
import {
  countResolvedBlockers,
  evaluateLearningRisks,
  listOpenBlockers,
  listRituals,
} from "@/modules/rituals/application";
import { listTeamCapacities } from "@/modules/teams-staffing/application";
import { ApplicationError } from "@/shared/errors";
import { linkMembershipsForUser } from "@/shared/tenancy";

import {
  CreateRitualForm,
  MarkHeldButton,
  RecordBlockerForm,
  RecordRetrospectiveForm,
  ResolveBlockerButton,
  ScheduleActions,
} from "./rituals-forms";

type RitualOccurrenceStatus = "Scheduled" | "Overdue" | "Held";

const OCCURRENCE_STATUS_LABELS: Record<RitualOccurrenceStatus, string> = {
  Scheduled: "Programada",
  Overdue: "Vencida",
  Held: "Realizada",
};

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

const STATUS_BADGE_VARIANT: Record<RitualOccurrenceStatus, "secondary" | "ok" | "warn"> = {
  Scheduled: "secondary",
  Held: "ok",
  Overdue: "warn",
};

export default async function RitualesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  let members;
  try {
    members = await listMembers({ actorClerkUserId: user.id });
  } catch (error) {
    if (!isNoMember(error)) throw error;
    if ((await linkMembershipsForUser(user.id, verifiedEmail(user))) === 0)
      redirect("/onboarding");
    members = await listMembers({ actorClerkUserId: user.id });
  }

  const actor = members.find((member) => member.clerkUserId === user.id);
  if (!actor) redirect("/onboarding");
  const role = actor.role;
  const canManageRituals = role === "Direccion" || role === "Lider";

  const memberNames = new Map(members.map((member) => [member.id, member.name]));
  const teams = await listTeamCapacities({ actorClerkUserId: user.id });
  const teamNames = new Map(teams.map((team) => [team.teamId, team.name]));
  const teamOptions = teams.map((team) => ({ id: team.teamId, label: team.name }));

  const objectives = await listObjectives({ actorClerkUserId: user.id });
  const objectiveOptions = objectives.map((objective) => ({
    id: objective.id,
    label: objective.title,
  }));

  const [rituals, openBlockers, resolvedCount, learningRisks] = await Promise.all([
    listRituals({ actorClerkUserId: user.id }),
    listOpenBlockers({ actorClerkUserId: user.id }),
    countResolvedBlockers({ actorClerkUserId: user.id }),
    evaluateLearningRisks({
      actorClerkUserId: user.id,
      teamIds: teams.map((team) => team.teamId),
    }),
  ]);

  const atRiskTeams = learningRisks.filter((risk) => risk.atRisk);

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-6 py-10 md:px-10">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
          {"Rituales"}
        </p>
        <h1 className="text-3xl md:text-5xl">{"Rituales y blockers"}</h1>
        <p className="text-muted-foreground">
          {"Las ceremonias de los Teams, los bloqueos abiertos y el ritmo de aprendizaje."}
        </p>
      </header>

      <section aria-labelledby="ceremonies-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="ceremonies-title" className="text-xl font-bold">
              {"Ceremonias"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {"Definí la cadencia, generá las fechas y marcá las ceremonias celebradas."}
            </p>
          </div>
          {canManageRituals ? (
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle>Crear ceremonia</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateRitualForm teams={teamOptions} />
              </CardContent>
            </Card>
          ) : null}
        </div>
        {rituals.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {"Todavía no hay ceremonias definidas."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {rituals.map((ritual) => (
              <Card key={ritual.ritualId}>
                <CardHeader>
                  <CardTitle>{ritual.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {teamNames.get(ritual.teamId) ?? "Team sin nombre"} · desde{" "}
                    {ritual.startDate}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canManageRituals ? <ScheduleActions ritualId={ritual.ritualId} /> : null}
                  {ritual.occurrences.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {"Generá las fechas para ver las ocurrencias."}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {ritual.occurrences.map((occurrence) => (
                        <li
                          key={occurrence.occurrenceId}
                          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                        >
                          <span className="text-sm">{occurrence.scheduledDate}</span>
                          <span className="flex items-center gap-2">
                            <Badge variant={STATUS_BADGE_VARIANT[occurrence.status]}>
                              {OCCURRENCE_STATUS_LABELS[occurrence.status]}
                            </Badge>
                            {canManageRituals && occurrence.status !== "Held" ? (
                              <MarkHeldButton occurrenceId={occurrence.occurrenceId} />
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="blockers-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="blockers-title" className="text-xl font-bold">
              {"Tablero de bloqueos"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {"Lo que impide avanzar, con su dueño y el objetivo que bloquea."}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{`Resueltos: ${resolvedCount}`}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {canManageRituals ? (
            <Card>
              <CardHeader>
                <CardTitle>Registrar Blocker</CardTitle>
              </CardHeader>
              <CardContent>
                <RecordBlockerForm teams={teamOptions} objectives={objectiveOptions} />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Abiertos</CardTitle>
            </CardHeader>
            <CardContent>
              {openBlockers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{"No hay bloqueos abiertos."}</p>
              ) : (
                <ul className="space-y-2">
                  {openBlockers.map((blocker) => (
                    <li
                      key={blocker.blockerId}
                      className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold">{blocker.title}</p>
                        {blocker.description ? (
                          <p className="text-sm text-muted-foreground">{blocker.description}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {teamNames.get(blocker.teamId) ?? "Team sin nombre"} · Dueño{" "}
                          {memberNames.get(blocker.ownerId) ?? "Miembro"}
                          {blocker.objective ? ` · Bloquea ${blocker.objective.title}` : ""}
                        </p>
                      </div>
                      {canManageRituals ? (
                        <ResolveBlockerButton blockerId={blocker.blockerId} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="learning-title" className="space-y-4">
        <div className="space-y-1">
          <h2 id="learning-title" className="text-xl font-bold">
            {"Riesgo de aprendizaje"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {"Los Teams sin retrospectiva reciente pierden el hábito de aprender."}
          </p>
        </div>
        <Card>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {teams.length === 0 ? (
                <li className="text-sm text-muted-foreground">{"Todavía no hay Teams."}</li>
              ) : (
                atRiskTeams.map((risk) => (
                  <li
                    key={risk.teamId}
                    className="flex items-center justify-between rounded-lg border px-4 py-2"
                  >
                    <span className="text-sm font-medium">
                      {teamNames.get(risk.teamId) ?? "Team sin nombre"}
                    </span>
                    <Badge variant="warn">Riesgo de aprendizaje</Badge>
                  </li>
                ))
              )}
            </ul>
            {canManageRituals ? <RecordRetrospectiveForm teams={teamOptions} /> : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
