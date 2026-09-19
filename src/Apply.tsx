import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Logo } from "./icons";

/** Public application page, served at /apply/<slug>. Always talks to the live backend. */
export function Apply({ slug }: { slug: string }) {
  const role = useQuery(api.roles.bySlug, { slug });
  const submit = useMutation(api.applications.submit);
  const uploadUrl = useMutation(api.applications.generateUploadUrl);
  const [f, setF] = useState({ name: "", email: "", phone: "", loc: "", linkedin: "", website: "", authorized: "", startDate: "", note: "" });
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
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
      <div className="apply-brand"><Logo />Callscreen</div>
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
              <div className="field"><label>Legally able to work in the EU without sponsorship?</label>
                <select value={f.authorized} onChange={set("authorized")} required><option value="">Choose one</option><option value="yes">Yes</option><option value="no">No</option></select></div>
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
