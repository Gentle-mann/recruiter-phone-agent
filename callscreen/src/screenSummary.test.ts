import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeScreen } from "../convex/screenSummary.ts";

const jordan = {
  authorized: true,
  startDate: "Two weeks after an offer",
  note: "I owned billing infrastructure at Stripe for three years and want to get closer to the product again.",
  loc: "San Francisco",
  linkedin: "https://linkedin.com/in/jordanlee",
  website: "https://github.com/jordanlee",
  yrs: 0,
  company: "",
  area: "",
  stack: "",
  repos: 0,
};

describe("summarizeScreen", () => {
  it("scores Jordan's live answers against the questions that were asked", () => {
    const summary = summarizeScreen({
      ...jordan,
      turns: [
        { id: "opening", label: "Opening", prompt: "Is now a good time?", answer: "Yes." },
        { id: "eligibility", label: "Eligibility", prompt: "Full-time and US authorization?", answer: "Yes." },
        {
          id: "thesis",
          label: "Experience",
          prompt: "You re-architected the payments ledger. What was breaking, and what did you own?",
          answer: "Um, I used Cloud code to solve this. before it was working, but",
        },
        { id: "questions", label: "Additional questions", prompt: "Any questions?", answer: "No." },
      ],
    });

    assert.equal(summary.rubric[0].name, "Full-time and US work authorization");
    assert.equal(summary.rubric[0].verdict, "met");
    assert.equal(summary.rubric[1].name, "Payments ledger ownership");
    assert.equal(summary.rubric[1].verdict, "no");
    assert.match(summary.rubric[1].detail, /Cloud code/);
    assert.equal(summary.rubric[2].verdict, "partial");
    assert.equal(summary.rubric[5].verdict, "met");
    assert.ok(summary.strengths.some((s) => /work authorization/i.test(s)));
    assert.ok(summary.concerns.some((s) => /ledger/i.test(s)));
    assert.ok(!summary.concerns.some((s) => /gap in 2023/i.test(s)));
    assert.ok(!summary.strengths.some((s) => /shrinking team/i.test(s)));
    assert.ok(summary.logistics.some((row) => row.k === "Work authorization"));
    assert.ok(summary.scores.call < 50);
    assert.ok(summary.scores.final < 70);
  });

  it("marks a specific ledger answer as met", () => {
    const summary = summarizeScreen({
      ...jordan,
      yrs: 6,
      company: "Stripe",
      stack: "Go, Postgres, Kafka",
      repos: 24,
      turns: [
        { id: "eligibility", label: "Eligibility", prompt: "Eligible?", answer: "Yes, full-time, authorized." },
        {
          id: "thesis",
          label: "Experience",
          prompt: "Ledger?",
          answer:
            "The ledger started as one Postgres table with row locks. At about 40k writes a minute the locks were the bottleneck, so I split hot accounts into shards and moved reconciliation to a nightly job. I owned the design and the cutover.",
        },
      ],
    });
    assert.equal(summary.rubric[0].verdict, "met");
    assert.equal(summary.rubric[1].verdict, "met");
    assert.equal(summary.rubric[2].verdict, "met");
    assert.ok(summary.scores.call >= 70);
  });
});
