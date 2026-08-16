import { z } from "zod";

const requiredText = z.string().trim().min(1);
const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

function text(formData: FormData, name: string): string | null {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry : null;
}

export function parseCreateTeamForm(formData: FormData) {
  return z
    .object({ name: requiredText, description: optionalText.nullable() })
    .parse({ name: text(formData, "name"), description: text(formData, "description") });
}

export function parseUpdateTeamForm(formData: FormData) {
  return z
    .object({ teamId: requiredText, name: requiredText, description: optionalText.nullable() })
    .parse({
      teamId: text(formData, "teamId"),
      name: text(formData, "name"),
      description: text(formData, "description"),
    });
}

export function parseAssignTeamMemberForm(formData: FormData) {
  return z
    .object({
      teamId: requiredText,
      memberId: requiredText,
      role: z.enum(["Lead", "Contributor"]),
      capacityPercent: z.coerce.number().int().min(0).max(100),
    })
    .parse({
      teamId: text(formData, "teamId"),
      memberId: text(formData, "memberId"),
      role: text(formData, "role"),
      capacityPercent: text(formData, "capacityPercent"),
    });
}

export function parseCreateProjectForm(formData: FormData) {
  return z.object({ name: requiredText }).parse({ name: text(formData, "name") });
}

export function parseLinkProjectForm(formData: FormData) {
  return z.object({ projectId: requiredText, objectiveId: requiredText }).parse({
    projectId: text(formData, "projectId"),
    objectiveId: text(formData, "objectiveId"),
  });
}

export function parseProjectIdentityForm(formData: FormData) {
  return z
    .object({ projectId: requiredText })
    .parse({ projectId: text(formData, "projectId") });
}
