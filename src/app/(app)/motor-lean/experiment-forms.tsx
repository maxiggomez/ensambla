"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createExperimentAction,
  startBuildingAction,
  startMeasuringAction,
  closeExperimentAction,
  type LeanFormState,
} from "./actions";

const initial: LeanFormState = {};
function Feedback({ state }: { state: LeanFormState }) {
  return (
    <p aria-live="polite" className="text-sm">
      {state.error ?? state.success}
    </p>
  );
}

export function CreateExperimentForm({
  keyResults,
}: {
  keyResults: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(createExperimentAction, initial);
  return (
    <form
      action={action}
      className="grid gap-3 rounded-2xl border border-line bg-card p-5 md:grid-cols-2"
    >
      <label htmlFor="keyResultId">KeyResult</label>
      <select id="keyResultId" name="keyResultId" required className="rounded-sm border p-2">
        <option value="">Elegí un KR</option>
        {keyResults.map((kr) => (
          <option key={kr.id} value={kr.id}>
            {kr.label}
          </option>
        ))}
      </select>
      <label htmlFor="belief">Creemos que</label>
      <Input id="belief" name="belief" required />
      <label htmlFor="expectedOutcome">Esperamos</label>
      <Input id="expectedOutcome" name="expectedOutcome" required />
      <Button disabled={pending}>Crear hipótesis</Button>
      <Feedback state={state} />
    </form>
  );
}
export function BuildForm({ experimentId }: { experimentId: string }) {
  const [state, action, pending] = useActionState(startBuildingAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="experimentId" value={experimentId} />
      <Button disabled={pending}>Empezar a construir</Button>
      <Feedback state={state} />
    </form>
  );
}
export function MeasureForm({ experimentId }: { experimentId: string }) {
  const [state, action, pending] = useActionState(startMeasuringAction, initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="experimentId" value={experimentId} />
      <label htmlFor={`type-${experimentId}`}>Tipo de métrica</label>
      <select id={`type-${experimentId}`} name="measurementType">
        <option value="percentage">Porcentaje</option>
        <option value="integer">Número</option>
        <option value="currency">Moneda</option>
        <option value="check">Check</option>
        <option value="text">Texto/Hito</option>
      </select>
      <label htmlFor={`start-${experimentId}`}>Inicial</label>
      <Input id={`start-${experimentId}`} name="start" type="number" defaultValue="0" />
      <label htmlFor={`target-${experimentId}`}>Meta</label>
      <Input id={`target-${experimentId}`} name="target" type="number" defaultValue="100" />
      <label htmlFor={`current-${experimentId}`}>Actual</label>
      <Input id={`current-${experimentId}`} name="current" type="number" defaultValue="0" />
      <label htmlFor={`cutoff-${experimentId}`}>Fecha de corte</label>
      <Input id={`cutoff-${experimentId}`} name="cutoffAt" type="date" required />
      <input type="checkbox" name="checkDone" aria-label="Check completado" />
      <select name="textState" aria-label="Estado del hito">
        <option value="not_started">Sin empezar</option>
        <option value="in_progress">En curso</option>
        <option value="done">Hecho</option>
      </select>
      <Button disabled={pending}>Empezar a medir</Button>
      <Feedback state={state} />
    </form>
  );
}
export function CloseForm({ experimentId }: { experimentId: string }) {
  const [state, action, pending] = useActionState(closeExperimentAction, initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="experimentId" value={experimentId} />
      {[
        ["believed", "Creíamos"],
        ["tested", "Probamos"],
        ["learned", "Aprendimos"],
      ].map(([name, label]) => (
        <span key={name} className="block">
          <label htmlFor={`${name}-${experimentId}`}>{label}</label>
          <Input id={`${name}-${experimentId}`} name={name} required />
        </span>
      ))}
      <label htmlFor={`decision-${experimentId}`}>Decisión</label>
      <select id={`decision-${experimentId}`} name="decision">
        <option value="persevere">Perseverar</option>
        <option value="pivot">Pivotar</option>
      </select>
      <Button disabled={pending}>Cerrar experimento</Button>
      <Feedback state={state} />
    </form>
  );
}
