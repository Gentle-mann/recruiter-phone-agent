import { useSyncExternalStore } from "react";

export type ScreenStep = { id: string; label: string; done: boolean; active: boolean };

export type ScreenState = {
  candidateId: string;
  stage: "application" | "socials";
  current: string;
  steps: ScreenStep[];
};

export const APPLICATION_STEPS = [
  { id: "resume", label: "Reading the résumé" },
  { id: "jd", label: "Checking match with the job description" },
  { id: "musts", label: "Scoring must-haves against the role" },
  { id: "knockouts", label: "Checking knockout questions" },
];

export const SOCIAL_STEPS = [
  { id: "li-find", label: "Finding LinkedIn" },
  { id: "li-check", label: "Checking LinkedIn tenure against the résumé" },
  { id: "ig-find", label: "Finding Instagram" },
  { id: "ig-check", label: "Checking Instagram for public activity" },
];

let current: ScreenState | null = null;
const listeners = new Set<() => void>();

export function setScreen(candidateId: string, stage: ScreenState["stage"], currentId: string, catalog: { id: string; label: string }[]) {
  const idx = catalog.findIndex((s) => s.id === currentId);
  current = {
    candidateId,
    stage,
    current: catalog[Math.max(0, idx)]?.label ?? "",
    steps: catalog.map((s, i) => ({
      ...s,
      done: i < idx,
      active: i === idx,
    })),
  };
  listeners.forEach((l) => l());
}

export function clearScreen(candidateId?: string) {
  if (candidateId && current && current.candidateId !== candidateId) return;
  current = null;
  listeners.forEach((l) => l());
}

export function useScreen(candidateId: string | null): ScreenState | null {
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    () => (current && candidateId && current.candidateId === candidateId ? current : null),
  );
}
