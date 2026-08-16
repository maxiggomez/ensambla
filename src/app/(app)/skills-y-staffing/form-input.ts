import { z } from "zod";

const requiredText = z.string().trim().min(1);

function text(formData: FormData, name: string): string | null {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry : null;
}

export function parseDefineSkillForm(formData: FormData) {
  return z.object({ name: requiredText }).parse({ name: text(formData, "name") });
}

export function parseRenameSkillForm(formData: FormData) {
  return z
    .object({ skillId: requiredText, name: requiredText })
    .parse({ skillId: text(formData, "skillId"), name: text(formData, "name") });
}

export function parseSetCompetencyForm(formData: FormData) {
  return z
    .object({
      memberId: requiredText,
      skillId: requiredText,
      level: z.coerce.number().int().min(0).max(4),
    })
    .parse({
      memberId: text(formData, "memberId"),
      skillId: text(formData, "skillId"),
      level: text(formData, "level"),
    });
}

export function parseSetSeniorityForm(formData: FormData) {
  return z
    .object({
      memberId: requiredText,
      seniority: z.enum(["Junior", "SemiSenior", "Senior"]),
    })
    .parse({
      memberId: text(formData, "memberId"),
      seniority: text(formData, "seniority"),
    });
}

export function parseAddSkillRequirementForm(formData: FormData) {
  return z
    .object({
      skillId: requiredText,
      needType: z.enum(["project", "keyResult"]),
      needId: requiredText,
    })
    .parse({
      skillId: text(formData, "skillId"),
      needType: text(formData, "needType"),
      needId: text(formData, "needId"),
    });
}
