export type ScreenTurn = {
  id: string;
  label: string;
  prompt: string;
  answer?: string | null;
};

export type ScreenInput = {
  turns: ScreenTurn[];
  authorized?: boolean;
  startDate?: string;
  note?: string;
  loc: string;
  linkedin?: string;
  website?: string;
  yrs: number;
  company: string;
  area: string;
  stack: string;
  repos: number;
};

export type RubricVerdict = "met" | "partial" | "no";

export type ScreenRubric = {
  name: string;
  kind: "must" | "nice";
  src: string;
  verdict: RubricVerdict;
  detail: string;
};

export type ScreenSummary = {
  strengths: string[];
  concerns: string[];
  rubric: ScreenRubric[];
  flags: [string, string][];
  logistics: { k: string; v: string; warn?: boolean }[];
  note: string;
  why: string;
  scores: { app: number; soc: number; call: number; final: number };
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function normalize(speech: string) {
  return ` ${speech.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim()} `;
}

function looksLikeYes(speech: string) {
  const text = normalize(speech);
  return [" yes ", " yeah ", " yep ", " sure ", " okay ", " ok ", " authorized ", " full time ", " i am "].some((t) => text.includes(t));
}

function looksLikeNo(speech: string) {
  const text = normalize(speech);
  const strong = [" not a good time ", " not now ", " not really ", " not available ", " cannot ", " can't ", " not authorized ", " need a visa ", " need sponsorship ", " part time ", " contractor "];
  if (strong.some((t) => text.includes(t))) return true;
  return [" no ", " nope "].some((t) => text.includes(t)) && !looksLikeYes(speech);
}

function polarity(speech: string | null | undefined): "yes" | "no" | "unclear" {
  const t = (speech || "").trim();
  if (!t) return "unclear";
  if (looksLikeNo(t)) return "no";
  if (looksLikeYes(t)) return "yes";
  return "unclear";
}

function quote(answer: string | null | undefined, fallback: string) {
  const t = (answer || "").replace(/\s+/g, " ").trim();
  if (!t) return fallback;
  const clipped = t.length > 140 ? `${t.slice(0, 137)}…` : t;
  return `"${clipped}"`;
}

function turn(turns: ScreenTurn[], id: string) {
  return turns.find((t) => t.id === id);
}

const YEAR_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

function yearsFromNote(note: string) {
  const digit = note.match(/(\d+)\s*\+?\s*years?/i);
  if (digit) return Number(digit[1]);
  const word = note.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+years?/i);
  if (word) return YEAR_WORDS[word[1].toLowerCase()] ?? 0;
  return 0;
}

function scoreThesis(answer: string | null | undefined): RubricVerdict {
  const raw = (answer || "").trim();
  if (!raw) return "no";
  const text = raw.toLowerCase();
  const substance = /ledger|postgres|shard|lock|kafka|bottleneck|reconcil|billing|architect|scale|production|owned|ownership/;
  const ownership = /\bi\s+(owned|built|split|moved|redesigned|re-?architected|led|cut)\b|\bpersonally\b|\bmy (job|call|design)\b/;
  if (raw.length < 40 && !substance.test(text)) return "no";
  if (substance.test(text) && (ownership.test(text) || raw.length > 140)) return "met";
  if (substance.test(text) || raw.length > 90) return "partial";
  return "no";
}

