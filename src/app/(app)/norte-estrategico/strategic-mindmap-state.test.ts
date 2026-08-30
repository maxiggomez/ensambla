import { describe, expect, it } from "vitest";

import type { StrategicMapView } from "../../../modules/strategy-northstar/application";

import {
  NORTH_STAR_NODE_ID,
  VISION_NODE_ID,
  allExpandedNodeIds,
  collapseAllNodeIds,
  initialExpandedNodeIds,
  pillarProgress,
  progressStatus,
  toggleNode,
} from "./strategic-mindmap-state";

const map: StrategicMapView = {
  strategy: { vision: "Visión", mission: null, values: [] },
  northStar: {
    name: "North Star",
    measurement: { type: "percentage", start: 0, target: 100, current: 50 },
    progress: 50,
    levers: [],
  },
  pillars: [
    {
      id: "pillar-one",
      name: "Pilar uno",
      description: null,
      objectives: [
        { id: "o1", title: "Uno", level: "Company", status: "Draft", progress: 20 },
        { id: "o2", title: "Dos", level: "Company", status: "Draft", progress: 80 },
      ],
    },
    { id: "pillar-empty", name: "Vacío", description: null, objectives: [] },
  ],
  unassignedObjectives: [],
};

describe("strategic mind-map state", () => {
  it("uses the approved semantic status boundaries", () => {
    expect(progressStatus(39).label).toBe("En riesgo");
    expect(progressStatus(40).label).toBe("Atención");
    expect(progressStatus(69).label).toBe("Atención");
    expect(progressStatus(70).label).toBe("En curso");
  });

  it("derives pillar progress as the arithmetic mean of child objectives", () => {
    expect(pillarProgress(map.pillars[0])).toBe(50);
    expect(pillarProgress(map.pillars[1])).toBeNull();
  });

  it("initializes the visible top and collapses all while preserving it", () => {
    expect([...initialExpandedNodeIds()]).toEqual([VISION_NODE_ID, NORTH_STAR_NODE_ID]);
    expect([...collapseAllNodeIds()]).toEqual([VISION_NODE_ID]);
  });

  it("expands every node with children and toggles immutable sets", () => {
    expect([...allExpandedNodeIds(map)]).toEqual([
      VISION_NODE_ID,
      NORTH_STAR_NODE_ID,
      "pillar:pillar-one",
    ]);

    const initial = initialExpandedNodeIds();
    const collapsed = toggleNode(initial, NORTH_STAR_NODE_ID);
    expect(initial.has(NORTH_STAR_NODE_ID)).toBe(true);
    expect(collapsed.has(NORTH_STAR_NODE_ID)).toBe(false);
    expect(toggleNode(collapsed, NORTH_STAR_NODE_ID).has(NORTH_STAR_NODE_ID)).toBe(true);
  });
});
