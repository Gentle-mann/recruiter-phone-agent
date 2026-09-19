import type { Role, TranscriptTurn, Brief, Interview } from "./types";

export const sampleRole: Role = {
  id: "role-support",
  title: "Customer Support Associate",
  company: "Northstar Studio",
  location: "San Francisco · Hybrid",
  payRange: "$24–28 / hour",
  schedule: "Monday–Friday, 9am–5pm Pacific",
  questions: [
    "Tell me about a time you helped an upset customer.",
    "Which support tools have you used, and what did you use them for?",
    "What is your availability, and when could you start?",
  ],
};

export const sampleTranscript: TranscriptTurn[] = [
  {
    id: "t1",
    speaker: "agent",
    timestamp: "00:00",
    text: "This is a fictional demo conversation with an AI assistant. Tell me about a time you helped an upset customer.",
  },
  {
    id: "t2",
    speaker: "candidate",
    timestamp: "00:12",
    text: "A customer was upset about a delayed order. I checked with our shipping team and found a replacement we could send that day.",
  },
  {
    id: "t3",
    speaker: "agent",
    timestamp: "00:29",
    text: "What did you personally do to keep the customer informed?",
  },
  {
    id: "t4",
    speaker: "candidate",
    timestamp: "00:35",
    text: "I called them back with the tracking number, then followed up the next morning to check that it arrived. They thanked me for keeping them updated.",
  },
  {
    id: "t5",
    speaker: "agent",
    timestamp: "00:52",
    text: "Which support tools have you used?",
  },
  {
    id: "t6",
    speaker: "candidate",
    timestamp: "00:58",
    text: "I used Zendesk for tickets and Shopify to check orders for about two years. I have not managed a support team.",
  },
  {
    id: "t7",
    speaker: "agent",
    timestamp: "01:14",
    text: "What is your availability, and when could you start?",
  },
  {
    id: "t8",
    speaker: "candidate",
    timestamp: "01:20",
    text: "The weekday schedule works for me. I could start two weeks after an offer. Are the two office days fixed or flexible?",
  },
  {
    id: "t9",
    speaker: "agent",
    timestamp: "01:35",
    text: "I do not have the office-day policy. I will include that question in the brief for the recruiter.",
  },
];

export const sampleBrief: Brief = {
  summary:
    "Jordan described handling a delayed order with proactive follow-up, reported two years using support tools, and confirmed weekday availability.",
  evidence: [
    {
      topic: "Customer care",
      summary:
        "Coordinated a replacement order and personally followed up with tracking and a next-day check-in.",
      turnIds: ["t2", "t4"],
    },
    {
      topic: "Tools & experience",
      summary:
        "Reports about two years using Zendesk and Shopify. Has not managed a support team.",
      turnIds: ["t6"],
    },
    {
      topic: "Availability",
      summary: "Weekday schedule works. Could start two weeks after an offer.",
      turnIds: ["t8"],
    },
  ],
  unknowns: [
    "Experience and employment history have not been independently verified.",
    "Hybrid office-day requirements need clarification.",
  ],
  candidateQuestions: ["Are the two office days fixed or flexible?"],
};

export const initialInterviews: Interview[] = [
  {
    id: "demo-jordan",
    mode: "demo",
    candidateName: "Jordan Lee",
    roleId: sampleRole.id,
    status: "completed",
    durationSeconds: 108,
    transcript: sampleTranscript,
    brief: sampleBrief,
  },
  {
    id: "demo-alex",
    mode: "demo",
    candidateName: "Alex Morgan",
    roleId: sampleRole.id,
    status: "no-answer",
    durationSeconds: 0,
    transcript: [],
    brief: null,
  },
  {
    id: "demo-taylor",
    mode: "demo",
    candidateName: "Taylor Reed",
    roleId: sampleRole.id,
    status: "opted-out",
    durationSeconds: 0,
    transcript: [],
    brief: null,
  },
];
