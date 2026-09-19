"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  FileCheck2,
  MessageSquareText,
  Quote,
} from "lucide-react";
import { useDemoWorkspace } from "./demo-provider";
import { StatusBadge } from "./status-badge";
import { sampleRole } from "@/lib/fixtures";

export function InterviewDetail({ id }: { id: string }) {
  const { interviews } = useDemoWorkspace();
  const interview = interviews.find((item) => item.id === id);
  if (!interview)
    return (
      <div className="empty-page">
        <h1>This demo has expired.</h1>
        <p>
          Generated previews last for the current browser session. Start another
          sample to explore the brief.
        </p>
        <Link className="button primary" href="/candidate">
          Open candidate preview
        </Link>
      </div>
    );
  return (
    <>
      <Link href="/" className="back-link">
        <ArrowLeft size={15} />
        All conversations
      </Link>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">CONVERSATION BRIEF · FICTIONAL DEMO</p>
          <h1>{interview.candidateName}</h1>
          <p className="subtitle">
            {sampleRole.title} · {sampleRole.company}
          </p>
        </div>
        <StatusBadge status={interview.status} />
      </div>
      {interview.brief ? (
        <div className="brief-layout">
          <div className="brief-content">
            <section className="panel brief-section">
              <span className="section-icon">
                <FileCheck2 size={20} />
              </span>
              <h2>The conversation at a glance</h2>
              <p className="brief-summary">{interview.brief.summary}</p>
              <span className="muted-tag">
                Candidate self-report · Not independently verified
              </span>
            </section>
            <section className="panel brief-section">
              <h2>What we learned</h2>
              <p className="subtle">
                Follow each reference back to the original sample transcript.
              </p>
              {interview.brief.evidence.map((evidence) => (
                <article className="evidence-item" key={evidence.topic}>
                  <h3>{evidence.topic}</h3>
                  <p>{evidence.summary}</p>
                  <div className="evidence-links">
                    {evidence.turnIds.map((turnId) => (
                      <a href={`#${turnId}`} key={turnId}>
                        <Quote size={12} />
                        {
                          interview.transcript.find(
                            (turn) => turn.id === turnId,
                          )?.timestamp
                        }
                        <ArrowUpRight size={12} />
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </section>
            <section className="panel brief-section">
              <h2>Leave room for the next conversation</h2>
              <h3 className="small-heading">OPEN QUESTIONS</h3>
              <ul className="plain-list">
                {interview.brief.unknowns.map((unknown) => (
                  <li key={unknown}>{unknown}</li>
                ))}
              </ul>
              <h3 className="small-heading">THE CANDIDATE ASKED</h3>
              {interview.brief.candidateQuestions.map((question) => (
                <blockquote key={question}>{question}</blockquote>
              ))}
              <p className="human-reminder">
                The recruiter decides the next step. This brief does not rank or
                select candidates.
              </p>
            </section>
          </div>
          <section className="panel transcript-panel">
            <div className="section-heading">
              <h2>
                <MessageSquareText size={18} />
                Sample transcript
              </h2>
              <span className="muted-tag">1m 48s</span>
            </div>
            <p className="transcript-notice">
              Scripted example · No audio recorded
            </p>
            {interview.transcript.map((turn) => (
              <article
                id={turn.id}
                key={turn.id}
                className={`transcript-turn ${turn.speaker}`}
              >
                <div>
                  <strong>
                    {turn.speaker === "agent" ? "Firstcall" : "Jordan"}
                  </strong>
                  <time>{turn.timestamp}</time>
                </div>
                <p>{turn.text}</p>
              </article>
            ))}
          </section>
        </div>
      ) : (
        <section className="panel empty-outcome">
          <span className="large-icon">
            <MessageSquareText size={28} />
          </span>
          <h2>
            {interview.status === "no-answer"
              ? "No conversation took place."
              : "The candidate chose to stop."}
          </h2>
          <p>
            {interview.status === "no-answer"
              ? "There is no transcript or brief. An unanswered call says nothing about the candidate’s qualifications."
              : "No candidate assessment was generated. A live workflow must honor this preference and suppress future calls."}
          </p>
          <Link className="button secondary" href="/candidate">
            Explore another sample
          </Link>
        </section>
      )}
    </>
  );
}
