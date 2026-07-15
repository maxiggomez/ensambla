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

import { resolveTenantForUser } from "../../shared/tenancy";

import { createOrganizationAction } from "./actions";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  if ((await resolveTenantForUser(userId)) !== null) {
    redirect("/members");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Creá tu organización</CardTitle>
          <CardDescription>
            Vas a quedar como Dirección y podrás invitar a tu equipo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createOrganizationAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre de la organización</Label>
              <Input id="name" name="name" placeholder="Acme SRL" required />
            </div>
            <Button type="submit">Crear organización</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
