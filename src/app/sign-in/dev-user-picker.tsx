"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { selectDevUserAction, signOutDevAction, type DevAuthFormState } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  Direccion: "Dirección",
  Lider: "Líder",
  Colaborador: "Colaborador",
};

export interface DevUserOption {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function DevUserPicker({
  users,
  currentUserId,
}: {
  users: readonly DevUserOption[];
  currentUserId: string | null;
}) {
  const [state, formAction] = useActionState<DevAuthFormState, FormData>(
    selectDevUserAction,
    {},
  );

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Usuarios de desarrollo</CardTitle>
          <CardDescription>
            {currentUserId
              ? "Ya hay una sesión de desarrollo activa. Elegí otro usuario para cambiar."
              : "Elegí un usuario para ingresar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={formAction} className="flex flex-col gap-2">
            {users.map((user) => (
              <button
                key={user.id}
                name="userId"
                value={user.id}
                data-testid={`dev-user-${user.id}`}
                className="flex items-center justify-between gap-2 rounded-md border border-foreground/10 px-4 py-3 text-left hover:border-accent"
              >
                <span>
                  <span className="block font-bold">{user.name}</span>
                  <span className="block text-sm text-muted-foreground">{user.email}</span>
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </button>
            ))}
            {state.error ? (
              <p role="alert" className="rounded-md bg-risk-soft px-3 py-2 text-sm text-risk">
                {state.error}
              </p>
            ) : null}
          </form>

          {currentUserId ? (
            <form action={signOutDevAction}>
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                data-testid="dev-sign-out"
              >
                Salir de la sesión de desarrollo
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
