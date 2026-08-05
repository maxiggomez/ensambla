import { DomainError } from "../../../shared/errors";
import { measurementSchema, type Measurement } from "../../../shared/measurement";

import { parseDriver, type Driver } from "./driver";

export interface AnonymousPulseResponse {
  rating: Extract<Measurement, { type: "integer" }>;
  driver: Driver;
  comment: string | null;
}

export function createPulseResponse(input: {
  score: number;
  driver: string;
  comment?: string;
}): AnonymousPulseResponse {
  const parsed = measurementSchema.safeParse({
    type: "integer",
    start: 0,
    target: 10,
    current: input.score,
  });
  if (
    !parsed.success ||
    parsed.data.type !== "integer" ||
    input.score < 0 ||
    input.score > 10
  ) {
    throw new DomainError(
      "culture-enps/invalid-score",
      "eNPS score must be an integer from 0 to 10",
    );
  }

  const comment = input.comment?.trim() || null;
  if (comment !== null && comment.length > 2_000) {
    throw new DomainError(
      "culture-enps/comment-too-long",
      "Comment cannot exceed 2000 characters",
    );
  }

  return {
    rating: parsed.data,
    driver: parseDriver(input.driver),
    comment,
  };
}
