# Firstcall

A recruiter phone-screen assistant, scaffolded for Dream AI Hackathon. `Firstcall` is a working UI name; the repository is `recruiter-phone-agent`.

## Run locally

Use Node 22 LTS (22.13 or newer) and npm.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The development server binds to loopback. No API keys or `.env` file are needed for the demo.

## Included

- Next.js App Router, React, TypeScript, plain CSS, Lucide icons, and Zod.
- Recruiter overview with candidate search and outcome filters.
- Role draft form, candidate preview, and evidence-linked sample interview briefs.
- Completed, no-answer, and opt-out demo outcomes.
- Typed domain models and server-only provider interfaces.
- ESLint, Prettier, Vitest, type checking, and a production build command.

## Demo boundaries

All candidates, role information, transcripts, and briefs are fictional fixtures. The demo API selects an outcome; it does not run AI or make phone calls. No microphone, recording, external provider request, or personal phone number is used.

Session drafts and generated samples live in React memory and reset on page refresh. Seed examples remain available. The role editor creates drafts; the sample call always uses the original Northstar support role. The current app has no authentication, database, durable queue, or production deployment.

## Routes

| Route                           | Behavior                                                   |
| ------------------------------- | ---------------------------------------------------------- |
| `/`                             | Recruiter overview                                         |
| `/roles/new`                    | Save a role draft for the current session                  |
| `/candidate`                    | Generate one of three fictional outcomes                   |
| `/interviews/[id]`              | Review facts, evidence links, transcript, or empty outcome |
| `/integrations`                 | Integration status and official documentation              |
| `GET /api/health`               | Demo health status, no secrets                             |
| `POST /api/demo/calls`          | Validates `{ consent: true, scenario }`, returns a fixture |
| `POST /api/calls`               | Returns HTTP 501; live calls are not implemented           |
| `POST /api/webhooks/elevenlabs` | Returns HTTP 501; does not acknowledge unprocessed events  |

`scenario` is `completed`, `no-answer`, or `opted-out`. Demo acknowledgment is not a production consent record. The response's `mode: "demo"` distinguishes sample data from a real call.

## Check the scaffold

```bash
npm run check
npm run format:check
```

`check` runs lint, route type generation, TypeScript, tests, and a production build. Tests cover affirmative demo acknowledgment, invalid payloads, evidence references, no-answer/opt-out outcomes, and disabled live endpoints. ESLint 9 matches the peer support of Next's current React/accessibility plugins; the lockfile pins the dependency tree.

## Structure

```text
src/
  app/                 Pages, layouts, CSS, and API route handlers
  components/          Interface and session-only demo state
  lib/                 Domain types, fictional fixtures, demo validation
  server/providers/    Server-only ElevenLabs and Nebius adapter contracts
docs/
  architecture.md      Integration sequence and implementation boundaries
```

## Connect real services next

`.env.example` lists future server-side configuration. Copy it to `.env.local` when implementing adapters. Never prefix provider keys with `NEXT_PUBLIC_`, commit secrets, or expose them to the browser. Adding keys alone does not enable integrations.

Use ElevenLabs Agents for the call, a Twilio number linked in ElevenLabs, and Nebius Token Factory for question preparation and transcript analysis. Implement the providers under `src/server/providers/` after adding persistent applications, calling permission, authentication, and deduplicated attempts. See [architecture](docs/architecture.md).

This scaffold makes no employment decisions. Candidate self-reports are not verified credentials, and a missing conversation is not negative evidence about a candidate.
