import { DomainError } from "../../../shared/errors";

export interface GrowthTargetInput {
  skillId: string;
  targetLevel: number;
}

export interface GrowthPlanInput {
  nextMilestone: string;
  targets: GrowthTargetInput[];
}

export interface ParsedGrowthPlan {
  nextMilestone: string;
  targets: GrowthTargetInput[];
}

export interface GrowthTargetProgress extends GrowthTargetInput {
  currentLevel: number;
  gap: number;
}

export interface GrowthProgress {
  progress: number;
  targets: GrowthTargetProgress[];
}

export function parseGrowthPlan(input: GrowthPlanInput): ParsedGrowthPlan {
  const nextMilestone = input.nextMilestone.trim();
  const targets = input.targets.map((target) => ({
    skillId: target.skillId.trim(),
    targetLevel: target.targetLevel,
  }));
  const skillIds = new Set(targets.map((target) => target.skillId));
  const invalidTarget = targets.some(
    (target) =>
      !target.skillId ||
      !Number.isInteger(target.targetLevel) ||
      target.targetLevel < 0 ||
      target.targetLevel > 4,
  );

  if (
    !nextMilestone ||
    targets.length === 0 ||
    skillIds.size !== targets.length ||
    invalidTarget
  ) {
    throw new DomainError(
      "feedback-growth/invalid-growth-plan",
      "GrowthPlan requires a milestone and unique Skill targets from zero to four",
    );
  }

  return { nextMilestone, targets };
}

export function deriveGrowthProgress(
  targets: readonly GrowthTargetInput[],
  currentLevels: Readonly<Record<string, number>>,
): GrowthProgress {
  const progressTargets = targets.map((target) => {
    const currentLevel = currentLevels[target.skillId] ?? 0;
    return {
      ...target,
      currentLevel,
      gap: Math.max(target.targetLevel - currentLevel, 0),
    };
  });
  const nonZeroTargets = progressTargets.filter((target) => target.targetLevel > 0);
  const progress =
    nonZeroTargets.length === 0
      ? 100
      : Math.round(
          (nonZeroTargets.reduce(
            (sum, target) => sum + Math.min(target.currentLevel / target.targetLevel, 1),
            0,
          ) /
            nonZeroTargets.length) *
            100,
        );

  return { progress, targets: progressTargets };
}
