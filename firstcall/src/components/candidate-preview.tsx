"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Headphones, MapPin, Phone } from "lucide-react";
import { useDemoWorkspace } from "./demo-provider";
import { sampleRole } from "@/lib/fixtures";
import type { CallStatus, Interview } from "@/lib/types";

export function CandidatePreview() {
  const [consent, setConsent] = useState(false);
  const [scenario, setScenario] = useState<CallStatus>("completed");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { addInterview } = useDemoWorkspace();
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/demo/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent, scenario }),
        signal: AbortSignal.timeout(10000),
      });
      const result: { interview?: Interview; error?: string } =
        await response.json();
      if (!response.ok || !result.interview)
        throw new Error(result.error || "Could not load the sample outcome.");
      addInterview(result.interview);
      router.push(`/interviews/${result.interview.id}`);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not load the sample. Please try again.",
      );
      setPending(false);
    }
  }

  return (
    <div className="candidate-preview">
      <div className="centered-heading">
        <p className="eyebrow">CANDIDATE EXPERIENCE · PREVIEW</p>
        <h1>
          Your next opportunity
          <br />
          starts with a conversation.
        </h1>
        <p className="subtitle">A short introduction. On your terms.</p>
      </div>
      <section className="candidate-card panel">
        <div className="candidate-card-top">
          <span className="large-icon">
            <Headphones size={28} />
          </span>
          <span className="muted-tag">Sample role</span>
        </div>
        <p className="eyebrow">{sampleRole.company}</p>
        <h2>{sampleRole.title}</h2>
        <div className="role-facts">
          <span>
            <MapPin size={15} />
            {sampleRole.location}
          </span>
          <span>
            <Clock3 size={15} />
            About 5 minutes in a live screening
          </span>
        </div>
        <div className="form-divider" />
        <h3>Here’s what we’ll cover</h3>
        <ol className="topic-list">
          <li>
            <span>01</span>Your experience helping customers
          </li>
          <li>
            <span>02</span>The tools you’ve worked with
          </li>
          <li>
            <span>03</span>Your availability and questions
          </li>
        </ol>
        <form onSubmit={onSubmit}>
          <div className="demo-notice">
            <Phone size={20} />
            <div>
              <strong>This is an interactive preview.</strong>
              <p>
                No phone call, microphone, recording, or AI generation is used.
                You’ll explore a fictional transcript and brief for Jordan Lee.
              </p>
            </div>
          </div>
          <label className="scenario-label">
            Sample outcome
            <select
              value={scenario}
              onChange={(event) =>
                setScenario(event.target.value as CallStatus)
              }
            >
              <option value="completed">Completed conversation</option>
              <option value="no-answer">No answer</option>
              <option value="opted-out">Candidate opts out</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            <span>
              I understand this is a simulation using fictional candidate data.
            </span>
          </label>
          {error ? (
            <p className="error-message" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="button primary wide"
            disabled={!consent || pending}
            type="submit"
          >
            {pending ? "Preparing sample…" : "Explore sample outcome"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="candidate-footnote">
          In the live product, candidates will be able to choose a callback time
          or request a human conversation.
        </p>
      </section>
    </div>
  );
}
