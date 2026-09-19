import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Logo } from "./icons";
import { PREFILL } from "./prefill";
import { publishWalkthrough } from "./walkChannel";

const jordan = {
  name: PREFILL.name,
  email: PREFILL.email,
  phone: PREFILL.phone,
  loc: PREFILL.loc,
  linkedin: PREFILL.linkedin,
  website: PREFILL.website,
  authorized: PREFILL.authorized ? "yes" : "no",
  startDate: PREFILL.startDate,
  note: PREFILL.note,
};

// Sample applicants for the Prefill button, so demos don't start with an empty form.
const SAMPLES = [
  jordan,
  { name: "Inês Carvalho", email: "ines.carvalho@proton.me", phone: "+351 91 555 0142", loc: "Porto", linkedin: "https://linkedin.com/in/inescarvalho", website: "https://github.com/inescarvalho", authorized: "yes", startDate: "2 months notice", note: "Currently at a fintech in Porto, mostly Go and Postgres. Happy to do the call after 17:00." },
  { name: "Tomasz Nowak", email: "tomasz.nowak@gmail.com", phone: "+48 512 338 904", loc: "Warsaw", linkedin: "https://linkedin.com/in/tnowak", website: "https://github.com/tnowak", authorized: "yes", startDate: "1 November", note: "Six years on event pipelines at Allegro. Looking for a smaller team where I own more of the stack." },
  { name: "Amara Diallo", email: "amara.diallo@hey.com", phone: "+33 6 12 44 90 71", loc: "Paris", linkedin: "https://linkedin.com/in/amaradiallo", website: "https://amaradiallo.dev", authorized: "yes", startDate: "Immediately", note: "Just wrapped a contract at Doctolib. Please text before calling, I'm often in meetings before noon." },
  { name: "Lukas Brandt", email: "lukas.brandt@posteo.de", phone: "+49 176 5522 0187", loc: "Berlin", linkedin: "https://linkedin.com/in/lukasbrandt", website: "https://github.com/lbrandt", authorized: "yes", startDate: "3 months notice", note: "Staff engineer at a Series B, mostly Rust and gRPC. Interested in the voice side of what you're building." },
  { name: "Priya Raman", email: "priya.raman@outlook.com", phone: "+44 7700 900412", loc: "London", linkedin: "https://linkedin.com/in/priyaraman", website: "https://github.com/praman", authorized: "no", startDate: "1 December", note: "Would need visa sponsorship for the US but can start remotely from London in the meantime." },
];
const samplePdf = (name: string) => new File([`%PDF-1.4\n% Résumé for ${name}\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n`], `${name.replace(/\s+/g, "-")}-CV.pdf`, { type: "application/pdf" });

/** Public application page at /apply or /apply/<slug>. Submits to Live and starts the board walkthrough. */
export function Apply({ slug }: { slug?: string }) {
  if (!import.meta.env.VITE_CONVEX_URL) {
    return (
      <div className="apply">
        <div className="apply-brand"><Logo />Callscreen</div>
        <h1>Live apply needs Convex</h1>
        <p className="apply-lead">Set VITE_CONVEX_URL in callscreen/.env, then restart the board.</p>
      </div>
    );
  }
  return <ApplyForm slug={slug} />;
}

