"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { submitPulseResponseAction, type CultureFormState } from "./actions";

const DRIVER_OPTIONS = [
  ["Recognition", "Reconocimiento"],
  ["GoalClarity", "Claridad de objetivos"],
  ["CareerGrowth", "Desarrollo de carrera"],
  ["Workload", "Carga de trabajo"],
  ["Coordination", "Coordinación"],
  ["Other", "Otro"],
] as const;

export function ResponseForm({ pulseId }: { pulseId: string }) {
  const [state, action, pending] = useActionState<CultureFormState, FormData>(
    submitPulseResponseAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="pulseId" value={pulseId} />
      <fieldset className="space-y-3">
        <legend className="font-bold">
          ¿Qué tan probable es que recomiendes trabajar acá?
        </legend>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, score) => (
            <label key={score} className="cursor-pointer">
              <input
                className="peer sr-only"
                type="radio"
                name="score"
                value={score}
                required
              />
              <span className="flex size-9 items-center justify-center rounded-sm border bg-card font-bold peer-checked:border-brand-2 peer-checked:bg-brand peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                {score}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-between text-xs font-bold text-muted-foreground">
          <span>Nada probable</span>
          <span>Muy probable</span>
        </div>
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor={`driver-${pulseId}`}>¿Qué influyó más?</Label>
        <select
          id={`driver-${pulseId}`}
          name="driver"
          required
          className="h-9 w-full rounded-sm border border-input bg-card px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Elegí un tema</option>
          {DRIVER_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`comment-${pulseId}`}>Comentario opcional</Label>
        <textarea
          id={`comment-${pulseId}`}
          name="comment"
          maxLength={2000}
          rows={3}
          className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Contanos qué ayudaría a mejorar"
        />
      </div>
      <p className="rounded-sm bg-brand-soft px-3 py-2 text-sm">
        Tu respuesta es <strong>anónima</strong>. Nadie puede ver tu respuesta individual.
      </p>
      {state.error ? (
        <p role="alert" className="rounded-sm bg-risk-soft px-3 py-2 text-risk">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enviando…" : "Enviar respuesta anónima"} <span aria-hidden>↗</span>
      </Button>
    </form>
  );
}
