import { describe, expect, it } from "vitest";

import { verifiedEmail } from "../verified-email";

import { createMockGateway } from "./gateway";
import { DEV_SESSION_COOKIE, setMockSessionUserId, type CookieStore } from "./session";

function fakeCookieStore() {
  const map = new Map<string, string>();
  const store: CookieStore = {
    get: (name) => map.get(name),
    set: (name, value) => {
      map.set(name, value);
    },
    delete: (name) => {
      map.delete(name);
    },
  };
  return { store, map };
}

describe("mock auth gateway contract (4.1)", () => {
  it("currentUser returns the Clerk-like shape verifiedEmail consumes", async () => {
    const { store } = fakeCookieStore();
    setMockSessionUserId(store, "dev_direccion");
    const user = await createMockGateway(store).currentUser();
    expect(user).not.toBeNull();
    expect(verifiedEmail(user!)).toBe("ceo@ensambla.dev");
  });

  it("auth returns the opaque userId", async () => {
    const { store } = fakeCookieStore();
    setMockSessionUserId(store, "dev_lider");
    const context = await createMockGateway(store).auth();
    expect(context.userId).toBe("dev_lider");
  });

  it("returns null / null userId without a session", async () => {
    const { store } = fakeCookieStore();
    const gateway = createMockGateway(store);
    expect(await gateway.currentUser()).toBeNull();
    expect((await gateway.auth()).userId).toBeNull();
  });

  it("treats an unknown cookie id as no session", async () => {
    const { store } = fakeCookieStore();
    store.set(DEV_SESSION_COOKIE, "dev_unknown", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    const gateway = createMockGateway(store);
    expect(await gateway.currentUser()).toBeNull();
  });
});
