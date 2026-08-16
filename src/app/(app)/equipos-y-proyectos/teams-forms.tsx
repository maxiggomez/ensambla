"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  assignTeamMemberAction,
  closeProjectAction,
  createProjectAction,
  createTeamAction,
  linkProjectToObjectivesAction,
  updateTeamAction,
  type TeamsFormState,
} from "./actions";

const initial: TeamsFormState = {};
const controlClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const TEAM_ROLES = ["Lead", "Contributor"] as const;

type Option = { id: string; label: string };

function FormFeedback({ state }: { state: TeamsFormState }) {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
      {state.error ?? state.success}
    </p>
  );
}

export function TeamForm({
  team,
}: {
  team?: { teamId: string; name: string; description: string | null };
}) {
  const [state, action, pending] = useActionState(
    team ? updateTeamAction : createTeamAction,
    initial,
  );
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        {team ? (
          <legend className="sr-only">Editar equipo</legend>
        ) : (
          <legend className="sr-only">Crear equipo</legend>
        )}
        {team ? <Input name="teamId" type="hidden" value={team.teamId} /> : null}
        <Label htmlFor="team-name">Nombre del equipo</Label>
        <Input id="team-name" name="name" defaultValue={team?.name} required maxLength={80} />
        <Label htmlFor="team-description">Descripción</Label>
        <Input
          id="team-description"
          name="description"
          defaultValue={team?.description ?? ""}
          maxLength={240}
        />
      </fieldset>
      <Button disabled={pending}>{team ? "Guardar cambios" : "Crear equipo"}</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function AssignMemberForm({
  team,
  members,
}: {
  team: { teamId: string; name: string };
  members: Option[];
}) {
  const [state, action, pending] = useActionState(assignTeamMemberAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Asignar miembro a {team.name}</legend>
        <Input name="teamId" type="hidden" value={team.teamId} />
        <Label htmlFor={`assign-member-${team.teamId}`}>Persona</Label>
        <select
          id={`assign-member-${team.teamId}`}
          name="memberId"
          required
          className={controlClass}
        >
          <option value="">Elegí una persona</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
            </option>
          ))}
        </select>
        <Label htmlFor={`assign-role-${team.teamId}`}>Rol</Label>
        <select
          id={`assign-role-${team.teamId}`}
          name="role"
          defaultValue="Contributor"
          className={controlClass}
        >
          {TEAM_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <Label htmlFor={`assign-load-${team.teamId}`}>% de carga</Label>
        <Input
          id={`assign-load-${team.teamId}`}
          name="capacityPercent"
          type="number"
          min={0}
          max={100}
          step={5}
          defaultValue={100}
          required
        />
      </fieldset>
      <Button disabled={pending}>Asignar</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function ProjectForm() {
  const [state, action, pending] = useActionState(createProjectAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Crear proyecto</legend>
        <Label htmlFor="project-name">Nombre del proyecto</Label>
        <Input id="project-name" name="name" required maxLength={80} />
      </fieldset>
      <Button disabled={pending}>Crear proyecto</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function LinkObjectiveForm({
  project,
  objectives,
}: {
  project: { projectId: string; name: string };
  objectives: Option[];
}) {
  const [state, action, pending] = useActionState(linkProjectToObjectivesAction, initial);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">Vincular {project.name}</legend>
        <Input name="projectId" type="hidden" value={project.projectId} />
        <Label htmlFor={`link-objective-${project.projectId}`}>Vincular a un objetivo</Label>
        <select
          id={`link-objective-${project.projectId}`}
          name="objectiveId"
          required
          className={controlClass}
        >
          <option value="">Elegí un objetivo</option>
          {objectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.label}
            </option>
          ))}
        </select>
      </fieldset>
      <Button disabled={pending}>Vincular</Button>
      <FormFeedback state={state} />
    </form>
  );
}

export function CloseProjectForm({
  project,
}: {
  project: { projectId: string; name: string };
}) {
  const [state, action, pending] = useActionState(closeProjectAction, initial);
  return (
    <form action={action} className="flex items-center gap-3">
      <Input name="projectId" type="hidden" value={project.projectId} />
      <Button variant="outline" disabled={pending}>
        Cerrar proyecto
      </Button>
      <FormFeedback state={state} />
    </form>
  );
}
