import { afterEach, describe, expect, it, vi } from "vitest";
import { createSession, previewStatus } from "./elevenlabs-session";

const config = { enabled: true, apiKey: "test-secret", agentId: "agent_test" };
const request = (
  origin = "http://127.0.0.1:3017",
  body: unknown = { consent: true },
) =>
  new Request("http://127.0.0.1:3017/api/elevenlabs/session", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
afterEach(() => vi.restoreAllMocks());
describe("ElevenLabs local preview boundary", () => {
  it("refuses cross-origin and non-loopback access before touching the provider", async () => {
    const provider = vi.fn();
    expect(
      (await createSession(request("https://evil.example"), config, provider))
        .status,
    ).toBe(403);
    expect(
      previewStatus(
        new Request("https://public.example/api/elevenlabs/status"),
        config,
      ).status,
    ).toBe(403);
    expect(provider).not.toHaveBeenCalled();
  });
  it("accepts Next's matching forwarded host and rejects a different proxy host", () => {
    const local = new Request("http://127.0.0.1:3017/api/elevenlabs/status", {
      headers: { host: "127.0.0.1:3017", "x-forwarded-host": "127.0.0.1:3017" },
    });
    expect(previewStatus(local, config).status).toBe(200);
    const proxy = new Request("http://127.0.0.1:3017/api/elevenlabs/status", {
      headers: { "x-forwarded-host": "public.example" },
    });
    expect(previewStatus(proxy, config).status).toBe(403);
  });
  it("handles Next normalizing the internal URL to localhost", async () => {
    const req = new Request("http://localhost:3017/api/elevenlabs/session", {
      method: "POST",
      headers: {
        host: "127.0.0.1:3017",
        "x-forwarded-host": "127.0.0.1:3017",
        origin: "http://127.0.0.1:3017",
      },
      body: JSON.stringify({ consent: true }),
    });
    const provider = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          signed_url: "wss://api.elevenlabs.io/v1/convai/conversation",
        }),
      );
    expect((await createSession(req, config, provider)).status).toBe(200);
  });
  it("requires explicit enablement, keys and acknowledgment", async () => {
    const provider = vi.fn();
    expect(
      (await createSession(request(), { ...config, enabled: false }, provider))
        .status,
    ).toBe(503);
    expect(
      (await createSession(request(), { ...config, apiKey: "" }, provider))
        .status,
    ).toBe(503);
    expect(
      (
        await createSession(
          request(undefined, { consent: false }),
          config,
          provider,
        )
      ).status,
    ).toBe(400);
    expect(provider).not.toHaveBeenCalled();
  });
  it("keeps secrets server-side and requests a single-use session", async () => {
    const provider = vi.fn().mockResolvedValue(
      Response.json({
        signed_url: "wss://api.elevenlabs.io/v1/convai/conversation?test=1",
      }),
    );
    const response = await createSession(request(), config, provider);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      signedUrl: "wss://api.elevenlabs.io/v1/convai/conversation?test=1",
    });
    expect(String(provider.mock.calls[0][0])).toContain(
      "include_conversation_id=true",
    );
    expect(provider.mock.calls[0][1].headers["xi-api-key"]).toBe("test-secret");
  });
  it("does not relay provider error bodies or invalid URLs", async () => {
    const failure = vi
      .fn()
      .mockResolvedValue(
        new Response("secret upstream details", { status: 401 }),
      );
    const response = await createSession(request(), config, failure);
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("secret");
    const invalid = vi
      .fn()
      .mockResolvedValue(
        Response.json({ signed_url: "wss://evil.example/steal" }),
      );
    expect((await createSession(request(), config, invalid)).status).toBe(502);
  });
  it("only exposes configuration status, never credential values", async () => {
    const response = previewStatus(
      new Request("http://127.0.0.1:3017/api/elevenlabs/status"),
      config,
    );
    expect(await response.json()).toEqual({
      configured: true,
      mode: "local-preview",
    });
  });
});
