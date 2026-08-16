"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  addSkillRequirementAction,
  defineSkillAction,
  renameSkillAction,
  setCompetencyAction,
  setSeniorityAction,
  type SkillsFormState,
} from "./actions";

export const SENIORITY_OPTIONS = ["Junior", "SemiSenior", "Senior"] as const;

type Option = { id: string; label: string };

const initial: SkillsFormState = {};
const controlClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function FormFeedback({ state }: { state: SkillsFormState }) {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
      {state.error ?? state.success}
    </p>
  );
}

export function DefineSkillForm() {
  const [state, action, pending] = useActionState(defineSkillAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Definir skill</legend>
        <Label htmlFor="skill-name">Nombre de la skill</Label>
        <Input id="skill-name" name="name" required maxLength={80} />
      </fieldset>
      <Button disabled={pending}>Definir skill</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function RenameSkillForm({ skill }: { skill: { skillId: string; name: string } }) {
  const [state, action, pending] = useActionState(renameSkillAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Renombrar skill</legend>
        <Input name="skillId" type="hidden" value={skill.skillId} />
        <Label htmlFor={`rename-${skill.skillId}`}>Renombrar a</Label>
        <Input
          id={`rename-${skill.skillId}`}
          name="name"
          defaultValue={skill.name}
          required
          maxLength={80}
        />
      </fieldset>
      <Button variant="outline" disabled={pending}>
        Renombrar
      </Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function CompetencyCell({
  memberId,
  skillId,
  skillName,
  level,
  editable,
}: {
  memberId: string;
  skillId: string;
  skillName: string;
  level: number | null;
  editable: boolean;
}) {
  const [state, action] = useActionState(setCompetencyAction, initial);
  if (!editable) {
    return <td className="px-3 py-2 text-center tabular-nums">{level ?? "–"}</td>;
  }
  return (
    <td className="px-3 py-2">
      <form action={action} className="space-y-1">
        <Input name="memberId" type="hidden" value={memberId} />
        <Input name="skillId" type="hidden" value={skillId} />
        <Label htmlFor={`level-${memberId}-${skillId}`} className="sr-only">
          {`Nivel ${skillName}`}
        </Label>
        <select
          id={`level-${memberId}-${skillId}`}
          name="level"
          defaultValue={level ?? ""}
          aria-label={`Nivel ${skillName}`}
          className={controlClass}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="">–</option>
          {[0, 1, 2, 3, 4].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <FormFeedback state={state} />
      </form>
    </td>
  );
}

export function SetSeniorityForm({
  members,
}: {
  members: Array<{ id: string; name: string; seniority: string | null }>;
}) {
  const [state, action, pending] = useActionState(setSeniorityAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Seniority</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="seniority-member">Persona</Label>
            <select id="seniority-member" name="memberId" required className={controlClass}>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="seniority-value">Seniority</Label>
            <select id="seniority-value" name="seniority" required className={controlClass}>
              <option value="">Elegí una seniority</option>
              {SENIORITY_OPTIONS.map((seniority) => (
                <option key={seniority} value={seniority}>
                  {seniority}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>
      <Button disabled={pending}>Guardar seniority</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function AddSkillRequirementForm({
  needType,
  needId,
  skills,
}: {
  needType: "project" | "keyResult";
  needId: string;
  skills: Option[];
}) {
  const [state, action, pending] = useActionState(addSkillRequirementAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Registrar skill requerido</legend>
        <Input name="needType" type="hidden" value={needType} />
        <Input name="needId" type="hidden" value={needId} />
        <Label htmlFor="requirement-skill">Skill</Label>
        <select id="requirement-skill" name="skillId" required className={controlClass}>
          <option value="">Elegí una skill</option>
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.label}
            </option>
          ))}
        </select>
      </fieldset>
      <Button disabled={pending}>Registrar requisito</Button>
      <FormFeedback state={state} />
    </form>
  );
}
