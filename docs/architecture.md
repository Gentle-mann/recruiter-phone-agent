# Architecture and next implementation steps

## Scaffold

Pages use server components where possible. Interactive views consume a shared React context for fictional interviews and role drafts. No browser storage or database is configured. The demo POST route validates a strict request with Zod and returns a cloned fixture; it never touches a provider.

The `VoiceProvider` and `AnalysisProvider` contracts define where real integrations belong. Their current implementations throw `IntegrationNotConfiguredError` and import `server-only`. The live routes return 501 even when environment variables are present.

## Intended flow

```text
Recruiter approves role/questions
  → candidate requests callback with appropriate permission
  → authenticated backend creates a durable call attempt
  → ElevenLabs Agent ↔ Twilio ↔ candidate
  → verified post-call webhook → durable queue
  → Nebius extracts facts with transcript references
  → recruiter reviews and decides next step
```

Use stable role, candidate, application, attempt, provider-call, and conversation IDs. A phone number is not a unique application identity. Keep call operations distinct from employment outcomes.

## Build in order

1. Add authentication and a database with employer-scoped roles, applications, consent records, suppression state, attempts, transcripts, and briefs. Protect all reads and writes by employer/application ownership.
2. Implement one caller-authorized test number. Check consent, revocation, calling window, and duplicate attempts server-side before dialing. Use a durable idempotency/attempt lock; retries must not create duplicate calls. An ambiguous provider timeout needs reconciliation.
3. Implement the ElevenLabs adapter using `POST /v1/convai/twilio/outbound-call`. Pass approved role context as dynamic variables; save the returned conversation ID and call SID. `success` means initiation, not interview completion.
4. Verify webhook HMAC over the raw body with a timestamp tolerance. Enforce request limits before buffering large payloads. Persist and deduplicate events before acknowledging; analyze asynchronously. Handle initiation failures and voicemail separately.
5. Implement Nebius question preparation and schema-constrained extraction. Validate outputs, referenced turn IDs, quote fidelity, and unknown fields. Transcript instructions are untrusted data. Do not infer protected traits or issue automatic employment decisions.
6. Replace the demo context with repository-backed reads. Add production notices, candidate timing/alternative contact, opt-out processing, retention/deletion, and error recovery.
7. Smoke-test real calls, interruptions, partial calls, callback handling, duplicate webhooks, and provider errors with consenting testers. Then evaluate evidence accuracy and recruiter review effort.

## Provider documentation

- [ElevenLabs native Twilio integration](https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration)
- [Outbound API](https://elevenlabs.io/docs/eleven-agents/api-reference/integrations/twilio/outbound-call)
- [Post-call webhooks](https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks)
- [Disclosure requirements](https://elevenlabs.io/docs/eleven-agents/legal/disclosure-requirement)
- [Nebius quickstart](https://docs.tokenfactory.nebius.com/quickstart)
- [Nebius structured output](https://docs.tokenfactory.nebius.com/ai-models-inference/json)

Current recommendation: keep Nebius preparation/analysis outside the live voice latency path first. A custom live Nebius model is a later compatibility test, not an implemented capability.
