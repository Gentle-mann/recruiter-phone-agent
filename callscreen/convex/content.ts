// Copy packs used by the seed and the simulation. The UI has its own copy of
// the display text in src/content.ts; this file only holds what the backend
// needs to generate plausible candidates.
export const NAMES = ["Maya Lindqvist","Tomás Ferreira","Priya Raman","Jonah Whitfield","Aiko Tanaka","Daniel Okafor","Sofia Marchetti","Lucas Bernard","Hannah Kim","Ibrahim Saleh","Elena Petrova","Marcus Bell","Noor Haddad","Felix Wagner","Grace O'Neill","Rafael Costa","Yuki Sato","Amara Diallo","Oliver Brandt","Leila Nasser","Kai Nakamura","Isabel Ruiz","Ethan Cole","Zara Ahmed","Mateo Alvarez","Chloe Dubois","Ravi Menon","Nina Larsen","Samuel Adeyemi","Ingrid Holm","Diego Morales","Anya Volkov","Ben Carter","Mei Chen","Omar Farouk","Freya Jensen","Theo Martin","Layla Hassan","Victor Silva","Emma Fischer","Jasper Lee","Rosa Delgado","Arjun Mehta","Klara Novak","Kwame Mensah","Sienna Park","Luca Romano","Hana Yoshida"];
export const LOCS = ["Lisbon","Berlin","London","Toronto","Austin","Amsterdam","São Paulo","Singapore","Warsaw","Dublin","New York","Lagos","Tokyo","Madrid","Stockholm","Bangalore"];
export const SOURCES = ["LinkedIn","Careers page","Referral","Wellfound","X"];

export const PACKS: Record<string, { companies: string[]; areas: string[]; stacks: string[]; notes: number }> = {
  be: {
    companies: ["Stripe","Datadog","a Series B fintech","Shopify","Cloudflare","Klarna","Monzo","Vercel","Notion"],
    areas: ["billing infrastructure","event pipelines","auth and identity","search infra","the payments ledger","internal platform tooling","the public API"],
    stacks: ["Go, Postgres, Kafka","TypeScript, Node, Redis","Rust, gRPC, Postgres","Python, Django, Celery","Java, Spring, Kubernetes","Elixir, Phoenix"],
    notes: 4,
  },
  pd: {
    companies: ["Linear","Figma","a seed-stage fintech","Spotify","Monzo","Miro","Intercom","Airbnb"],
    areas: ["onboarding","the mobile app","design systems","growth experiments","the editor","checkout"],
    stacks: ["Figma, Framer, light React","Figma, Origami","Figma, Protopie","Figma, Webflow, CSS"],
    notes: 4,
  },
  ae: {
    companies: ["Gong","Salesforce","a Series A devtools startup","HubSpot","Deel","Rippling","Brex"],
    areas: ["mid-market EMEA","enterprise new logo","SMB inbound","partnerships"],
    stacks: ["Salesforce, Outreach","HubSpot, Apollo","Salesforce, Gong"],
    notes: 4,
  },
};

export const STAGES = ["applied", "application", "socials", "call", "scored"] as const;
export type Stage = (typeof STAGES)[number];

export function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export function makeCandidate(pack: string, name: string, r: () => number, stage: Stage, now: number, idx: number) {
  const c = PACKS[pack];
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const app = 55 + Math.floor(r() * 42), soc = 40 + Math.floor(r() * 55), call = 45 + Math.floor(r() * 53);
  const sIdx = STAGES.indexOf(stage);
  const agoMin = sIdx === 0 ? 1 + Math.floor(r() * 40) : 60 + Math.floor(r() * 60 * 40);
  const live = stage === "call" && idx < 2;
  const callDur = 120 + Math.floor(r() * 400);
  return {
    name, loc: pick(LOCS), source: pick(SOURCES),
    appliedAt: now - agoMin * 60_000,
    stage, app, soc, call, final: Math.round(app * .3 + soc * .2 + call * .5),
    live, callStartedAt: live ? now - callDur * 1000 : undefined, callDur,
    yrs: 3 + Math.floor(r() * 9), company: pick(c.companies), area: pick(c.areas), stack: pick(c.stacks),
    repos: 8 + Math.floor(r() * 60), stars: Math.floor(r() * 900),
    socialsFound: [r() > .1, r() > .25, r() > .55],
    noteIdx: Math.floor(r() * c.notes),
    taken: false,
  };
}
