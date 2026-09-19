import { elevenLabsConfig } from "@/server/elevenlabs-config";
import { createSession } from "@/server/elevenlabs-session";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return createSession(request, elevenLabsConfig());
}
