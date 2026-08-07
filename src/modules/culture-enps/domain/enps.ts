import { DomainError } from "../../../shared/errors";
import type { Measurement } from "../../../shared/measurement";

import { DEFAULT_MINIMUM_RESPONSES, parseMinimumResponses } from "./minimum-responses";

type IntegerMeasurement = Extract<Measurement, { type: "integer" }>;
type PercentageMeasurement = Extract<Measurement, { type: "percentage" }>;

export interface SuppressedEnpsResult {
  status: "suppressed";
  minimumResponses: number;
}

export interface VisibleEnpsResult {
  status: "visible";
  score: IntegerMeasurement;
  participation: PercentageMeasurement;
  promoters: PercentageMeasurement;
  passives: PercentageMeasurement;
  detractors: PercentageMeasurement;
}

export type EnpsResult = SuppressedEnpsResult | VisibleEnpsResult;

export function calculateEnps(input: {
  ratings: IntegerMeasurement[];
  recipientCount: number;
  minimumResponses?: number;
}): EnpsResult {
  const minimumResponses = parseMinimumResponses(
    input.minimumResponses ?? DEFAULT_MINIMUM_RESPONSES,
  );
  if (input.ratings.length < minimumResponses) {
    return { status: "suppressed", minimumResponses };
  }
  if (!Number.isInteger(input.recipientCount) || input.recipientCount < input.ratings.length) {
    throw new DomainError(
      "culture-enps/invalid-recipient-count",
      "Recipient count cannot be lower than response count",
    );
  }

  const scores = input.ratings.map(validateRating);
  const total = scores.length;
  const promoters = scores.filter((score) => score >= 9).length;
  const passives = scores.filter((score) => score >= 7 && score <= 8).length;
  const detractors = scores.filter((score) => score <= 6).length;

  return {
    status: "visible",
    score: integerMetric(-100, 100, Math.round(((promoters - detractors) / total) * 100)),
    participation: percentageMetric(Math.round((total / input.recipientCount) * 100)),
    promoters: percentageMetric(Math.round((promoters / total) * 100)),
    passives: percentageMetric(Math.round((passives / total) * 100)),
    detractors: percentageMetric(Math.round((detractors / total) * 100)),
  };
}

function validateRating(rating: IntegerMeasurement): number {
  if (
    rating.type !== "integer" ||
    rating.start !== 0 ||
    rating.target !== 10 ||
    !Number.isInteger(rating.current) ||
    rating.current < 0 ||
    rating.current > 10
  ) {
    throw new DomainError("culture-enps/invalid-score", "Invalid stored eNPS rating");
  }
  return rating.current;
}

function integerMetric(start: number, target: number, current: number): IntegerMeasurement {
  return { type: "integer", start, target, current };
}

function percentageMetric(current: number): PercentageMeasurement {
  return { type: "percentage", start: 0, target: 100, current };
}
