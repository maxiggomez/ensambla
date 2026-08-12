import { describe, expect, it } from "vitest";

import { verifiedEmail } from "../verified-email";

import {
  DEV_USERS,
  findMockUserById,
  mockUserAsClerkUser,
  type MockDevUser,
} from "./mock-users";

describe("mock dev users registry (1.1)", () => {
  it("exposes the preset users with dev ids, verified emails and full names", () => {
    expect(DEV_USERS).toHaveLength(4);
    for (const user of DEV_USERS) {
      expect(user.id).toMatch(/^dev_/);
      expect(mockUserAsClerkUser(user).id).toBe(user.id);
      expect(verifiedEmail(mockUserAsClerkUser(user))).toBe(user.email);
      expect(user.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("covers the three roles, con el invitado sin seedear", () => {
    const roles = DEV_USERS.map((user: MockDevUser) => user.role).sort();
    expect(roles).toEqual(["Colaborador", "Colaborador", "Direccion", "Lider"]);
    const seeded = DEV_USERS.filter((user: MockDevUser) => user.seeded === false);
    expect(seeded).toHaveLength(1);
    expect(seeded[0].id).toBe("dev_invitado");
  });

  it("resolves a preset user by id and returns undefined for unknown ids", () => {
    expect(findMockUserById(DEV_USERS[0].id)).toBe(DEV_USERS[0]);
    expect(findMockUserById("dev_unknown")).toBeUndefined();
  });
});
