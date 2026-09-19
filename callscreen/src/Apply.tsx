import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Logo } from "./icons";

// Sample applicants for the Prefill button, so demos don't start with an empty form.
const SAMPLES = [
  { name: "Inês Carvalho", email: "ines.carvalho@proton.me", phone: "+351 91 555 0142", loc: "Porto", linkedin: "https://linkedin.com/in/inescarvalho", website: "https://github.com/inescarvalho", authorized: "yes", startDate: "2 months notice", note: "Currently at a fintech in Porto, mostly Go and Postgres. Happy to do the call after 17:00." },
  { name: "Tomasz Nowak", email: "tomasz.nowak@gmail.com", phone: "+48 512 338 904", loc: "Warsaw", linkedin: "https://linkedin.com/in/tnowak", website: "https://github.com/tnowak", authorized: "yes", startDate: "1 November", note: "Six years on event pipelines at Allegro. Looking for a smaller team where I own more of the stack." },
  { name: "Amara Diallo", email: "amara.diallo@hey.com", phone: "+33 6 12 44 90 71", loc: "Paris", linkedin: "https://linkedin.com/in/amaradiallo", website: "https://amaradiallo.dev", authorized: "yes", startDate: "Immediately", note: "Just wrapped a contract at Doctolib. Please text before calling, I'm often in meetings before noon." },
  { name: "Lukas Brandt", email: "lukas.brandt@posteo.de", phone: "+49 176 5522 0187", loc: "Berlin", linkedin: "https://linkedin.com/in/lukasbrandt", website: "https://github.com/lbrandt", authorized: "yes", startDate: "3 months notice", note: "Staff engineer at a Series B, mostly Rust and gRPC. Interested in the voice side of what you're building." },
  { name: "Priya Raman", email: "priya.raman@outlook.com", phone: "+44 7700 900412", loc: "London", linkedin: "https://linkedin.com/in/priyaraman", website: "https://github.com/praman", authorized: "no", startDate: "1 December", note: "Would need visa sponsorship for the EU but can work from London in the meantime." },
];
const samplePdf = (name: string) => new File([`%PDF-1.4\n% Résumé for ${name}\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n`], `${name.replace(/\s+/g, "-")}-CV.pdf`, { type: "application/pdf" });

/** Public application page, served at /apply/<slug>. Always talks to the live backend. */
export function Apply({ slug }: { slug: string }) {
  const role = useQuery(api.roles.bySlug, { slug });
  const submit = useMutation(api.applications.submit);
  const uploadUrl = useMutation(api.applications.generateUploadUrl);
  const [f, setF] = useState({ name: "", email: "", phone: "", loc: "", linkedin: "", website: "", authorized: "", startDate: "", note: "" });
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const prefill = () => {
    const s = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
    setF(s); setFile(samplePdf(s.name)); setErr("");
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await submit({ slug, name: f.name, email: f.email, phone: f.phone, loc: f.loc, linkedin: f.linkedin || undefined, website: f.website || undefined, resumeId, authorized: f.authorized === "yes", startDate: f.startDate, note: f.note || undefined });
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
          <p className="apply-lead">{role.agent}, our screening agent, reads every application within the hour. If the {role.name} role looks like a fit, expect a short call in the next two days. We'll text before calling.</p>
          <p className="apply-muted">Sent to the {role.team} team. You can close this page.</p>
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
              <div className="field"><label>Phone, for the screening call</label><input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="+351 …" /></div>
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
              <div className="field"><label>EU work authorization</label>
                <select value={f.authorized} onChange={set("authorized")} required><option value="">Choose one</option><option value="yes">Yes, no sponsorship needed</option><option value="no">No, I'd need sponsorship</option></select></div>
              <div className="field"><label>Earliest start date</label><input type="text" value={f.startDate} onChange={set("startDate")} placeholder="e.g. 1 November, or 2 months notice" required /></div>
            </div>
            <div className="field"><label>Anything you want us to know</label><textarea rows={3} value={f.note} onChange={set("note")} placeholder="Optional" /></div>
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
