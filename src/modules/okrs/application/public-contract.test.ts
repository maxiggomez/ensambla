import { describe, expect, it } from "vitest";

import { getKeyResultContext, listKeyResultContexts, MAX_EVIDENCE_FILE_BYTES } from ".";

describe("OKR public application contract", () => {
  it("exposes the evidence file limit through the public module API", () => {
    expect(MAX_EVIDENCE_FILE_BYTES).toBe(5 * 1024 * 1024);
  });

  it("exposes KeyResult context reads for other bounded contexts", () => {
    expect(getKeyResultContext).toBeTypeOf("function");
    expect(listKeyResultContexts).toBeTypeOf("function");
  });
});
