import { useSyncExternalStore } from "react";
import type { VoiceState } from "./voice";

type Entry = VoiceState & { candidateId: string; startedAt: number };
let current: Entry | null = null;
const listeners = new Set<() => void>();

export function setVoice(candidateId: string, state: VoiceState) {
  const prev = current?.candidateId === candidateId ? current : null;
  const startedAt = state.startedAt ?? prev?.startedAt ?? Date.now();
  current = {
    ...prev,
    ...state,
    candidateId,
    startedAt,
    durationSeconds:
      state.durationSeconds ??
      (state.ended ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : prev?.durationSeconds),
  };
  listeners.forEach((l) => l());
}

export function voiceSeconds(state: VoiceState | null, now: number) {
  if (!state) return 0;
  if (state.durationSeconds) return state.durationSeconds;
  if (state.startedAt) return Math.max(0, Math.floor((now - state.startedAt) / 1000));
  return 0;
}

export function callSeconds(
  c: { live: boolean; callStartedAt?: number; callDur: number },
  now: number,
  voice: VoiceState | null,
) {
  const overlay = voiceSeconds(voice, now);
  if (overlay) return overlay;
  return c.live && c.callStartedAt ? Math.floor((now - c.callStartedAt) / 1000) : c.callDur;
}

export function useVoice(candidateId: string | null): VoiceState | null {
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    () => (current && candidateId && current.candidateId === candidateId ? current : null),
  );
}
