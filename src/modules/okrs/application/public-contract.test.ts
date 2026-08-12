import { describe, expect, it } from "vitest";

import { MAX_EVIDENCE_FILE_BYTES } from ".";

describe("OKR public application contract", () => {
  it("exposes the evidence file limit through the public module API", () => {
    expect(MAX_EVIDENCE_FILE_BYTES).toBe(5 * 1024 * 1024);
  });
});
