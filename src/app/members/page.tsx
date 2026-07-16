import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { listMembers, ROLES } from "../../modules/identity-org/application";
import { resolveTenantForUser } from "../../shared/tenancy";

import { inviteMemberAction } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  Direccion: "Dirección",
  Lider: "Líder",
  Colaborador: "Colaborador",
};

export default async function MembersPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  if ((await resolveTenantForUser(userId)) === null) {
    redirect("/onboarding");
  }

  const members = await listMembers({ actorClerkUserId: userId });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 bg-background p-6">
      <Card>
        <CardHeader>
          <CardTitle>Miembros</CardTitle>
          <CardDescription>Personas de tu organización y su rol.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitar miembro</CardTitle>
          <CardDescription>
            La persona se suma con el rol asignado; si su email ya existe, no se duplica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={inviteMemberAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Bruno Díaz" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="bruno@acme.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                name="role"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                defaultValue="Colaborador"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Invitar</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
