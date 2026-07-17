import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { verifiedEmail } from "../../lib/verified-email";
import { resolveOrLinkTenantForUser } from "../../shared/tenancy";

import { CreateOrgForm } from "./create-org-form";

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }
  // Si el usuario fue invitado y este es su primer login, acá también se
  // vincula por email verificado (F.1) antes de decidir la redirección.
  if ((await resolveOrLinkTenantForUser(user.id, verifiedEmail(user))) !== null) {
    redirect("/members");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Creá tu organización</CardTitle>
          <CardDescription>
            Vas a quedar como Dirección y podrás invitar a tu equipo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrgForm />
        </CardContent>
      </Card>
    </main>
  );
}
