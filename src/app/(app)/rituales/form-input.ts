import { z } from "zod";

const requiredText = z.string().trim().min(1);

function text(formData: FormData, name: string): string | null {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry : null;
}

export function parseCreateRitualForm(formData: FormData) {
  return z
    .object({
      teamId: requiredText,
      name: requiredText,
      cadence: z.string(),
      startDate: z.string(),
    })
    .parse({
      teamId: text(formData, "teamId"),
      name: text(formData, "name"),
      cadence: text(formData, "cadence"),
      startDate: text(formData, "startDate"),
    });
}

export function parseGenerateOccurrencesForm(formData: FormData) {
  return z.object({ ritualId: requiredText }).parse({ ritualId: text(formData, "ritualId") });
}

export function parseEvaluateRitualStatusForm(formData: FormData) {
  return z.object({ ritualId: requiredText }).parse({ ritualId: text(formData, "ritualId") });
}

export function parseMarkHeldForm(formData: FormData) {
  return z
    .object({ occurrenceId: requiredText })
    .parse({ occurrenceId: text(formData, "occurrenceId") });
}

export function parseRecordBlockerForm(formData: FormData) {
  return z
    .object({
      teamId: requiredText,
      title: requiredText,
      description: z.string().optional(),
      objectiveId: z.string().optional(),
    })
    .parse({
      teamId: text(formData, "teamId"),
      title: text(formData, "title"),
      description: text(formData, "description") ?? undefined,
      objectiveId: text(formData, "objectiveId") ?? undefined,
    });
}

export function parseResolveBlockerForm(formData: FormData) {
  return z
    .object({ blockerId: requiredText })
    .parse({ blockerId: text(formData, "blockerId") });
}

export function parseRecordRetrospectiveForm(formData: FormData) {
  return z.object({ teamId: requiredText }).parse({ teamId: text(formData, "teamId") });
}
