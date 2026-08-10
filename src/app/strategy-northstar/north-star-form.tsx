"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { defineNorthStarAction } from "./actions";
import { FormFeedback } from "./form-feedback";

type MeasurementKind = "check" | "percentage" | "integer" | "currency" | "text";

const KIND_LABELS: Record<MeasurementKind, string> = {
  check: "Check (hecho / pendiente)",
  percentage: "Porcentaje",
  integer: "Entero",
  currency: "Moneda",
  text: "Hito (texto)",
};

export function NorthStarForm() {
  const [state, action, pending] = useActionState(defineNorthStarAction, {});
  const [kind, setKind] = useState<MeasurementKind>("percentage");

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="ns-name">Nombre de la North Star</Label>
        <Input id="ns-name" name="name" placeholder="p. ej. ARR" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ns-kind">Tipo de medición</Label>
        <select
          id="ns-kind"
          name="measurementType"
          className="h-9 w-full rounded-sm border border-input bg-card px-3 text-sm"
          value={kind}
          onChange={(event) => setKind(event.target.value as MeasurementKind)}
        >
          {Object.entries(KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {kind === "check" ? (
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="done" className="size-4 accent-lime" />
          Marcada como hecha
        </label>
      ) : null}

      {kind === "text" ? (
        <div className="space-y-2">
          <Label htmlFor="ns-state">Estado</Label>
          <select
            id="ns-state"
            name="textState"
            defaultValue="not_started"
            className="h-9 w-full rounded-sm border border-input bg-card px-3 text-sm"
          >
            <option value="not_started">No iniciada</option>
            <option value="in_progress">En curso</option>
            <option value="done">Completa</option>
          </select>
        </div>
      ) : null}

      {kind === "percentage" || kind === "integer" || kind === "currency" ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="ns-start">Base</Label>
            <Input id="ns-start" name="start" type="number" step="any" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ns-target">Objetivo</Label>
            <Input id="ns-target" name="target" type="number" step="any" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ns-current">Actual</Label>
            <Input id="ns-current" name="current" type="number" step="any" required />
          </div>
        </div>
      ) : null}

      <FormFeedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Definir North Star"}
      </Button>
    </form>
  );
}
