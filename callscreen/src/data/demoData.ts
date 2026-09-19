import { useEffect, useMemo, useSyncExternalStore } from "react";
import { makeCandidate, NAMES, rng, STAGES, type Stage } from "../../convex/content";
import { summarizeScreen } from "../../convex/screenSummary";
import type { Candidate, CandidateFull, DataApi, Event, NewRole, Note, Role, ScreenTurns } from "../types";

/**
 * Demo mode: an in-memory copy of the product with a simulation that adds
 * applicants and moves people through stages. Nothing here reaches Convex.
 */
type RoleRow = Omit<Role, "inProgress" | "total">;
type EventRow = Event & { candidateId: string };
type NoteRow = Note & { candidateId: string };

const SEED_ROLES = [
  { name: "Backend Engineer", team: "Platform", openedDaysAgo: 12, threshold: 70, agent: "June", contentKey: "be" },
  { name: "Product Designer", team: "Design", openedDaysAgo: 5, threshold: 70, agent: "June", contentKey: "pd" },
  { name: "Account Executive", team: "Sales", openedDaysAgo: 19, threshold: 65, agent: "Adrian", contentKey: "ae" },
];
const DIST: Record<Stage, number> = { applied: 6, application: 5, socials: 4, call: 3, scored: 9 };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const dur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

class DemoStore {
  roles: RoleRow[] = [];
  cands: Candidate[] = [];
  events: EventRow[] = [];
  notes: NoteRow[] = [];
  private n = 0;
  private listeners = new Set<() => void>();
  private cache: { roles?: Role[]; byRole: Record<string, Candidate[]>; full: Record<string, CandidateFull | null> } = { byRole: {}, full: {} };
  private timers: number[] = [];

  constructor() { this.seed(); }
  private id(p: string) { return `${p}${++this.n}`; }

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private emit() { this.cache = { byRole: {}, full: {} }; this.listeners.forEach((l) => l()); }

  getRoles(): Role[] {
    return (this.cache.roles ??= this.roles.map((r) => {
      const cs = this.cands.filter((c) => c.roleId === r._id);
      return { ...r, inProgress: cs.filter((c) => c.stage !== "scored").length, total: cs.length };
    }));
  }
  getCandidates(roleId: string): Candidate[] {
    return (this.cache.byRole[roleId] ??= this.cands.filter((c) => c.roleId === roleId));
  }
  getCandidate(id: string): CandidateFull | null {
    if (id in this.cache.full) return this.cache.full[id];
    const c = this.cands.find((x) => x._id === id);
    const full = c ? { ...c, events: this.events.filter((e) => e.candidateId === id).sort((a, b) => b.at - a.at), notes: this.notes.filter((x) => x.candidateId === id) } : null;
    return (this.cache.full[id] = full);
  }

  private event(candidateId: string, text: string, at = Date.now(), byRecruiter = false) {
    this.events.push({ _id: this.id("e"), candidateId, text, at, byRecruiter });
  }

  private seed() {
    const now = Date.now();
    let seed = 1234;
    for (const r of SEED_ROLES) {
      const roleId = this.id("r");
      this.roles.push({ _id: roleId, slug: slugify(r.name), name: r.name, team: r.team, openedAt: now - r.openedDaysAgo * 86_400_000, threshold: r.threshold, agent: r.agent, contentKey: r.contentKey });
      const rand = rng(seed); seed += 97;
      const names = NAMES.slice().sort(() => rand() - .5);
      let i = 0;
      for (const st of STAGES) for (let k = 0; k < DIST[st]; k++) {
        const c = makeCandidate(r.contentKey, names[i++], rand, st, now, k);
        const id = this.id("c");
        this.cands.push({ ...c, _id: id, roleId });
        const sIdx = STAGES.indexOf(st);
        const ev = (t: string, m: number) => this.event(id, t, c.appliedAt + m * 60_000);
        ev(`Applied via ${c.source}`, 0);
        if (sIdx >= 1) ev("Résumé parsed, 3 roles found", 5);
        if (sIdx >= 2) ev(`Application scored <b>${c.app}</b>`, 12);
        if (sIdx >= 3) { ev(`Socials checked, ${c.socialsFound.filter(Boolean).length} of 3 found`, 25); ev(`Text sent: "${r.agent} from Callscreen will call tomorrow at 14:00"`, 30); }
        if (sIdx >= 4 || c.live) { ev("Call attempt 1, no answer, voicemail left", 48); ev(c.live ? "Call connected, in progress" : `Call connected, ${dur(c.callDur)}`, 50); }
        if (sIdx >= 4) { ev(`Scored <b>${c.final}</b>${c.final < r.threshold ? ", below the bar" : ", above the bar"}`, 56); if (c.final >= r.threshold) ev(`Summary sent to #hiring-${r.team.toLowerCase()}`, 56); }
      }
    }
  }

