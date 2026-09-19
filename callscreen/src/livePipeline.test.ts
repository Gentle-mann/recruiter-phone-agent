import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { settleLiveCall } from "./settleLiveCall.ts";
import type { VoiceState } from "./voice.ts";

const ended: VoiceState = {
  status: "completed",
  step: "closed",
  ended: true,
  turns: [{ id: "opening", label: "Opening", prompt: "Hi?", answer: "Yes." }],
};

describe("settleLiveCall", () => {
  it("scores from the transcript when completeScreen works", async () => {
    const screened: string[] = [];
    const completed: string[] = [];
    await settleLiveCall(
      "c1",
      ended,
      68,
      async (id) => { screened.push(id); },
      async (id) => { completed.push(id); },
    );
    assert.deepEqual(completed, ["c1"]);
    assert.deepEqual(screened, []);
  });

  it("advances to scored if completeScreen is missing or throws", async () => {
    const screened: string[] = [];
    await settleLiveCall("c2", ended, 68, async (id) => { screened.push(id); });
    assert.deepEqual(screened, ["c2"]);

    const screenedAfterThrow: string[] = [];
    await settleLiveCall(
      "c3",
      ended,
      68,
      async (id) => { screenedAfterThrow.push(id); },
      async () => { throw new Error("Convex mutation not deployed"); },
    );
    assert.deepEqual(screenedAfterThrow, ["c3"]);
  });

  it("still advances when the call produced no turns", async () => {
    const screened: string[] = [];
    await settleLiveCall(
      "c4",
      { ...ended, turns: [] },
      12,
      async (id) => { screened.push(id); },
      async () => { throw new Error("should not run"); },
    );
    assert.deepEqual(screened, ["c4"]);
  });
});
