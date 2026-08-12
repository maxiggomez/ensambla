import type { StrategicMapView } from "../../../modules/strategy-northstar/application";

function Progress({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="h-2 w-20 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-brand" style={{ width: `${value}%` }} />
      </span>
      <span className="text-sm font-bold">{value}%</span>
    </span>
  );
}

export function StrategicMap({ map }: { map: StrategicMapView }) {
  const hasPillars = map.pillars.length > 0;
  const hasUnassigned = map.unassignedObjectives.length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-extrabold tracking-[0.13em] uppercase text-muted-foreground">
          Visión
        </p>
        <p className="mt-1 font-medium">{map.strategy.vision ?? "—"}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-extrabold tracking-[0.13em] uppercase text-muted-foreground">
          North Star
        </p>
        {map.northStar ? (
          <div className="mt-1 flex items-center justify-between gap-4">
            <p className="font-medium">{map.northStar.name}</p>
            <Progress value={map.northStar.progress} />
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Sin definir</p>
        )}
      </div>

      {hasPillars || hasUnassigned ? (
        <div className="space-y-3">
          {map.pillars.map((pillar) => (
            <div key={pillar.id} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-extrabold tracking-[0.13em] uppercase text-muted-foreground">
                Pilar
              </p>
              <p className="mt-1 font-medium">{pillar.name}</p>
              {pillar.description ? (
                <p className="text-sm text-muted-foreground">{pillar.description}</p>
              ) : null}
              {pillar.objectives.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Sin objetivos visibles.</p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {pillar.objectives.map((objective) => (
                    <li
                      key={objective.id}
                      className="flex items-center justify-between gap-4 py-2"
                    >
                      <span className="font-medium">{objective.title}</span>
                      <Progress value={objective.progress} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {hasUnassigned ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-4">
              <p className="text-xs font-extrabold tracking-[0.13em] uppercase text-muted-foreground">
                Sin pilar
              </p>
              <ul className="mt-2 divide-y divide-border">
                {map.unassignedObjectives.map((objective) => (
                  <li
                    key={objective.id}
                    className="flex items-center justify-between gap-4 py-2"
                  >
                    <span className="font-medium">{objective.title}</span>
                    <Progress value={objective.progress} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-sm bg-brand-soft px-3 py-2 text-sm">
          Definí la North Star y asigná objetivos a pilares para ver la cascada.
        </p>
      )}
    </div>
  );
}
