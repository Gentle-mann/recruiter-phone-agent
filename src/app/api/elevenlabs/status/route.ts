import { elevenLabsConfig } from "@/server/elevenlabs-config";
import { previewStatus } from "@/server/elevenlabs-session";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return previewStatus(request, elevenLabsConfig());
}
