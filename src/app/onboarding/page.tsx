import { getCurrentUser } from "@/lib/auth";
import {
  getOnboardingSetupAccess,
  getOnboardingTemplateOptions,
  startOnboardingSetup,
} from "@/modules/onboarding-setup/application";
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
import { GuidedSetupForm } from "./guided-setup-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  // Si el usuario fue invitado y este es su primer login, acá también se
  // vincula por email verificado (F.1) antes de decidir la redirección.
  if ((await resolveOrLinkTenantForUser(user.id, verifiedEmail(user))) !== null) {
    const access = await getOnboardingSetupAccess({ actorClerkUserId: user.id });
    if (!access.canMutate) redirect("/members");
    const setup = access.setup ?? (await startOnboardingSetup({ actorClerkUserId: user.id }));
    if (setup.status !== "Pending") redirect("/members");
    const templateOptions =
      setup.currentStep === "Review" && setup.companyType && setup.industry
        ? getOnboardingTemplateOptions({
            companyType: setup.companyType,
            industry: setup.industry,
          })
        : null;
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center p-6">
        <GuidedSetupForm setup={setup} templateOptions={templateOptions} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1>Creá tu organización</h1>
          </CardTitle>
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
