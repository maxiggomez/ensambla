import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KeyResultView, ObjectiveView, OkrCycleView } from "@/modules/okrs/application";

import {
  addKeyResultAction,
  archiveObjectiveAction,
  carryOverAction,
  closeObjectiveAction,
  configureCadenceAction,
  createCycleAction,
  createObjectiveAction,
  gradeKeyResultAction,
  linkParentAction,
  publishObjectiveAction,
  recordCheckInAction,
} from "./actions";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export interface OkrMemberOption {
  id: string;
  name: string;
}

export interface OkrTeamOption {
  id: string;
  name: string;
}

export function CreateObjectiveForm(props: {
  members: readonly OkrMemberOption[];
  teams: readonly OkrTeamOption[];
  cycles: readonly OkrCycleView[];
  objectives: readonly ObjectiveView[];
}) {
  return (
    <form action={createObjectiveAction} className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="objective-title">Título</Label>
        <Input
          id="objective-title"
          name="title"
          required
          placeholder="Ej. Acelerar expansión"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="objective-level">Nivel</Label>
        <select
          id="objective-level"
          name="level"
          className={selectClass}
          defaultValue="Company"
        >
          <option value="Company">Compañía</option>
          <option value="Area">Área</option>
          <option value="Team">Team</option>
          <option value="Person">Persona</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="objective-owner">Owner</Label>
        <select id="objective-owner" name="ownerMemberId" className={selectClass} required>
          {props.members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="objective-team">Team (solo nivel Team)</Label>
        <select id="objective-team" name="teamId" className={selectClass} defaultValue="">
          <option value="">Sin Team</option>
          {props.teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="objective-cycle">Ciclo</Label>
        <select id="objective-cycle" name="cycleId" className={selectClass} defaultValue="">
          <option value="">Sin ciclo</option>
          {props.cycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="objective-parent">Objetivo superior (Alineamiento)</Label>
        <select
          id="objective-parent"
          name="parentObjectiveId"
          className={selectClass}
          defaultValue=""
        >
          <option value="">Sin objetivo superior</option>
          {props.objectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.title}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" className="md:col-span-2">
        Crear objetivo ↗
      </Button>
    </form>
  );
}

export function CreateCycleForm() {
  return (
    <form action={createCycleAction} className="grid gap-3 md:grid-cols-3">
      <div className="space-y-1">
        <Label htmlFor="cycle-name">Nombre del ciclo</Label>
        <Input id="cycle-name" name="name" required placeholder="Q4 2026" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cycle-start">Inicio</Label>
        <Input id="cycle-start" name="startsAt" type="date" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cycle-end">Fin</Label>
        <Input id="cycle-end" name="endsAt" type="date" required />
      </div>
      <Button type="submit" variant="outline" className="md:col-span-3">
        Crear ciclo
      </Button>
    </form>
  );
}

export function AddKeyResultForm({ objectiveId }: { objectiveId: string }) {
  return (
    <form
      action={addKeyResultAction}
      className="grid gap-2 rounded-lg bg-muted/50 p-3 md:grid-cols-2"
    >
      <input type="hidden" name="objectiveId" value={objectiveId} />
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor={`kr-title-${objectiveId}`}>Nuevo Key Result</Label>
        <Input
          id={`kr-title-${objectiveId}`}
          name="title"
          required
          placeholder="Resultado medible"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`kr-type-${objectiveId}`}>Tipo de medición</Label>
        <select id={`kr-type-${objectiveId}`} name="measurementType" className={selectClass}>
          <option value="check">Check</option>
          <option value="percentage">Porcentaje</option>
          <option value="integer">Número entero</option>
          <option value="currency">Moneda</option>
          <option value="text">Texto / hito</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`kr-start-${objectiveId}`}>Valor inicial</Label>
          <Input id={`kr-start-${objectiveId}`} name="startValue" type="number" step="any" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`kr-target-${objectiveId}`}>Target</Label>
          <Input id={`kr-target-${objectiveId}`} name="targetValue" type="number" step="any" />
        </div>
      </div>
      <Button type="submit" variant="secondary" className="md:col-span-2">
        Agregar KR
      </Button>
    </form>
  );
}

