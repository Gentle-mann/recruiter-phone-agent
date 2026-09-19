import { z } from "zod";
import { sampleRole, sampleBrief, sampleTranscript } from "./fixtures";
import type { Interview } from "./types";

export const demoRequestSchema = z
  .object({
    consent: z.literal(true),
    scenario: z.enum(["completed", "no-answer", "opted-out"]),
  })
  .strict();

export type DemoRequest = z.infer<typeof demoRequestSchema>;

/** Produces fictional fixtures only. Never calls a provider or dials a number. */
export function createDemoInterview(input: DemoRequest): Interview {
  const request = demoRequestSchema.parse(input);
  const completed = request.scenario === "completed";
  return {
    id: `demo-${crypto.randomUUID()}`,
    mode: "demo",
    candidateName: "Jordan Lee",
    roleId: sampleRole.id,
    status: request.scenario,
    durationSeconds: completed ? 108 : 0,
    transcript: completed ? structuredClone(sampleTranscript) : [],
    brief: completed ? structuredClone(sampleBrief) : null,
  };
}
