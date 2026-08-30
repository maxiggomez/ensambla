"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function CollapsibleSection({
  children,
  id,
  onToggle,
  open,
  title,
}: {
  children: ReactNode;
  id: string;
  onToggle: () => void;
  open: boolean;
  title: string;
}) {
  const contentId = `${id}-content`;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <h2>
        <button
          aria-controls={contentId}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-xl font-extrabold transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          onClick={onToggle}
          type="button"
        >
          {title}
          <ChevronDown
            aria-hidden
            className={`size-5 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h2>
      {open ? (
        <div className="border-t border-border p-5" id={contentId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

const SECTION_IDS = ["strategy", "north-star", "pillars"] as const;
type SectionId = (typeof SECTION_IDS)[number];

export function StrategyDetailSections({
  northStar,
  pillars,
  strategy,
}: {
  northStar: ReactNode;
  pillars: ReactNode;
  strategy: ReactNode;
}) {
  const [openSections, setOpenSections] = useState<Set<SectionId>>(() => new Set());
  const toggle = (id: SectionId) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section aria-labelledby="detail-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold tracking-[0.13em] text-muted-foreground uppercase">
            Configuración
          </p>
          <h2 id="detail-title" className="text-2xl">
            Detalle estratégico
          </h2>
        </div>
        <div aria-label="Controles del detalle" className="flex gap-2">
          <Button
            onClick={() => setOpenSections(new Set(SECTION_IDS))}
            size="sm"
            variant="outline"
          >
            <Plus aria-hidden /> Expandir todo
          </Button>
          <Button onClick={() => setOpenSections(new Set())} size="sm" variant="outline">
            <Minus aria-hidden /> Contraer todo
          </Button>
        </div>
      </div>
      <CollapsibleSection
        id="strategy"
        onToggle={() => toggle("strategy")}
        open={openSections.has("strategy")}
        title="Estrategia"
      >
        {strategy}
      </CollapsibleSection>
      <CollapsibleSection
        id="north-star"
        onToggle={() => toggle("north-star")}
        open={openSections.has("north-star")}
        title="North Star"
      >
        {northStar}
      </CollapsibleSection>
      <CollapsibleSection
        id="pillars"
        onToggle={() => toggle("pillars")}
        open={openSections.has("pillars")}
        title="Pilares"
      >
        {pillars}
      </CollapsibleSection>
    </section>
  );
}
