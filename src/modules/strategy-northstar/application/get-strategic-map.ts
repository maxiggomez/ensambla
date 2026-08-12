import { prismaClient, type PrismaClient } from "../../../shared/db";
import {
  measurementFromColumns,
  progress,
  type Measurement,
} from "../../../shared/measurement";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listObjectives, type ObjectiveView } from "../../okrs/application";
import type { ObjectiveLevel, ObjectiveStatus } from "../../okrs/application";
import { findStrategyStatements, type StrategyColumns } from "../infrastructure/strategy-repo";
import { findNorthStar } from "../infrastructure/north-star-repo";
import { listLevers } from "../infrastructure/lever-repo";
import { listPillarsWithLinks } from "../infrastructure/pillar-repo";

export interface GetStrategicMapInput {
  actorClerkUserId: string;
}

export interface StrategicMapItem {
  id: string;
  title: string;
  level: ObjectiveLevel;
  status: ObjectiveStatus;
  /** 🔒 Derivado por roll-up de okrs; nunca persistido. */
  progress: number;
}

export interface LeverMapView {
  id: string;
  name: string;
  objective: StrategicMapItem | null;
}

export interface NorthStarMapView {
  name: string;
  measurement: Measurement;
  progress: number;
  levers: LeverMapView[];
}

export interface PillarMapView {
  id: string;
  name: string;
  description: string | null;
  objectives: StrategicMapItem[];
}

export interface StrategicMapView {
  strategy: StrategyColumns;
  northStar: NorthStarMapView | null;
  pillars: PillarMapView[];
  unassignedObjectives: StrategicMapItem[];
}

/** La cascada Vision → North Star → Pillars → OKRs con progreso real derivado
 * (roll-up 🔒). El progreso viene de `okrs` por su interfaz pública. */
export async function getStrategicMap(
  input: GetStrategicMapInput,
  client: PrismaClient = prismaClient(),
): Promise<StrategicMapView> {
  const objectives = await listObjectives({ actorClerkUserId: input.actorClerkUserId }, client);

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const [strategy, northStarRow, pillars, levers] = await Promise.all([
        findStrategyStatements(tx, actor.organizationId),
        findNorthStar(tx, actor.organizationId),
        listPillarsWithLinks(tx, actor.organizationId),
        listLevers(tx, actor.organizationId),
      ]);

      const byId = new Map(objectives.map((objective) => [objective.id, objective]));

      const northStar = northStarRow
        ? (() => {
            const measurement = measurementFromColumns({
              measurementType: northStarRow.measurementType,
              startValue:
                northStarRow.startValue === null ? null : Number(northStarRow.startValue),
              targetValue:
                northStarRow.targetValue === null ? null : Number(northStarRow.targetValue),
              currentValue:
                northStarRow.currentValue === null ? null : Number(northStarRow.currentValue),
              checkDone: northStarRow.checkDone,
              textState: northStarRow.textState,
            });
            return {
              name: northStarRow.name,
              measurement,
              progress: progress(measurement),
              levers: levers.map((lever) => ({
                id: lever.id,
                name: lever.name,
                objective: lever.objectiveId ? toItem(byId.get(lever.objectiveId)) : null,
              })),
            };
          })()
        : null;

      const assignedObjectiveIds = new Set(
        pillars.flatMap((pillar) => pillar.objectiveLinks.map((link) => link.objectiveId)),
      );

      const pillarViews: PillarMapView[] = pillars.map((pillar) => ({
        id: pillar.id,
        name: pillar.name,
        description: pillar.description,
        objectives: pillar.objectiveLinks
          .map((link) => toItem(byId.get(link.objectiveId)))
          .filter((objective): objective is StrategicMapItem => objective !== null),
      }));

      const unassignedObjectives = objectives
        .filter((objective) => !assignedObjectiveIds.has(objective.id))
        .map((objective) => toItem(objective)!);

      return {
        strategy,
        northStar,
        pillars: pillarViews,
        unassignedObjectives,
      };
    },
    client,
  );
}

function toItem(objective: ObjectiveView | undefined): StrategicMapItem | null {
  if (!objective) return null;
  return {
    id: objective.id,
    title: objective.title,
    level: objective.level,
    status: objective.status,
    progress: objective.progress,
  };
}
