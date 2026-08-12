"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { defineStrategyAction } from "./actions";
import { FormFeedback } from "./form-feedback";

export function StrategyForm({
  defaultVision,
  defaultMission,
  defaultValues,
}: {
  defaultVision: string | null;
  defaultMission: string | null;
  defaultValues: string[];
}) {
  const [state, action, pending] = useActionState(defineStrategyAction, {});
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="vision">Visión</Label>
        <Input id="vision" name="vision" defaultValue={defaultVision ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mission">Misión</Label>
        <Input id="mission" name="mission" defaultValue={defaultMission ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="values">Valores</Label>
        <textarea
          id="values"
          name="values"
          rows={3}
          defaultValue={defaultValues.join("\n")}
          className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Un valor por línea"
        />
      </div>
      <FormFeedback state={state} />
      <Button variant="outline" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar estrategia"}
      </Button>
    </form>
  );
}
