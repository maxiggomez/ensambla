import { getCurrentUser } from "@/lib/auth";
import { verifiedEmail } from "@/lib/verified-email";
import { listMembers } from "@/modules/identity-org/application";
import {
  getAlignmentChain,
  listAtRiskKeyResults,
  listDueCheckInReminders,
  listObjectiveHistory,
  listObjectives,
  listOkrCycles,
  type AlignmentChainView,
  type ObjectiveView,
} from "@/modules/okrs/application";
import { listTeamCapacities } from "@/modules/teams-staffing/application";
import { ApplicationError } from "@/shared/errors";
import { linkMembershipsForUser } from "@/shared/tenancy";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ArchiveObjectiveForm,
  CreateCycleForm,
  CreateObjectiveForm,
  KeyResultControls,
  ObjectiveControls,
} from "./okr-forms";

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

export default async function OkrsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
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
  const [objectives, history, cycles, teams, reminders] = await Promise.all([
    listObjectives({ actorClerkUserId: user.id }),
    listObjectiveHistory({ actorClerkUserId: user.id }),
    listOkrCycles({ actorClerkUserId: user.id }),
    listTeamCapacities({ actorClerkUserId: user.id }),
    listDueCheckInReminders({ actorClerkUserId: user.id }),
  ]);
  const risks = isDirection ? await listAtRiskKeyResults({ actorClerkUserId: user.id }) : [];
  const alignmentEntries = await Promise.all(
    objectives.flatMap((objective) =>
      objective.keyResults.map(
        async (keyResult) =>
          [
            keyResult.id,
            await getAlignmentChain({ actorClerkUserId: user.id, keyResultId: keyResult.id }),
          ] as const,
      ),
    ),
  );
  const alignmentByKeyResult = new Map<string, AlignmentChainView>(alignmentEntries);
  const riskIds = new Set(risks.map((risk) => risk.keyResultId));
  const outdatedIds = new Set(reminders.map((reminder) => reminder.keyResultId));
  const feedback = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
          OKRs
        </p>
        <h1 className="text-3xl md:text-5xl">Objetivos que bajan a resultados medibles</h1>
        <p className="text-base text-muted-foreground">
          Definí el alineamiento, registrá check-ins con evidencia y cerrá cada ciclo con
          progreso siempre derivado.
        </p>
      </header>

      {feedback.success ? (
        <p role="status" className="rounded-lg bg-ok-soft px-4 py-3 font-bold text-foreground">
          {feedback.success}
        </p>
      ) : null}
      {feedback.error ? (
        <p role="alert" className="rounded-lg bg-risk-soft px-4 py-3 font-bold text-risk">
          {feedback.error}
        </p>
      ) : null}

      {isDirection ? (
        <section aria-labelledby="cycle-title" className="space-y-3">
          <h2 id="cycle-title" className="text-2xl">
            Ciclos
          </h2>
          <Card>
            <CardContent>
              <CreateCycleForm />
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="create-objective-title" className="space-y-3">
        <h2 id="create-objective-title" className="text-2xl">
          Crear objetivo
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Objective</CardTitle>
            <CardDescription>
              Queda en borrador hasta tener al menos un Key Result válido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateObjectiveForm
              members={members.map((member) => ({ id: member.id, name: member.name }))}
              teams={teams.map((team) => ({ id: team.teamId, name: team.name }))}
              cycles={cycles}
              objectives={objectives}
            />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="active-objectives-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="active-objectives-title" className="text-2xl">
              Objetivos activos
            </h2>
            <p className="text-sm text-muted-foreground">
              {objectives.length} visibles · {reminders.length} check-ins vencidos
            </p>
          </div>
          {risks.length > 0 ? (
            <Badge variant="risk">{risks.length} KR en riesgo</Badge>
          ) : (
            <Badge variant="ok">Sin riesgos críticos</Badge>
          )}
        </div>
        {objectives.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <h3 className="text-lg font-bold">Creá tu primer objetivo</h3>
              <p className="text-muted-foreground">
                Empezá con un Objective y agregale resultados medibles.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {objectives.map((objective) => (
              <ObjectiveCard
                key={objective.id}
                objective={objective}
                objectives={objectives}
                cycles={cycles}
                isDirection={isDirection}
                riskIds={riskIds}
                outdatedIds={outdatedIds}
                alignmentByKeyResult={alignmentByKeyResult}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="history-title" className="space-y-3">
        <h2 id="history-title" className="text-2xl">
          Historial archivado
        </h2>
        {history.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
            Todavía no hay ciclos cerrados.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {history.map((objective) => (
              <Card key={objective.id}>
                <CardHeader>
                  <CardTitle>{objective.title}</CardTitle>
                  <CardDescription>
                    {objective.status === "Archived" ? "Solo lectura" : "Cerrado"} ·{" "}
                    {Math.round(objective.progress)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {objective.keyResults.map((keyResult) => (
                      <li key={keyResult.id} className="rounded-lg bg-muted/50 p-3">
                        <p className="font-bold">{keyResult.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {keyResult.grade ?? "Sin calificación"} ·{" "}
                          {Math.round(keyResult.progress)}%
                        </p>
                        <KeyResultControls
                          keyResult={keyResult}
                          objectiveStatus={objective.status}
                          cycles={cycles}
                          isDirection={isDirection}
                        />
                      </li>
                    ))}
                  </ul>
                  {isDirection && objective.status === "Closed" ? (
                    <ArchiveObjectiveForm objectiveId={objective.id} />
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ObjectiveCard(props: {
  objective: ObjectiveView;
  objectives: readonly ObjectiveView[];
  cycles: Awaited<ReturnType<typeof listOkrCycles>>;
  isDirection: boolean;
  riskIds: ReadonlySet<string>;
  outdatedIds: ReadonlySet<string>;
  alignmentByKeyResult: ReadonlyMap<string, AlignmentChainView>;
}) {
  const { objective } = props;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{objective.title}</CardTitle>
            <CardDescription>
              {levelLabel(objective.level)} ·{" "}
              {objective.status === "Draft" ? "Borrador" : "Publicado"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {objective.isOrphan ? (
              <Badge variant="warn">Objetivo huérfano</Badge>
            ) : (
              <Badge variant="info">Alineado</Badge>
            )}
            <Badge variant="secondary">{Math.round(objective.progress)}%</Badge>
          </div>
        </div>
        <div
          aria-label={`Progreso ${Math.round(objective.progress)}%`}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-brand-2"
            style={{ width: `${objective.progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {objective.keyResults.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tiene Key Results.</p>
        ) : (
          <ul className="space-y-3">
            {objective.keyResults.map((keyResult) => {
              const chain = props.alignmentByKeyResult.get(keyResult.id);
              return (
                <li key={keyResult.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{keyResult.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {measurementLabel(keyResult.measurementType)} ·{" "}
                        {Math.round(keyResult.progress)}%
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {props.riskIds.has(keyResult.id) ? (
                        <Badge variant="risk">En riesgo</Badge>
                      ) : null}
                      {props.outdatedIds.has(keyResult.id) ? (
                        <Badge variant="warn">Desactualizado</Badge>
                      ) : null}
                    </div>
                  </div>
                  {chain ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Alineamiento:{" "}
                      {[
                        ...chain.objectives.map((item) => item.title),
                        chain.pillar?.name,
                        chain.northStarName,
                      ]
                        .filter(Boolean)
                        .join(" → ") || "Sin vínculo superior"}
                    </p>
                  ) : null}
                  <KeyResultControls
                    keyResult={keyResult}
                    objectiveStatus={objective.status}
                    cycles={props.cycles}
                    isDirection={props.isDirection}
                  />
                </li>
              );
            })}
          </ul>
        )}
        <ObjectiveControls
          objective={objective}
          objectives={props.objectives}
          isDirection={props.isDirection}
        />
      </CardContent>
    </Card>
  );
}

function levelLabel(level: ObjectiveView["level"]): string {
  return { Company: "Compañía", Area: "Área", Team: "Team", Person: "Persona" }[level];
}

function measurementLabel(
  type: ObjectiveView["keyResults"][number]["measurementType"],
): string {
  return {
    check: "Check",
    percentage: "Porcentaje",
    integer: "Número",
    currency: "Moneda",
    text: "Texto / hito",
  }[type];
}
