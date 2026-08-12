import { describe, expect, it, vi } from "vitest";

import type { Organization, TenantClient } from "../../../shared/db";

import { getAggregateInputs } from "./results-repo";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("eNPS results repository transaction query scheduling", () => {
  it("does not overlap anonymous aggregate queries", async () => {
    const order: string[] = [];
    const organization = deferred<Organization>();
    const participation = deferred<number>();
    const tx = {
      pulse: {
        findUnique: vi.fn(async () => ({
          id: "pulse-a",
          organizationId: "org-a",
          scope: "Organization",
          teamId: null,
        })),
      },
      organization: {
        findUniqueOrThrow: vi.fn(async () => {
          order.push("organization:start");
          const value = await organization.promise;
          order.push("organization:end");
          return value;
        }),
      },
      pulseParticipation: {
        count: vi.fn(async () => {
          order.push("participation:start");
          const value = await participation.promise;
          order.push("participation:end");
          return value;
        }),
      },
      pulseResponse: {
        findMany: vi.fn(async () => {
          order.push("responses:start");
          order.push("responses:end");
          return [];
        }),
      },
    } as unknown as TenantClient;

    const resultPromise = getAggregateInputs(tx, "pulse-a");
    await vi.waitFor(() => expect(tx.organization.findUniqueOrThrow).toHaveBeenCalledOnce());
    expect(tx.pulseParticipation.count).not.toHaveBeenCalled();
    organization.resolve({ enpsMinimumResponses: 4 } as Organization);
    await vi.waitFor(() => expect(tx.pulseParticipation.count).toHaveBeenCalledOnce());
    expect(tx.pulseResponse.findMany).not.toHaveBeenCalled();
    participation.resolve(0);
    await vi.waitFor(() => expect(tx.pulseResponse.findMany).toHaveBeenCalledOnce());

    await expect(resultPromise).resolves.toMatchObject({
      pulseId: "pulse-a",
      minimumResponses: 4,
      recipientCount: 0,
      responses: [],
    });
    expect(order).toEqual([
      "organization:start",
      "organization:end",
      "participation:start",
      "participation:end",
      "responses:start",
      "responses:end",
    ]);
  });
});
