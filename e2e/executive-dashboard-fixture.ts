import { giveFeedback } from "../src/modules/feedback-growth/application";
import { listMembers } from "../src/modules/identity-org/application";
import { launchPulse } from "../src/modules/culture-enps/application";
import { assignTeamMember, createTeam } from "../src/modules/teams-staffing/application";
import { prismaClient, withTenant } from "../src/shared/db";
import type { OrganizationId } from "../src/shared/ids";

const TEAM_NAME = "Team Dashboard E2E";
const PRIVATE_BODY = "Contenido privado que el dashboard agregado no muestra";

async function setup(): Promise<void> {
  const client = prismaClient();
  try {
    const members = await listMembers({ actorClerkUserId: "dev_direccion" }, client);
    const leader = members.find((member) => member.clerkUserId === "dev_lider");
    const collaborator = members.find((member) => member.clerkUserId === "dev_colaborador");
    if (!leader || !collaborator) throw new Error("Missing dev dashboard members");

    const { teamId } = await createTeam(
      {
        actorClerkUserId: "dev_direccion",
        name: TEAM_NAME,
        description: "Fixture aislado del dashboard",
      },
      client,
    );
    await assignTeamMember(
      {
        actorClerkUserId: "dev_direccion",
        teamId,
        memberId: leader.id,
        role: "Lead",
        capacityPercent: 100,
      },
      client,
    );
    await assignTeamMember(
      {
        actorClerkUserId: "dev_direccion",
        teamId,
        memberId: collaborator.id,
        role: "Contributor",
        capacityPercent: 20,
      },
      client,
    );
    await giveFeedback(
      {
        actorClerkUserId: "dev_direccion",
        recipientMemberId: leader.id,
        body: PRIVATE_BODY,
        classification: "strength",
      },
      client,
    );
    await launchPulse(
      { actorClerkUserId: "dev_direccion", scope: { type: "team", teamId } },
      client,
    );
  } finally {
    await client.$disconnect();
  }
}

async function cleanup(): Promise<void> {
  const client = prismaClient();
  try {
    const members = await listMembers({ actorClerkUserId: "dev_direccion" }, client);
    const direction = members.find((member) => member.clerkUserId === "dev_direccion");
    if (!direction) return;
    await withTenant(
      direction.organizationId as OrganizationId,
      async (tx) => {
        const teams = await tx.team.findMany({
          where: { name: TEAM_NAME },
          select: { id: true },
        });
        const teamIds = teams.map((team) => team.id);
        const pulses = await tx.pulse.findMany({
          where: { teamId: { in: teamIds } },
          select: { id: true },
        });
        const pulseIds = pulses.map((pulse) => pulse.id);
        await tx.pulseParticipation.deleteMany({ where: { pulseId: { in: pulseIds } } });
        await tx.pulseResponse.deleteMany({ where: { pulseId: { in: pulseIds } } });
        await tx.pulse.deleteMany({ where: { id: { in: pulseIds } } });
        await tx.feedback.deleteMany({ where: { body: PRIVATE_BODY } });
        await tx.teamMember.deleteMany({ where: { teamId: { in: teamIds } } });
        await tx.team.deleteMany({ where: { id: { in: teamIds } } });
      },
      client,
    );
  } finally {
    await client.$disconnect();
  }
}

async function main(): Promise<void> {
  const action = process.argv[2];
  if (action === "setup") await setup();
  else if (action === "cleanup") await cleanup();
  else throw new Error("Expected executive-dashboard fixture action: setup | cleanup");
}

void main();
