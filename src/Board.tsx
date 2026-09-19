import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { CONTENT, STAGES, STAGE_LABEL, fmtAgo, fmtDur, initials, type Stage } from "./content";
import { useNow } from "./useNow";

type Role = Doc<"roles"> & { inProgress: number; total: number };
type Cand = Doc<"candidates">;

export function Pie({ v }: { v: number }) {
  const a = (Math.min(99.9, v) / 100) * 2 * Math.PI, R = 8;
  const x = 8 + R * Math.sin(a), y = 8 - R * Math.cos(a), big = v > 50 ? 1 : 0;
  return (
    <svg className="pie" viewBox="0 0 16 16">
      <circle className="bg" cx="8" cy="8" r="8" />
      <path className="fg" d={`M8 8 L8 0 A8 8 0 ${big} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`} />
    </svg>
  );
}
export const Wave = ({ still }: { still?: boolean }) => (
  <span className={"wave" + (still ? " still" : "")}><i /><i /><i /><i /><i /></span>
);

export const liveDur = (c: Cand, now: number) => (c.live && c.callStartedAt ? Math.floor((now - c.callStartedAt) / 1000) : c.callDur);

function CardRight({ c, role, now }: { c: Cand; role: Role; now: number }) {
  const i = STAGES.indexOf(c.stage);
  if (i === 0) return <span>{fmtAgo(now - c.appliedAt)}</span>;
  if (i === 1) return c.app % 3 === 0 ? <span className="thinking"><i /><i /><i /></span> : <span>{c.app}</span>;
  if (i === 2) {
    const keys = CONTENT[role.contentKey].social;
    return <span className="tags">{keys.map((k, j) => <span key={j} className={"tag" + (c.socialsFound[j] ? "" : " off")}>{k[0]}</span>)}</span>;
  }
  if (i === 3) return c.live ? <><Wave /><span className="dur">{fmtDur(liveDur(c, now))}</span></> : <span>{c.taken ? "yours" : "queued"}</span>;
  const low = c.final < role.threshold;
  return <span className={"score" + (low ? " low" : "")}>{c.final}<Pie v={c.final} /></span>;
}

function cardMeta(c: Cand, role: Role, now: number) {
  const i = STAGES.indexOf(c.stage);
  if (i === 0) return `${c.source} · ${c.loc}`;
  if (i === 1) return c.app % 3 === 0 ? "Reading résumé" : `${c.yrs} yrs · ${c.company}`;
  if (i === 2) return `${c.socialsFound.filter(Boolean).length} of 3 profiles found`;
  if (i === 3) return c.live ? `${role.agent} is on the call` : c.taken ? "You are calling" : "Calls at 14:00 local";
  return c.taken ? "You took over" : `Called ${fmtAgo(now - c.appliedAt)} ago · ${fmtDur(c.callDur)}`;
}

export function Board({ role, onOpen }: { role: Role; onOpen: (id: Id<"candidates">) => void }) {
  const cands = useQuery(api.candidates.listByRole, { roleId: role._id });
  const tick = useMutation(api.sim.tick);
  const setPaused = useMutation(api.roles.setPaused);
  const now = useNow();
  const [q, setQ] = useState("");

  // Demo simulation runs only while this board is open.
  useEffect(() => {
    const a = setInterval(() => tick({ roleId: role._id, add: false }), 4200);
    const b = setInterval(() => tick({ roleId: role._id, add: true }), 7600);
    return () => { clearInterval(a); clearInterval(b); };
  }, [role._id, tick]);

  // Track stage changes so moved cards get an entrance animation.
  const prev = useRef(new Map<string, Stage>());
  const entered = new Set<string>();
  for (const c of cands ?? []) { const p = prev.current.get(c._id); if (p !== undefined && p !== c.stage) entered.add(c._id); if (p === undefined && prev.current.size) entered.add(c._id); }
  useEffect(() => { prev.current = new Map((cands ?? []).map((c) => [c._id, c.stage])); });

  const list = (cands ?? []).filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()));
  const live = (cands ?? []).filter((c) => c.stage === "call" && c.live).length;
  const openedAgo = fmtAgo(now - role.openedAt);

  const Card = ({ c }: { c: Cand }) => {
    const i = STAGES.indexOf(c.stage);
    return (
      <button className={"card" + (entered.has(c._id) ? " enter" : "")} onClick={() => onOpen(c._id)}>
        <span className={`av s${i}`}>{initials(c.name)}</span>
        <span className="who"><span className="name">{c.name}</span><span className="meta">{cardMeta(c, role, now)}</span></span>
        <span className="side-r"><CardRight c={c} role={role} now={now} /></span>
      </button>
    );
  };

  return (
    <section className="view active">
      <header className="top">
        <div>
          <h1>{role.name}</h1>
          <p className="sub">{role.team} · opened {openedAgo.replace(/d$/, " days")} ago · {cands?.length ?? 0} applications</p>
        </div>
        <div className="top-actions">
          <span className="live-pill"><span className="dot" /><span>{live === 1 ? "1 call in progress" : `${live} calls in progress`}</span></span>
          <label className="search">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" /></svg>
            <input placeholder="Find a candidate" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <button className="btn" onClick={() => setPaused({ roleId: role._id, paused: !role.paused })}>{role.paused ? "Resume agent" : "Pause agent"}</button>
        </div>
      </header>
      <div className="board">
        {STAGES.map((s, i) => {
          let items = list.filter((c) => c.stage === s);
          let body;
          if (s === "scored") {
            items = items.sort((a, b) => b.final - a.final);
            const hi = items.filter((c) => c.final >= role.threshold), lo = items.filter((c) => c.final < role.threshold);
            body = <>{hi.map((c) => <Card key={c._id} c={c} />)}{lo.length > 0 && <div className="rule">below {role.threshold}</div>}{lo.map((c) => <Card key={c._id} c={c} />)}</>;
          } else if (s === "call") {
            items = items.sort((a, b) => Number(b.live) - Number(a.live));
            body = items.map((c) => <Card key={c._id} c={c} />);
          } else {
            items = items.sort((a, b) => b.appliedAt - a.appliedAt);
            body = items.map((c) => <Card key={c._id} c={c} />);
          }
          return (
            <div key={s} className={`col s${i}`}>
              <div className="col-h"><span className="t">{STAGE_LABEL[s]}</span><span className="c">{items.length}</span></div>
              <div className="col-body">{items.length ? body : <div className="empty">Nobody here right now</div>}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
