"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  addGrowthEvidenceAction,
  closeProjectAction,
  defineGrowthPlanAction,
  giveFeedbackAction,
  giveKudoAction,
  requestFeedbackAction,
  type FeedbackGrowthFormState,
} from "./actions";

const initial: FeedbackGrowthFormState = {};
const controlClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const textareaClass =
  "min-h-20 w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Option = { id: string; label: string };

function FormFeedback({ state }: { state: FeedbackGrowthFormState }) {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground">
      {state.error ?? state.success}
    </p>
  );
}

function MemberSelect({
  name,
  id = name,
  members,
}: {
  id?: string;
  name: string;
  members: Option[];
}) {
  return (
    <select id={id} name={name} required className={controlClass}>
      <option value="">Elegí una persona</option>
      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {member.label}
        </option>
      ))}
    </select>
  );
}

export function RequestFeedbackForm({ members }: { members: Option[] }) {
  const [state, action, pending] = useActionState(requestFeedbackAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Solicitar Feedback</legend>
        <Label htmlFor="requestedFromMemberId">Pedírselo a</Label>
        <MemberSelect name="requestedFromMemberId" members={members} />
        <Label htmlFor="prompt">¿Sobre qué necesitás Feedback?</Label>
        <textarea id="prompt" name="prompt" required className={textareaClass} />
      </fieldset>
      <Button disabled={pending}>Solicitar Feedback</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function GiveFeedbackForm({
  members,
  projects,
  values,
  request,
}: {
  members: Option[];
  projects: Option[];
  values: string[];
  request?: { requestId: string; recipientMemberId: string; recipientLabel: string };
}) {
  const [state, action, pending] = useActionState(giveFeedbackAction, initial);
  const prefix = request?.requestId ?? "new";
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Dar Feedback privado</legend>
        {request ? <input type="hidden" name="requestId" value={request.requestId} /> : null}
        {request ? (
          <p className="text-sm">
            <span className="font-medium">Para:</span> {request.recipientLabel}
            <input type="hidden" name="recipientMemberId" value={request.recipientMemberId} />
          </p>
        ) : (
          <>
            <Label htmlFor={`recipient-${prefix}`}>Para</Label>
            <MemberSelect
              id={`recipient-${prefix}`}
              name="recipientMemberId"
              members={members}
            />
          </>
        )}
        <Label htmlFor={`feedback-body-${prefix}`}>Feedback</Label>
        <textarea
          id={`feedback-body-${prefix}`}
          name="body"
          required
          className={textareaClass}
        />
        <Label htmlFor={`classification-${prefix}`}>Clasificación</Label>
        <select id={`classification-${prefix}`} name="classification" className={controlClass}>
          <option value="strength">Fortaleza</option>
          <option value="improvement">Oportunidad de mejora</option>
        </select>
        <Label htmlFor={`project-${prefix}`}>Proyecto (opcional)</Label>
        <select id={`project-${prefix}`} name="projectId" className={controlClass}>
          <option value="">Sin proyecto</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.label}
            </option>
          ))}
        </select>
        <Label htmlFor={`feedback-value-${prefix}`}>Valor (opcional)</Label>
        <select id={`feedback-value-${prefix}`} name="value" className={controlClass}>
          <option value="">Sin valor</option>
          {values.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </fieldset>
      <Button disabled={pending}>{request ? "Responder solicitud" : "Enviar Feedback"}</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function GiveKudoForm({
  members,
  values,
  objectives,
  keyResults,
}: {
  members: Option[];
  values: string[];
  objectives: Option[];
  keyResults: Option[];
}) {
  const [state, action, pending] = useActionState(giveKudoAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Dar reconocimiento público</legend>
        <Label htmlFor="kudo-recipient">Reconocer a</Label>
        <select id="kudo-recipient" name="recipientMemberId" required className={controlClass}>
          <option value="">Elegí una persona</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
            </option>
          ))}
        </select>
        <Label htmlFor="kudo-message">Mensaje</Label>
        <textarea id="kudo-message" name="message" required className={textareaClass} />
        <Label htmlFor="kudo-value">Valor demostrado</Label>
        <select id="kudo-value" name="value" required className={controlClass}>
          <option value="">Elegí un valor</option>
          {values.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <Label htmlFor="kudo-objective">Objetivo (opcional)</Label>
        <select id="kudo-objective" name="objectiveId" className={controlClass}>
          <option value="">Sin objetivo</option>
          {objectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.label}
            </option>
          ))}
        </select>
        <Label htmlFor="kudo-key-result">Key Result (opcional)</Label>
        <select id="kudo-key-result" name="keyResultId" className={controlClass}>
          <option value="">Sin Key Result</option>
          {keyResults.map((keyResult) => (
            <option key={keyResult.id} value={keyResult.id}>
              {keyResult.label}
            </option>
          ))}
        </select>
      </fieldset>
      <Button disabled={pending}>Publicar reconocimiento</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function GrowthPlanForm({
  skills,
  nextMilestone,
  targets,
}: {
  skills: Option[];
  nextMilestone?: string;
  targets?: Record<string, number>;
}) {
  const [state, action, pending] = useActionState(defineGrowthPlanAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Definir plan de crecimiento</legend>
        <Label htmlFor="nextMilestone">Próximo hito</Label>
        <Input id="nextMilestone" name="nextMilestone" defaultValue={nextMilestone} required />
        {skills.map((skill) => (
          <div key={skill.id} className="grid grid-cols-[1fr_5rem] items-center gap-3">
            <input type="hidden" name="skillId" value={skill.id} />
            <Label htmlFor={`target-${skill.id}`}>{skill.label}</Label>
            <select
              id={`target-${skill.id}`}
              name="targetLevel"
              defaultValue={targets?.[skill.id] ?? 0}
              className={controlClass}
            >
              {[0, 1, 2, 3, 4].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        ))}
      </fieldset>
      <Button disabled={pending || skills.length === 0}>Guardar plan</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function EvidenceForm({
  source,
  options,
}: {
  source: "feedback" | "project";
  options: Option[];
}) {
  const [state, action, pending] = useActionState(addGrowthEvidenceAction, initial);
  const field = source === "feedback" ? "feedbackId" : "projectId";
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="source" value={source} />
      <div className="min-w-48 flex-1 space-y-2">
        <Label htmlFor={`evidence-${source}`}>
          {source === "feedback" ? "Feedback recibido" : "Proyecto cerrado"}
        </Label>
        <select id={`evidence-${source}`} name={field} required className={controlClass}>
          <option value="">Elegí evidencia</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Button disabled={pending || options.length === 0}>Agregar</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function CloseProjectForm({ project }: { project: Option }) {
  const [state, action, pending] = useActionState(closeProjectAction, initial);
  return (
    <form action={action} className="flex items-center justify-between gap-3">
      <input type="hidden" name="projectId" value={project.id} />
      <span className="text-sm">{project.label}</span>
      <Button variant="outline" disabled={pending}>
        Cerrar proyecto
      </Button>
      <FormFeedback state={state} />
    </form>
  );
}
