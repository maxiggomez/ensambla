import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth";
import { verifiedEmail } from "@/lib/verified-email";
import { listMembers } from "@/modules/identity-org/application";
import { listObjectives } from "@/modules/okrs/application";
import {
  evaluateGaps,
  getCompetencyMatrix,
  suggestStaffing,
} from "@/modules/skills-matrix/application";
import { listProjectContexts, listTeamCapacities } from "@/modules/teams-staffing/application";
import { ApplicationError } from "@/shared/errors";
import { linkMembershipsForUser } from "@/shared/tenancy";

import {
  AddSkillRequirementForm,
  CompetencyCell,
  DefineSkillForm,
  RenameSkillForm,
  SetSeniorityForm,
} from "./skills-forms";

export interface SkillsYStaffingSearchParams {
  team?: string;
  need?: string;
}

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

const controlClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Form GET que combina el filtro de Team y la necesidad seleccionada. */
export function FilterForms({
  teams,
  selectedNeed,
  selectedTeam,
}: {
  teams: Array<{ teamId: string; name: string }>;
  selectedNeed: string | undefined;
  selectedTeam: string | undefined;
}) {
  return (
    <form action="/skills-y-staffing" className="flex flex-wrap items-end gap-3" method="get">
      <div className="space-y-1">
        <Label htmlFor="team-filter">Team</Label>
        <select
          id="team-filter"
          name="team"
          defaultValue={selectedTeam ?? ""}
          className={controlClass}
        >
          <option value="">Todos</option>
          {teams.map((team) => (
            <option key={team.teamId} value={team.teamId}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      {selectedNeed ? <input name="need" type="hidden" value={selectedNeed} /> : null}
      <button
        type="submit"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Aplicar filtro
      </button>
    </form>
  );
}

export default async function SkillsYStaffingPage({
  searchParams,
}: {
  searchParams: Promise<SkillsYStaffingSearchParams>;
}) {
  const { team = "", need: selectedNeed } = await searchParams;
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
  const canManageSkills = role === "Direccion" || role === "Lider";
  const canManageSeniority = role === "Direccion";

  const [matrix, teams, projects, objectives, gaps] = await Promise.all([
    getCompetencyMatrix({ actorClerkUserId: user.id, teamId: team || undefined }),
    listTeamCapacities({ actorClerkUserId: user.id }),
    listProjectContexts({ actorClerkUserId: user.id }),
    listObjectives({ actorClerkUserId: user.id }),
    evaluateGaps({ actorClerkUserId: user.id }),
  ]);

  const skillNames = new Map(matrix.skills.map((skill) => [skill.skillId, skill.name]));
  const skillOptions = matrix.skills.map((skill) => ({
    id: skill.skillId,
    label: skill.name,
  }));

  const needOptions: Array<{ id: string; label: string }> = [
    ...projects.map((project) => ({
      id: `project:${project.projectId}`,
      label: `Project · ${project.name}`,
    })),
    ...objectives.flatMap((objective) =>
      objective.keyResults.map((keyResult) => ({
        id: `kr:${keyResult.id}`,
        label: `KeyResult · ${objective.title} · ${keyResult.title}`,
      })),
    ),
  ];

  const selectedNeedKind = selectedNeed?.startsWith("project:") ? "project" : "keyResult";
  const selectedNeedId = selectedNeed?.slice(selectedNeedKind === "project" ? 8 : 3) ?? "";

  const suggestions = selectedNeed
    ? await suggestStaffing({
        actorClerkUserId: user.id,
        ...(selectedNeedKind === "project"
          ? { projectId: selectedNeedId }
          : { keyResultId: selectedNeedId }),
      })
    : [];

  const seniorityByMember = new Map(
    members.map((member) => [member.id, member.seniority] as const),
  );
  const seniorityMembers = members.map((member) => ({
    id: member.id,
    name: member.name,
    seniority: (seniorityByMember.get(member.id) ?? null) as string | null,
  }));

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-6 py-10 md:px-10">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
          {"Skills & Staffing"}
        </p>
        <h1 className="text-3xl md:text-5xl">Competencias y staffing alineados</h1>
        <p className="text-muted-foreground">
          La matriz de competencias, las sugerencias de staffing y los gaps derivados de los
          OKRs publicados.
        </p>
      </header>

      <section aria-labelledby="catalog-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="catalog-title" className="text-xl font-bold">
              Catálogo de skills
            </h2>
            <p className="text-sm text-muted-foreground">
              El lenguaje común de competencias de la organización.
            </p>
          </div>
          {canManageSkills ? (
            <Card className="w-full max-w-xs">
              <CardHeader>
                <CardTitle>Definir skill</CardTitle>
              </CardHeader>
              <CardContent>
                <DefineSkillForm />
              </CardContent>
            </Card>
          ) : null}
        </div>
        {matrix.skills.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Todavía no hay skills definidas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-4">
            {matrix.skills.map((skill) => (
              <Card key={skill.skillId} className="w-full max-w-xs">
                <CardHeader>
                  <CardTitle>{skill.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {canManageSkills ? (
                    <RenameSkillForm skill={skill} />
                  ) : (
                    <p className="text-sm text-muted-foreground">Definida.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="matrix-title" className="space-y-4">
        <div className="space-y-1">
          <h2 id="matrix-title" className="text-xl font-bold">
            Matriz de competencias
          </h2>
          <p className="text-sm text-muted-foreground">
            Niveles por persona y skill (0 a 4). Podés filtrar por Team.
          </p>
        </div>
        <FilterForms
          teams={teams.map((team) => ({ teamId: team.teamId, name: team.name }))}
          selectedNeed={selectedNeed}
          selectedTeam={team}
        />
        <Card className="overflow-x-auto">
          <CardContent className="p-0">
            {matrix.rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                Sin personas para mostrar con el filtro actual.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-semibold">Persona</th>
                    {matrix.skills.map((skill) => (
                      <th key={skill.skillId} className="px-4 py-2 text-center font-semibold">
                        {skill.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.rows.map((row) => (
                    <tr key={row.memberId} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{row.name}</td>
                      {matrix.skills.map((skill) => (
                        <CompetencyCell
                          key={skill.skillId}
                          memberId={row.memberId}
                          skillId={skill.skillId}
                          skillName={skill.name}
                          level={row.levels[skill.skillId] ?? null}
                          editable={canManageSkills}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        {canManageSeniority ? (
          <Card>
            <CardHeader>
              <CardTitle>Seniority</CardTitle>
            </CardHeader>
            <CardContent>
              <SetSeniorityForm members={seniorityMembers} />
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section aria-labelledby="staffing-title" className="space-y-4">
        <div className="space-y-1">
          <h2 id="staffing-title" className="text-xl font-bold">
            Sugerencias de staffing
          </h2>
          <p className="text-sm text-muted-foreground">
            Elegí una necesidad (Project o KeyResult) para ver quién la puede cubrir mejor.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Necesidad de staffing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action="/skills-y-staffing" className="space-y-3" method="get">
              <fieldset className="space-y-3">
                <legend className="sr-only">Necesidad de staffing</legend>
                <div className="space-y-1">
                  <Label htmlFor="need-select">Necesidad</Label>
                  <select id="need-select" name="need" className={controlClass}>
                    <option value="">Elegí una necesidad</option>
                    {needOptions.map((need) => (
                      <option key={need.id} value={need.id}>
                        {need.label}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Ver sugerencias
              </button>
            </form>

            {selectedNeed ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {`Sugerencias para un ${selectedNeedKind === "project" ? "Project" : "KeyResult"}.`}
                </p>
                {suggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin sugerencias: nadie alcanza el mínimo en las skills requeridas o la
                    necesidad todavía no tiene requisitos.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.memberId}
                        className="flex items-center justify-between rounded-lg border px-4 py-2"
                      >
                        <span className="font-medium">{suggestion.name}</span>
                        <span className="text-sm text-muted-foreground">
                          Nivel {suggestion.skillLevel.toFixed(1)} · Disponibilidad{" "}
                          {suggestion.availability}%{suggestion.noMargin ? " · Sin margen" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {canManageSkills ? (
                  <AddSkillRequirementForm
                    needType={selectedNeedKind}
                    needId={selectedNeedId}
                    skills={skillOptions}
                  />
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="gaps-title" className="space-y-4">
        <div className="space-y-1">
          <h2 id="gaps-title" className="text-xl font-bold">
            Gaps de cobertura
          </h2>
          <p className="text-sm text-muted-foreground">
            Alertas derivadas de las skills requeridas por OKRs publicados.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cobertura insuficiente</CardTitle>
            </CardHeader>
            <CardContent>
              {gaps.coverageGaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todas las skills con demanda tienen cobertura suficiente.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {gaps.coverageGaps.map((skillId) => (
                    <li key={skillId}>{skillNames.get(skillId) ?? "Skill desconocida"}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Riesgo bus factor</CardTitle>
            </CardHeader>
            <CardContent>
              {gaps.busFactorRisks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin skills críticas cubiertas por una sola persona.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {gaps.busFactorRisks.map((skillId) => (
                    <li key={skillId}>{skillNames.get(skillId) ?? "Skill desconocida"}</li>
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
