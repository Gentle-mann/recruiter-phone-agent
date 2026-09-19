import type { Stage } from "./content";

export type Mode = "demo" | "live";

export type Role = {
  _id: string; name: string; team: string; openedAt: number; threshold: number;
  agent: string; contentKey: string; inProgress: number; total: number;
};
export type Candidate = {
  _id: string; roleId: string; name: string; loc: string; source: string; appliedAt: number; stage: Stage;
  app: number; soc: number; call: number; final: number; live: boolean; callStartedAt?: number; callDur: number;
  yrs: number; company: string; area: string; stack: string; repos: number; stars: number;
  socialsFound: boolean[]; noteIdx: number; taken: boolean;
};
export type Event = { _id: string; text: string; at: number; byRecruiter: boolean };
export type Note = { _id: string; text: string; at: number };
export type CandidateFull = Candidate & { events: Event[]; notes: Note[] };
export type NewRole = { name: string; team: string; threshold: number; agent: string; contentKey: string };

/** Everything the UI needs from a backend. Implemented by Convex (live) and an in-memory store (demo). */
export interface DataApi {
  mode: Mode;
  useRoles(): Role[] | undefined;
  useCandidates(roleId: string): Candidate[] | undefined;
  useCandidate(id: string | null): CandidateFull | null | undefined;
  advance(id: string): Promise<void>;
  reject(id: string): Promise<void>;
  setTaken(id: string, taken: boolean): Promise<void>;
  addNote(id: string, text: string): Promise<void>;
  createRole(r: NewRole): Promise<string>;
}
