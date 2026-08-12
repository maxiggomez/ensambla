import { describe, expect, it, vi } from "vitest";

import type { Ritual, TenantClient } from "../../../shared/db";

import { listRitualsWithOccurrences } from "./ritual-repo";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("ritual repository transaction query scheduling", () => {
  it("does not query occurrences while rituals are pending", async () => {
    const order: string[] = [];
    const rituals = deferred<Ritual[]>();
    const tx = {
      ritual: {
        findMany: vi.fn(async () => {
          order.push("rituals:start");
          const value = await rituals.promise;
          order.push("rituals:end");
          return value;
        }),
      },
      ritualOccurrence: {
        findMany: vi.fn(async () => {
          order.push("occurrences:start");
          order.push("occurrences:end");
          return [];
        }),
      },
    } as unknown as TenantClient;

    const resultPromise = listRitualsWithOccurrences(tx);
    await vi.waitFor(() => expect(tx.ritual.findMany).toHaveBeenCalledOnce());
    rituals.resolve([]);

    await expect(resultPromise).resolves.toEqual([]);
    expect(order).toEqual([
      "rituals:start",
      "rituals:end",
      "occurrences:start",
      "occurrences:end",
    ]);
  });
});
