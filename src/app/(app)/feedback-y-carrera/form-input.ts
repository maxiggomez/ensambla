import { z } from "zod";

const requiredText = z.string().trim().min(1);
const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

function value(formData: FormData, name: string): FormDataEntryValue | null {
  return formData.get(name);
}

function text(formData: FormData, name: string): string | null {
  const entry = value(formData, name);
  return typeof entry === "string" ? entry : null;
}

const feedbackSchema = z.object({
  recipientMemberId: requiredText,
  body: requiredText,
  classification: z.enum(["strength", "improvement"]),
  projectId: optionalText,
  value: optionalText,
  requestId: optionalText,
});

export function parseGiveFeedbackForm(formData: FormData) {
  return feedbackSchema.parse({
    recipientMemberId: text(formData, "recipientMemberId"),
    body: text(formData, "body"),
    classification: text(formData, "classification"),
    projectId: text(formData, "projectId") ?? "",
    value: text(formData, "value") ?? "",
    requestId: text(formData, "requestId") ?? "",
  });
}

const requestSchema = z.object({
  requestedFromMemberId: requiredText,
  prompt: requiredText,
});

export function parseRequestFeedbackForm(formData: FormData) {
  return requestSchema.parse({
    requestedFromMemberId: text(formData, "requestedFromMemberId"),
    prompt: text(formData, "prompt"),
  });
}

const kudoSchema = z
  .object({
    recipientMemberId: requiredText,
    message: requiredText,
    value: requiredText,
    objectiveId: optionalText,
    keyResultId: optionalText,
  })
  .refine((input) => !(input.objectiveId && input.keyResultId), {
    message: "Elegí un Objective o un KeyResult, no ambos",
  });

export function parseGiveKudoForm(formData: FormData) {
  return kudoSchema.parse({
    recipientMemberId: text(formData, "recipientMemberId"),
    message: text(formData, "message"),
    value: text(formData, "value"),
    objectiveId: text(formData, "objectiveId") ?? "",
    keyResultId: text(formData, "keyResultId") ?? "",
  });
}

const targetSchema = z.object({
  skillId: requiredText,
  targetLevel: z.coerce.number().int().min(0).max(4),
});

export function parseGrowthPlanForm(formData: FormData) {
  const skillIds = formData.getAll("skillId");
  const targetLevels = formData.getAll("targetLevel");
  if (skillIds.length !== targetLevels.length) throw new Error("Invalid Growth targets");
  return z
    .object({ nextMilestone: requiredText, targets: z.array(targetSchema).min(1) })
    .parse({
      nextMilestone: text(formData, "nextMilestone"),
      targets: skillIds.map((skillId, index) => ({
        skillId,
        targetLevel: targetLevels[index],
      })),
    });
}

const evidenceSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("feedback"), feedbackId: requiredText }),
  z.object({ source: z.literal("project"), projectId: requiredText }),
]);

export function parseGrowthEvidenceForm(formData: FormData) {
  const source = text(formData, "source");
  return evidenceSchema.parse(
    source === "feedback"
      ? { source, feedbackId: text(formData, "feedbackId") }
      : { source, projectId: text(formData, "projectId") },
  );
}

export function parseProjectIdentityForm(formData: FormData) {
  return z
    .object({ projectId: requiredText })
    .parse({ projectId: text(formData, "projectId") });
}
