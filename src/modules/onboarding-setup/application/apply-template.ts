import {
  acquireOrganizationStructureLock,
  prismaClient,
  type PrismaClient,
} from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { organizationId } from "../../../shared/ids";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { isTemplateOkrTargetEmpty, materializeTemplateOkrs } from "../../okrs/application";
import {
  isTemplateSkillTargetEmpty,
  materializeTemplateSkills,
} from "../../skills-matrix/application";
import {
  isTemplateNorthStarTargetEmpty,
  materializeTemplateNorthStar,
} from "../../strategy-northstar/application";
import {
  isTemplateTeamTargetEmpty,
  materializeTemplateTeams,
} from "../../teams-staffing/application";
import { applySetupTemplate } from "../domain/setup-progress";
import { onboardingTemplate, type OnboardingTemplateKey } from "../domain/template-catalog";
import { compareAndSetSetup, findSetup } from "../infrastructure/setup-repo";
import { setupViewOf, type OnboardingSetupView } from "./onboarding-setup";

export interface ApplyOnboardingTemplateInput {
  actorClerkUserId: string;
  templateKey: OnboardingTemplateKey;
}

function applicationError(code: string, message: string): ApplicationError {
  return new ApplicationError(`onboarding-setup/${code}`, message);
}

export async function applyOnboardingTemplate(
  input: ApplyOnboardingTemplateInput,
  client: PrismaClient = prismaClient(),
): Promise<OnboardingSetupView> {
  const template = onboardingTemplate(input.templateKey);

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const tenantId = organizationId(actor.organizationId);
      if (!canEditOrganization(actor.role)) {
        throw applicationError("forbidden", "Only Dirección can apply onboarding templates");
      }
      await acquireOrganizationStructureLock(tx, tenantId);
      const row = await findSetup(tx, actor.organizationId);
      if (!row) {
        throw applicationError("not-found", "Onboarding setup has not been started");
      }

      const current = setupViewOf(row);
      const next = applySetupTemplate(current, input.templateKey);
      if (next === current) return current;

      // Reserve the setup row first. A concurrent confirmation blocks on this CAS;
      // every later check/write remains in the same transaction and rolls back together.
      const changed = await compareAndSetSetup(tx, actor.organizationId, current, next);
      if (!changed) {
        const latestRow = await findSetup(tx, actor.organizationId);
        if (latestRow) {
          const latest = setupViewOf(latestRow);
          if (applySetupTemplate(latest, input.templateKey) === latest) {
            return latest;
          }
        }
        throw applicationError("stale-transition", "Onboarding setup changed concurrently");
      }

      const targetsAreEmpty =
        (await isTemplateTeamTargetEmpty(tx)) &&
        (await isTemplateNorthStarTargetEmpty(tx)) &&
        (await isTemplateOkrTargetEmpty(tx)) &&
        (await isTemplateSkillTargetEmpty(tx));
      if (!targetsAreEmpty) {
        throw applicationError(
          "template-target-not-empty",
          "Template targets must be empty before applying a template",
        );
      }

      await materializeTemplateTeams(tx, tenantId, template.teams);
      await materializeTemplateNorthStar(tx, tenantId, template.northStar);
      await materializeTemplateOkrs(tx, tenantId, actor.id, template.objectives);
      await materializeTemplateSkills(tx, tenantId, template.skills);

      return setupViewOf(changed);
    },
    client,
  );
}
