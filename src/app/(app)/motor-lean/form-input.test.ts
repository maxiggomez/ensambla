import { describe, expect, it } from "vitest";

import {
  parseCloseExperimentForm,
  parseCreateExperimentForm,
  parseStartMeasuringForm,
} from "./form-input";

describe("Motor Lean FormData boundary", () => {
  it("rejects absent hypothesis fields instead of converting them to text", () => {
    const form = new FormData();
    form.set("keyResultId", "kr-1");
    form.set("belief", "belief");
    expect(() => parseCreateExperimentForm(form)).toThrow();
  });

  it.each([undefined, "rating"])("rejects an absent or unknown metric type: %s", (type) => {
    const form = new FormData();
    form.set("experimentId", "experiment-1");
    form.set("cutoffAt", "2026-09-30");
    if (type) form.set("measurementType", type);
    expect(() => parseStartMeasuringForm(form)).toThrow();
  });

  it("rejects absent numeric metric values instead of coercing them to zero", () => {
    const form = new FormData();
    form.set("experimentId", "experiment-1");
    form.set("measurementType", "percentage");
    form.set("cutoffAt", "2026-09-30");
    expect(() => parseStartMeasuringForm(form)).toThrow();
  });

  it("rejects absent structured learning fields", () => {
    const form = new FormData();
    form.set("experimentId", "experiment-1");
    form.set("believed", "belief");
    form.set("tested", "test");
    form.set("decision", "pivot");
    expect(() => parseCloseExperimentForm(form)).toThrow();
  });
});
