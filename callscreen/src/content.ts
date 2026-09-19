// Display copy per role pack. Pure text; the backend owns the data.
export const STAGES = ["applied", "application", "socials", "call", "scored"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = { applied: "Applied", application: "Application", socials: "Socials", call: "Phone call", scored: "Scored" };
export const BOARD_STAGES = ["application", "socials", "call", "scored"] as const;
export type BoardStage = (typeof BOARD_STAGES)[number];
export const boardStage = (s: Stage): BoardStage => (s === "applied" ? "application" : s);

type Pack = {
  social: [string, string, string][];
  q: [string, string][];
  note: string[];
  titles: string[];
  rubric: [string, "must" | "nice", string, [string, string, string]][];
  history: [string, string, string][];
  edu: string;
  skills: string[];
  asked: string[];
  strengths: string[];
  concerns: string[];
  logistics: { salary: string; start: string; notice: string; auth: string; remote: string; other: string };
};

export const CONTENT: Record<string, Pack> = {
  be: {
    social: [
      ["gh", "GitHub", "{n} public repos, {s} stars. Steady commits for 3 years, mostly to a Postgres tooling project. Clean READMEs."],
      ["in", "LinkedIn", "Tenure matches the résumé. One 4-month gap in 2023, worth asking about."],
      ["x", "X", "Posts occasionally about database internals. Nothing concerning."],
    ],
    q: [
      ["Walk me through a system you built that outgrew its first design.", "The ledger. We started with one Postgres table and row locks. At about 40k writes a minute the locks were the bottleneck, so I split hot accounts into shards and moved reconciliation to a nightly job. It took two quarters and I would do the sharding earlier next time."],
      ["What does on-call look like on your team right now?", "One week in six. Pages are down to two or three a week since we added budget alerts, most of them are noisy Kafka lag warnings that I want to fix."],
      ["Why leave now?", "Honestly, the team is shrinking and I want to build with people again. I read about what you are doing with voice and it is the first thing in a while that made me curious."],
    ],
    note: ["Specific about tradeoffs, owned the mistakes. Clear communicator.", "Solid technically but vague on ownership. Team results, not personal.", "Strong on systems, hesitated on relocation and start date.", "Talked fast and in generalities. Could not name a concrete failure."],
    titles: ["Senior Backend Engineer", "Backend Engineer", "Staff Engineer", "Software Engineer II"],
    rubric: [
      ["5+ years backend", "must", "résumé", ["{yrs} years across two companies, the last three at {company}.", "{yrs} years, but most of it full-stack with light backend.", "Résumé shows {yrs} years, mostly frontend."]],
      ["Owned a production system end to end", "must", "call 2:14", ["\"I owned {area} from the first design doc to on-call.\"", "\"I was one of three people on {area}.\" Shared ownership.", "Could not name a system they owned alone."]],
      ["Postgres at scale", "must", "GitHub", ["Repos and the call both point to real Postgres work: sharding, partitioning, query plans.", "Uses Postgres, but scale questions got general answers.", "No Postgres in résumé, repos, or call."]],
      ["US timezone overlap", "must", "call 5:40", ["\"{loc} is home, I am not planning to move.\"", "Willing to shift hours, currently 6h off.", "Would need 9h+ overlap shift. Said no."]],
      ["Go or Rust", "nice", "résumé", ["Go daily for four years.", "Some Go, mostly Python.", "Neither."]],
      ["Payments domain", "nice", "résumé", ["Two years on {area} at {company}.", "Adjacent: billing reconciliation tooling.", "None."]],
    ],
    history: [["Senior Backend Engineer", "{company}", "2022 – now"], ["Backend Engineer", "Farfetch", "2019 – 2022"], ["Software Engineer", "Talkdesk", "2017 – 2019"]],
    edu: "BSc Computer Science, Instituto Superior Técnico, 2017",
    skills: ["Go", "Postgres", "Kafka", "Kubernetes", "gRPC", "Terraform", "Redis", "Python"],
    asked: ["How big is the platform team, and who would I report to?", "Is the role open to fully remote inside the US?", "What does the rest of the process look like?"],
    strengths: ["Specific about tradeoffs, owns mistakes without prompting.", "Postgres depth is real, backed by public repos.", "Wants to leave for the right reasons: a shrinking team, not a grievance."],
    concerns: ["Four-month gap in 2023 not explained on the call.", "Salary expectation is at the top of the band."],
    logistics: { salary: "$160k–180k", start: "1 October", notice: "2 months", auth: "US citizen", remote: "Remote, in {loc}", other: "2 other processes, one at final stage" },
  },
  pd: {
    social: [
      ["◎", "Portfolio", "4 case studies, latest from this year. Shows research, iterations and what shipped. Strong."],
      ["dr", "Dribbble", "120 shots, mostly visual explorations. Not much product thinking, but craft is high."],
      ["in", "LinkedIn", "Titles match. Two roles under 12 months, worth a question."],
    ],
    q: [
      ["Tell me about the last thing you shipped that you are proud of. What was your part?", "The onboarding redesign. I ran the research, did the flows, and paired with one engineer for three weeks. Activation went from 31% to 44%."],
      ["How do you decide when a design is done?", "When the next iteration would cost more than it would teach us. I try to ship a smaller version and watch what people actually do."],
      ["How do you work with engineers day to day?", "I sit in standup, I write the tickets with them, and I am comfortable opening a PR for spacing and copy."],
    ],
    note: ["Specific, owns outcomes, comfortable with engineers.", "Beautiful work, but every answer was about visuals. Thin on product reasoning.", "Good process, quiet on results. Ask for numbers.", "Portfolio was strongest signal; call added little."],
    titles: ["Senior Product Designer", "Product Designer", "Lead Product Designer", "Design Engineer"],
    rubric: [
      ["4+ years product design", "must", "résumé", ["{yrs} years in product roles at {company} and earlier.", "{yrs} years, half of it in visual and brand.", "Mostly brand design, under 2 years in product."]],
      ["Shipped a 0→1 product", "must", "portfolio", ["Case study on {area} covers research through launch metrics.", "Portfolio shows launches, but always as part of a bigger team.", "No 0→1 work in portfolio or on the call."]],
      ["Figma prototyping", "must", "call 4:02", ["Described interactive prototypes used in usability tests.", "Uses Figma daily, prototyping mostly static.", "Works in Sketch, no Figma prototyping."]],
      ["Portfolio link", "must", "application", ["Portfolio linked, 4 case studies, latest this year.", "Portfolio linked, last updated 2023.", "No portfolio provided."]],
      ["Works close to engineers", "nice", "call 7:20", ["\"I open PRs for spacing and copy.\"", "Attends standup, hands off in Figma.", "Works through a PM only."]],
      ["B2B SaaS", "nice", "résumé", ["Three years at {company}, B2B.", "Consumer mostly, one B2B project.", "Consumer only."]],
    ],
    history: [["Senior Product Designer", "{company}", "2022 – now"], ["Product Designer", "Typeform", "2019 – 2022"], ["UI Designer", "Freelance", "2017 – 2019"]],
    edu: "BA Interaction Design, Umeå Institute of Design, 2017",
    skills: ["Figma", "Prototyping", "User research", "Design systems", "Framer", "CSS"],
    asked: ["How many designers are on the team?", "Do designers own research here or is there a research team?", "What is the design review culture like?"],
    strengths: ["Owns outcomes, quotes activation numbers without being asked.", "Comfortable with engineers, opens PRs.", "Portfolio is current and shows process, not just finals."],
    concerns: ["Two roles under 12 months in a row.", "Little B2B experience."],
    logistics: { salary: "$130k–145k", start: "15 November", notice: "1 month", auth: "US citizen", remote: "Hybrid, {loc}", other: "One other process, early stage" },
  },
  ae: {
    social: [
      ["in", "LinkedIn", "Consistent quota claims across roles. 3 roles in 5 years, normal for sales."],
      ["x", "X", "Active, posts about sales craft. Professional tone."],
      ["◎", "Personal site", "None found."],
    ],
    q: [
      ["Tell me about your biggest closed deal last year, start to finish.", "A 180k ARR deal with a logistics company. Found the champion at a conference, got to the CFO in three weeks. The hard part was procurement, I brought our legal in early."],
      ["What was your quota and attainment the last two years?", "1.1M and I hit 118%. The year before 900k at 94%, I lost a big one in Q4."],
      ["How do you handle a deal that goes quiet?", "I go back to the pain we agreed on, not the product. If there is no pain I let it go and put it on a 90-day nurture."],
    ],
    note: ["Numbers were specific and consistent with LinkedIn. High energy without being pushy.", "Overstated attainment compared with earlier answer. Follow up.", "Strong on process, fewer specifics on deals.", "Very polished, hard to tell what is real."],
    titles: ["Account Executive", "Senior Account Executive", "Mid-Market AE", "Enterprise AE"],
    rubric: [
      ["3+ years closing", "must", "résumé", ["{yrs} years carrying a quota at {company}.", "{yrs} years, 1 of them as SDR.", "Only SDR and BDR roles."]],
      ["Quota attainment 100%+", "must", "call 3:10", ["\"1.1M quota, 118% last year.\" Consistent with LinkedIn.", "Hit 94% one year and 118% the next.", "Would not give numbers."]],
      ["Sold to technical buyers", "must", "call 5:02", ["Sold devtools to engineering leaders for 2 years.", "Sold to ops, some technical evaluation involved.", "Sold to HR and finance buyers only."]],
      ["Deal size $50k+", "must", "call 1:40", ["Average deal 180k ARR.", "Average 40k, largest 120k.", "SMB deals under 10k."]],
      ["Outbound heavy", "nice", "call 6:15", ["70% self-sourced pipeline.", "Half inbound, half outbound.", "Inbound only."]],
      ["US mid-market experience", "nice", "résumé", ["US mid-market at {company}.", "US SMB only.", "EMEA only."]],
    ],
    history: [["Account Executive", "{company}", "2022 – now"], ["SDR then AE", "Pipedrive", "2019 – 2022"], ["Sales Associate", "Enterprise Rent-A-Car", "2018 – 2019"]],
    edu: "BA Business, University of Amsterdam, 2018",
    skills: ["Outbound", "Salesforce", "Gong", "MEDDIC", "Negotiation", "Demoing"],
    asked: ["What is the OTE split?", "How much of pipeline is inbound today?", "Who would I be selling with, is there an SE?"],
    strengths: ["Numbers were specific and matched LinkedIn.", "Handles objections by going back to pain, not features.", "High energy without being pushy."],
    concerns: ["OTE expectation is above the band.", "Only one full year above quota."],
    logistics: { salary: "$180k OTE, 50/50", start: "1 November", notice: "1 month", auth: "Green card", remote: "Hybrid, {loc}", other: "Two other processes" },
  },
};

export const TZ: Record<string, string> = { Lisbon: "GMT+1", Berlin: "GMT+2", London: "GMT+1", Toronto: "GMT-4", Austin: "GMT-5", Amsterdam: "GMT+2", "São Paulo": "GMT-3", Singapore: "GMT+8", Warsaw: "GMT+2", Dublin: "GMT+1", "New York": "GMT-4", Lagos: "GMT+1", Tokyo: "GMT+9", Madrid: "GMT+2", Stockholm: "GMT+2", Bangalore: "GMT+5:30", "San Francisco": "GMT-7" };

// ---- helpers ----
export const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
export const fmtAgo = (ms: number) => { const m = Math.max(0, Math.floor(ms / 60_000)); return m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d`; };
export const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export function hash(str: string) { let h = 0; for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
export const pr = (id: string, k: number) => ((hash(id) * (k + 3) * 2654435761) >>> 0) % 1000 / 1000;
export const fill = (t: string, c: { yrs: number; company: string; area: string; loc: string }) =>
  t.replace(/\{yrs\}/g, String(c.yrs)).replace(/\{company\}/g, c.company).replace(/\{area\}/g, c.area).replace(/\{loc\}/g, c.loc);
