import { z } from "zod";

export type PreviewConfig = {
  enabled: boolean;
  apiKey: string;
  agentId: string;
};
const payload = z.object({ consent: z.literal(true) }).strict();
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const ready = (config: PreviewConfig) =>
  Boolean(config.enabled && config.apiKey && config.agentId);
function localRequest(request: Request, write = false) {
  const url = new URL(request.url);
  const loopback = (hostname: string) =>
    ["127.0.0.1", "localhost", "[::1]"].includes(hostname);
  if (url.protocol !== "http:" || !loopback(url.hostname)) return false;
  // Next normalizes request.url to localhost even when the browser uses 127.0.0.1.
  // Validate the actual Host independently, then compare Origin to that authority.
  const host = request.headers.get("host") || url.host;
  let incoming: URL;
  try {
    incoming = new URL(`http://${host}`);
  } catch {
    return false;
  }
  if (
    !loopback(incoming.hostname) ||
    incoming.host !== host ||
    incoming.port !== url.port ||
    incoming.username ||
    incoming.password
  )
    return false;
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (
    request.headers.has("forwarded") ||
    (forwardedHost && forwardedHost !== host)
  )
    return false;
  return !write || request.headers.get("origin") === incoming.origin;
}
export function previewStatus(request: Request, config: PreviewConfig) {
  if (!localRequest(request))
    return json({ error: "This preview is only available on localhost." }, 403);
  return json({ configured: ready(config), mode: "local-preview" });
}
export async function createSession(
  request: Request,
  config: PreviewConfig,
  provider: typeof fetch = fetch,
) {
  if (!localRequest(request, true))
    return json(
      { error: "This preview requires a same-origin localhost request." },
      403,
    );
  if (!ready(config))
    return json(
      {
        error:
          "Add the ElevenLabs API key and agent ID to .env.local, enable the local preview, then restart the server.",
      },
      503,
    );
  try {
    const body = await request.text();
    if (body.length > 512 || !payload.safeParse(JSON.parse(body)).success)
      return json(
        { error: "Acknowledge ElevenLabs processing before starting." },
        400,
      );
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  try {
    const url = new URL(
      "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url",
    );
    url.searchParams.set("agent_id", config.agentId);
    url.searchParams.set("include_conversation_id", "true");
    const response = await provider(url, {
      headers: { "xi-api-key": config.apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      return json(
        {
          error:
            "ElevenLabs could not authorize a session. Check the API key permissions and agent configuration.",
        },
        502,
      );
    const result = z
      .object({ signed_url: z.string().url() })
      .parse(await response.json());
    const signed = new URL(result.signed_url);
    if (
      signed.protocol !== "wss:" ||
      signed.hostname !== "api.elevenlabs.io" ||
      signed.username ||
      signed.password
    )
      throw new Error("Invalid provider response");
    return json({ signedUrl: result.signed_url });
  } catch {
    return json(
      { error: "Could not connect to ElevenLabs. Please try again." },
      502,
    );
  }
}