  start() {
    if (this.timers.length) return;
    this.timers = [
      window.setInterval(() => this.tick(false), 4200),
      window.setInterval(() => this.tick(true), 7600),
    ];
  }
  stop() { this.timers.forEach(clearInterval); this.timers = []; }

  private tick(add: boolean) {
    const now = Date.now();
    if (add) {
      const role = this.roles[Math.floor(Math.random() * this.roles.length)];
      if (!role) return;
      const used = new Set(this.cands.filter((c) => c.roleId === role._id).map((c) => c.name));
      const name = NAMES.find((n) => !used.has(n));
      if (!name) return;
      const c = makeCandidate(role.contentKey, name, rng((now % 100000) + 1), "applied", now, 0);
      c.appliedAt = now;
      const id = this.id("c");
      this.cands.push({ ...c, _id: id, roleId: role._id });
      this.event(id, `Applied via ${c.source}`, now);
      this.emit();
      return;
    }
    const pool = this.cands.filter((c) => c.stage !== "scored" && !c.taken && !(c.stage === "call" && !c.live && Math.random() < .6));
    const c = pool[Math.floor(Math.random() * pool.length)];
    if (!c) return;
    const role = this.roles.find((r) => r._id === c.roleId)!;
    const next = STAGES[STAGES.indexOf(c.stage) + 1];
    let text = "";
    if (next === "application") text = "Résumé parsed, 3 roles found";
    if (next === "socials") text = `Application scored <b>${c.app}</b>`;
    if (next === "call") { c.live = Math.random() < .5; c.callStartedAt = c.live ? now : undefined; text = `Socials checked, ${c.socialsFound.filter(Boolean).length} of 3 found`; }
    if (next === "scored") { if (c.callStartedAt) c.callDur = Math.max(90, Math.round((now - c.callStartedAt) / 1000)); c.live = false; text = `Scored <b>${c.final}</b>${c.final < role.threshold ? ", below the bar" : ", above the bar"}`; }
    c.stage = next;
    this.event(c._id, text, now);
    this.emit();
  }

  advance(id: string) {
    const c = this.cands.find((x) => x._id === id); if (!c) return;
    const i = STAGES.indexOf(c.stage); if (i >= STAGES.length - 1) return;
    c.stage = STAGES[i + 1]; c.live = false;
    this.event(id, `<b>You</b> moved ${c.name.split(" ")[0]} to ${c.stage}`, Date.now(), true);
    this.emit();
  }
  reject(id: string) {
    this.cands = this.cands.filter((c) => c._id !== id);
    this.events = this.events.filter((e) => e.candidateId !== id);
    this.notes = this.notes.filter((n) => n.candidateId !== id);
    this.emit();
  }
  addNote(id: string, text: string) {
    if (!text.trim()) return;
    this.notes.push({ _id: this.id("n"), candidateId: id, text: text.trim(), at: Date.now() });
    this.emit();
  }
  completeScreen(id: string, result: ScreenTurns) {
    const c = this.cands.find((x) => x._id === id); if (!c) return;
    const summary = summarizeScreen({
      turns: result.turns,
      authorized: c.authorized,
      startDate: c.startDate,
      note: c.note,
      loc: c.loc,
      linkedin: c.linkedin,
      website: c.website,
      yrs: c.yrs,
      company: c.company,
      area: c.area,
      stack: c.stack,
      repos: c.repos,
    });
    c.app = summary.scores.app;
    c.soc = summary.scores.soc;
    c.call = summary.scores.call;
    c.final = summary.scores.final;
    c.callDur = result.callDur;
    c.live = false;
    c.stage = "scored";
    c.callTurns = result.turns;
    this.event(id, `Scored <b>${c.final}</b>${c.final < 70 ? ", below the bar" : ", above the bar"} from the call`);
    this.emit();
  }
  createRole(r: NewRole) {
    const _id = this.id("r");
    this.roles.push({ _id, slug: slugify(r.name), name: r.name, team: r.team, openedAt: Date.now(), threshold: r.threshold, agent: r.agent, contentKey: r.contentKey });
    this.emit();
    return _id;
  }
}

const store = new DemoStore();

export function useDemoData(): DataApi {
  useEffect(() => { store.start(); return () => store.stop(); }, []);
  return useMemo<DataApi>(() => ({
    mode: "demo",
    useRoles: () => useSyncExternalStore(store.subscribe, () => store.getRoles()),
    useCandidates: (roleId) => useSyncExternalStore(store.subscribe, () => store.getCandidates(roleId)),
    useCandidate: (id) => useSyncExternalStore(store.subscribe, () => (id ? store.getCandidate(id) : null)),
    advance: async (id) => store.advance(id),
    reject: async (id) => store.reject(id),
    addNote: async (id, text) => store.addNote(id, text),
    completeScreen: async (id, result) => store.completeScreen(id, result),
    createRole: async (r) => store.createRole(r),
  }), []);
}
