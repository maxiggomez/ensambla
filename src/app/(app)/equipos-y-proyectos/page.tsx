import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { verifiedEmail } from "@/lib/verified-email";
import { listMembers } from "@/modules/identity-org/application";
import { listObjectives } from "@/modules/okrs/application";
import {
  evaluateAlignment,
  listProjectContexts,
  listTeamAssignments,
  listTeamCapacities,
  type TeamAssignmentView,
} from "@/modules/teams-staffing/application";
import { ApplicationError } from "@/shared/errors";
import { linkMembershipsForUser } from "@/shared/tenancy";

import {
  AssignMemberForm,
  CloseProjectForm,
  LinkObjectiveForm,
  ProjectForm,
  TeamForm,
} from "./teams-forms";

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

interface TeamView {
  teamId: string;
  name: string;
  capacity: number;
  overloaded: boolean;
  members: Array<TeamAssignmentView & { name: string }>;
}

export default async function EquiposYProyectosPage() {
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
  const canManageProjects = role === "Direccion" || role === "Lider";
  const canCreateTeam = canManageProjects;

  const memberNames = new Map(members.map((member) => [member.id, member.name]));
  const memberOptions = members
    .filter((member) => member.id !== actor.id)
    .map((member) => ({ id: member.id, label: member.name }));

  const teams = await listTeamCapacities({ actorClerkUserId: user.id });
  const assignmentsByTeam = new Map<string, TeamAssignmentView[]>();
  const actorLeadTeamIds = new Set<string>();
  for (const team of teams) {
    const assignments = await listTeamAssignments({
      actorClerkUserId: user.id,
      teamId: team.teamId,
    });
    assignmentsByTeam.set(team.teamId, assignments);
    if (
      assignments.some(
        (assignment) => assignment.memberId === actor.id && assignment.role === "Lead",
      )
    ) {
      actorLeadTeamIds.add(team.teamId);
    }
  }
  const teamViews: TeamView[] = teams.map((team) => ({
    ...team,
    members: (assignmentsByTeam.get(team.teamId) ?? []).map((assignment) => ({
      ...assignment,
      name: memberNames.get(assignment.memberId) ?? "Miembro sin nombre",
    })),
  }));

  const projects = await listProjectContexts({ actorClerkUserId: user.id });
  const objectives = await listObjectives({ actorClerkUserId: user.id });
  const alignment = await evaluateAlignment({ actorClerkUserId: user.id });

  const objectiveOptions = objectives.map((objective) => ({
    id: objective.id,
    label: objective.title,
  }));
  const keyResultTitles = new Map<string, string>();
  for (const objective of objectives) {
    for (const keyResult of objective.keyResults) {
      keyResultTitles.set(keyResult.id, `${objective.title} · ${keyResult.title}`);
    }
  }
  const projectNames = new Map(projects.map((project) => [project.projectId, project.name]));
  const projectsWithoutOkr = alignment.projectsWithoutOkr
    .map((projectId) => projectNames.get(projectId))
    .filter((name): name is string => Boolean(name));
  const keyResultsWithoutProject = alignment.keyResultsWithoutProject
    .map((keyResultId) => keyResultTitles.get(keyResultId))
    .filter((title): title is string => Boolean(title));

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-6 py-10 md:px-10">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
          {"Equipos & Proyectos"}
        </p>
        <h1 className="text-3xl md:text-5xl">Trabajo por equipos hacia los objetivos</h1>
        <p className="text-muted-foreground">
          Formá equipos, asigná carga y conectá proyectos a los objetivos de la organización.
        </p>
      </header>

      <section aria-labelledby="teams-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="teams-title" className="text-xl font-bold">
              Equipos
            </h2>
            <p className="text-sm text-muted-foreground">
              La capacidad de cada equipo es la suma derivada de las cargas de sus miembros.
            </p>
          </div>
          {canCreateTeam ? (
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle>Crear equipo</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamForm />
              </CardContent>
            </Card>
          ) : null}
        </div>

        {teamViews.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-muted-foreground">Creá tu primer equipo.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {teamViews.map((team) => {
              const canManageTeam =
                role === "Direccion" || (role === "Lider" && actorLeadTeamIds.has(team.teamId));
              return (
                <Card key={team.teamId} data-testid={`team-card-${team.name}`}>
                  <CardHeader>
                    <div className="space-y-2">
                      <CardTitle>{team.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Capacidad del equipo · {team.capacity}%
                        </span>
                        {team.overloaded ? <Badge>overloaded</Badge> : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {team.members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Sin miembros asignados todavía.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {team.members.map((member) => (
                          <li
                            key={member.memberId}
                            className="flex items-center justify-between gap-3 py-2 text-sm"
                          >
                            <span className="font-medium">{member.name}</span>
                            <span className="text-muted-foreground">
                              {member.role} · {member.capacityPercent}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {canManageTeam ? (
                      <div className="border-t pt-4">
                        <h3 className="mb-3 text-sm font-semibold">Asignar miembro</h3>
                        <AssignMemberForm team={team} members={memberOptions} />
                        <div className="mt-4 border-t pt-4">
                          <h3 className="mb-3 text-sm font-semibold">Editar equipo</h3>
                          <TeamForm
                            team={{
                              teamId: team.teamId,
                              name: team.name,
                              description: null,
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="projects-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="projects-title" className="text-xl font-bold">
              Proyectos
            </h2>
            <p className="text-sm text-muted-foreground">
              Iniciativas que mueven uno o más objetivos; su estado se refleja en el dashboard.
            </p>
          </div>
          {canManageProjects ? (
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle>Crear proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectForm />
              </CardContent>
            </Card>
          ) : null}
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-muted-foreground">Todavía no creaste proyectos.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.projectId} data-testid={`project-card-${project.name}`}>
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle>{project.name}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {project.status === "Active"
                        ? "Activo"
                        : project.status === "Closed"
                          ? "Cerrado"
                          : project.status}
                    </span>
                  </div>
                </CardHeader>
                {canManageProjects ? (
                  <CardContent className="space-y-4">
                    <LinkObjectiveForm project={project} objectives={objectiveOptions} />
                    {project.status === "Active" ? (
                      <CloseProjectForm project={project} />
                    ) : null}
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="alignment-title" className="space-y-4">
        <div className="space-y-1">
          <h2 id="alignment-title" className="text-xl font-bold">
            Alertas de alineamiento
          </h2>
          <p className="text-sm text-muted-foreground">
            Derivadas en cada lectura desde proyectos y objetivos publicados.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos sin OKR</CardTitle>
            </CardHeader>
            <CardContent>
              {projectsWithoutOkr.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todos los proyectos tienen objetivos.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {projectsWithoutOkr.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>KeyResults sin proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              {keyResultsWithoutProject.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todos los KeyResults de objetivos publicados tienen un proyecto.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {keyResultsWithoutProject.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
