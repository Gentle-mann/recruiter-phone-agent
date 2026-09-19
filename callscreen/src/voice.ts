/** Body sent to Flask. Never includes to_number — Flask keeps TWILIO_TO. */
export function voiceCallBody(candidateName: string) {
  return { candidate_name: candidateName };
}

export type VoiceTurn = {
  id: string;
  label: string;
  prompt: string;
  answer: string | null;
};

export type VoiceAsk = {
  id: string;
  label: string;
  prompt: string;
};

export type VoiceState = {
  status: string;
  step: string;
  error?: string;
  turns: VoiceTurn[];
  ask?: VoiceAsk;
  lastAnswer?: string | null;
  startedAt?: number;
  durationSeconds?: number;
  ended?: boolean;
};

const STEP_COPY: Record<string, VoiceAsk> = {
  opening: { id: "opening", label: "Opening", prompt: "Is now a good time for a quick chat?" },
  eligibility: {
    id: "eligibility",
    label: "Eligibility",
    prompt: "This is a full-time role, and we need authorization to work in the United States. Does that work for you?",
  },
  thesis: {
    id: "thesis",
    label: "Experience",
    prompt: "On your resume you mentioned you re-architected the payments ledger. What was breaking before, and what did you personally own?",
  },
  questions: { id: "questions", label: "Your questions", prompt: "Do you have any questions for me before we wrap up?" },
};

const FINISHED = new Set([
  "completed",
  "busy",
  "failed",
  "no-answer",
  "canceled",
  "cancelled",
]);

export function callFinished(state: VoiceState) {
  if (state.error) return false;
  return state.step === "closed" || FINISHED.has(state.status);
}

type FlaskState = {
  error?: string;
  candidate_name?: string;
  ask?: VoiceAsk | null;
  script?: VoiceAsk[];
  call?: {
    status?: string;
    step?: string;
    turns?: VoiceTurn[];
    candidate_name?: string;
  } | null;
  status?: string;
  step?: string;
  turns?: VoiceTurn[];
};

function askFor(data: FlaskState, step: string): VoiceAsk | undefined {
  if (data.ask && data.ask.id === step) return data.ask;
  const fromScript = data.script?.find((s) => s.id === step);
  if (fromScript) {
    const name = data.call?.candidate_name || data.candidate_name || "";
    return {
      id: fromScript.id,
      label: fromScript.label,
      prompt: fromScript.prompt.replace("{name}", name),
    };
  }
  return STEP_COPY[step];
}

function asVoiceState(data: FlaskState, fallbackStatus = "queued"): VoiceState {
  const call = data.call ?? (data.status || data.step || data.turns ? data : null);
  const status = call?.status || fallbackStatus;
  const step = call?.step || "opening";
  const turns = call?.turns ?? [];
  const last = turns.length ? turns[turns.length - 1] : undefined;
  return {
    status,
    step,
    turns,
    ask: step === "closed" || step === "idle" ? undefined : askFor(data, step),
    lastAnswer: last?.answer ?? null,
  };
}

async function readJson(res: Response): Promise<FlaskState> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as FlaskState;
  } catch {
    return { error: "Voice agent returned an unexpected response." };
  }
}

export async function placeVoiceCall(candidateName: string): Promise<VoiceState> {
  try {
    const res = await fetch("/voice/api/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voiceCallBody(candidateName)),
      signal: AbortSignal.timeout(20000),
    });
    const data = await readJson(res);
    if (!res.ok) {
      return {
        status: "error",
        step: "idle",
        error: data.error || "Start python app.py so the voice agent can dial.",
        turns: [],
      };
    }
    return asVoiceState(data);
  } catch {
    return {
      status: "error",
      step: "idle",
      error: "Start python app.py so the voice agent can dial.",
      turns: [],
    };
  }
}

export async function fetchVoiceState(): Promise<VoiceState | null> {
  try {
    const res = await fetch("/voice/api/state", { signal: AbortSignal.timeout(8000) });
    const data = await readJson(res);
    if (!res.ok) return null;
    if (!data.call && !data.status) return { status: "idle", step: "idle", turns: [] };
    return asVoiceState(data, data.call ? data.call.status || "queued" : data.status || "idle");
  } catch {
    return null;
  }
}
