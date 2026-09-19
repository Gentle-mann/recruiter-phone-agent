import { useEffect, useRef, useState } from "react";
import { useData } from "./data";
import { MailIcon, PhoneIcon, ResumeIcon, SocialIcon, LinkedInIcon } from "./icons";
import type { Role } from "./types";
import { CONTENT, BOARD_STAGES, STAGES, TZ, fill, fmtAgo, fmtDur, hash, initials, pr, boardStage } from "./content";
import { summarizeScreen } from "../convex/screenSummary";
import { fetchVoiceState } from "./voice";
import { useVoice, callSeconds, setVoice } from "./voiceStore";
import { useScreen } from "./screenStore";
import { settleLiveCall } from "./settleLiveCall";
import { useNow } from "./useNow";

const Ico = ({ d }: { d: string }) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" dangerouslySetInnerHTML={{ __html: d }} />;

export function Drawer({ id, role, onClose }: { id: string | null; role: Role | null; onClose: () => void }) {
  const { data } = useData();
  const c = data.useCandidate(id);
  const advance = (a: { id: string }) => data.advance(a.id);
  const reject = (a: { id: string }) => data.reject(a.id);
  const addNote = (a: { id: string; text: string }) => data.addNote(a.id, a.text);
  const now = useNow();
  const voice = useVoice(id);
  const screen = useScreen(id);
  const seconds = c ? callSeconds(c, now, voice) : 0;
  const calling = !!(c && (c.live || (STAGES.indexOf(c.stage) === 3 && voice && !voice.ended)));
  const body = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState("p-overview");
  const [note, setNote] = useState("");

  useEffect(() => { if (id && body.current) { body.current.scrollTop = 0; setTab("p-overview"); setNote(""); } }, [id]);
  useEffect(() => {
    if (!id || !c || voice?.turns?.length || c.callTurns?.length) return;
    let cancelled = false;
    void fetchVoiceState().then((state) => {
      if (cancelled || !state?.turns?.length) return;
      if (state.candidateName && state.candidateName !== c.name) return;
      setVoice(id, { ...state, ended: true, status: state.status === "idle" ? "completed" : state.status });
    });
    return () => { cancelled = true; };
  }, [id, c, voice]);
  useEffect(() => {
    if (!id || !c || c.stage !== "call" || !voice?.ended) return;
    void settleLiveCall(
      id,
      voice,
      voice.durationSeconds || 0,
      (cid) => data.advance(cid),
      data.completeScreen,
    );
  }, [id, c, voice, data]);

  const open = !!id;
  if (!c || !role) {
    return (
      <aside className={"drawer" + (open ? " open" : "")} aria-label="Candidate profile">
        <div className="d-top"><button className="icon-btn" onClick={onClose} aria-label="Close"><Ico d='<path d="M4 4l8 8M12 4l-8 8"/>' /></button></div>
        <div className="d-body" ref={body}>{open && <div className="loading">Loading…</div>}</div>
      </aside>
    );
  }

  const ct = CONTENT[role.contentKey];
  const i = STAGES.indexOf(c.stage);
  const bi = BOARD_STAGES.indexOf(boardStage(c.stage));
  const has = (k: number) => i >= k;
  const first = c.name.split(" ")[0];
  const title = ct.titles[hash(c._id) % ct.titles.length];
  const email = c.email ?? c.name.toLowerCase().replace(/[^a-z ]/g, "").replace(" ", ".") + "@gmail.com";
  const phone = c.phone || `+351 91 ${200 + hash(c._id) % 700} ${100 + hash(c._id) % 900}`;
  const fromForm = c.source === "Careers page";
  const tz = TZ[c.loc] ?? "GMT";
  const agoMs = now - c.appliedAt;
  const P = (k: number) => pr(c._id, k);
  const turns = (voice?.turns?.length ? voice.turns : c.callTurns) ?? [];
  const summary = turns.length ? summarizeScreen({
    turns,
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
  }) : null;
  const scores = summary && (c.final === 0 || fromForm) ? summary.scores : { app: c.app, soc: c.soc, call: c.call, final: c.final };
  const low = scores.final < role.threshold;

  // ---- next step ----
  let next: React.ReactNode, nextBtns: React.ReactNode = null, nextClass = `s${i}`;
  if (screen?.stage === "application") next = <><b>{screen.current}.</b> Matching this application against the {role.name} job description.</>;
  else if (screen?.stage === "socials") next = <><b>{screen.current}.</b> Checking LinkedIn and Instagram against the résumé.</>;
  else if (i === 0 || i === 1) next = i === 0
    ? <><b>{role.agent} is reading the application.</b> Checking match with the job description.</>
    : <><b>Next: socials check.</b> Application scored {scores.app}, above the bar.</>;
  else if (i === 2) { next = <><b>Next: {role.agent} calls today at 14:00 {first}'s time.</b> A summary lands here within minutes of the call.</>; nextBtns = <button className="btn">Reschedule</button>; }
  else if (i === 3 && calling) {
    next = voice?.error
      ? <><b>Call did not start.</b> {voice.error}</>
      : <><b>Step: {voice?.ask?.label || voice?.step || "Call"}.</b> {voice?.ask ? `${role.agent} is asking: ${voice.ask.prompt}` : `${role.agent} is on the phone with ${first} now.`} {fmtDur(seconds)} so far.</>;
    nextBtns = <button className="btn">Listen in</button>;
    nextClass += " live";
  }
  else if (i === 3) { next = <><b>Call queued for 14:00 {first}'s time.</b> Text sent yesterday, {first} confirmed.</>; nextBtns = <button className="btn">Reschedule</button>; }
  else if (!low) { next = <><b>Waiting on you.</b> Above the bar. Book the interview with Mark?</>; nextBtns = <button className="btn primary">Book interview</button>; nextClass = "you"; }
  else { next = <><b>Decline email goes out in 18 hours</b> unless you override.</>; nextBtns = <button className="btn">Keep in process</button>; }

  // ---- verdict ----
  const label = !has(4) ? (calling ? "On the call now" : "Not scored yet") : low ? "Below the bar" : scores.final >= 85 ? "Strong match" : "Worth a look";
  const headline = has(4) ? (low ? "Probably not this one." : scores.final >= 85 ? "Book the interview." : "Worth fifteen minutes of your time.") : "Still in progress.";
  const why = !has(4) ? `${role.agent} writes a summary here after the call.` : summary ? summary.why : low ? `${ct.concerns[0]} ${ct.strengths[1]}` : `${ct.strengths[0]} ${ct.concerns[P(9) > .5 ? 0 : 1]}`;
  const Brow = ({ l, v, ok, k }: { l: string; v: number; ok: boolean; k: number }) => (
    <div className={`brow k${k}` + (ok ? "" : " pending")}><span>{l}</span><span className="track"><span className="fill" style={{ width: `${ok ? v : 0}%` }} /></span><b>{ok ? v : "–"}</b></div>
  );

  // ---- rubric ----
  const verdictFor = (k: number) => { const x = P(k) * 0.6 + (c.final - 55) / 60; return x > .55 ? "met" : x > .3 ? "partial" : "no"; };
  const hashedRubric = ct.rubric.map(([name, kind, src, texts], k) => {
    const pending = !has(1) || (src.startsWith("call") && !has(4)) || (src === "GitHub" && !has(3)) || (src === "portfolio" && !has(3));
    if (pending) return <div key={k} className="rub"><span className="v unclear">Not yet</span><div><b>{name}</b>{kind === "nice" && <span className="nice">nice to have</span>}<p>Checked at the {src.startsWith("call") ? "call" : src} stage.</p></div></div>;
    const v = verdictFor(k);
    return <div key={k} className="rub"><span className={`v ${v}`}>{v === "met" ? "Met" : v === "partial" ? "Partial" : "Not met"}</span><div><b>{name}</b>{kind === "nice" && <span className="nice">nice to have</span>}<span className="src">{src}</span><p>{fill(texts[v === "met" ? 0 : v === "partial" ? 1 : 2], c)}</p></div></div>;
  });
  const rubric = summary && has(4)
    ? summary.rubric.map((row) => (
      <div key={row.name} className="rub">
        <span className={`v ${row.verdict}`}>{row.verdict === "met" ? "Met" : row.verdict === "partial" ? "Partial" : "Not met"}</span>
        <div><b>{row.name}</b>{row.kind === "nice" && <span className="nice">nice to have</span>}<span className="src">{row.src}</span><p>{row.detail}</p></div>
      </div>
    ))
    : hashedRubric;

  // ---- flags ----
  const flags: [string, string][] = summary && has(4) ? [...summary.flags] : [];
  if (!summary) {
    if (has(4)) { if (P(21) > .6) flags.push(["Salary at top of band", "warn"]); if (P(22) > .7) flags.push(["Notice period 3 months", "warn"]); if (P(23) > .5) flags.push(["In another final round", "warn"]); }
    if (has(2) && P(24) > .7) flags.push(["Gap in 2023, unexplained", ""]);
  }
  if (c.source === "Referral") flags.push(["Referred by Anna R.", ""]);

  // ---- logistics ----
  const lg = ct.logistics;
  const KV = ({ k, v, warn }: { k: string; v: string; warn?: boolean }) => <div><small>{k}</small><span className={warn ? "warn" : ""}>{v}</span></div>;

  // ---- call ----
  const bars = Array.from({ length: 64 }, (_, k) => <i key={k} style={{ height: 4 + Math.round(Math.abs(Math.sin(k * 1.7 + hash(c._id))) * 16) }} className={k < 40 ? "on" : ""} />);
  const stamps = ["0:12", "1:48", "3:41", "5:10"];

  // ---- activity ----
  const events = c.events.length ? c.events : [];

  const goto = (pid: string) => { const t = body.current?.querySelector<HTMLElement>("#" + pid); if (t && body.current) body.current.scrollTo({ top: t.offsetTop - 40, behavior: "smooth" }); setTab(pid); };
  const onScroll = () => {
    const el = body.current; if (!el) return;
    const parts = [...el.querySelectorAll<HTMLElement>(".d-part")];
    let cur = parts[0]; for (const p of parts) if (p.offsetTop <= el.scrollTop + 60) cur = p;
    if (cur && cur.id !== tab) setTab(cur.id);
  };
  const saveNote = () => { if (note.trim()) { addNote({ id: c._id, text: note }); setNote(""); } };

  return (
    <aside className={"drawer" + (open ? " open" : "")} aria-label="Candidate profile">
      <div className="d-top">
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Ico d='<path d="M4 4l8 8M12 4l-8 8"/>' /></button>
        <div className="btns">
          <button className="btn danger" onClick={() => { reject({ id: c._id }); onClose(); }}>Reject</button>
          <button className="btn primary" onClick={() => { if (i < 4) advance({ id: c._id }); }}>{has(4) ? "Book interview" : "Advance"}</button>
          <button className="icon-btn" aria-label="More"><svg viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="13" cy="8" r="1.3" /></svg></button>
        </div>
      </div>
      <div className="d-body" ref={body} onScroll={onScroll}>
        <div className="d-head">
          <span className={`av big s${bi}`}>{initials(c.name)}</span>
          <div><h2>{c.name}</h2><p>{fromForm ? "" : `${title} at ${c.company} · `}{c.loc}, {tz} · applied {fmtAgo(agoMs)} ago via {c.source.toLowerCase()}</p></div>
        </div>
        <div className="links">
          {(!fromForm || c.resumeUrl) && <a href={c.resumeUrl ?? "#"} target={c.resumeUrl ? "_blank" : undefined} rel="noreferrer"><ResumeIcon />Résumé</a>}
          {(!fromForm || c.linkedin) && <a href={c.linkedin ?? "#"} target={c.linkedin ? "_blank" : undefined} rel="noreferrer"><LinkedInIcon />LinkedIn</a>}
          {fromForm ? (c.website && <a href={c.website} target="_blank" rel="noreferrer"><SocialIcon k={/github\.com/.test(c.website) ? "gh" : "web"} />{/github\.com/.test(c.website) ? "GitHub" : "Website"}</a>)
            : (c.socialsFound[0] && ct.social[0][0] !== "in" && <a href="#"><SocialIcon k={ct.social[0][0]} />{ct.social[0][1]}</a>)}
          <a href={`mailto:${email}`}><MailIcon />{email}</a>{phone && <a href={`tel:${phone}`}><PhoneIcon />{phone}</a>}
        </div>
        <div className={`next ${nextClass}`}><span className="dot" /><span className="t">{next}</span><span className="btns">{nextBtns}</span></div>

        <nav className="d-tabs">
          {[["p-overview", "Overview"], ["p-call", "Call"], ["p-background", "Background"], ["p-activity", "Activity"]].map(([pid, l]) => (
            <a key={pid} href={"#" + pid} className={tab === pid ? "on" : ""} onClick={(e) => { e.preventDefault(); goto(pid); }}>{l}</a>
          ))}
        </nav>

        <section className="d-part" id="p-overview">
          <div className="verdict">
            <div className={"big" + (!has(4) ? " none" : low ? " low" : "")}>{has(4) ? scores.final : "–"}<small>{label}</small></div>
            <div className="why"><b>{headline}</b><p>{why}</p>
              <div className="breakdown"><Brow l="Application" v={scores.app} ok={has(2)} k={1} /><Brow l="Socials" v={scores.soc} ok={has(3)} k={2} /><Brow l="Phone call" v={scores.call} ok={has(4)} k={3} /></div>
            </div>
          </div>
          {has(4) && (
            <div className="pm">
              <div><h4><i style={{ background: "var(--sage)" }} />Strengths</h4><ul>{(summary?.strengths ?? ct.strengths).map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><h4><i style={{ background: "var(--below)" }} />Concerns</h4><ul>{(summary?.concerns ?? ct.concerns).map((x) => <li key={x}>{x}</li>)}</ul></div>
            </div>
          )}
          {flags.length > 0 && <div className="flags">{flags.map((f) => <span key={f[0]} className={`flag ${f[1]}`}>{f[0]}</span>)}</div>}
          {fromForm && (
            <>
              <h2>From the application</h2>
              <div className="kv">
                <div><small>Work authorization</small><span className={c.authorized === false ? "warn" : ""}>{c.authorized ? "Authorized to work in the US" : "Needs US sponsorship"}</span></div>
                <div><small>Earliest start</small><span>{c.startDate || "–"}</span></div>
                {c.note && <div style={{ gridColumn: "1 / -1" }}><small>In their words</small><span>{c.note}</span></div>}
              </div>
            </>
          )}
          <h2>Must-haves</h2>
          {rubric}
          <h2>Logistics</h2>
          {has(4) && summary ? (
            <div className="kv">{summary.logistics.map((row) => <KV key={row.k} k={row.k} v={row.v} warn={row.warn} />)}</div>
          ) : has(4) && !fromForm ? (
            <div className="kv">
              <KV k="Salary expectation" v={lg.salary} warn={P(21) > .6} /><KV k="Earliest start" v={lg.start} />
              <KV k="Notice period" v={lg.notice} warn={P(22) > .7} /><KV k="Work authorization" v={lg.auth} />
              <KV k="Location" v={fill(lg.remote, c)} /><KV k="Other processes" v={lg.other} warn={P(23) > .5} />
            </div>
          ) : has(4) ? (
            <p style={{ color: "var(--ink-2)", margin: 0 }}>Logistics from this screen are in the application section above.</p>
          ) : <p style={{ color: "var(--ink-2)", margin: 0 }}>{role.agent} asks about full-time eligibility, US work authorization, and a system from the résumé.</p>}
        </section>

        <section className="d-part" id="p-call">
          <h2>Phone call {has(4) ? <span style={{ float: "right" }}>{scores.call} of 100 · {fmtDur(seconds)}</span> : calling ? <span style={{ float: "right" }}>{voice?.status || "Live"}</span> : null}</h2>
          {turns.length || calling ? (
            <>
              <div className="callbar"><button className="play" aria-label="Live call"><svg viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5z" /></svg></button><div className="bars">{bars}</div><span className="dur">{fmtDur(seconds)}</span></div>
              {voice?.error && <p className="apply-err">{voice.error}</p>}
              {summary && has(4) && <div className="note" style={{ marginTop: 14 }}><b>{role.agent}'s note.</b> {summary.note}</div>}
              <h2 style={{ marginTop: 22 }}>{voice && !voice.ended ? "Live transcript" : "Transcript"}</h2>
              {turns.map((turn, k) => (
                <div key={turn.id + k} className="tr">
                  <span className="ts">{turn.label}</span>
                  <div>
                    <div className="q">{role.agent}: {turn.prompt}</div>
                    <div className="a">{turn.answer || (calling ? "Listening…" : "No reply captured.")}</div>
                  </div>
                </div>
              ))}
              {calling && voice?.ask && !turns.some((t) => t.id === voice.ask!.id && t.answer) && (
                <div className="tr">
                  <span className="ts">{voice.ask.label}</span>
                  <div>
                    <div className="q">{role.agent}: {voice.ask.prompt}</div>
                    <div className="a">{voice.status === "dialing" || voice.status === "queued" || voice.status === "ringing" ? "Ringing…" : `${first} is speaking…`}</div>
                  </div>
                </div>
              )}
              {turns.length === 0 && !(calling && voice?.ask) && (
                <p style={{ color: "var(--ink-2)", margin: 0 }}>{voice?.error ? "The board is waiting on the voice agent." : "Dialing the screening number…"}</p>
              )}
            </>
          ) : has(4) || c.live ? (
            <>
              <div className="callbar"><button className="play" aria-label="Play recording"><svg viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5z" /></svg></button><div className="bars">{bars}</div><span className="dur">{calling ? fmtDur(seconds) : `4:12 / ${fmtDur(seconds)}`}</span></div>
              <div className="attempts"><span>1st attempt: no answer, voicemail left</span><span>2nd attempt: connected</span><span>Recording consent: yes</span></div>
              {!c.live && <div className="note" style={{ marginTop: 14 }}><b>{role.agent}'s note.</b> {ct.note[c.noteIdx]}</div>}
              <h2 style={{ marginTop: 22 }}>Transcript</h2>
              {ct.q.slice(0, c.live ? 1 : 3).map((p, k) => <div key={k} className="tr"><span className="ts">{stamps[k]}</span><div><div className="q">{role.agent}: {p[0]}</div><div className="a">{p[1]}</div></div></div>)}
              {!c.live && (
                <>
                  <div className="tr"><span className="ts">{stamps[3]}</span><div><div className="q">{role.agent}: Anything you want to ask me?</div><div className="a">See below.</div></div></div>
                  <h2>{first} asked</h2>
                  <ul className="asked">{ct.asked.map((q) => <li key={q}>{q}</li>)}</ul>
                </>
              )}
            </>
          ) : <p style={{ color: "var(--ink-2)", margin: 0 }}>{i < 2 ? `${role.agent} calls once socials are checked` : `${role.agent} calls today at 14:00 ${first}'s time`}, within the call window you set. Attempts, recording, and transcript show up here.</p>}
        </section>

        <section className="d-part" id="p-background">
          <h2>Work history</h2>
          {ct.history.map((h) => <div key={h[0]} className="hist"><div><b>{h[0]}</b> <span>· {fill(h[1], c)}</span></div><div className="d">{h[2]}</div></div>)}
          <h2>Education</h2>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>{ct.edu}</p>
          <h2>Skills</h2>
          <div className="skills">{ct.skills.map((k) => <span key={k} className="tag" style={{ fontSize: 12, padding: "3px 8px" }}>{k}</span>)}</div>
          <h2>Online</h2>
          {fromForm ? (
            <>
              {c.website && <div className="social"><span className="k"><SocialIcon k={/github\.com/.test(c.website) ? "gh" : "web"} /></span><div><b>{/github\.com/.test(c.website) ? "GitHub" : "Website"}</b> · Linked from the application</div></div>}
              {c.linkedin && <div className="social"><span className="k"><SocialIcon k="in" /></span><div><b>LinkedIn</b> · Linked from the application</div></div>}
              {!c.website && !c.linkedin && <p style={{ color: "var(--ink-2)", margin: 0 }}>No profiles linked on the application.</p>}
            </>
          ) : ct.social.map((sc, j) => c.socialsFound[j]
            ? <div key={j} className="social"><span className="k"><SocialIcon k={sc[0]} /></span><div><b>{sc[1]}</b> · {has(3) ? sc[2].replace("{n}", String(c.repos)).replace("{s}", String(c.stars)) : "Found, not checked yet"}</div></div>
            : <div key={j} className="social none"><span className="k"><SocialIcon k={sc[0]} /></span><div><b>{sc[1]}</b> · Not found</div></div>)}
        </section>

        <section className="d-part" id="p-activity">
          <h2>Activity</h2>
          {events.map((e) => <div key={e._id} className={"act" + (e.byRecruiter ? " you" : "")}><i /><span dangerouslySetInnerHTML={{ __html: e.text }} /><span className="when">{fmtAgo(now - e.at)} ago</span></div>)}
          <h2>Notes</h2>
          {c.notes.map((n) => <div key={n._id} className="note-item">{n.text}<small>You · {fmtAgo(now - n.at)} ago</small></div>)}
          <textarea className="notes" placeholder="Anything the team should know. Enter to save." value={note} onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(); } }} />
          <div className="share"><span>Shared with Mark (hiring manager)</span><button className="btn" style={{ height: 26 }} onClick={saveNote}>Save note</button></div>
        </section>
      </div>
    </aside>
  );
}
