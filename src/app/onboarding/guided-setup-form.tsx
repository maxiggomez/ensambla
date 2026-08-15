"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  OnboardingSetupView,
  OnboardingTemplateOptions,
} from "@/modules/onboarding-setup/application";

import {
  applyOnboardingTemplateAction,
  backOnboardingAction,
  completeOnboardingAction,
  saveCompanyProfileAction,
  skipOnboardingAction,
  type OnboardingFormState,
} from "./actions";

function FormError({ state }: { state: OnboardingFormState }) {
  return state.error ? (
    <p role="alert" className="rounded-lg bg-risk-soft px-3 py-2 text-sm text-risk">
      {state.error}
    </p>
  ) : null;
}

function StepHeader({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3" aria-label={`Paso ${step} de 2`}>
      {[1, 2].map((item) => (
        <span
          key={item}
          aria-current={item === step ? "step" : undefined}
          className={
            item === step
              ? "rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-foreground"
              : "rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground"
          }
        >
          {String(item).padStart(2, "0")}
        </span>
      ))}
    </div>
  );
}

function SkipForm() {
  const [state, action, pending] = useActionState(skipOnboardingAction, {});
  return (
    <form action={action} className="space-y-2">
      <Button type="submit" variant="ghost" disabled={pending}>
        {pending ? "Saliendo…" : "Saltar configuración"}
      </Button>
      <FormError state={state} />
    </form>
  );
}

function CompanyProfileStep({ setup }: { setup: OnboardingSetupView }) {
  const [state, action, pending] = useActionState(saveCompanyProfileAction, {});
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="space-y-4">
        <StepHeader step={1} />
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-[0.13em] text-muted-foreground uppercase">
            Configuración inicial
          </p>
          <CardTitle>
            <h1 className="text-2xl">Contanos sobre tu empresa</h1>
          </CardTitle>
          <CardDescription>
            Guardamos este paso para que puedas volver sin perder lo cargado.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="companyType">Tipo de empresa</Label>
            <Input
              id="companyType"
              name="companyType"
              defaultValue={setup.companyType ?? ""}
              placeholder="Ej. Servicios profesionales"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industria</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={setup.industry ?? ""}
              placeholder="Ej. Tecnología"
              required
            />
          </div>
          <FormError state={state} />
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Guardando…" : "Continuar"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <SkipForm />
      </CardFooter>
    </Card>
  );
}

function TemplateCard({
  template,
  recommended,
}: {
  template: OnboardingTemplateOptions["templates"][number];
  recommended: boolean;
}) {
  const [state, action, pending] = useActionState(applyOnboardingTemplateAction, {});
  return (
    <Card className={recommended ? "border-brand shadow-sm" : "shadow-sm"}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{template.name}</CardTitle>
          {recommended ? (
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-foreground">
              Template recomendado
            </span>
          ) : null}
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <details className="rounded-xl border border-border p-3">
          <summary className="cursor-pointer font-semibold">Ver estructura</summary>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <h3 className="font-bold">Teams</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {template.teams.map((team) => (
                  <li key={team}>{team}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold">North Star</h3>
              <p className="mt-1 text-muted-foreground">{template.northStar.name}</p>
            </div>
            <div>
              <h3 className="font-bold">Objectives y Key Results</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {template.objectives.map((objective) => (
                  <li key={objective.title}>
                    <span className="font-medium text-foreground">{objective.title}</span>
                    <ul className="mt-1 list-[circle] space-y-1 pl-5">
                      {objective.keyResults.map((keyResult) => (
                        <li key={keyResult.title}>{keyResult.title}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Skills</h3>
              <p className="mt-1 text-muted-foreground">{template.skills.join(", ")}</p>
            </div>
          </div>
          <form action={action} className="mt-5 space-y-3">
            <input type="hidden" name="templateKey" value={template.key} />
            <Button type="submit" disabled={pending}>
              {pending ? "Aplicando…" : "Aplicar template"}
            </Button>
            <FormError state={state} />
          </form>
        </details>
      </CardContent>
    </Card>
  );
}

function ReviewStep({
  setup,
  templateOptions,
}: {
  setup: OnboardingSetupView;
  templateOptions: OnboardingTemplateOptions;
}) {
  const [backState, backAction, backing] = useActionState(backOnboardingAction, {});
  const [completeState, completeAction, completing] = useActionState(
    completeOnboardingAction,
    {},
  );
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="space-y-4">
        <StepHeader step={2} />
        <div>
          <CardTitle>
            <h1 className="text-2xl">Revisá tu configuración</h1>
          </CardTitle>
          <CardDescription>
            Elegí una base editable para empezar o finalizá sin aplicar un template.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 rounded-xl bg-muted p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold text-muted-foreground">Tipo de empresa</dt>
            <dd className="mt-1 font-semibold">{setup.companyType}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-muted-foreground">Industria</dt>
            <dd className="mt-1 font-semibold">{setup.industry}</dd>
          </div>
        </dl>
        <section className="space-y-3" aria-labelledby="templates-heading">
          <div>
            <h2 id="templates-heading" className="text-lg font-bold">
              Templates para tu organización
            </h2>
            <p className="text-sm text-muted-foreground">
              Revisá la estructura antes de confirmar. La vista previa no guarda cambios.
            </p>
          </div>
          <div className="grid gap-4">
            {templateOptions.templates.map((template) => (
              <TemplateCard
                key={template.key}
                template={template}
                recommended={template.key === templateOptions.recommendedKey}
              />
            ))}
          </div>
        </section>
        <FormError state={backState.error ? backState : completeState} />
        <div className="flex flex-wrap gap-3">
          <form action={backAction}>
            <Button type="submit" variant="outline" disabled={backing || completing}>
              Volver
            </Button>
          </form>
          <form action={completeAction}>
            <Button type="submit" size="lg" disabled={backing || completing}>
              {completing ? "Finalizando…" : "Finalizar sin template"}
            </Button>
          </form>
        </div>
      </CardContent>
      <CardFooter>
        <SkipForm />
      </CardFooter>
    </Card>
  );
}

export function GuidedSetupForm({
  setup,
  templateOptions,
}: {
  setup: OnboardingSetupView;
  templateOptions: OnboardingTemplateOptions | null;
}) {
  if (setup.currentStep === "CompanyProfile") {
    return <CompanyProfileStep setup={setup} />;
  }
  if (!templateOptions) {
    return (
      <p role="alert" className="rounded-lg bg-risk-soft px-3 py-2 text-sm text-risk">
        No pudimos recomendar templates para esta configuración.
      </p>
    );
  }
  return <ReviewStep setup={setup} templateOptions={templateOptions} />;
}