function ApplyForm({ slug }: { slug?: string }) {
  const bySlug = useQuery(api.roles.bySlug, slug ? { slug } : "skip");
  const roles = useQuery(api.roles.list, slug ? "skip" : {});
  const role = slug
    ? bySlug
    : roles === undefined
      ? undefined
      : roles.find((r) => r.slug === PREFILL.roleSlug) ?? roles[0] ?? null;
  const submitSlug = slug || (role && "slug" in role ? role.slug : PREFILL.roleSlug);
  const submit = useMutation(api.applications.submit);
  const uploadUrl = useMutation(api.applications.generateUploadUrl);
  const [f, setF] = useState(jordan);
  const [file, setFile] = useState<File | null>(() => samplePdf(PREFILL.name));
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const [similar, setSimilar] = useState(true);
  const prefill = () => {
    const s = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
    setF(s); setFile(samplePdf(s.name)); setErr("");
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !submitSlug) return;
    if (!f.name.trim() || !f.email.trim() || !f.authorized || !f.startDate.trim()) { setErr("Please fill in your name, email, work authorization, and start date."); return; }
    setErr(""); setState("sending");
    try {
      let resumeId: Id<"_storage"> | undefined;
      if (file) {
        const url = await uploadUrl();
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
        if (!res.ok) throw new Error("Résumé upload failed.");
        resumeId = (await res.json()).storageId;
      }
      const result = await submit({
        slug: submitSlug,
        name: f.name,
        email: f.email,
        phone: f.phone,
        loc: f.loc,
        linkedin: f.linkedin || undefined,
        website: f.website || undefined,
        resumeId,
        authorized: f.authorized === "yes",
        startDate: f.startDate,
        note: f.note || undefined,
      });
      const candidateId = typeof result === "string" ? result : String(result);
      publishWalkthrough({ candidateId, roleId: role._id, name: f.name });
      setState("done");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Something went wrong. Please try again.");
      setState("error");
    }
  };

  return (
    <div className="apply">
      <div className="apply-brand"><Logo />Callscreen{role && state !== "done" && <button className="prefill" onClick={prefill} type="button">Prefill sample</button>}</div>
      {role === undefined && <p className="apply-muted">Loading…</p>}
      {role === null && (
        <>
          <h1>This role isn't open</h1>
          <p className="apply-muted">The link may have expired or the role has been filled.</p>
        </>
      )}
      {role && state === "done" && (
        <>
          <h1>Thanks, {f.name.trim().split(" ")[0]}.</h1>
          <p className="apply-lead">{role.agent}, our screening agent, reads every application within the hour. Keep the recruiter board open on <strong>Live</strong> — the card should already be moving through screening.{similar ? " We’ll also put you forward for similar open roles." : ""}</p>
          <p className="apply-muted">Sent to the {role.team} team. You can leave this tab open.</p>
        </>
      )}
      {role && state !== "done" && (
        <>
          <h1>{role.name}</h1>
          <p className="apply-lead">{role.team} team. Takes about three minutes. {role.agent}, our screening agent, reads every application and calls the strongest candidates within two days.</p>
          <form onSubmit={onSubmit} noValidate>
            <div className="row2">
              <div className="field"><label>Full name</label><input type="text" value={f.name} onChange={set("name")} autoComplete="name" required /></div>
              <div className="field"><label>Email</label><input type="email" value={f.email} onChange={set("email")} autoComplete="email" required /></div>
            </div>
            <div className="row2">
              <div className="field"><label>Phone, for the screening call</label><input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="+1 …" /></div>
              <div className="field"><label>City</label><input type="text" value={f.loc} onChange={set("loc")} autoComplete="address-level2" /></div>
            </div>
            <div className="row2">
              <div className="field"><label>LinkedIn</label><input type="url" value={f.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/…" /></div>
              <div className="field"><label>GitHub or portfolio</label><input type="url" value={f.website} onChange={set("website")} placeholder="https://" /></div>
            </div>
            <div className="field">
              <label>Résumé</label>
              <label className={"upload" + (file ? " has" : "")}>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? <span>{file.name} <small>· change</small></span> : <span>Choose a PDF or Word file</span>}
              </label>
            </div>
            <div className="row2">
              <div className="field"><label>US work authorization</label>
                <select value={f.authorized} onChange={set("authorized")} required><option value="">Choose one</option><option value="yes">Yes, authorized to work in the US</option><option value="no">No, I'd need sponsorship</option></select></div>
              <div className="field"><label>Earliest start date</label><input type="text" value={f.startDate} onChange={set("startDate")} placeholder="e.g. 1 November, or 2 months notice" required /></div>
            </div>
            <div className="field"><label>Anything you want us to know</label><textarea rows={3} value={f.note} onChange={set("note")} placeholder="Optional" /></div>
            <button
              type="button"
              className={"apply-optin" + (similar ? " on" : "")}
              role="switch"
              aria-checked={similar}
              onClick={() => setSimilar((v) => !v)}
            >
              <span className={"apply-switch" + (similar ? " on" : "")} aria-hidden="true"><i /></span>
              <span className="apply-optin-copy">
                <b>Also automatically apply to other similar jobs?</b>
                <span>We’ll send this application to other open roles that look like a match.</span>
              </span>
            </button>
            {err && <p className="apply-err">{err}</p>}
            <div className="apply-foot">
              <button className="btn primary" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send application"}</button>
              <span className="apply-muted">By applying you agree that we may call and record a short screening conversation.</span>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
