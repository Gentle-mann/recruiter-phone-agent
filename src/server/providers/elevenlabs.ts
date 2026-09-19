import "server-only";
import { IntegrationNotConfiguredError, type VoiceProvider } from "./contracts";

/** Implement after auth, durable consent, attempt storage, and dial deduplication. */
export const elevenLabsProvider: VoiceProvider = {
  async startCall() {
    throw new IntegrationNotConfiguredError("ElevenLabs");
  },
};
