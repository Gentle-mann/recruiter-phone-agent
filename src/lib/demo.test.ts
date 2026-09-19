import { describe, expect, it } from "vitest";
import { createDemoInterview, demoRequestSchema } from "./demo";

describe("demo interview boundary", () => {
  it("requires affirmative demo consent", () => {
    expect(
      demoRequestSchema.safeParse({ consent: false, scenario: "completed" })
        .success,
    ).toBe(false);
    expect(demoRequestSchema.safeParse({ scenario: "completed" }).success).toBe(
      false,
    );
  });

  it("rejects unsupported scenarios", () => {
    expect(
      demoRequestSchema.safeParse({ consent: true, scenario: "auto-hire" })
        .success,
    ).toBe(false);
  });

  it("produces evidence references that point to candidate transcript turns", () => {
    const interview = createDemoInterview({
      consent: true,
      scenario: "completed",
    });
    expect(interview.mode).toBe("demo");
    expect(interview.brief?.evidence.length).toBeGreaterThan(0);
    for (const evidence of interview.brief!.evidence) {
      for (const turnId of evidence.turnIds) {
        expect(
          interview.transcript.find((turn) => turn.id === turnId)?.speaker,
        ).toBe("candidate");
      }
    }
  });

  it("never generates a brief from an unanswered call", () => {
    const interview = createDemoInterview({
      consent: true,
      scenario: "no-answer",
    });
    expect(interview.status).toBe("no-answer");
    expect(interview.brief).toBeNull();
    expect(interview.transcript).toEqual([]);
  });

  it("keeps opt-out distinct from candidate assessment", () => {
    const interview = createDemoInterview({
      consent: true,
      scenario: "opted-out",
    });
    expect(interview.status).toBe("opted-out");
    expect(interview.brief).toBeNull();
  });
});
