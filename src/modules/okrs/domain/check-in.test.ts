import { describe, expect, it } from "vitest";

import { applyCheckInValue, isAtRisk, validateConfidence, validateEvidence } from "./check-in";

describe("OKR check-ins", () => {
  it("accepts confidence from 0 through 10", () => {
    expect(validateConfidence(0)).toBe(0);
    expect(validateConfidence(10)).toBe(10);
    expect(() => validateConfidence(-1)).toThrowError(
      expect.objectContaining({ code: "okrs/invalid-confidence" }),
    );
    expect(() => validateConfidence(11)).toThrowError(
      expect.objectContaining({ code: "okrs/invalid-confidence" }),
    );
  });

  it("rejects a value that mismatches the KeyResult Measurement", () => {
    expect(() =>
      applyCheckInValue(
        { measurementType: "percentage", startValue: 0, targetValue: 100 },
        true,
      ),
    ).toThrowError(expect.objectContaining({ code: "okrs/value-type-mismatch" }));
  });

  it("applies a typed value while preserving the Measurement definition", () => {
    expect(
      applyCheckInValue({ measurementType: "integer", startValue: 0, targetValue: 10 }, 4),
    ).toEqual({
      measurementType: "integer",
      startValue: 0,
      targetValue: 10,
      currentValue: 4,
    });
  });

  it("derives risk from the latest confidence", () => {
    expect(
      isAtRisk([
        { confidence: 3, createdAt: new Date("2026-01-01T00:00:00.000Z") },
        { confidence: 7, createdAt: new Date("2026-01-02T00:00:00.000Z") },
      ]),
    ).toBe(false);
    expect(
      isAtRisk([
        { confidence: 7, createdAt: new Date("2026-01-01T00:00:00.000Z") },
        { confidence: 4, createdAt: new Date("2026-01-02T00:00:00.000Z") },
      ]),
    ).toBe(true);
    expect(isAtRisk([])).toBe(false);
  });

  it("accepts HTTPS link evidence", () => {
    expect(validateEvidence({ kind: "link", url: "https://example.com/proof" })).toEqual({
      kind: "link",
      url: "https://example.com/proof",
    });
    expect(() => validateEvidence({ kind: "link", url: "http://example.com" })).toThrowError(
      expect.objectContaining({ code: "okrs/invalid-evidence" }),
    );
  });

  it("accepts files up to 5 MiB and rejects larger files", () => {
    const valid = {
      kind: "file" as const,
      fileName: "reporte.pdf",
      mediaType: "application/pdf",
      bytes: new Uint8Array(5 * 1024 * 1024),
    };
    expect(validateEvidence(valid)).toBe(valid);
    expect(() =>
      validateEvidence({ ...valid, bytes: new Uint8Array(5 * 1024 * 1024 + 1) }),
    ).toThrowError(expect.objectContaining({ code: "okrs/evidence-too-large" }));
  });
});
