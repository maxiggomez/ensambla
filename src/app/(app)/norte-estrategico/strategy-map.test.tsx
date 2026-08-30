import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { StrategicMapView } from "../../../modules/strategy-northstar/application";

import { StrategicMap } from "./strategy-map";

const map: StrategicMapView = {
  strategy: {
    vision: "Pymes de LATAM operando con foco",
    mission: "Alinear estrategia y ejecución",
    values: ["Claridad"],
  },
  northStar: {
    name: "Pymes activas",
    measurement: { type: "percentage", start: 0, target: 100, current: 42 },
    progress: 42,
    levers: [],
  },
  pillars: [
    {
      id: "pillar-growth",
      name: "Crecimiento",
      description: "Expandir el negocio",
      objectives: [
        {
          id: "objective-partners",
          title: "Consolidar el canal de partners",
          level: "Company",
          status: "Published",
          progress: 63,
        },
      ],
    },
  ],
  unassignedObjectives: [
    {
      id: "objective-quality",
      title: "Mejorar la calidad operativa",
      level: "Area",
      status: "Draft",
      progress: 15,
    },
  ],
};

describe("StrategicMap", () => {
  it("shows Vision, North Star and their direct children, with pillar objectives collapsed", () => {
    const html = renderToStaticMarkup(<StrategicMap map={map} />);

    expect(html).toContain('aria-label="Mapa estratégico interactivo"');
    expect(html).toContain("Pymes de LATAM operando con foco");
    expect(html).toContain("Pymes activas");
    expect(html).toContain("Crecimiento");
    expect(html).toContain("Mejorar la calidad operativa");
    expect(html).not.toContain("Consolidar el canal de partners");
    expect(html).toContain('aria-label="Contraer Visión"');
    expect(html).toContain('aria-label="Contraer North Star"');
    expect(html).toContain('aria-label="Expandir pilar Crecimiento, 1 hijo oculto"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("renders semantic progress, thresholds and a distinguished unassigned objective", () => {
    const html = renderToStaticMarkup(<StrategicMap map={map} />);

    expect(html).toContain("Atención");
    expect(html).toContain("En riesgo");
    expect(html).toContain("En curso ≥ 70%");
    expect(html).toContain("Atención 40–69%");
    expect(html).toContain("En riesgo &lt; 40%");
    expect(html).toContain('data-node-kind="unassigned-objective"');
    expect(html).toContain("Sin pilar");
    expect(html).toContain('role="progressbar"');
  });

  it("keeps the map read-only", () => {
    const html = renderToStaticMarkup(<StrategicMap map={map} />);

    expect(html).not.toContain("Guardar estrategia");
    expect(html).not.toContain("Nueva North Star");
    expect(html).not.toContain("Nuevo lever");
    expect(html).not.toContain("Crear pilar");
    expect(html).not.toContain("Asignar objetivo");
  });

  it("renders a useful empty state without breaking the root", () => {
    const emptyMap: StrategicMapView = {
      strategy: { vision: null, mission: null, values: [] },
      northStar: null,
      pillars: [],
      unassignedObjectives: [],
    };
    const html = renderToStaticMarkup(<StrategicMap map={emptyMap} />);

    expect(html).toContain("Visión sin definir");
    expect(html).toContain("Definí la estrategia y la North Star desde el detalle");
    expect(html).not.toContain("undefined");
  });

  it("guides an empty cascade and identifies pillars without objectives", () => {
    const emptyCascadeHtml = renderToStaticMarkup(
      <StrategicMap map={{ ...map, pillars: [], unassignedObjectives: [] }} />,
    );
    const emptyPillarHtml = renderToStaticMarkup(
      <StrategicMap
        map={{
          ...map,
          pillars: [{ ...map.pillars[0], objectives: [] }],
          unassignedObjectives: [],
        }}
      />,
    );

    expect(emptyCascadeHtml).toContain("Creá pilares o asigná objetivos");
    expect(emptyPillarHtml.match(/Sin objetivos asignados/g)).toHaveLength(1);
  });
});
