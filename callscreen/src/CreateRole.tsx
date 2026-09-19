import { useState } from "react";
import { Wave } from "./Board";
import { useData } from "./data";

function Switch({ on: init, disabled }: { on: boolean; disabled?: boolean }) {
  const [on, setOn] = useState(init);
  return <button className={"switch" + (on ? " on" : "")} aria-pressed={on} disabled={disabled} style={disabled ? { opacity: .5 } : undefined} onClick={() => !disabled && setOn(!on)} />;
}
function Row({ t, s, children }: { t: string; s: React.ReactNode; children: React.ReactNode }) {
  return <div className="switchrow"><div className="l"><b>{t}</b><span>{s}</span></div>{children}</div>;
}
function Weight({ init, pct = true }: { init: number; pct?: boolean }) {
  const [v, setV] = useState(init);
  return <div className="weight"><input type="range" min={0} max={100} value={v} onChange={(e) => setV(Number(e.target.value))} /><output>{v}{pct ? "%" : ""}</output></div>;
}
function Chips({ init }: { init: string[] }) {
  const [items, setItems] = useState(init);
  return (
    <div className="chips">
      {items.map((t) => <span key={t} className="chip">{t} <button aria-label="Remove" onClick={() => setItems(items.filter((x) => x !== t))}>×</button></span>)}
      <button className="chip add" onClick={() => { const t = prompt("Add"); if (t) setItems([...items, t]); }}>+ Add</button>
    </div>
  );
}
function QList({ init, addLabel = "+ Add" }: { init: [string, string][]; addLabel?: string }) {
  const [items, setItems] = useState(init);
  return (
    <>
      <div className="qlist">
        {items.map(([q, h]) => <div key={q} className="qitem"><span className="g">⋮⋮</span><div className="txt">{q}<small>{h}</small></div><button aria-label="Remove" onClick={() => setItems(items.filter((x) => x[0] !== q))}>×</button></div>)}
      </div>
      <button className="chip add" style={{ alignSelf: "flex-start" }} onClick={() => { const t = prompt("Question"); if (t) setItems([...items, [t, ""]]); }}>{addLabel}</button>
    </>
  );
}
const SelectSm = ({ opts }: { opts: string[] }) => <select style={{ height: 28, border: "1px solid var(--line)", borderRadius: 6, padding: "0 8px" }}>{opts.map((o) => <option key={o}>{o}</option>)}</select>;

