"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { inviteMemberAction, type InviteFormState } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  Direccion: "Dirección",
  Lider: "Líder",
  Colaborador: "Colaborador",
};

export function InviteMemberForm({ roles }: { roles: readonly string[] }) {
  const [state, formAction, pending] = useActionState<InviteFormState, FormData>(
    inviteMemberAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" placeholder="Bruno Díaz" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="bruno@acme.com" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Rol</Label>
        <select
          id="role"
          name="role"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          defaultValue="Colaborador"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role] ?? role}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-md bg-risk-soft px-3 py-2 text-sm text-risk">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Invitando…" : "Invitar"}
      </Button>
    </form>
  );
}
