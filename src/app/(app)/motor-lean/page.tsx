import { getCurrentUser } from "@/lib/auth";
import { verifiedEmail } from "@/lib/verified-email";
import { listExperimentBoard, listLearnings } from "@/modules/lean-experiments/application";
import { listObjectives } from "@/modules/okrs/application";
import { ApplicationError } from "@/shared/errors";
import { linkMembershipsForUser } from "@/shared/tenancy";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BuildForm, CloseForm, CreateExperimentForm, MeasureForm } from "./experiment-forms";

const columns = [
  ["Hypothesis", "Hipótesis"],
  ["Building", "Construyendo"],
  ["Measuring", "Midiendo"],
  ["Learned", "Aprendido"],
] as const;

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

export default async function MotorLeanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  try {
    await listObjectives({ actorClerkUserId: user.id });
  } catch (error) {
    if (!isNoMember(error)) throw error;
    if ((await linkMembershipsForUser(user.id, verifiedEmail(user))) === 0)
      redirect("/onboarding");
  }
  const [objectives, board, learnings] = await Promise.all([
    listObjectives({ actorClerkUserId: user.id }),
    listExperimentBoard({ actorClerkUserId: user.id }),
    listLearnings({ actorClerkUserId: user.id }),
  ]);
  const keyResults = objectives.flatMap((objective) =>
    objective.keyResults.map((keyResult) => ({
      id: keyResult.id,
      label: `${objective.title} · ${keyResult.title}`,
    })),
  );

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-6 py-10 md:px-10">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-3 text-xs font-extrabold tracking-[0.13em] uppercase before:h-1 before:w-7 before:bg-brand-2">
          Motor Lean
        </p>
        <h1 className="text-3xl md:text-5xl">Convertí supuestos en aprendizajes</h1>
        <p className="text-muted-foreground">
          Vinculá cada hipótesis a un KeyResult y recorré Construir, Medir y Aprender.
        </p>
      </header>

      <section aria-labelledby="create-title" className="space-y-4">
        <h2 id="create-title">Nueva hipótesis</h2>
        <CreateExperimentForm keyResults={keyResults} />
      </section>

      <section aria-labelledby="board-title" className="space-y-4">
        <h2 id="board-title">Ciclo de experimentos</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          {columns.map(([status, label]) => (
            <section key={status} aria-labelledby={`column-${status}`} className="space-y-3">
              <h3
                id={`column-${status}`}
                className="rounded-full bg-brand-soft px-4 py-2 text-sm"
              >
                {label} · {board[status].length}
              </h3>
              {board[status].length === 0 ? (
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Sin experimentos.</p>
                  </CardContent>
                </Card>
              ) : (
                board[status].map((card) => (
                  <Card key={card.experimentId} data-testid={`experiment-${card.experimentId}`}>
                    <CardHeader>
                      <CardTitle className="text-base">{card.statement}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p>
                        <strong>KR:</strong> {card.keyResultTitle}
                      </p>
                      <p>
                        <strong>Objetivo:</strong> {card.objectiveTitle}
                      </p>
                      {status === "Hypothesis" ? (
                        <BuildForm experimentId={card.experimentId} />
                      ) : null}
                      {status === "Building" ? (
                        <MeasureForm experimentId={card.experimentId} />
                      ) : null}
                      {status === "Measuring" ? (
                        <CloseForm experimentId={card.experimentId} />
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              )}
            </section>
          ))}
        </div>
      </section>

      <section aria-labelledby="library-title" className="space-y-4">
        <h2 id="library-title">Biblioteca de aprendizajes</h2>
        {learnings.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay aprendizajes cerrados.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {learnings.map((learning) => (
              <Card key={learning.experimentId}>
                <CardHeader>
                  <CardTitle>
                    {learning.decision === "persevere" ? "Perseverar" : "Pivotar"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <strong>Creíamos:</strong> {learning.believed}
                  </p>
                  <p>
                    <strong>Probamos:</strong> {learning.tested}
                  </p>
                  <p>
                    <strong>Aprendimos:</strong> {learning.learned}
                  </p>
                  <p>
                    <strong>KR:</strong> {learning.keyResultTitle}
                  </p>
                  <p>
                    <strong>Objetivo:</strong> {learning.objectiveTitle}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
