import { callFinished, fetchVoiceState, placeVoiceCall, type VoiceState } from "./voice";
import { setVoice } from "./voiceStore";
import { APPLICATION_STEPS, SOCIAL_STEPS, clearScreen, setScreen } from "./screenStore";
import { WALK_STORAGE, type Walkthrough } from "./walkChannel";
import { settleLiveCall } from "./settleLiveCall";

const started = new Set<string>();
const LOCK = "callscreen.screening";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const STEP_MS = 900;

function claim(id: string) {
  if (started.has(id)) return false;
  try {
    const ids: string[] = JSON.parse(sessionStorage.getItem(LOCK) || "[]");
    if (ids.includes(id)) return false;
    ids.push(id);
    sessionStorage.setItem(LOCK, JSON.stringify(ids));
  } catch {
    /* ignore quota / private mode */
  }
  started.add(id);
  return true;
}

function stillRinging(state: VoiceState) {
  return ["queued", "ringing", "in-progress", "dialing", "initiated"].includes(state.status)
    || (state.step !== "closed" && state.step !== "idle");
}

async function playSteps(
  candidateId: string,
  stage: "application" | "socials",
  catalog: { id: string; label: string }[],
) {
  for (const step of catalog) {
    setScreen(candidateId, stage, step.id, catalog);
    await wait(STEP_MS);
  }
}

/** Auto-plays Application → Socials → Phone call, dials, then scores when the call ends. */
export async function runLiveScreening(
  msg: Walkthrough,
  screen: (id: string) => Promise<void>,
  complete?: (id: string, result: { turns: VoiceState["turns"]; callDur: number }) => Promise<void>,
) {
  if (!claim(msg.candidateId)) return;
  localStorage.removeItem(WALK_STORAGE);

  await screen(msg.candidateId);
  await playSteps(msg.candidateId, "application", APPLICATION_STEPS);
  await screen(msg.candidateId);
  await playSteps(msg.candidateId, "socials", SOCIAL_STEPS);
  clearScreen(msg.candidateId);
  await screen(msg.candidateId);

  const startedAt = Date.now();
  setVoice(msg.candidateId, { status: "dialing", step: "opening", turns: [], startedAt });
  let latest = await placeVoiceCall(msg.name);
  setVoice(msg.candidateId, { ...latest, startedAt });
  if (latest.error) return;

  await new Promise<void>((resolve) => {
    let sawLive = stillRinging(latest);
    const poll = window.setInterval(async () => {
      const next = await fetchVoiceState();
      if (!next) return;
      if (next.turns.length || !latest.turns.length) latest = next;
      setVoice(msg.candidateId, { ...next, startedAt, turns: next.turns.length ? next.turns : latest.turns });
      if (stillRinging(next)) sawLive = true;
      if (callFinished(next) || (sawLive && next.status === "idle" && next.step === "idle")) {
        clearInterval(poll);
        resolve();
      }
    }, 800);
  });

  const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  setVoice(msg.candidateId, {
    ...latest,
    startedAt,
    durationSeconds,
    ended: true,
    status: latest.status === "idle" ? "completed" : latest.status,
  });
  await settleLiveCall(msg.candidateId, latest, durationSeconds, screen, complete);
}
