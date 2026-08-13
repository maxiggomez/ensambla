import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import * as cultureEnps from "./index";

describe("culture-enps public API anonymity 🔒", () => {
  it("does not export an individual PulseResponse read", () => {
    const exports = Object.keys(cultureEnps).sort();

    expect(exports).toEqual(
      [
        "DRIVERS",
        "analyzeTeamEnps",
        "configureMinimumResponses",
        "configurePulseSchedule",
        "generateDuePulses",
        "getCultureEnpsSettings",
        "getEnpsResults",
        "launchPulse",
        "listPendingPulses",
        "listPulseResults",
        "submitPulseResponse",
      ].sort(),
    );
  });

  it("keeps server actions free of individual response reads", () => {
    const actions = readFileSync(
      join(process.cwd(), "src/app/(app)/culture-enps/actions.ts"),
      "utf8",
    );
    const exportedActions = [...actions.matchAll(/export async function (\w+)/g)].map(
      ([, name]) => name,
    );

    expect(exportedActions.sort()).toEqual(
      [
        "configureMinimumResponsesAction",
        "configurePulseScheduleAction",
        "launchPulseAction",
        "submitPulseResponseAction",
      ].sort(),
    );
    expect(actions).not.toMatch(/(?:get|find|list)IndividualPulseResponse/);
  });

  it("has no individual response route and returns only an opaque submit receipt", () => {
    expect(existsSync(join(process.cwd(), "src/app/api/culture-enps/responses"))).toBe(false);
    expect(existsSync(join(process.cwd(), "src/app/(app)/api/culture-enps/responses"))).toBe(
      false,
    );

    const submit = readFileSync(join(__dirname, "submit-pulse-response.ts"), "utf8");
    expect(submit).toContain("Promise<{ submitted: true }>");
    expect(submit).not.toContain("responseId");
  });
});
