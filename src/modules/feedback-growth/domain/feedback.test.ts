import { describe, expect, it } from "vitest";

import { parseFeedback, parseFeedbackRequest } from "./feedback";
import { parseKudo } from "./kudo";

describe("Feedback", () => {
  it.each(["strength", "improvement"] as const)(
    "normalizes non-empty %s feedback",
    (classification) => {
      expect(
        parseFeedback({
          authorId: "member-author",
          recipientId: "member-recipient",
          body: "  Buen trabajo con el lanzamiento.  ",
          classification,
        }),
      ).toEqual({
        authorId: "member-author",
        recipientId: "member-recipient",
        body: "Buen trabajo con el lanzamiento.",
        classification,
      });
    },
  );

  it("rejects empty content, unknown classifications and self-feedback", () => {
    expect(() =>
      parseFeedback({
        authorId: "member-a",
        recipientId: "member-b",
        body: "   ",
        classification: "strength",
      }),
    ).toThrowError(expect.objectContaining({ code: "feedback-growth/invalid-feedback" }));

    expect(() =>
      parseFeedback({
        authorId: "member-a",
        recipientId: "member-b",
        body: "Texto",
        classification: "neutral",
      }),
    ).toThrowError(expect.objectContaining({ code: "feedback-growth/invalid-feedback" }));

    expect(() =>
      parseFeedback({
        authorId: "member-a",
        recipientId: "member-a",
        body: "Texto",
        classification: "strength",
      }),
    ).toThrowError(expect.objectContaining({ code: "feedback-growth/invalid-feedback" }));
  });
});

describe("FeedbackRequest", () => {
  it("normalizes a prompt between distinct Members", () => {
    expect(
      parseFeedbackRequest({
        requesterId: "member-a",
        requestedFromId: "member-b",
        prompt: "  ¿Qué puedo mejorar?  ",
      }),
    ).toEqual({
      requesterId: "member-a",
      requestedFromId: "member-b",
      prompt: "¿Qué puedo mejorar?",
    });
  });

  it("rejects an empty prompt and self-request", () => {
    expect(() =>
      parseFeedbackRequest({
        requesterId: "member-a",
        requestedFromId: "member-b",
        prompt: " ",
      }),
    ).toThrowError(expect.objectContaining({ code: "feedback-growth/invalid-request" }));
    expect(() =>
      parseFeedbackRequest({
        requesterId: "member-a",
        requestedFromId: "member-a",
        prompt: "Feedback",
      }),
    ).toThrowError(expect.objectContaining({ code: "feedback-growth/invalid-request" }));
  });
});

describe("Kudo", () => {
  it("normalizes a message and required Organization Value", () => {
    expect(
      parseKudo({
        giverId: "member-giver",
        recipientId: "member-recipient",
        message: "  Gracias por acompañar el incidente.  ",
        value: "  Ownership  ",
      }),
    ).toEqual({
      giverId: "member-giver",
      recipientId: "member-recipient",
      message: "Gracias por acompañar el incidente.",
      value: "Ownership",
    });
  });

  it("rejects an empty value and self-kudos", () => {
    expect(() =>
      parseKudo({
        giverId: "member-a",
        recipientId: "member-b",
        message: "Gracias",
        value: " ",
      }),
    ).toThrowError(expect.objectContaining({ code: "feedback-growth/invalid-kudo" }));

    expect(() =>
      parseKudo({
        giverId: "member-a",
        recipientId: "member-a",
        message: "Gracias",
        value: "Ownership",
      }),
    ).toThrowError(expect.objectContaining({ code: "feedback-growth/invalid-kudo" }));
  });
});