export function CreateRole({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: string) => void }) {
  const { data } = useData();
  const create = data.createRole;
  const [title, setTitle] = useState("Product Designer");
  const [team, setTeam] = useState("Design");
  const [agent, setAgent] = useState("June");
  const [voice, setVoice] = useState("June");
  const [opener, setOpener] = useState("Hi, this is June calling from Actum about the Product Designer role you applied for. Is now still a good time for a fifteen-minute chat?");
  const [musts, setMusts] = useState(["4+ years product design", "Shipped a 0→1 product", "Figma prototyping"]);
  const [suggested, setSuggested] = useState(false);
  const [saving, setSaving] = useState(false);

  const contentKey = /engineer|developer|backend|frontend/i.test(title) ? "be" : /sales|account|executive|ae\b/i.test(title) ? "ae" : "pd";

  const save = async () => {
    setSaving(true);
    const id = await create({ name: title || "New role", team, threshold: 70, agent, contentKey });
    onCreated(id);
  };

  return (
    <section className="view active">
      <header className="top">
        <div><h1>New role</h1><p className="sub">Set up what {agent} checks at each stage and how she talks to candidates.</p></div>
        <div className="top-actions">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save and start screening"}</button>
        </div>
      </header>
      <div className="create">
        <div className="form">
          <div className="step"><div className="num">1</div><div>
            <h2>Role</h2><p className="help">Candidates see this on the application form and hear it on the call.</p>
            <div className="field"><label>Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="row2">
              <div className="field"><label>Team</label><input type="text" value={team} onChange={(e) => setTeam(e.target.value)} /></div>
              <div className="field"><label>Location</label><input type="text" defaultValue="Remote, Europe" /></div>
            </div>
            <div className="row2">
              <div className="field"><label>Type</label><select><option>Full-time</option><option>Contract</option><option>Part-time</option></select></div>
              <div className="field"><label>Hiring manager</label><select><option>Mark Vasilyev</option><option>Sara Lindgren</option></select></div>
            </div>
            <div className="field"><label>Job description</label><textarea rows={5} defaultValue="We're hiring a product designer to own onboarding and activation. You'll work with one PM and three engineers, run your own research, and ship weekly. 4+ years in product design, at least one 0→1 launch you can show, and comfort prototyping in Figma. Bonus if you've worked in B2B SaaS." /></div>
            <div className="chips" style={{ marginBottom: 14 }}><button className="chip add" onClick={() => { if (!suggested) { setMusts([...musts, "Ran own research", "Ships weekly"]); setSuggested(true); } }}>{suggested ? "Added 2 from the description" : "Suggest must-haves from the description"}</button></div>
            <div className="field"><label>Where candidates come from</label><div>
              <Row t="Careers page link" s={<>callscreen.com/actum/{title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} · <a href="#" style={{ color: "inherit" }}>Copy</a></>}><Switch on /></Row>
              <Row t="Greenhouse" s="New applicants sync in, stages sync back"><Switch on /></Row>
              <Row t="LinkedIn Easy Apply" s="Connect LinkedIn Recruiter to enable"><Switch on={false} /></Row>
            </div></div>
          </div></div>

          <div className="step"><div className="num">2</div><div>
            <h2>Application screen</h2><p className="help">{agent} reads the résumé and the form answers. Knockouts reject on the spot, must-haves are scored, nice-to-haves break ties.</p>
            <div className="field"><label>Knockout questions</label>
              <QList addLabel="+ Add knockout" init={[["Are you legally able to work in the EU without sponsorship?", "Must answer: Yes"], ["Can you start within 3 months?", "Must answer: Yes"], ["Link to your portfolio", "Must be provided"]]} />
            </div>
            <div className="field"><label>Must-haves</label>
              <div className="chips">{musts.map((t) => <span key={t} className="chip">{t} <button aria-label="Remove" onClick={() => setMusts(musts.filter((x) => x !== t))}>×</button></span>)}<button className="chip add" onClick={() => { const t = prompt("Must-have"); if (t) setMusts([...musts, t]); }}>+ Add</button></div>
            </div>
            <div className="field"><label>Nice-to-haves</label><Chips init={["B2B SaaS", "Works close to engineers"]} /></div>
            <div className="field"><label>Weight in final score</label><Weight init={30} /></div>
          </div></div>

          <div className="step"><div className="num">3</div><div>
            <h2>Socials</h2><p className="help">Public profiles only. {agent} notes what she found and never messages anyone.</p>
            <div>
              <Row t="Portfolio site" s="Case studies, depth of process, recency"><Switch on /></Row>
              <Row t="Dribbble" s="Craft, consistency"><Switch on /></Row>
              <Row t="LinkedIn" s="Tenure, titles, gaps"><Switch on /></Row>
              <Row t="GitHub" s="Only relevant for design engineers"><Switch on={false} /></Row>
              <Row t="X" s="Public voice, how they talk about work"><Switch on={false} /></Row>
            </div>
            <div className="field" style={{ marginTop: 14 }}><label>Raise a flag when</label><Chips init={["Résumé and LinkedIn disagree", "Gap over 6 months", "Portfolio older than 2 years"]} /></div>
            <div className="field"><label>Weight in final score</label><Weight init={20} /></div>
          </div></div>

          <div className="step"><div className="num">4</div><div>
            <h2>Phone call</h2><p className="help">{agent} calls everyone who passes the first two stages. About fifteen minutes each.</p>
            <div className="row2">
              <div className="field"><label>Agent name</label><input type="text" value={agent} onChange={(e) => setAgent(e.target.value)} /></div>
              <div className="field"><label>Language</label><select><option>English, match candidate's accent</option><option>English (UK)</option><option>Portuguese</option><option>German</option></select></div>
            </div>
            <div className="field"><label>Voice</label><div className="voices">
              {[["June", "Warm, unhurried"], ["Adrian", "Direct, low"], ["Sana", "Bright, quick"]].map(([n, d]) => (
                <button key={n} className={"voice" + (voice === n ? " sel" : "")} onClick={() => setVoice(n)}><b>{n}</b><span>{d}</span><span className="vplay"><Wave />Preview</span></button>
              ))}
            </div></div>
            <div className="field"><label>Tone</label><select><option>Friendly and brief, like a good recruiter</option><option>Formal</option><option>Casual</option></select></div>
            <div className="field"><label>Opening line</label><textarea rows={2} value={opener} onChange={(e) => setOpener(e.target.value)} /></div>
            <div className="field"><label>Questions, in order</label>
              <QList addLabel="+ Add question" init={[
                ["Tell me about the last thing you shipped that you're proud of. What was your part?", "Good answer: names the outcome, says \"I\" not \"we\""],
                ["Walk me through how you decide when a design is done.", "Good answer: judgement over process, mentions shipping small"],
                ["How do you work with engineers day to day?", "Good answer: in standup, comfortable in code or PRs"],
                ["Salary expectation, notice period, earliest start, and any other processes you're in?", "Always asked, fills the Logistics card"],
              ]} />
            </div>
            <div className="row2">
              <div className="field"><label>Follow-ups per question</label><select defaultValue="Up to 2, if the answer is vague"><option>None, just ask</option><option>Up to 2, if the answer is vague</option><option>Up to 4, dig in</option></select></div>
              <div className="field"><label>Call length</label><select defaultValue="Up to 15 minutes"><option>Up to 10 minutes</option><option>Up to 15 minutes</option><option>Up to 20 minutes</option></select></div>
            </div>
            <div className="field"><label>What {agent} can answer if asked</label>
              <QList init={[
                ["Salary range", "€70k–85k plus equity. Share the range if asked."],
                ["Remote policy", "Remote anywhere in the EU, two team weeks a year in Lisbon."],
                ["Team", "One PM, three engineers, you'd be the first designer. Reports to Mark."],
                ["Process after this call", "45-min portfolio review with Mark, then a half-day paid design exercise. Two weeks end to end."],
              ]} />
            </div>
            <div className="field"><label>Scheduling</label><div>
              <Row t="Text before calling" s={`"${agent} from Callscreen will call tomorrow at 14:00. Reply with a better time if needed."`}><Switch on /></Row>
              <Row t="Call window" s="Candidate's local 10:00 to 18:00, weekdays"><SelectSm opts={["10:00–18:00 local", "Any time"]} /></Row>
              <Row t="Retry if no answer" s="Two more attempts, a day apart, voicemail on the last one"><Switch on /></Row>
              <Row t="Recording disclosure" s={`${agent} says the call is recorded and asks for consent. Required.`}><Switch on disabled /></Row>
              <Row t="If the candidate asks for a human" s={`${agent} takes a message and flags the profile for you`}><SelectSm opts={["Take a message", "Transfer to me"]} /></Row>
            </div></div>
            <div className="field" style={{ marginTop: 14 }}><label>Weight in final score</label><Weight init={50} /></div>
          </div></div>

          <div className="step"><div className="num">5</div><div>
            <h2>Score and hand-off</h2><p className="help">What happens once {agent} has a final score.</p>
            <div className="field"><label>Pass threshold</label><Weight init={70} pct={false} /></div>
            <div>
              <Row t="Book an interview above threshold" s="45 min on Mark's calendar, candidate picks the slot"><Switch on /></Row>
              <Row t="Decline below threshold" s="Sent 24 hours later, so you can override"><Switch on /></Row>
              <Row t="Post summaries to Slack" s={`#hiring-${team.toLowerCase() || "team"}, one message per scored candidate`}><Switch on /></Row>
              <Row t="Sync stage to Greenhouse" s='Scored → "Phone screen complete"'><Switch on /></Row>
              <Row t="Ask me before every call" s={`Off means ${agent} calls as soon as a candidate passes socials`}><Switch on={false} /></Row>
            </div>
          </div></div>

          <div className="form-foot">
            <button className="btn primary" onClick={save} disabled={saving}>Save and start screening</button>
            <button className="btn" onClick={onCancel}>Save as draft</button>
          </div>
        </div>

        <aside className="preview">
          <p className="cap">How the call will go</p>
          <div className="phone">
            <div className="ph-h"><span className="av s3">{agent[0] ?? "J"}</span><div><b>{agent}</b><span>Callscreen · {title}</span></div></div>
            <div className="bubbles">
              <div className="bub sys">Calling Aiko Tanaka · 14:02 local</div>
              <div className="bub agent">{opener}</div>
              <div className="bub cand">Sure, go ahead.</div>
              <div className="bub agent">Quick note, this call is recorded so the team can listen back. Okay with you?</div>
              <div className="bub cand">Yes, fine.</div>
              <div className="bub agent">Great. Tell me about the last thing you shipped that you're proud of. What was your part?</div>
              <div className="bub cand">The onboarding redesign at Linear. I owned it end to end, from research to the final handoff…</div>
              <div className="bub sys">…</div>
              <div className="bub cand">What's the salary range?</div>
              <div className="bub agent">Seventy to eighty-five thousand euros, plus equity.</div>
              <div className="bub agent">That's everything from me. Mark will be in touch within two days. Thanks, Aiko.</div>
            </div>
          </div>
          <div className="testcall">
            <p className="cap" style={{ marginTop: 22 }}>Try it yourself</p>
            <div className="testrow"><input type="text" defaultValue="+351 91 234 5678" aria-label="Your phone number" /><button className="btn primary">Call me</button></div>
            <p className="cap" style={{ margin: "8px 0 0", fontSize: 12 }}>{agent} calls you as if you'd applied. Nothing is scored.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
