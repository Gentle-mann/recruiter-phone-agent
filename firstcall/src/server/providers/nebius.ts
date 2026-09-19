import "server-only";
import {
  IntegrationNotConfiguredError,
  type AnalysisProvider,
} from "./contracts";

/** Future endpoint: https://api.tokenfactory.nebius.com/v1/chat/completions */
export const nebiusProvider: AnalysisProvider = {
  async prepareQuestions() {
    throw new IntegrationNotConfiguredError("Nebius");
  },
  async extractBrief() {
    throw new IntegrationNotConfiguredError("Nebius");
  },
};
