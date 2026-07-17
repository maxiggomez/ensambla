import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  canManageMembers,
  listMembers,
  ROLES,
  type Role,
} from "../../modules/identity-org/application";
import type { Member } from "../../shared/db";
import { verifiedEmail } from "../../lib/verified-email";
import { ApplicationError } from "../../shared/errors";
import { linkMembershipsForUser } from "../../shared/tenancy";

import { InviteMemberForm } from "./invite-member-form";

const ROLE_LABELS: Record<string, string> = {
  Direccion: "Dirección",
  Lider: "Líder",
  Colaborador: "Colaborador",
};

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

export default async function MembersPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const email = verifiedEmail(user);

  // Una sola resolución de tenant por request (F.5b): listMembers resuelve
  // internamente; si el usuario no tiene membership, se intenta la vinculación
  // por email verificado (primer login de un invitado, F.1) y se reintenta.
  let members: Member[];
  try {
    members = await listMembers({ actorClerkUserId: user.id });
  } catch (error) {
    if (!isNoMember(error)) {
      throw error;
    }
    const linked = await linkMembershipsForUser(user.id, email);
    if (linked === 0) {
      redirect("/onboarding");
    }
    members = await listMembers({ actorClerkUserId: user.id });
  }

  const actor = members.find((m) => m.clerkUserId === user.id);
  const showInviteForm = actor ? canManageMembers(actor.role as Role) : false;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
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

      {showInviteForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Invitar miembro</CardTitle>
            <CardDescription>
              La persona se suma con el rol asignado; si su email ya existe, no se duplica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMemberForm roles={ROLES} />
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
