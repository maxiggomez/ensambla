"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createOrganizationAction, type CreateOrgFormState } from "./actions";

export function CreateOrgForm() {
  const [state, formAction, pending] = useActionState<CreateOrgFormState, FormData>(
    createOrganizationAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre de la organización</Label>
        <Input id="name" name="name" placeholder="Acme SRL" required />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-md bg-risk-soft px-3 py-2 text-sm text-risk">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear organización"}
      </Button>
    </form>
  );
}
