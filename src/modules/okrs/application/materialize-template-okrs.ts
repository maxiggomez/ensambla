import { randomUUID } from "node:crypto";

import type { TenantClient } from "../../../shared/db";
import type { OrganizationId } from "../../../shared/ids";
import type { Measurement } from "../../../shared/measurement";
import { toMeasurement, type KeyResultValues } from "../domain/key-result";
import { objectiveTitle } from "../domain/objective";
import { insertAuditEvent } from "../infrastructure/audit-repo";
import { insertKeyResult } from "../infrastructure/key-result-repo";
import { countObjectives, insertObjective } from "../infrastructure/objective-repo";

export interface TemplateObjectiveInput {
  readonly title: string;
  readonly keyResults: readonly {
    readonly title: string;
    readonly measurement: Measurement;
  }[];
}

export async function isTemplateOkrTargetEmpty(tx: TenantClient): Promise<boolean> {
  return (await countObjectives(tx)) === 0;
}

function valuesOf(measurement: Measurement): KeyResultValues {
  switch (measurement.type) {
    case "check":
      return { measurementType: "check", checkDone: measurement.done };
    case "text":
      return { measurementType: "text", textState: measurement.state };
    case "percentage":
    case "integer":
    case "currency":
      return {
        measurementType: measurement.type,
        startValue: measurement.start,
        targetValue: measurement.target,
        currentValue: measurement.current,
      };
  }
}

export async function materializeTemplateOkrs(
  tx: TenantClient,
  organizationId: OrganizationId,
  actorMemberId: string,
  objectives: readonly TemplateObjectiveInput[],
): Promise<void> {
  const validated = objectives.map((objective) => ({
    title: objectiveTitle(objective.title),
    keyResults: objective.keyResults.map((keyResult) => {
      const values = valuesOf(keyResult.measurement);
      toMeasurement(values);
      return { title: objectiveTitle(keyResult.title), values };
    }),
  }));

  for (const objective of validated) {
    const objectiveId = randomUUID();
    await insertObjective(tx, {
      id: objectiveId,
      organizationId,
      title: objective.title,
      level: "Company",
      ownerId: actorMemberId,
    });
    await insertAuditEvent(tx, {
      organizationId,
      actorMemberId,
      action: "OBJECTIVE_CREATED",
      entityType: "Objective",
      entityId: objectiveId,
      metadata: { level: "Company", source: "onboarding-template" },
    });

    for (const keyResult of objective.keyResults) {
      const keyResultId = randomUUID();
      await insertKeyResult(tx, {
        id: keyResultId,
        organizationId,
        objectiveId,
        title: keyResult.title,
        ...keyResult.values,
      });
      await insertAuditEvent(tx, {
        organizationId,
        actorMemberId,
        action: "KEY_RESULT_ADDED",
        entityType: "KeyResult",
        entityId: keyResultId,
        metadata: {
          objectiveId,
          measurementType: keyResult.values.measurementType,
          source: "onboarding-template",
        },
      });
    }
  }
}
