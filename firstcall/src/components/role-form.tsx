"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileText } from "lucide-react";
import { useDemoWorkspace } from "./demo-provider";
import { sampleRole } from "@/lib/fixtures";

export function RoleForm() {
  const { addDraft } = useDemoWorkspace();
  const [saved, setSaved] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? "").trim();
    addDraft({
      id: `draft-${crypto.randomUUID()}`,
      title: field("title"),
      company: field("company"),
      location: field("location"),
      payRange: field("payRange"),
      schedule: field("schedule"),
      questions: [field("q1"), field("q2"), field("q3")],
    });
    setSaved(true);
  }

  return (
    <>
      <Link className="back-link" href="/">
        <ArrowLeft size={15} />
        Workspace
      </Link>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">START WITH THE ROLE</p>
          <h1>
            A better conversation
            <br />
            starts with clear questions.
          </h1>
          <p className="subtitle">
            Give your assistant the facts and the questions that matter.
          </p>
        </div>
      </div>
      {saved ? (
        <section className="panel success-panel" role="status">
          <span className="success-icon">
            <Check size={26} />
          </span>
          <h2>Your role draft is ready.</h2>
          <p>Saved in this browser session. Refreshing resets demo drafts.</p>
          <p className="subtle">
            Live interviews for custom roles will be connected in the next
            implementation step.
          </p>
          <Link href="/" className="button primary">
            View workspace
            <ArrowRight size={16} />
          </Link>
        </section>
      ) : (
        <div className="form-layout">
          <form className="panel form-panel" onSubmit={onSubmit}>
            <h2>Role details</h2>
            <p className="subtle">
              Start from this example or enter a fictional role.
            </p>
            <div className="form-grid">
              <label>
                Role title
                <input
                  name="title"
                  required
                  maxLength={120}
                  defaultValue={sampleRole.title}
                />
              </label>
              <label>
                Company
                <input
                  name="company"
                  required
                  maxLength={120}
                  defaultValue={sampleRole.company}
                />
              </label>
              <label>
                Location
                <input
                  name="location"
                  required
                  maxLength={200}
                  defaultValue={sampleRole.location}
                />
              </label>
              <label>
                Pay range
                <input
                  name="payRange"
                  required
                  maxLength={100}
                  defaultValue={sampleRole.payRange}
                />
              </label>
              <label className="full-width">
                Schedule
                <input
                  name="schedule"
                  required
                  maxLength={200}
                  defaultValue={sampleRole.schedule}
                />
              </label>
            </div>
            <div className="form-divider" />
            <h2>Screening questions</h2>
            <p className="subtle">
              Keep questions specific to the work. You approve the wording.
            </p>
            {sampleRole.questions.map((question, index) => (
              <label key={question} className="question-label">
                <span>Question {index + 1}</span>
                <textarea
                  name={`q${index + 1}`}
                  required
                  maxLength={500}
                  rows={2}
                  defaultValue={question}
                />
              </label>
            ))}
            <button className="button primary" type="submit">
              Save role draft
              <ArrowRight size={16} />
            </button>
          </form>
          <aside className="aside-note">
            <FileText size={24} />
            <h3>A useful starting point</h3>
            <p>
              Ask for a concrete example, clarify the candidate’s contribution,
              and leave room for their questions.
            </p>
            <div className="form-divider" />
            <h4>What happens next?</h4>
            <p>
              This scaffold saves drafts for the session. The sample interview
              remains tied to the original Northstar role.
            </p>
            <Link href="/candidate" className="text-link">
              Explore the sample interview
              <ArrowUpRightIcon />
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight size={14} />;
}
