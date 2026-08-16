"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createRitualAction,
  evaluateRitualStatusAction,
  generateOccurrencesAction,
  markHeldAction,
  recordBlockerAction,
  recordRetrospectiveAction,
  resolveBlockerAction,
  type RitualsFormState,
} from "./actions";

type Option = { id: string; label: string };

const initial: RitualsFormState = {};
const controlClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const CADENCES = [
  { value: "Weekly", label: "Semanal" },
  { value: "Biweekly", label: "Quincenal" },
  { value: "Monthly", label: "Mensual" },
] as const;

function FormFeedback({ state }: { state: RitualsFormState }) {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
      {state.error ?? state.success}
    </p>
  );
}

function TeamSelect({ id, options }: { id: string; options: Option[] }) {
  return (
    <select id={id} name="teamId" required className={controlClass}>
      <option value="">Elegí un team</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function CreateRitualForm({ teams }: { teams: Option[] }) {
  const [state, action, pending] = useActionState(createRitualAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Crear ceremonia</legend>
        <div className="space-y-1">
          <Label htmlFor="ritual-team">Team</Label>
          <TeamSelect id="ritual-team" options={teams} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ritual-name">Nombre</Label>
          <Input id="ritual-name" name="name" required maxLength={80} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="ritual-cadence">Cadencia</Label>
            <select id="ritual-cadence" name="cadence" className={controlClass}>
              {CADENCES.map((cadence) => (
                <option key={cadence.value} value={cadence.value}>
                  {cadence.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ritual-start">Fecha de inicio</Label>
            <Input id="ritual-start" name="startDate" type="date" required className="h-8" />
          </div>
        </div>
      </fieldset>
      <Button disabled={pending}>Crear ceremonia</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function ScheduleActions({ ritualId }: { ritualId: string }) {
  const [generateState, generateAction, generatePending] = useActionState(
    generateOccurrencesAction,
    initial,
  );
  const [evaluateState, evaluateAction, evaluatePending] = useActionState(
    evaluateRitualStatusAction,
    initial,
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={generateAction} className="space-y-1">
        <Input name="ritualId" type="hidden" value={ritualId} />
        <Button variant="outline" size="sm" disabled={generatePending}>
          Generar fechas
        </Button>
        <FormFeedback state={generateState} />
      </form>
      <form action={evaluateAction} className="space-y-1">
        <Input name="ritualId" type="hidden" value={ritualId} />
        <Button variant="outline" size="sm" disabled={evaluatePending}>
          Evaluar estado
        </Button>
        <FormFeedback state={evaluateState} />
      </form>
    </div>
  );
}

export function MarkHeldButton({ occurrenceId }: { occurrenceId: string }) {
  const [state, action, pending] = useActionState(markHeldAction, initial);
  return (
    <form action={action} className="space-y-1">
      <Input name="occurrenceId" type="hidden" value={occurrenceId} />
      <Button variant="secondary" size="sm" disabled={pending}>
        Marcar realizada
      </Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function RecordBlockerForm({
  teams,
  objectives,
}: {
  teams: Option[];
  objectives: Option[];
}) {
  const [state, action, pending] = useActionState(recordBlockerAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Registrar Blocker</legend>
        <div className="space-y-1">
          <Label htmlFor="blocker-team">Team</Label>
          <TeamSelect id="blocker-team" options={teams} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="blocker-title">Título</Label>
          <Input id="blocker-title" name="title" required maxLength={120} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="blocker-description">Descripción</Label>
          <Input id="blocker-description" name="description" maxLength={240} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="blocker-objective">Objective</Label>
          <select id="blocker-objective" name="objectiveId" className={controlClass}>
            <option value="">Sin objetivo asociado</option>
            {objectives.map((objective) => (
              <option key={objective.id} value={objective.id}>
                {objective.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      <Button disabled={pending}>Registrar Blocker</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function ResolveBlockerButton({ blockerId }: { blockerId: string }) {
  const [state, action, pending] = useActionState(resolveBlockerAction, initial);
  return (
    <form action={action} className="space-y-1">
      <Input name="blockerId" type="hidden" value={blockerId} />
      <Button variant="outline" size="sm" disabled={pending}>
        Resolver
      </Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function RecordRetrospectiveForm({ teams }: { teams: Option[] }) {
  const [state, action, pending] = useActionState(recordRetrospectiveAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Registrar retrospectiva</legend>
        <div className="space-y-1">
          <Label htmlFor="retro-team">Team</Label>
          <TeamSelect id="retro-team" options={teams} />
        </div>
      </fieldset>
      <Button disabled={pending}>Registrar retrospectiva</Button>
      <FormFeedback state={state} />
    </form>
  );
}