export function ObjectiveControls(props: {
  objective: ObjectiveView;
  objectives: readonly ObjectiveView[];
  isDirection: boolean;
}) {
  const { objective } = props;
  return (
    <fieldset className="grid gap-3 border-t border-border pt-3">
      <legend className="px-1 text-xs font-extrabold tracking-[0.08em] uppercase">
        Gestión del objetivo
      </legend>
      {objective.status === "Draft" ? <AddKeyResultForm objectiveId={objective.id} /> : null}
      <div className="flex flex-wrap gap-2">
        {objective.status === "Draft" ? (
          <form action={publishObjectiveAction}>
            <input type="hidden" name="objectiveId" value={objective.id} />
            <Button type="submit">Publicar</Button>
          </form>
        ) : null}
        {objective.status === "Published" ? (
          <form action={configureCadenceAction} className="flex gap-2">
            <input type="hidden" name="objectiveId" value={objective.id} />
            <Label htmlFor={`cadence-${objective.id}`} className="sr-only">
              Cadencia
            </Label>
            <select
              id={`cadence-${objective.id}`}
              name="cadence"
              className={selectClass}
              defaultValue="Weekly"
            >
              <option value="Weekly">Semanal</option>
              <option value="Biweekly">Quincenal</option>
              <option value="Monthly">Mensual</option>
            </select>
            <Button type="submit" variant="outline">
              Cadencia
            </Button>
          </form>
        ) : null}
        <form action={linkParentAction} className="flex min-w-64 flex-1 gap-2">
          <input type="hidden" name="objectiveId" value={objective.id} />
          <Label htmlFor={`parent-${objective.id}`} className="sr-only">
            Alineamiento
          </Label>
          <select
            id={`parent-${objective.id}`}
            name="parentObjectiveId"
            className={selectClass}
            required
            defaultValue=""
          >
            <option value="" disabled>
              Alinear con…
            </option>
            {props.objectives
              .filter((item) => item.id !== objective.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
          </select>
          <Button type="submit" variant="outline">
            Alineamiento
          </Button>
        </form>
        {props.isDirection && objective.status === "Published" ? (
          <form action={closeObjectiveAction}>
            <input type="hidden" name="objectiveId" value={objective.id} />
            <Button type="submit" variant="destructive">
              Cerrar ciclo
            </Button>
          </form>
        ) : null}
      </div>
    </fieldset>
  );
}

export function KeyResultControls(props: {
  keyResult: KeyResultView;
  objectiveStatus: ObjectiveView["status"];
  cycles: readonly OkrCycleView[];
  isDirection: boolean;
}) {
  const { keyResult } = props;
  return (
    <div className="space-y-3 border-t border-border pt-3">
      {props.objectiveStatus === "Published" ? (
        <form action={recordCheckInAction} className="grid gap-2 md:grid-cols-2">
          <input type="hidden" name="keyResultId" value={keyResult.id} />
          <input type="hidden" name="measurementType" value={keyResult.measurementType} />
          <div className="space-y-1">
            <Label htmlFor={`value-${keyResult.id}`}>Valor del check-in</Label>
            {keyResult.measurementType === "check" ? (
              <select id={`value-${keyResult.id}`} name="value" className={selectClass}>
                <option value="false">Pendiente</option>
                <option value="true">Hecho</option>
              </select>
            ) : keyResult.measurementType === "text" ? (
              <select id={`value-${keyResult.id}`} name="value" className={selectClass}>
                <option value="not_started">Sin empezar</option>
                <option value="in_progress">En curso</option>
                <option value="done">Hecho</option>
              </select>
            ) : (
              <Input
                id={`value-${keyResult.id}`}
                name="value"
                type="number"
                step="any"
                required
              />
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`confidence-${keyResult.id}`}>Confianza (0–10)</Label>
            <Input
              id={`confidence-${keyResult.id}`}
              name="confidence"
              type="number"
              min="0"
              max="10"
              required
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor={`comment-${keyResult.id}`}>Comentario</Label>
            <Input id={`comment-${keyResult.id}`} name="comment" />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`link-${keyResult.id}`}>Evidencia (link HTTPS)</Label>
            <Input id={`link-${keyResult.id}`} name="evidenceUrl" type="url" />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`file-${keyResult.id}`}>Evidencia (archivo, máx. 5 MiB)</Label>
            <Input id={`file-${keyResult.id}`} name="fileEvidence" type="file" />
          </div>
          <Button type="submit" className="md:col-span-2">
            Registrar check-in
          </Button>
        </form>
      ) : null}
      {props.isDirection && props.objectiveStatus === "Published" ? (
        <form action={gradeKeyResultAction} className="flex gap-2">
          <input type="hidden" name="keyResultId" value={keyResult.id} />
          <Label htmlFor={`grade-${keyResult.id}`} className="sr-only">
            Calificación final
          </Label>
          <select id={`grade-${keyResult.id}`} name="grade" className={selectClass}>
            <option value="Achieved">Logrado</option>
            <option value="Partial">Parcial</option>
            <option value="NotAchieved">No logrado</option>
          </select>
          <Button type="submit" variant="outline">
            Calificar
          </Button>
        </form>
      ) : null}
      {props.isDirection && props.objectiveStatus === "Closed" && props.cycles.length > 0 ? (
        <form action={carryOverAction} className="flex gap-2">
          <input type="hidden" name="keyResultId" value={keyResult.id} />
          <Label htmlFor={`carry-${keyResult.id}`} className="sr-only">
            Ciclo destino
          </Label>
          <select
            id={`carry-${keyResult.id}`}
            name="destinationCycleId"
            className={selectClass}
          >
            {props.cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline">
            Trasladar al próximo ciclo
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function ArchiveObjectiveForm({ objectiveId }: { objectiveId: string }) {
  return (
    <form action={archiveObjectiveAction}>
      <input type="hidden" name="objectiveId" value={objectiveId} />
      <Button type="submit" variant="destructive">
        Archivar objetivo
      </Button>
    </form>
  );
}
