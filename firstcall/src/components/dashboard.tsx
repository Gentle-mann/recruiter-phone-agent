"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCheck,
  Clock3,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { useDemoWorkspace } from "./demo-provider";
import { StatusBadge } from "./status-badge";
import { sampleRole } from "@/lib/fixtures";

export function Dashboard() {
  const { interviews, drafts } = useDemoWorkspace();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const completed = interviews.filter(
    (interview) => interview.status === "completed",
  ).length;
  const visible = interviews.filter(
    (interview) =>
      interview.candidateName.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || interview.status === filter),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR RECRUITING DESK</p>
          <h1>
            Good conversations.
            <br />
            Better first impressions.
          </h1>
          <p className="subtitle">
            A little less coordination. A little more human connection.
          </p>
        </div>
        <Link href="/roles/new" className="button primary">
          <Plus size={17} />
          Create a role
        </Link>
      </div>
      <section className="hero-panel">
        <div>
          <span className="pill">MEET YOUR PHONE-SCREEN ASSISTANT</span>
          <h2>
            The first conversation,
            <br />
            already taken care of.
          </h2>
          <p>
            Explore a sample screening and see how a conversation becomes a
            brief you can verify.
          </p>
          <Link href="/candidate" className="button light">
            Try the demo
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="conversation-art" aria-hidden="true">
          <div className="voice-orb">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="art-note">
            <CheckCheck size={18} />
            <div>
              <strong>A story, not just a résumé.</strong>
              <small>Useful context for your next conversation</small>
            </div>
          </div>
        </div>
      </section>
      <section className="stats-grid" aria-label="Sample workspace statistics">
        {[
          {
            label: "Sample interviews",
            value: interviews.length,
            note: "Fictional call outcomes",
            icon: PhoneIcon,
          },
          {
            label: "Briefs to explore",
            value: completed,
            note: "With transcript evidence",
            icon: FileText,
          },
          {
            label: "Roles in workspace",
            value: 1 + drafts.length,
            note: `${drafts.length} session drafts`,
            icon: BriefcaseBusiness,
          },
        ].map(({ label, value, note, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <span>
              {label}
              <Icon size={17} />
            </span>
            <strong>{value.toString().padStart(2, "0")}</strong>
            <small>{note}</small>
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Recent conversations</h2>
            <p>
              Every brief starts with something the candidate actually said.
            </p>
          </div>
          <span className="muted-tag">Sample data</span>
        </div>
        <div className="table-tools">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search candidates"
              placeholder="Search candidates…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="Filter by call outcome"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All outcomes</option>
            <option value="completed">Brief ready</option>
            <option value="no-answer">No answer</option>
            <option value="opted-out">Opted out</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Outcome</th>
                <th>Duration</th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((interview) => (
                <tr key={interview.id}>
                  <td>
                    <div className="candidate-cell">
                      <span className="avatar">
                        {interview.candidateName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div>
                        <strong>{interview.candidateName}</strong>
                        <small>Demo candidate</small>
                      </div>
                    </div>
                  </td>
                  <td className="role-cell">{sampleRole.title}</td>
                  <td>
                    <StatusBadge status={interview.status} />
                  </td>
                  <td className="duration">
                    {interview.durationSeconds
                      ? `${Math.floor(interview.durationSeconds / 60)}m ${interview.durationSeconds % 60}s`
                      : "—"}
                  </td>
                  <td>
                    <Link
                      className="row-action"
                      href={`/interviews/${interview.id}`}
                      aria-label={`View ${interview.candidateName} ${interview.status} interview`}
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 ? (
          <div className="empty-state">No conversations match your search.</div>
        ) : null}
      </section>
      <section className="bottom-grid">
        <div className="panel role-summary">
          <div className="section-heading">
            <h2>Your roles</h2>
            <BriefcaseBusiness size={18} />
          </div>
          <Link className="role-summary-link" href="/candidate">
            <span>
              <strong>{sampleRole.title}</strong>
              <small>{sampleRole.location}</small>
            </span>
            <ArrowRight size={18} />
          </Link>
          {drafts.map((role) => (
            <div className="draft-row" key={role.id}>
              <strong>{role.title}</strong>
              <span className="muted-tag">Draft</span>
            </div>
          ))}
        </div>
        <div className="human-note">
          <div className="note-icon">
            <CheckCheck size={22} />
          </div>
          <h3>
            Context for people.
            <br />
            Decisions by people.
          </h3>
          <p>
            Facts, source passages, and open questions. The next step belongs to
            your recruiter.
          </p>
        </div>
      </section>
    </>
  );
}

const PhoneIcon = Clock3;
