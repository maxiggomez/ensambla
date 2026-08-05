import { describe, expect, it } from "vitest";

import * as cultureEnps from "./index";

describe("culture-enps public API anonymity 🔒", () => {
  it("does not export an individual PulseResponse read", () => {
    const exports = Object.keys(cultureEnps);

    expect(exports).not.toContain("getPulseResponse");
    expect(exports).not.toContain("findPulseResponse");
    expect(exports).not.toContain("listPulseResponses");
    expect(exports.some((name) => /individual.*response/i.test(name))).toBe(false);
  });
});
