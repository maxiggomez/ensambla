import { describe, expect, it, vi } from "vitest";

import type { TenantClient } from "../../../shared/db";

import { listReminderCandidates } from "./cadence-repo";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("OKR cadence repository transaction query scheduling", () => {
  it("does not overlap nested reminder candidate queries", async () => {
    const order: string[] = [];
    const publishedAt = new Date("2026-08-01T00:00:00.000Z");
    const checkInAt = new Date("2026-08-08T00:00:00.000Z");
    const objectives = deferred<
      Array<{
        id: string;
        title: string;
        teamId: string;
        publishedAt: Date;
        createdAt: Date;
      }>
    >();
    const cadences = deferred<
      Array<{
        objectiveId: string | null;
        teamId: string | null;
        cadence: "Monthly" | "Weekly";
      }>
    >();
    const keyResults = deferred<Array<{ id: string; objectiveId: string; title: string }>>();
    const tx = {
      objective: {
        findMany: vi.fn(async () => {
          order.push("objectives:start");
          const value = await objectives.promise;
          order.push("objectives:end");
          return value;
        }),
      },
      okrCadenceConfig: {
        findMany: vi.fn(async () => {
          order.push("cadences:start");
          const value = await cadences.promise;
          order.push("cadences:end");
          return value;
        }),
      },
      keyResult: {
        findMany: vi.fn(async () => {
          order.push("key-results:start");
          const value = await keyResults.promise;
          order.push("key-results:end");
          return value;
        }),
      },
      checkIn: {
        groupBy: vi.fn(async () => {
          order.push("check-ins:start");
          order.push("check-ins:end");
          return [{ keyResultId: "kr-a", _max: { createdAt: checkInAt } }];
        }),
      },
    } as unknown as TenantClient;

    const resultPromise = listReminderCandidates(tx);
    await vi.waitFor(() => expect(tx.objective.findMany).toHaveBeenCalledOnce());
    expect(tx.okrCadenceConfig.findMany).not.toHaveBeenCalled();
    objectives.resolve([
      {
        id: "objective-a",
        title: "Aumentar activación",
        teamId: "team-a",
        publishedAt,
        createdAt: publishedAt,
      },
    ]);
    await vi.waitFor(() => expect(tx.okrCadenceConfig.findMany).toHaveBeenCalledOnce());
    expect(tx.keyResult.findMany).not.toHaveBeenCalled();
    cadences.resolve([
      { objectiveId: "objective-a", teamId: null, cadence: "Monthly" },
      { objectiveId: null, teamId: "team-a", cadence: "Weekly" },
    ]);
    await vi.waitFor(() => expect(tx.keyResult.findMany).toHaveBeenCalledOnce());
    expect(tx.checkIn.groupBy).not.toHaveBeenCalled();
    keyResults.resolve([{ id: "kr-a", objectiveId: "objective-a", title: "Activaciones" }]);
    await vi.waitFor(() => expect(tx.checkIn.groupBy).toHaveBeenCalledOnce());

    await expect(resultPromise).resolves.toEqual([
      {
        id: "objective-a",
        title: "Aumentar activación",
        publishedAt,
        createdAt: publishedAt,
        cadenceConfigs: [{ cadence: "Monthly" }],
        team: { cadenceConfigs: [{ cadence: "Weekly" }] },
        keyResults: [
          {
            id: "kr-a",
            title: "Activaciones",
            checkIns: [{ createdAt: checkInAt }],
          },
        ],
      },
    ]);
    expect(order).toEqual([
      "objectives:start",
      "objectives:end",
      "cadences:start",
      "cadences:end",
      "key-results:start",
      "key-results:end",
      "check-ins:start",
      "check-ins:end",
    ]);
  });
});
