import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { callFinished, voiceCallBody } from "./voice.ts";

describe("voice call proxy payload", () => {
  it("sends only the candidate name and never a destination number", () => {
    const body = voiceCallBody("Jordan Lee");
    assert.deepEqual(body, { candidate_name: "Jordan Lee" });
    assert.equal("to_number" in body, false);
    assert.equal("from_number" in body, false);
    assert.equal("auth_token" in body, false);
  });
});

describe("callFinished", () => {
  it("stays live while Twilio is ringing or in progress", () => {
    assert.equal(callFinished({ status: "queued", step: "opening", turns: [] }), false);
    assert.equal(callFinished({ status: "ringing", step: "opening", turns: [] }), false);
    assert.equal(callFinished({ status: "in-progress", step: "background", turns: [] }), false);
  });

  it("ends when Twilio completes or the script closes", () => {
    assert.equal(callFinished({ status: "completed", step: "opening", turns: [] }), true);
    assert.equal(callFinished({ status: "in-progress", step: "closed", turns: [] }), true);
    assert.equal(callFinished({ status: "no-answer", step: "opening", turns: [] }), true);
  });
});

