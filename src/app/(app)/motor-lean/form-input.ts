import { z } from "zod";

const requiredString = z.string().trim().min(1);
const finiteNumber = requiredString.transform((value, context) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    context.addIssue({ code: "custom", message: "Expected a finite number" });
    return z.NEVER;
  }
  return number;
});
const validDate = requiredString.transform((value, context) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    context.addIssue({ code: "custom", message: "Expected a valid date" });
    return z.NEVER;
  }
  return date;
});

function fields(
  formData: FormData,
  names: readonly string[],
): Record<string, FormDataEntryValue | null> {
  return Object.fromEntries(names.map((name) => [name, formData.get(name)]));
}

const createExperimentSchema = z.object({
  keyResultId: requiredString,
  belief: requiredString,
  expectedOutcome: requiredString,
});

const experimentIdentitySchema = z.object({ experimentId: requiredString });

const measuringSchema = z.discriminatedUnion("measurementType", [
  experimentIdentitySchema.extend({
    measurementType: z.literal("check"),
    checkDone: z.boolean(),
    cutoffAt: validDate,
  }),
  experimentIdentitySchema.extend({
    measurementType: z.literal("text"),
    textState: z.enum(["not_started", "in_progress", "done"]),
    cutoffAt: validDate,
  }),
  ...(["percentage", "integer", "currency"] as const).map((measurementType) =>
    experimentIdentitySchema.extend({
      measurementType: z.literal(measurementType),
      start: finiteNumber,
      target: finiteNumber,
      current: finiteNumber,
      cutoffAt: validDate,
    }),
  ),
]);

const closeExperimentSchema = experimentIdentitySchema.extend({
  believed: requiredString,
  tested: requiredString,
  learned: requiredString,
  decision: z.enum(["persevere", "pivot"]),
});

export function parseCreateExperimentForm(formData: FormData) {
  return createExperimentSchema.parse(
    fields(formData, ["keyResultId", "belief", "expectedOutcome"]),
  );
}

export function parseExperimentIdentityForm(formData: FormData) {
  return experimentIdentitySchema.parse(fields(formData, ["experimentId"]));
}

export function parseStartMeasuringForm(formData: FormData) {
  const values = fields(formData, [
    "experimentId",
    "measurementType",
    "start",
    "target",
    "current",
    "textState",
    "cutoffAt",
  ]);
  return measuringSchema.parse({ ...values, checkDone: formData.get("checkDone") === "on" });
}

export function parseCloseExperimentForm(formData: FormData) {
  return closeExperimentSchema.parse(
    fields(formData, ["experimentId", "believed", "tested", "learned", "decision"]),
  );
}
