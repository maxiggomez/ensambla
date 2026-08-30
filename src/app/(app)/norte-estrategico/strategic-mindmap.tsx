"use client";

import { ChevronRight, Minus, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { StrategicMapView } from "../../../modules/strategy-northstar/application";
import {
  NORTH_STAR_NODE_ID,
  VISION_NODE_ID,
  allExpandedNodeIds,
  collapseAllNodeIds,
  initialExpandedNodeIds,
  pillarNodeId,
  pillarProgress,
  progressStatus,
  toggleNode,
} from "./strategic-mindmap-state";

type PillarMapView = StrategicMapView["pillars"][number];
type ObjectiveMapView = PillarMapView["objectives"][number];
type NodeTone = "vision" | "north-star" | "pillar" | "objective" | "unassigned";

const NODE_TONES: Record<NodeTone, string> = {
  vision: "border-deep bg-deep text-card",
  "north-star": "border-brand-2 bg-brand text-ink",
  pillar: "border-border bg-card text-card-foreground",
  objective: "border-border bg-card text-card-foreground",
  unassigned: "border-dashed border-warn bg-warn-soft text-card-foreground",
};

function childLabel(count: number): string {
  return `${count} ${count === 1 ? "hijo oculto" : "hijos ocultos"}`;
}

function Progress({ value }: { value: number }) {
  const bounded = Math.min(100, Math.max(0, Math.round(value)));
  const status = progressStatus(bounded);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={status.badgeVariant}>
          <span aria-hidden>{status.symbol}</span> {status.label}
        </Badge>
        <span className="text-sm font-extrabold">{bounded}%</span>
      </div>
      <div
        aria-label={`Progreso: ${bounded}%, ${status.label}`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={bounded}
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        <span
          aria-hidden
          className={`block h-full rounded-full ${status.barClassName}`}
          style={{ width: `${bounded}%` }}
        />
      </div>
    </div>
  );
}

function MapNode({
  children,
  description,
  hiddenChildren,
  kind,
  label,
  nodeId,
  onToggle,
  open,
  progress,
  title,
  toggleName,
  tone,
}: {
  children?: ReactNode;
  description?: string | null;
  hiddenChildren?: number;
  kind: string;
  label: string;
  nodeId?: string;
  onToggle?: () => void;
  open?: boolean;
  progress?: number | null;
  title: string;
  toggleName?: string;
  tone: NodeTone;
}) {
  const accessibleName = toggleName ?? label;
  const toggleLabel = nodeId
    ? open
      ? `Contraer ${accessibleName}`
      : `Expandir ${accessibleName}${hiddenChildren ? `, ${childLabel(hiddenChildren)}` : ""}`
    : undefined;

  return (
    <article
      className={`relative w-[224px] shrink-0 rounded-xl border p-4 shadow-sm ${NODE_TONES[tone]}`}
      data-node-kind={kind}
    >
      <p className="text-[11px] font-extrabold tracking-[0.13em] uppercase opacity-65">
        {label}
      </p>
      <p className="mt-1 line-clamp-3 text-sm font-extrabold leading-snug">{title}</p>
      {description ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed opacity-70">{description}</p>
      ) : null}
      {progress === null || progress === undefined ? null : <Progress value={progress} />}
      {!open && hiddenChildren ? (
        <p className="mt-3 text-xs font-bold opacity-70">{childLabel(hiddenChildren)}</p>
      ) : null}
      {children}
      {nodeId && onToggle ? (
        <button
          aria-controls={`${nodeId}-children`}
          aria-expanded={open}
          aria-label={toggleLabel}
          className="absolute top-1/2 -right-3 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-transform motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={onToggle}
          type="button"
        >
          <ChevronRight
            aria-hidden
            className={`size-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}
    </article>
  );
}

function Connector({ long = false }: { long?: boolean }) {
  return <span aria-hidden className={`h-px shrink-0 bg-line ${long ? "w-12" : "w-8"}`} />;
}

function ObjectiveNode({
  objective,
  unassigned = false,
}: {
  objective: ObjectiveMapView;
  unassigned?: boolean;
}) {
  return (
    <MapNode
      kind={unassigned ? "unassigned-objective" : "objective"}
      label={unassigned ? "Sin pilar" : "Objetivo"}
      progress={objective.progress}
      title={objective.title}
      tone={unassigned ? "unassigned" : "objective"}
    />
  );
}

function PillarBranch({
  expanded,
  onToggle,
  pillar,
}: {
  expanded: boolean;
  onToggle: () => void;
  pillar: PillarMapView;
}) {
  const nodeId = pillarNodeId(pillar.id);
  const hasObjectives = pillar.objectives.length > 0;

  return (
    <li className="flex items-center">
      <Connector />
      <MapNode
        description={pillar.description}
        hiddenChildren={pillar.objectives.length}
        kind="pillar"
        label="Pilar"
        nodeId={hasObjectives ? nodeId : undefined}
        onToggle={hasObjectives ? onToggle : undefined}
        open={hasObjectives ? expanded : undefined}
        progress={pillarProgress(pillar)}
        title={pillar.name}
        toggleName={`pilar ${pillar.name}`}
        tone="pillar"
      >
        {!hasObjectives ? (
          <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            Sin objetivos asignados
          </p>
        ) : null}
      </MapNode>
      {hasObjectives && expanded ? (
        <>
          <Connector />
          <ul
            aria-label={`Objetivos de ${pillar.name}`}
            className="space-y-4 border-l border-line py-1"
            id={`${nodeId}-children`}
          >
            {pillar.objectives.map((objective) => (
              <li className="flex items-center" key={objective.id}>
                <Connector />
                <ObjectiveNode objective={objective} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </li>
  );
}

export function StrategicMindmap({ map }: { map: StrategicMapView }) {
  const [expanded, setExpanded] = useState<Set<string>>(initialExpandedNodeIds);
  const visionOpen = expanded.has(VISION_NODE_ID);
  const northStarOpen = expanded.has(NORTH_STAR_NODE_ID);
  const directChildren = map.pillars.length + map.unassignedObjectives.length;
  const hasNorthStar = map.northStar !== null;

  const toggle = (nodeId: string) => setExpanded((current) => toggleNode(current, nodeId));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span aria-hidden>↔</span> Desplazá horizontalmente para explorar la cascada.
        </p>
        <div className="flex gap-2" aria-label="Controles del mapa">
          <Button
            onClick={() => setExpanded(allExpandedNodeIds(map))}
            size="sm"
            variant="outline"
          >
            <Plus aria-hidden /> Expandir todo
          </Button>
          <Button onClick={() => setExpanded(collapseAllNodeIds())} size="sm" variant="outline">
            <Minus aria-hidden /> Contraer todo
          </Button>
        </div>
      </div>

      <section
        aria-label="Mapa estratégico interactivo"
        className="max-w-full overflow-x-auto rounded-xl border border-border bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        tabIndex={0}
      >
        <div className="flex min-h-[330px] min-w-max items-center px-8 py-10 pr-16">
          <MapNode
            hiddenChildren={hasNorthStar ? 1 : 0}
            kind="vision"
            label="Visión"
            nodeId={hasNorthStar ? VISION_NODE_ID : undefined}
            onToggle={hasNorthStar ? () => toggle(VISION_NODE_ID) : undefined}
            open={hasNorthStar ? visionOpen : undefined}
            title={map.strategy.vision ?? "Visión sin definir"}
            tone="vision"
          />

          {hasNorthStar && visionOpen ? (
            <div className="flex items-center" id={`${VISION_NODE_ID}-children`}>
              <Connector long />
              <MapNode
                hiddenChildren={directChildren}
                kind="north-star"
                label="North Star"
                nodeId={directChildren ? NORTH_STAR_NODE_ID : undefined}
                onToggle={directChildren ? () => toggle(NORTH_STAR_NODE_ID) : undefined}
                open={directChildren ? northStarOpen : undefined}
                progress={map.northStar?.progress}
                title={map.northStar?.name ?? "North Star sin definir"}
                tone="north-star"
              />

              {directChildren > 0 && northStarOpen ? (
                <div className="flex items-center" id={`${NORTH_STAR_NODE_ID}-children`}>
                  <Connector long />
                  <ul
                    aria-label="Ramas estratégicas"
                    className="space-y-5 border-l border-line py-1"
                  >
                    {map.pillars.map((pillar) => (
                      <PillarBranch
                        expanded={expanded.has(pillarNodeId(pillar.id))}
                        key={pillar.id}
                        onToggle={() => toggle(pillarNodeId(pillar.id))}
                        pillar={pillar}
                      />
                    ))}
                    {map.unassignedObjectives.map((objective) => (
                      <li className="flex items-center" key={objective.id}>
                        <Connector />
                        <ObjectiveNode objective={objective} unassigned />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {!hasNorthStar ? (
        <p className="rounded-lg bg-brand-soft px-4 py-3 text-sm">
          Definí la estrategia y la North Star desde el detalle para completar el mapa.
        </p>
      ) : null}
      {hasNorthStar && directChildren === 0 ? (
        <p className="rounded-lg bg-brand-soft px-4 py-3 text-sm">
          Creá pilares o asigná objetivos desde el detalle para extender la cascada.
        </p>
      ) : null}

      <div
        aria-label="Umbrales de estado"
        className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"
      >
        <span>
          <strong className="text-foreground">✓ En curso ≥ 70%</strong>
        </span>
        <span>
          <strong className="text-foreground">! Atención 40–69%</strong>
        </span>
        <span>
          <strong className="text-foreground">× En riesgo &lt; 40%</strong>
        </span>
      </div>
    </div>
  );
}
