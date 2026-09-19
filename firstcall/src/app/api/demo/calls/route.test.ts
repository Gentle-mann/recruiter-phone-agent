import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { POST as liveCall } from "../../calls/route";
import { POST as webhook } from "../../webhooks/elevenlabs/route";

describe("route boundaries", () => {
  it("rejects malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/calls", {
        method: "POST",
        body: "{",
      }),
    );
    expect(response.status).toBe(400);
  });
  it("rejects absent consent", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/calls", {
        method: "POST",
        body: JSON.stringify({ scenario: "completed" }),
      }),
    );
    expect(response.status).toBe(400);
  });
  it("returns a clearly labeled fictional outcome", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/calls", {
        method: "POST",
        body: JSON.stringify({ consent: true, scenario: "completed" }),
      }),
    );
    expect(response.status).toBe(201);
    expect((await response.json()).interview.mode).toBe("demo");
  });
  it("never enables live calls or acknowledges unprocessed webhooks", async () => {
    expect((await liveCall()).status).toBe(501);
    expect((await webhook()).status).toBe(501);
  });
});
