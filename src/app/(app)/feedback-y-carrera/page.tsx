import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { verifiedEmail } from "@/lib/verified-email";
import {
  getGrowthPlan,
  listFeedbackRequests,
  listKudoActivity,
  listPrivateFeedback,
} from "@/modules/feedback-growth/application";
import { listMembers } from "@/modules/identity-org/application";
import { listObjectives } from "@/modules/okrs/application";
import { getCompetencyMatrix } from "@/modules/skills-matrix/application";
import { getStrategy } from "@/modules/strategy-northstar/application";
import { listProjectContexts } from "@/modules/teams-staffing/application";
import { ApplicationError } from "@/shared/errors";
import { linkMembershipsForUser } from "@/shared/tenancy";

import {
  CloseProjectForm,
  EvidenceForm,
  GiveFeedbackForm,
  GiveKudoForm,
  GrowthPlanForm,
  RequestFeedbackForm,
} from "./feedback-growth-forms";

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

export default async function FeedbackYCarreraPage() {
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

  const strategy = await getStrategy({ actorClerkUserId: user.id });
  const projects = await listProjectContexts({ actorClerkUserId: user.id });
  const objectives = await listObjectives({ actorClerkUserId: user.id });
  const matrix = await getCompetencyMatrix({ actorClerkUserId: user.id });
  const privateFeedback = await listPrivateFeedback({ actorClerkUserId: user.id });
  const requests = await listFeedbackRequests({ actorClerkUserId: user.id });
  const kudos = await listKudoActivity({ actorClerkUserId: user.id });
  const growthPlan = await getGrowthPlan({ actorClerkUserId: user.id });

  const actor = members.find((member) => member.clerkUserId === user.id);
  if (!actor) redirect("/onboarding");
  const memberOptions = members
    .filter((member) => member.id !== actor.id)
    .map((member) => ({ id: member.id, label: member.name }));
  const projectOptions = projects.map((project) => ({
    id: project.projectId,
    label: project.name,
  }));
  const objectiveOptions = objectives.map((objective) => ({
    id: objective.id,
    label: objective.title,
  }));
  const keyResultOptions = objectives.flatMap((objective) =>
    objective.keyResults.map((keyResult) => ({
      id: keyResult.id,
      label: `${objective.title} · ${keyResult.title}`,
    })),
  );
  const skillOptions = matrix.skills.map((skill) => ({ id: skill.skillId, label: skill.name }));
  const receivedFeedback = privateFeedback.filter(
    (feedback) => feedback.recipientId === actor.id,
  );
  const pendingRequests = requests.inbox.filter((request) => request.pending);
  const targetLevels = Object.fromEntries(
    growthPlan?.targets.map((target) => [target.skillId, target.targetLevel]) ?? [],
  );
  const closedProjects = projects.filter((project) => project.status === "Closed");
  const activeProjects = projects.filter((project) => project.status === "Active");

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-6 py-10 md:px-10">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
          {"Feedback & Carrera"}
        </p>
        <h1 className="text-3xl md:text-5xl">Crecer con señales del trabajo real</h1>
        <p className="text-muted-foreground">
          Pedí Feedback privado, reconocé contribuciones y convertí evidencia en progreso.
        </p>
      </header>

      <section aria-labelledby="feedback-actions-title" className="space-y-4">
        <h2 id="feedback-actions-title">Dar y pedir Feedback</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Solicitar Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestFeedbackForm members={memberOptions} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dar Feedback privado</CardTitle>
            </CardHeader>
            <CardContent>
              <GiveFeedbackForm
                members={memberOptions}
                projects={projectOptions}
                values={strategy.values}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="requests-title" className="space-y-4">
        <h2 id="requests-title">Solicitudes pendientes</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-muted-foreground">No tenés solicitudes pendientes.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingRequests.map((request) => (
              <Card key={request.requestId}>
                <CardHeader>
                  <CardTitle>{request.requesterName} te pidió Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{request.prompt}</p>
                  <GiveFeedbackForm
                    members={memberOptions}
                    projects={projectOptions}
                    values={strategy.values}
                    request={{
                      requestId: request.requestId,
                      recipientMemberId: request.requesterId,
                      recipientLabel: request.requesterName,
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="received-title" className="space-y-4">
        <h2 id="received-title">Feedback para mí</h2>
        {receivedFeedback.length === 0 ? (
          <p className="text-muted-foreground">Todavía no recibiste Feedback.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {receivedFeedback.map((feedback) => (
              <Card key={feedback.feedbackId}>
                <CardHeader>
                  <CardTitle>
                    {feedback.classification === "strength"
                      ? "Fortaleza"
                      : "Oportunidad de mejora"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{feedback.body}</p>
                  <p className="text-sm text-muted-foreground">De {feedback.authorName}</p>
                  {feedback.project ? <p>Proyecto: {feedback.project.name}</p> : null}
                  {feedback.value ? <p>Valor: {feedback.value}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="kudos-title" className="space-y-4">
        <h2 id="kudos-title">Reconocimientos del equipo</h2>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Dar un Kudo</CardTitle>
            </CardHeader>
            <CardContent>
              <GiveKudoForm
                members={memberOptions}
                values={strategy.values}
                objectives={objectiveOptions}
                keyResults={keyResultOptions}
              />
            </CardContent>
          </Card>
          <div className="space-y-3">
            {kudos.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground">Todavía no hay reconocimientos.</p>
                </CardContent>
              </Card>
            ) : (
              kudos.map((kudo) => (
                <Card key={kudo.kudoId}>
                  <CardHeader>
                    <CardTitle>{kudo.recipientName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>{kudo.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {kudo.giverName} · {kudo.value}
                    </p>
                    {kudo.context ? (
                      <p className="text-sm">
                        {kudo.context.type === "Objective"
                          ? kudo.context.objectiveTitle
                          : `${kudo.context.objectiveTitle} · ${kudo.context.keyResultTitle}`}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="growth-title" className="space-y-4">
        <h2 id="growth-title">Mi plan de crecimiento</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Próximo hito</CardTitle>
            </CardHeader>
            <CardContent>
              <GrowthPlanForm
                skills={skillOptions}
                nextMilestone={growthPlan?.nextMilestone}
                targets={targetLevels}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progreso · {growthPlan?.progress ?? 0}%</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {growthPlan?.targets.map((target) => (
                <div key={target.skillId} className="space-y-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span>{target.skillName}</span>
                    <span>
                      Nivel {target.currentLevel}/{target.targetLevel} · Gap {target.gap}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-brand-2"
                      style={{
                        width: `${target.targetLevel === 0 ? 100 : Math.min((target.currentLevel / target.targetLevel) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )) ?? <p className="text-muted-foreground">Definí tu primer plan.</p>}
              {growthPlan ? (
                <div className="space-y-4 border-t pt-4">
                  <EvidenceForm
                    source="feedback"
                    options={receivedFeedback.map((feedback) => ({
                      id: feedback.feedbackId,
                      label: `${feedback.authorName}: ${feedback.body}`,
                    }))}
                  />
                  <EvidenceForm
                    source="project"
                    options={closedProjects.map((project) => ({
                      id: project.projectId,
                      label: project.name,
                    }))}
                  />
                  <div className="space-y-2">
                    {growthPlan.evidence.map((evidence) => (
                      <p
                        key={`${evidence.source}-${"feedbackId" in evidence ? evidence.feedbackId : evidence.projectId}`}
                      >
                        Evidencia: {"body" in evidence ? evidence.body : evidence.projectName}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      {actor.role === "Direccion" && activeProjects.length > 0 ? (
        <section aria-labelledby="projects-title" className="space-y-4">
          <h2 id="projects-title">Cerrar proyectos para usarlos como evidencia</h2>
          <Card>
            <CardContent className="space-y-3">
              {activeProjects.map((project) => (
                <CloseProjectForm
                  key={project.projectId}
                  project={{ id: project.projectId, label: project.name }}
                />
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  );
}
