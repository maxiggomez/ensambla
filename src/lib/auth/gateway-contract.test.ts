import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(__dirname, "..", "..");
const CLERK_SERVER_PKG = "@clerk/nextjs/server";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(full);
    }
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") ? [full] : [];
  });
}

function hasRuntimeClerkServerImport(source: string): boolean {
  return new RegExp(`import\\s+(?!type\\b)[\\s\\S]*?from\\s+["']${CLERK_SERVER_PKG}["']`).test(
    source,
  );
}

function isAuthGatewayFile(relative: string): boolean {
  return relative === "proxy.ts" || relative.startsWith("lib/auth/");
}

describe("auth gateway contract (dev-auth-mock)", () => {
  const scanned = sourceFiles(SRC_ROOT);
  const guarded = scanned.filter(
    (file) => !isAuthGatewayFile(file.replace(`${SRC_ROOT}/`, "")),
  );
  const offenders = guarded.filter((file) =>
    hasRuntimeClerkServerImport(readFileSync(file, "utf8")),
  );

  it("scans app code outside lib/auth and proxy", () => {
    expect(guarded.length).toBeGreaterThan(0);
  });

  for (const file of offenders) {
    const relative = file.replace(`${SRC_ROOT}/`, "");
    it(`keeps ${relative} on the auth gateway (@/lib/auth)`, () => {
      expect(hasRuntimeClerkServerImport(readFileSync(file, "utf8"))).toBe(false);
    });
  }
});
