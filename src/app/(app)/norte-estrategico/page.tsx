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

import { EntityCreateDrawer } from "../../../components/entity-create-drawer";
import { StrategyDetailSections } from "./collapsible-section";
import { NorthStarForm } from "./north-star-form";
import { StrategyForm } from "./strategy-form";
import { LeverForm } from "./lever-form";
import { AssignForm, PillarForm } from "./pillar-form";
import { StrategicMap } from "./strategy-map";

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

export default async function NorteEstrategicoPage() {
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

  const strategyDetail = (
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
              defaultMission={strategy.mission}
              defaultValues={strategy.values}
              defaultVision={strategy.vision}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  const northStarDetail = (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>La métrica que define el rumbo</CardTitle>
            <CardDescription>
              Una sola North Star por organización, medida con una métrica tipada.
            </CardDescription>
          </div>
          {isDirection && !northStar ? (
            <EntityCreateDrawer triggerLabel="+ Nueva North Star" title="Definir North Star">
              <NorthStarForm />
            </EntityCreateDrawer>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {northStar ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Nombre</p>
                <p className="text-2xl font-extrabold tracking-[-0.04em]">{northStar.name}</p>
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
              <h3 className="mb-2 flex flex-wrap items-center justify-between gap-3 font-bold">
                <span>Input levers</span>
                {isDirection ? (
                  <EntityCreateDrawer triggerLabel="+ Nuevo lever" title="Nuevo lever">
                    <LeverForm
                      objectives={objectives.map((objective) => ({
                        id: objective.id,
                        title: objective.title,
                      }))}
                    />
                  </EntityCreateDrawer>
                ) : null}
              </h3>
              {northStar.levers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay levers. Agregá las palancas que mueven la North Star.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {northStar.levers.map((lever) => (
                    <li className="py-2" key={lever.id}>
                      <p className="font-medium">{lever.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {lever.objective
                          ? `Vinculado a “${lever.objective.title}” · ${lever.objective.progress}%`
                          : "Sin objetivo vinculado"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isDirection
              ? "Todavía no hay North Star. Usá “+ Nueva North Star” para definirla."
              : "La organización todavía no definió su North Star."}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const pillarsDetail = (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Pilares y asignaciones</CardTitle>
            <CardDescription>
              Organizá los objetivos que sostienen el rumbo estratégico.
            </CardDescription>
          </div>
          {isDirection ? (
            <div className="flex flex-wrap gap-3">
              <EntityCreateDrawer triggerLabel="+ Nuevo pilar" title="Nuevo pilar estratégico">
                <PillarForm />
              </EntityCreateDrawer>
              <EntityCreateDrawer
                triggerLabel="Asignar objetivo"
                title="Asignar objetivo a un pilar"
              >
                <AssignForm
                  objectives={objectives.map((objective) => ({
                    id: objective.id,
                    title: objective.title,
                  }))}
                  pillars={map.pillars.map((pillar) => ({ id: pillar.id, name: pillar.name }))}
                />
              </EntityCreateDrawer>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {map.pillars.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isDirection
              ? "Todavía no hay pilares. Creá el primero para agrupar objetivos."
              : "La organización todavía no definió pilares estratégicos."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {map.pillars.map((pillar) => (
              <li className="py-3" key={pillar.id}>
                <p className="font-bold">{pillar.name}</p>
                <p className="text-sm text-muted-foreground">
                  {pillar.objectives.length === 0
                    ? "Sin objetivos asignados"
                    : `${pillar.objectives.length} ${pillar.objectives.length === 1 ? "objetivo" : "objetivos"}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 overflow-x-hidden px-6 py-10 md:px-10">
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

      <section aria-labelledby="map-title" className="min-w-0 space-y-4">
        <div>
          <h2 id="map-title" className="text-2xl">
            Mapa estratégico
          </h2>
          <p className="text-sm text-muted-foreground">
            La conexión entre el rumbo y los objetivos que lo hacen avanzar.
          </p>
        </div>
        <StrategicMap map={map} />
      </section>

      <StrategyDetailSections
        northStar={northStarDetail}
        pillars={pillarsDetail}
        strategy={strategyDetail}
      />
    </main>
  );
}

function formatMeasurement(measurement: Measurement): string {
  switch (measurement.type) {
    case "check":
      return measurement.done ? "Marcada como hecha" : "Pendiente de marcar";
    case "text":
      return { not_started: "No iniciada", in_progress: "En curso", done: "Completa" }[
        measurement.state
      ];
    case "percentage":
      return `Actual ${measurement.current}% · base ${measurement.start}% → objetivo ${measurement.target}%`;
    case "integer":
      return `Actual ${measurement.current} · base ${measurement.start} → objetivo ${measurement.target}`;
    case "currency":
      return `Actual $ ${measurement.current.toLocaleString("es-AR")} · base $ ${measurement.start.toLocaleString("es-AR")} → objetivo $ ${measurement.target.toLocaleString("es-AR")}`;
  }
}
