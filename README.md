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

The dashboard candidates, roles, transcripts, and briefs are fictional fixtures. The demo API never calls providers. The separate `/agent` page connects to a real ElevenLabs agent for voice or text practice after acknowledgment; audio/text is processed by ElevenLabs. No phone number is dialed.

Session drafts and generated samples live in React memory and reset on page refresh. Seed examples remain available. The role editor creates drafts; the sample call always uses the original Northstar support role. The current app has no authentication, database, durable queue, or production deployment.

## ElevenLabs browser connection

The `/agent` page uses `@elevenlabs/react` with server-issued, single-use signed WebSocket URLs. Voice and text modes share the configured agent, with start/end controls and a session-only transcript.

Copy `.env.example` to `.env.local`, set `ELEVENLABS_LOCAL_PREVIEW=true`, `ELEVENLABS_AGENT_ID`, and `ELEVENLABS_API_KEY`, then restart the server. Enable authentication on the ElevenLabs agent. The local project configuration already contains the created demo agent ID; its API key is intentionally blank until configured. Never commit `.env.local`.

This is a **local developer preview**, not a public candidate endpoint: the server must remain bound to loopback. Session creation requires a matching localhost Origin. Do not expose it through a tunnel or reverse proxy; add real application authentication, quotas, and ownership checks before deployment. Configuration status is not proof of valid credentials; only a successful conversation confirms the connection.

The configured demo agent uses a fictional Northstar support role, asks permission before interviewing, and makes no employment decisions. It requires authentication, ends after five minutes or 30 seconds of silence, allows one concurrent conversation and 30 per day, disables bursting/audio storage, and retains transcripts for seven days. The text-only override is enabled for microphone-free tests. These are provider settings, not guarantees enforced by the browser.

## Routes

| Route                           | Behavior                                                   |
| ------------------------------- | ---------------------------------------------------------- |
| `/`                             | Recruiter overview                                         |
| `/roles/new`                    | Save a role draft for the current session                  |
| `/candidate`                    | Generate one of three fictional outcomes                   |
| `/interviews/[id]`              | Review facts, evidence links, transcript, or empty outcome |
| `/agent`                        | Live ElevenLabs browser practice (local only)              |
| `GET /api/elevenlabs/status`    | Configuration status, without keys                         |
| `POST /api/elevenlabs/session`  | Same-origin local session authorization                    |
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

`.env.example` lists future server-side configuration. Copy it to `.env.local` when implementing adapters. Never prefix provider keys with `NEXT_PUBLIC_`, commit secrets, or expose them to the browser. Browser practice also requires `ELEVENLABS_LOCAL_PREVIEW=true`. Outbound phone calling remains disabled.

Use ElevenLabs Agents for the call, a Twilio number linked in ElevenLabs, and Nebius Token Factory for question preparation and transcript analysis. Implement the providers under `src/server/providers/` after adding persistent applications, calling permission, authentication, and deduplicated attempts. See [architecture](docs/architecture.md).

This scaffold makes no employment decisions. Candidate self-reports are not verified credentials, and a missing conversation is not negative evidence about a candidate.
