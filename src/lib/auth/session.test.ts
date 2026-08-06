import { describe, expect, it } from "vitest";

import {
  clearMockSessionUserId,
  DEV_SESSION_COOKIE,
  getMockSessionUserId,
  setMockSessionUserId,
  type CookieStore,
} from "./session";

interface SetCall {
  name: string;
  value: string;
  options: { httpOnly: boolean; path: string; maxAge: number };
}

function fakeCookieStore() {
  const map = new Map<string, string>();
  const setCalls: SetCall[] = [];
  const store: CookieStore = {
    get: (name) => map.get(name),
    set: (name, value, options) => {
      map.set(name, value);
      setCalls.push({ name, value, options });
    },
    delete: (name) => {
      map.delete(name);
    },
  };
  return { store, map, setCalls };
}

describe("mock session cookie (3.1)", () => {
  it("stores and reads the dev user id as an httpOnly cookie", () => {
    const { store, setCalls } = fakeCookieStore();
    setMockSessionUserId(store, "dev_direccion");
    expect(getMockSessionUserId(store)).toBe("dev_direccion");
    expect(setCalls[0]).toMatchObject({
      name: DEV_SESSION_COOKIE,
      value: "dev_direccion",
      options: { httpOnly: true },
    });
  });

  it("switching user replaces the session", () => {
    const { store } = fakeCookieStore();
    setMockSessionUserId(store, "dev_direccion");
    setMockSessionUserId(store, "dev_lider");
    expect(getMockSessionUserId(store)).toBe("dev_lider");
  });

  it("clearing removes the session", () => {
    const { store } = fakeCookieStore();
    setMockSessionUserId(store, "dev_direccion");
    clearMockSessionUserId(store);
    expect(getMockSessionUserId(store)).toBeUndefined();
  });

  it("returns undefined without a session", () => {
    const { store } = fakeCookieStore();
    expect(getMockSessionUserId(store)).toBeUndefined();
  });

  it("ignores unknown cookie names", () => {
    const { store } = fakeCookieStore();
    store.set("other", "x", { httpOnly: false, path: "/", maxAge: 0 });
    expect(getMockSessionUserId(store)).toBeUndefined();
  });

  it("rejects setting a non-dev user id", () => {
    const { store } = fakeCookieStore();
    expect(() => setMockSessionUserId(store, "user_2notdev")).toThrow();
  });
});
