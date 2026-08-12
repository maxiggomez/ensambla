"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { addInputLeverAction } from "./actions";
import { FormFeedback } from "./form-feedback";

type ObjectiveOption = { id: string; title: string };

export function LeverForm({ objectives }: { objectives: ObjectiveOption[] }) {
  const [state, action, pending] = useActionState(addInputLeverAction, {});
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="lever-name">Nombre del lever</Label>
        <Input id="lever-name" name="name" placeholder="p. ej. Leads calificados" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lever-objective">Objetivo vinculado (opcional)</Label>
        <select
          id="lever-objective"
          name="objectiveId"
          className="h-9 w-full rounded-sm border border-input bg-card px-3 text-sm"
        >
          <option value="">Sin vínculo</option>
          {objectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.title}
            </option>
          ))}
        </select>
      </div>
      <FormFeedback state={state} />
      <Button variant="outline" type="submit" disabled={pending}>
        {pending ? "Agregando…" : "Agregar lever"}
      </Button>
    </form>
  );
}
