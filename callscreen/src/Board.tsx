import { useEffect, useRef, useState } from "react";
import { CONTENT, BOARD_STAGES, STAGE_LABEL, boardStage, fmtAgo, fmtDur, initials, type Stage } from "./content";
import { useNow } from "./useNow";
import { useData } from "./data";
import { SocialIcon } from "./icons";
import { ApplyLink } from "./ApplyLink";
import { ModeSwitch } from "./ModeSwitch";
import { useVoice, callSeconds } from "./voiceStore";
import { useScreen } from "./screenStore";
import { settleLiveCall } from "./settleLiveCall";
import type { Candidate as Cand, Role } from "./types";

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

function CardRight({ c, role, calling, seconds, screen }: {
  c: Cand; role: Role; calling: boolean; seconds: number; screen: ReturnType<typeof useScreen>;
}) {
  const stage = boardStage(c.stage);
  if (stage === "application") return screen ? <span className="thinking"><i /><i /><i /></span> : (c.app % 3 === 0 ? <span className="thinking"><i /><i /><i /></span> : <span>{c.app}</span>);
  if (stage === "socials") {
    const live = screen?.stage === "socials";
    const keys = live
      ? [["in", "LinkedIn"], ["ig", "Instagram"]] as [string, string][]
      : CONTENT[role.contentKey].social;
    return (
      <span className="tags">{keys.map((k, j) => {
        const on = live
          ? screen!.steps.some((s) => s.id.startsWith(j === 0 ? "li-" : "ig-") && (s.done || s.active))
          : c.socialsFound[j];
        return <span key={k[0] + j} className={"tag" + (on ? "" : " off")} title={k[1]}><SocialIcon k={k[0]} /></span>;
      })}</span>
    );
  }
  if (stage === "call") return calling ? <><Wave /><span className="dur">{fmtDur(seconds)}</span></> : <span>{c.taken ? "yours" : "queued"}</span>;
  const low = c.final < role.threshold;
  return <span className={"score" + (low ? " low" : "")}>{c.final}<Pie v={c.final} /></span>;
}

function cardMeta(c: Cand, role: Role, now: number, calling: boolean, seconds: number, screenCurrent?: string) {
  const stage = boardStage(c.stage);
  if (stage === "application") return screenCurrent || (c.app % 3 === 0 ? "Reading résumé" : `${c.yrs} yrs · ${c.company}`);
  if (stage === "socials") return screenCurrent || `${c.socialsFound.filter(Boolean).length} of 3 profiles found`;
  if (stage === "call") return calling ? `${role.agent} is on the call` : c.taken ? "You are calling" : "Calls at 14:00 local";
  return c.taken ? "You took over" : `Called ${fmtAgo(now - c.appliedAt)} ago · ${fmtDur(seconds)}`;
}

export function Board({ role, onOpen }: { role: Role; onOpen: (id: string) => void }) {
  const { data } = useData();
  const cands = data.useCandidates(role._id);
  const now = useNow();
  const [q, setQ] = useState("");

  const prev = useRef(new Map<string, Stage>());
  const entered = new Set<string>();
  for (const c of cands ?? []) { const p = prev.current.get(c._id); if (p !== undefined && p !== c.stage) entered.add(c._id); if (p === undefined && prev.current.size) entered.add(c._id); }
  useEffect(() => { prev.current = new Map((cands ?? []).map((c) => [c._id, c.stage])); });

  const list = (cands ?? []).filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()));
  const openedAgo = fmtAgo(now - role.openedAt);

  const Card = ({ c }: { c: Cand }) => {
    const stage = boardStage(c.stage);
    const bi = BOARD_STAGES.indexOf(stage);
    const voice = useVoice(c._id);
    const screen = useScreen(c._id);
    const calling = c.live || (stage === "call" && !!voice && !voice.ended);
    const seconds = callSeconds(c, now, voice);
    const first = c.name.split(" ")[0];
    const settled = useRef(false);
    useEffect(() => {
      if (stage !== "call" || !voice?.ended || settled.current) return;
      settled.current = true;
      void settleLiveCall(
        c._id,
        voice,
        voice.durationSeconds || 0,
        (id) => data.advance(id),
        data.completeScreen,
      );
    }, [c._id, stage, voice, data]);
    return (
      <button className={"card" + (entered.has(c._id) ? " enter" : "")} onClick={() => onOpen(c._id)}>
        <span className={`av s${bi}`}>{initials(c.name)}</span>
        <span className="who">
          <span className="name">{c.name}</span>
          <span className="meta">{cardMeta(c, role, now, calling, seconds, screen?.current)}</span>
          {screen && (
            <ol className="card-steps">
              {screen.steps.map((s) => (
                <li key={s.id} className={s.done ? "done" : s.active ? "on" : ""}>
                  <span className="mark">{s.done ? "✓" : s.active ? "→" : "·"}</span>
                  {s.label}
                </li>
              ))}
            </ol>
          )}
          {calling && voice && !voice.error && (
            <div className="card-live">
              <div className="step">{voice.ask?.label || "Dialing"}</div>
              {voice.ask && <div className="q">{role.agent}: {voice.ask.prompt}</div>}
              <div className="a">{first}: {voice.turns.find((t) => t.id === voice.ask?.id)?.answer
                || (voice.status === "dialing" || voice.status === "queued" || voice.status === "ringing" ? "Ringing…" : "Listening…")}</div>
            </div>
          )}
        </span>
        <span className="side-r"><CardRight c={c} role={role} calling={calling} seconds={seconds} screen={screen} /></span>
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
          <ApplyLink />
          <label className="search">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" /></svg>
            <input placeholder="Find a candidate" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <ModeSwitch />
        </div>
      </header>
      <div className="board">
        {BOARD_STAGES.map((s, i) => {
          let items = list.filter((c) => boardStage(c.stage) === s);
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
