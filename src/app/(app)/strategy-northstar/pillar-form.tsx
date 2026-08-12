"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { assignObjectiveToPillarAction, createStrategicPillarAction } from "./actions";
import { FormFeedback } from "./form-feedback";

type PillarOption = { id: string; name: string };
type ObjectiveOption = { id: string; title: string };

export function PillarForm() {
  const [state, action, pending] = useActionState(createStrategicPillarAction, {});
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="pillar-name">Nombre del pilar</Label>
        <Input id="pillar-name" name="name" placeholder="p. ej. Crecimiento" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pillar-description">Descripción (opcional)</Label>
        <Input id="pillar-description" name="description" />
      </div>
      <FormFeedback state={state} />
      <Button variant="outline" type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear pilar"}
      </Button>
    </form>
  );
}

export function AssignForm({
  pillars,
  objectives,
}: {
  pillars: PillarOption[];
  objectives: ObjectiveOption[];
}) {
  const [state, action, pending] = useActionState(assignObjectiveToPillarAction, {});
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="assign-pillar">Pilar</Label>
        <select
          id="assign-pillar"
          name="pillarId"
          required
          className="h-9 w-full rounded-sm border border-input bg-card px-3 text-sm"
        >
          <option value="">Elegí un pilar</option>
          {pillars.map((pillar) => (
            <option key={pillar.id} value={pillar.id}>
              {pillar.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="assign-objective">Objetivo</Label>
        <select
          id="assign-objective"
          name="objectiveId"
          required
          className="h-9 w-full rounded-sm border border-input bg-card px-3 text-sm"
        >
          <option value="">Elegí un objetivo</option>
          {objectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.title}
            </option>
          ))}
        </select>
      </div>
      <FormFeedback state={state} />
      <Button variant="outline" type="submit" disabled={pending}>
        {pending ? "Asignando…" : "Asignar al pilar"}
      </Button>
    </form>
  );
}
