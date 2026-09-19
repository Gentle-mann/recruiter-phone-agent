/** Pre-filled demo application. Phone is display-only; Twilio still dials TWILIO_TO. */
export const PREFILL = {
  name: "Jordan Lee",
  email: "jordan.lee@gmail.com",
  phone: "+1 (415) 555-0198",
  loc: "San Francisco",
  linkedin: "https://linkedin.com/in/jordanlee",
  website: "https://github.com/jordanlee",
  resumeName: "Jordan_Lee_Resume.pdf",
  authorized: true,
  startDate: "Two weeks after an offer",
  note: "I owned billing infrastructure at Stripe for three years and want to get closer to the product again.",
  yrs: 6,
  company: "Stripe",
  area: "billing infrastructure",
  stack: "Go, Postgres, Kafka",
  roleName: "Backend Engineer",
  roleSlug: "backend-engineer",
  roleTeam: "Platform",
  bullets: [
    "Senior backend engineer at Stripe, billing infrastructure, 2022 – now",
    "Backend engineer at Farfetch, 2019 – 2022",
    "Go, Postgres, Kafka. Shipped a ledger that moved from row locks to account shards.",
    "EU and US overlap. Can start two weeks after an offer.",
  ],
};

export type Prefill = typeof PREFILL;