export function summarizeScreen(c: ScreenInput): ScreenSummary {
  const eligibility = turn(c.turns, "eligibility");
  const thesis = turn(c.turns, "thesis");
  const questions = turn(c.turns, "questions");
  const eligPolarity = polarity(eligibility?.answer);
  const thesisVerdict = scoreThesis(thesis?.answer);
  const asked = polarity(questions?.answer) === "yes";
  const note = (c.note || "").trim();
  const years = c.yrs >= 3 ? c.yrs : yearsFromNote(note) || c.yrs;
  const hay = `${note} ${c.area} ${c.stack} ${thesis?.answer || ""}`.toLowerCase();
  const payments = /billing|ledger|payment/.test(hay);
  const postgres = /postgres|shard|partition/.test(hay) || c.repos > 8;
  const goRust = /\bgo\b|golang|\brust\b/.test(hay);

  const eligVerdict: RubricVerdict = eligPolarity === "yes" || (eligPolarity === "unclear" && c.authorized) ? (eligPolarity === "yes" ? "met" : "partial") : eligPolarity === "no" || c.authorized === false ? "no" : "partial";
  const yearVerdict: RubricVerdict = years >= 5 ? "met" : years >= 3 ? "partial" : "no";
  const postgresVerdict: RubricVerdict = postgres ? (c.repos > 8 || /shard|lock|partition/.test(hay) ? "met" : "partial") : c.website && /github\.com/.test(c.website) ? "partial" : "no";
  const goVerdict: RubricVerdict = goRust ? "met" : "no";
  const payVerdict: RubricVerdict = payments ? "met" : "no";

  const rubric: ScreenRubric[] = [
    {
      name: "Full-time and US work authorization",
      kind: "must",
      src: "call",
      verdict: eligVerdict,
      detail:
        eligVerdict === "met"
          ? `${quote(eligibility?.answer, "Confirmed on the call.")} Full-time and authorized to work in the US.`
          : eligVerdict === "partial"
            ? "Authorization is on the application, but the call answer was unclear."
            : `${quote(eligibility?.answer, "Did not confirm on the call.")} Full-time or US work authorization was not confirmed.`,
    },
    {
      name: "Payments ledger ownership",
      kind: "must",
      src: "call",
      verdict: thesisVerdict,
      detail:
        thesisVerdict === "met"
          ? quote(thesis?.answer, "Named what was breaking and what they personally owned.")
          : thesisVerdict === "partial"
            ? `${quote(thesis?.answer, "Talked about the ledger.")} Ownership or the failure mode was vague.`
            : `${quote(thesis?.answer, "No answer captured.")} Could not explain what was breaking or what they personally owned.`,
    },
    {
      name: "5+ years backend",
      kind: "must",
      src: "résumé",
      verdict: yearVerdict,
      detail:
        yearVerdict === "met"
          ? `${years} years backend${c.company ? `, most recently at ${c.company}` : ""}.`
          : yearVerdict === "partial"
            ? note
              ? `Application mentions ${years || "a few"} years${c.company ? ` at ${c.company}` : ""}. Below the 5-year bar.`
              : `${years} years, below the 5-year bar.`
            : note
              ? "Application does not show 5+ years of backend work."
              : "Résumé does not show 5+ years of backend work.",
    },
    {
      name: "Postgres at scale",
      kind: "must",
      src: "GitHub",
      verdict: postgresVerdict,
      detail:
        postgresVerdict === "met"
          ? "Repos or the call point to real Postgres work: sharding, locks, or partitioning."
          : postgresVerdict === "partial"
            ? c.website && /github\.com/.test(c.website)
              ? "GitHub linked from the application; no scale signal on the call."
              : "Uses Postgres, but the call did not get into scale."
            : "No Postgres in the application, repos, or call.",
    },
    {
      name: "Go or Rust",
      kind: "nice",
      src: "résumé",
      verdict: goVerdict,
      detail: goVerdict === "met" ? "Go or Rust on the résumé or in their own words." : "Neither mentioned on the application or the call.",
    },
    {
      name: "Payments domain",
      kind: "nice",
      src: "résumé",
      verdict: payVerdict,
      detail: payVerdict === "met" ? (note ? quote(note, "Payments or billing experience on the application.") : "Payments or billing experience on the application.") : "None on the application or the call.",
    },
  ];

  const strengths: string[] = [];
  const concerns: string[] = [];
  if (eligVerdict === "met") strengths.push("Confirmed full-time and US work authorization on the call.");
  if (thesisVerdict === "met") strengths.push("Walked through what was breaking on the ledger and what they personally owned.");
  if (payVerdict === "met") strengths.push("Application shows payments or billing work.");
  if (asked) strengths.push("Came with questions about the role.");
  if (eligVerdict === "no") concerns.push("Did not confirm full-time or US work authorization.");
  if (thesisVerdict === "no") concerns.push("Could not explain what was breaking on the payments ledger or what they personally owned.");
  else if (thesisVerdict === "partial") concerns.push("Ledger answer was thin on what was breaking and what they personally owned.");
  if (yearVerdict === "no") concerns.push("Does not clearly meet the 5+ years backend bar.");
  if (!strengths.length) strengths.push("Took the screen.");
  if (!concerns.length) concerns.push("Little signal beyond the screen.");

  const authLabel = c.authorized === false ? "Needs US sponsorship" : "Authorized to work in the US";
  const logistics = [
    { k: "Work authorization", v: eligVerdict === "met" ? `${authLabel} · confirmed on the call` : authLabel, warn: eligVerdict === "no" || c.authorized === false },
    { k: "Earliest start", v: c.startDate || "Not asked on this screen" },
    { k: "Location", v: c.loc ? `Remote, in ${c.loc}` : "—" },
  ];

  const flags: [string, string][] = [];
  if (thesisVerdict === "no") flags.push(["Ledger answer incomplete", "warn"]);
  if (eligVerdict === "no" || c.authorized === false) flags.push(["Work authorization unclear", "warn"]);

  const app = clamp(50 + (c.authorized === false ? -20 : 12) + (c.startDate ? 8 : 0) + (note.length > 40 ? 10 : 0) + (c.linkedin ? 6 : 0) + (c.website ? 6 : 0), 35, 95);
  const soc = clamp(40 + (c.linkedin ? 25 : 0) + (c.website ? 20 : 0) + (c.repos > 0 ? 10 : 0), 30, 95);
  const call = clamp((eligVerdict === "met" ? 35 : eligVerdict === "partial" ? 18 : 6) + (thesisVerdict === "met" ? 50 : thesisVerdict === "partial" ? 22 : 0) + (asked ? 8 : 0), 8, 95);
  const scores = { app, soc, call, final: clamp(app * 0.3 + soc * 0.2 + call * 0.5, 1, 99) };

  const noteLine =
    thesisVerdict === "met" && eligVerdict === "met"
      ? "Confirmed eligibility, then walked through the ledger: what was breaking and what they personally owned."
      : thesisVerdict === "no"
        ? `Eligibility ${eligVerdict === "met" ? "was a yes" : "was unclear"}. The ledger follow-up did not land: ${quote(thesis?.answer, "no answer")}.`
        : "Eligibility was fine. Ledger answer had some signal but was light on ownership.";

  return {
    strengths: strengths.slice(0, 3),
    concerns: concerns.slice(0, 2),
    rubric,
    flags,
    logistics,
    note: noteLine,
    why: `${concerns[0]} ${strengths[0]}`,
    scores,
  };
}
