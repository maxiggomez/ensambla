"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  configureMinimumResponsesAction,
  configurePulseScheduleAction,
  launchPulseAction,
  type CultureFormState,
} from "./actions";

type TeamOption = { teamId: string; name: string };

function Feedback({ state }: { state: CultureFormState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm font-bold text-risk">
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p role="status" className="text-sm font-bold text-ok">
        {state.success}
      </p>
    );
  return null;
}

export function LaunchForm({ teams }: { teams: TeamOption[] }) {
  const [state, action, pending] = useActionState(launchPulseAction, {});
  return (
    <form action={action} className="space-y-3">
      <Label htmlFor="teamId">Alcance</Label>
      <select
        id="teamId"
        name="teamId"
        className="h-9 w-full rounded-sm border border-input bg-card px-3 text-sm"
      >
        <option value="">Toda la organización</option>
        {teams.map((team) => (
          <option key={team.teamId} value={team.teamId}>
            {team.name}
          </option>
        ))}
      </select>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Lanzando…" : "Lanzar pulso"} <span aria-hidden>↗</span>
      </Button>
    </form>
  );
}

export function ThresholdForm({ minimumResponses }: { minimumResponses: number }) {
  const [state, action, pending] = useActionState(configureMinimumResponsesAction, {});
  return (
    <form action={action} className="space-y-3">
      <Label htmlFor="minimumResponses">N mínimo para mostrar resultados</Label>
      <Input
        id="minimumResponses"
        name="minimumResponses"
        type="number"
        min={4}
        max={100}
        defaultValue={minimumResponses}
        required
      />
      <Feedback state={state} />
      <Button variant="outline" type="submit" disabled={pending}>
        Guardar umbral
      </Button>
    </form>
  );
}

export function ScheduleForm() {
  const [state, action, pending] = useActionState(configurePulseScheduleAction, {});
  return (
    <form action={action} className="space-y-3">
      <Label htmlFor="frequency">Frecuencia</Label>
      <select
        id="frequency"
        name="frequency"
        className="h-9 w-full rounded-sm border border-input bg-card px-3 text-sm"
        defaultValue="monthly"
      >
        <option value="weekly">Semanal</option>
        <option value="monthly">Mensual</option>
        <option value="quarterly">Trimestral</option>
      </select>
      <Label htmlFor="nextRunAt">Próxima ejecución</Label>
      <Input id="nextRunAt" name="nextRunAt" type="datetime-local" required />
      <Feedback state={state} />
      <Button variant="outline" type="submit" disabled={pending}>
        Configurar recurrencia
      </Button>
    </form>
  );
}
