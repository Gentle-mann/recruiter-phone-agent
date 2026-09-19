export type CallStatus = "completed" | "no-answer" | "opted-out";

export interface Role {
  id: string;
  title: string;
  company: string;
  location: string;
  payRange: string;
  schedule: string;
  questions: string[];
}

export interface TranscriptTurn {
  id: string;
  speaker: "agent" | "candidate";
  text: string;
  timestamp: string;
}

export interface Evidence {
  topic: string;
  summary: string;
  turnIds: string[];
}

export interface Brief {
  summary: string;
  evidence: Evidence[];
  unknowns: string[];
  candidateQuestions: string[];
}

export interface Interview {
  id: string;
  mode: "demo";
  candidateName: string;
  roleId: string;
  status: CallStatus;
  durationSeconds: number;
  transcript: TranscriptTurn[];
  brief: Brief | null;
}
