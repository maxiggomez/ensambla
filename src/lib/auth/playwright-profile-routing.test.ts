import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MOCK_AUTH_SPECS = [
  "dev-auth",
  "app-shell",
  "strategy-northstar",
  "okrs",
  "culture-enps",
  "lean-experiments",
  "feedback-growth",
] as const;

function configuredPattern(source: string, property: "testIgnore" | "testMatch"): RegExp {
  const match = source.match(new RegExp(`${property}:\\s*\\/(.+)\\/,`));
  if (!match) throw new Error(`Missing ${property} regexp in Playwright config`);
  return new RegExp(match[1]);
}

describe("Playwright auth profile routing", () => {
  it("routes every mock-auth spec away from Clerk and into dev-auth", () => {
    const standard = readFileSync(join(process.cwd(), "playwright.config.ts"), "utf8");
    const devAuth = readFileSync(join(process.cwd(), "playwright.dev-auth.config.ts"), "utf8");
    const standardIgnore = configuredPattern(standard, "testIgnore");
    const devAuthMatch = configuredPattern(devAuth, "testMatch");

    for (const spec of MOCK_AUTH_SPECS) {
      const file = `${spec}.spec.ts`;
      expect(standardIgnore.test(file), `${file} must not run against Clerk`).toBe(true);
      expect(devAuthMatch.test(file), `${file} must run in dev-auth`).toBe(true);
    }
  });
});
