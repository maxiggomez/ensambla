import type { StrategicMapView } from "../../../modules/strategy-northstar/application";

export const VISION_NODE_ID = "vision";
export const NORTH_STAR_NODE_ID = "north-star";

type PillarMapView = StrategicMapView["pillars"][number];

export type ProgressStatus = {
  label: "En curso" | "Atención" | "En riesgo";
  symbol: "✓" | "!" | "×";
  badgeVariant: "ok" | "warn" | "risk";
  barClassName: string;
};

export function progressStatus(progress: number): ProgressStatus {
  if (progress >= 70) {
    return { label: "En curso", symbol: "✓", badgeVariant: "ok", barClassName: "bg-ok" };
  }
  if (progress >= 40) {
    return {
      label: "Atención",
      symbol: "!",
      badgeVariant: "warn",
      barClassName: "bg-warn",
    };
  }
  return {
    label: "En riesgo",
    symbol: "×",
    badgeVariant: "risk",
    barClassName: "bg-risk",
  };
}

export function pillarProgress(pillar: PillarMapView): number | null {
  if (pillar.objectives.length === 0) return null;
  const total = pillar.objectives.reduce((sum, objective) => sum + objective.progress, 0);
  return Math.round(total / pillar.objectives.length);
}

export function pillarNodeId(pillarId: string): string {
  return `pillar:${pillarId}`;
}

export function initialExpandedNodeIds(): Set<string> {
  return new Set([VISION_NODE_ID, NORTH_STAR_NODE_ID]);
}

export function collapseAllNodeIds(): Set<string> {
  return new Set([VISION_NODE_ID]);
}

export function allExpandedNodeIds(map: StrategicMapView): Set<string> {
  return new Set([
    VISION_NODE_ID,
    NORTH_STAR_NODE_ID,
    ...map.pillars
      .filter((pillar) => pillar.objectives.length > 0)
      .map((pillar) => pillarNodeId(pillar.id)),
  ]);
}

export function toggleNode(current: ReadonlySet<string>, nodeId: string): Set<string> {
  const next = new Set(current);
  if (next.has(nodeId)) next.delete(nodeId);
  else next.add(nodeId);
  return next;
}
