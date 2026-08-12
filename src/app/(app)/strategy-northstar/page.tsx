import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { listObjectives } from "../../../modules/okrs/application";
import { getStrategicMap, getStrategy } from "../../../modules/strategy-northstar/application";
import { listMembers } from "../../../modules/identity-org/application";
import type { Member } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { verifiedEmail } from "../../../lib/verified-email";
import { linkMembershipsForUser } from "../../../shared/tenancy";
import type { Measurement } from "../../../shared/measurement";

import { NorthStarForm } from "./north-star-form";
import { StrategyForm } from "./strategy-form";
import { LeverForm } from "./lever-form";
import { AssignForm, PillarForm } from "./pillar-form";
import { StrategicMap } from "./strategy-map";

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

export default async function StrategyNorthStarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  let members: Member[];
  try {
    members = await listMembers({ actorClerkUserId: user.id });
  } catch (error) {
    if (!isNoMember(error)) throw error;
    const linked = await linkMembershipsForUser(user.id, verifiedEmail(user));
    if (linked === 0) redirect("/onboarding");
    members = await listMembers({ actorClerkUserId: user.id });
  }

  const actor = members.find((member) => member.clerkUserId === user.id);
  const isDirection = actor?.role === "Direccion";

  const [strategy, map] = await Promise.all([
    getStrategy({ actorClerkUserId: user.id }),
    getStrategicMap({ actorClerkUserId: user.id }),
  ]);
  const objectives = isDirection ? await listObjectives({ actorClerkUserId: user.id }) : [];

  const northStar = map.northStar;

  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
          Norte estratégico
        </p>
        <h1 className="text-3xl md:text-5xl">De dónde baja todo lo demás</h1>
        <p className="text-base text-muted-foreground">
          Visión, misión, valores, la North Star tipada y el mapa estratégico con el progreso
          real de los OKRs.
        </p>
      </header>

      <section aria-labelledby="strategy-title" className="space-y-4">
        <h2 id="strategy-title" className="text-2xl">
          Estrategia
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Visión, misión y valores</CardTitle>
            <CardDescription>
              Visibles para toda la organización; solo Dirección puede editarlos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 md:grid-cols-2">
              <div>
                <dt className="text-xs font-bold text-muted-foreground">Visión</dt>
                <dd className="text-base">{strategy.vision ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground">Misión</dt>
                <dd className="text-base">{strategy.mission ?? "—"}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs font-bold text-muted-foreground">Valores</dt>
                <dd className="flex flex-wrap gap-2 pt-1">
                  {strategy.values.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    strategy.values.map((value) => (
                      <span
                        key={value}
                        className="rounded-full bg-brand-soft px-3 py-1 text-sm font-bold"
                      >
                        {value}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>
            {isDirection ? (
              <div className="border-t border-border pt-4">
                <StrategyForm
                  defaultVision={strategy.vision}
                  defaultMission={strategy.mission}
                  defaultValues={strategy.values}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="northstar-title" className="space-y-4">
        <h2 id="northstar-title" className="text-2xl">
          North Star
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>La métrica que define el rumbo</CardTitle>
            <CardDescription>
              Una sola North Star por organización, medida con una métrica tipada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {northStar ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">Nombre</p>
                    <p className="text-2xl font-extrabold tracking-[-0.04em]">
                      {northStar.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">Progreso</p>
                    <p className="text-4xl font-extrabold tracking-[-0.04em]">
                      {northStar.progress}%
                    </p>
                  </div>
                </div>
                <p className="rounded-sm bg-brand-soft px-3 py-2 text-sm">
                  {formatMeasurement(northStar.measurement)}
                </p>

                <div>
                  <h3 className="mb-2 font-bold">Input levers</h3>
                  {northStar.levers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Todavía no hay levers. Agregá las palancas que mueven la North Star.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {northStar.levers.map((lever) => (
                        <li key={lever.id} className="py-2">
                          <p className="font-medium">{lever.name}</p>
                          {lever.objective ? (
                            <p className="text-sm text-muted-foreground">
                              Vinculado a “{lever.objective.title}” · {lever.objective.progress}
                              %
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Sin objetivo vinculado
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {isDirection ? (
                  <div className="border-t border-border pt-4">
                    <LeverForm
                      objectives={objectives.map((objective) => ({
                        id: objective.id,
                        title: objective.title,
                      }))}
                    />
                  </div>
                ) : null}
              </div>
            ) : isDirection ? (
              <NorthStarForm />
            ) : (
              <p className="text-sm text-muted-foreground">
                La organización todavía no definió su North Star.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="map-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="map-title" className="text-2xl">
            Mapa estratégico
          </h2>
          {isDirection ? (
            <div className="flex flex-wrap gap-3">
              <PillarForm />
              <AssignForm
                pillars={map.pillars.map((pillar) => ({
                  id: pillar.id,
                  name: pillar.name,
                }))}
                objectives={objectives.map((objective) => ({
                  id: objective.id,
                  title: objective.title,
                }))}
              />
            </div>
          ) : null}
        </div>
        <StrategicMap map={map} />
      </section>
    </div>
  );
}

function formatMeasurement(measurement: Measurement): string {
  switch (measurement.type) {
    case "check":
      return measurement.done ? "Marcada como hecha" : "Pendiente de marcar";
    case "text":
      return {
        not_started: "No iniciada",
        in_progress: "En curso",
        done: "Completa",
      }[measurement.state];
    case "percentage":
      return `Actual ${measurement.current}% · base ${measurement.start}% → objetivo ${measurement.target}%`;
    case "integer":
      return `Actual ${measurement.current} · base ${measurement.start} → objetivo ${measurement.target}`;
    case "currency":
      return `Actual $ ${measurement.current.toLocaleString("es-AR")} · base $ ${measurement.start.toLocaleString("es-AR")} → objetivo $ ${measurement.target.toLocaleString("es-AR")}`;
  }
}
