import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { listMembers, requireActor } from "../../identity-org/application";
import { listTeamAssignments } from "../../teams-staffing/application";
import { listCompetencies } from "../infrastructure/competency-repo";
import { listSkills } from "../infrastructure/skill-repo";

export interface MatrixRow {
  memberId: string;
  name: string;
  /** skillId → level (solo skills con competencia registrada). */
  levels: Record<string, number>;
}

export interface CompetencyMatrix {
  skills: Array<{ skillId: string; name: string }>;
  rows: MatrixRow[];
}

export interface GetCompetencyMatrixInput {
  actorClerkUserId: string;
  /** Si se indica, la matriz muestra solo los miembros de ese Team. */
  teamId?: string;
}

/** Matriz personas × skills, filtrable por Team (visible a cualquier rol). */
export async function getCompetencyMatrix(
  input: GetCompetencyMatrixInput,
  client: PrismaClient = prismaClient(),
): Promise<CompetencyMatrix> {
  const members = await listMembers({ actorClerkUserId: input.actorClerkUserId }, client);
  const teamMemberIds = input.teamId
    ? new Set(
        (
          await listTeamAssignments(
            { actorClerkUserId: input.actorClerkUserId, teamId: input.teamId },
            client,
          )
        ).map((assignment) => assignment.memberId),
      )
    : null;

  const { skills, competencies } = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return { skills: await listSkills(tx), competencies: await listCompetencies(tx) };
    },
    client,
  );

  const rows = members
    .filter((member) => teamMemberIds === null || teamMemberIds.has(member.id))
    .map((member) => ({
      memberId: member.id,
      name: member.name,
      levels: Object.fromEntries(
        competencies
          .filter((competency) => competency.memberId === member.id)
          .map((competency) => [competency.skillId, competency.level]),
      ),
    }));

  return {
    skills: skills.map((skill) => ({ skillId: skill.id, name: skill.name })),
    rows,
  };
}
