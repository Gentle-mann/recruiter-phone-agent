import "server-only";
export function elevenLabsConfig() {
  return {
    enabled: process.env.ELEVENLABS_LOCAL_PREVIEW === "true",
    apiKey: process.env.ELEVENLABS_API_KEY?.trim() || "",
    agentId: process.env.ELEVENLABS_AGENT_ID?.trim() || "",
  };
}
