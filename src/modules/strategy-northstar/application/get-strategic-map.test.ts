import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findStrategyStatements: vi.fn(),
  findNorthStar: vi.fn(),
  listPillarsWithLinks: vi.fn(),
  listLevers: vi.fn(),
}));

vi.mock("../../../shared/tenancy", () => ({
  withTenantForUser: vi.fn(
    async (_userId: string, callback: (tx: object) => Promise<unknown>) => callback({}),
  ),
}));
vi.mock("../../identity-org/application", () => ({
  requireActor: vi.fn(async () => ({ organizationId: "org-a" })),
}));
vi.mock("../../okrs/application", () => ({
  listObjectives: vi.fn(async () => []),
}));
vi.mock("../infrastructure/strategy-repo", () => ({
  findStrategyStatements: mocks.findStrategyStatements,
}));
vi.mock("../infrastructure/north-star-repo", () => ({
  findNorthStar: mocks.findNorthStar,
}));
vi.mock("../infrastructure/pillar-repo", () => ({
  listPillarsWithLinks: mocks.listPillarsWithLinks,
}));
vi.mock("../infrastructure/lever-repo", () => ({
  listLevers: mocks.listLevers,
}));

import { getStrategicMap } from "./get-strategic-map";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("getStrategicMap transaction query scheduling", () => {
  beforeEach(() => vi.clearAllMocks());

  it("waits for each tenant query before starting the next", async () => {
    const order: string[] = [];
    const strategy = deferred<{ vision: null; mission: null; values: string[] }>();
    const northStar = deferred<null>();
    const pillars = deferred<[]>();
    const levers = deferred<[]>();

    mocks.findStrategyStatements.mockImplementation(async () => {
      order.push("strategy:start");
      const value = await strategy.promise;
      order.push("strategy:end");
      return value;
    });
    mocks.findNorthStar.mockImplementation(async () => {
      order.push("north-star:start");
      const value = await northStar.promise;
      order.push("north-star:end");
      return value;
    });
    mocks.listPillarsWithLinks.mockImplementation(async () => {
      order.push("pillars:start");
      const value = await pillars.promise;
      order.push("pillars:end");
      return value;
    });
    mocks.listLevers.mockImplementation(async () => {
      order.push("levers:start");
      const value = await levers.promise;
      order.push("levers:end");
      return value;
    });

    const resultPromise = getStrategicMap({ actorClerkUserId: "user-a" }, {} as never);
    await vi.waitFor(() => expect(mocks.findStrategyStatements).toHaveBeenCalledOnce());
    strategy.resolve({ vision: null, mission: null, values: [] });
    await vi.waitFor(() => expect(mocks.findNorthStar).toHaveBeenCalledOnce());
    northStar.resolve(null);
    await vi.waitFor(() => expect(mocks.listPillarsWithLinks).toHaveBeenCalledOnce());
    pillars.resolve([]);
    await vi.waitFor(() => expect(mocks.listLevers).toHaveBeenCalledOnce());
    levers.resolve([]);

    await expect(resultPromise).resolves.toMatchObject({ pillars: [] });
    expect(order).toEqual([
      "strategy:start",
      "strategy:end",
      "north-star:start",
      "north-star:end",
      "pillars:start",
      "pillars:end",
      "levers:start",
      "levers:end",
    ]);
  });
});
