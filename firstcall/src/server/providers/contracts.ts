import type { Brief, Role, TranscriptTurn } from "@/lib/types";

export interface CallRequest {
  applicationId: string;
  attemptId: string;
  phoneNumber: string;
  consentRecordId: string;
  role: Role;
}

export interface VoiceProvider {
  startCall(
    request: CallRequest,
  ): Promise<{ conversationId: string; callSid: string }>;
}

export interface AnalysisProvider {
  prepareQuestions(role: Role): Promise<string[]>;
  extractBrief(role: Role, transcript: TranscriptTurn[]): Promise<Brief>;
}

export class IntegrationNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider} is not connected in this scaffold.`);
    this.name = "IntegrationNotConfiguredError";
  }
}
