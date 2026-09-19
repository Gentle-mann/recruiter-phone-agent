import { AudioLines, BrainCircuit, Cable, ArrowUpRight } from "lucide-react";

const integrations = [
  {
    name: "ElevenLabs",
    purpose: "The conversation",
    description:
      "Voice, turn-taking, outbound calling, and post-call transcripts through the Agents platform.",
    icon: AudioLines,
    href: "https://elevenlabs.io/docs/eleven-agents/overview",
  },
  {
    name: "Nebius",
    purpose: "The preparation & brief",
    description:
      "Prepare role-specific questions and extract structured evidence from completed conversations.",
    icon: BrainCircuit,
    href: "https://docs.tokenfactory.nebius.com/quickstart",
  },
  {
    name: "Twilio",
    purpose: "The phone connection",
    description:
      "Connect a provisioned phone number through the ElevenLabs dashboard for real candidate calls.",
    icon: Cable,
    href: "https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration",
  },
];

export const metadata = { title: "Integrations" };
export default function IntegrationsPage() {
  return (
    <>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">BUILT TO CONNECT</p>
          <h1>
            The tools behind
            <br />
            the conversation.
          </h1>
          <p className="subtitle">
            Your workspace is ready for its next implementation step.
          </p>
        </div>
      </div>
      <div className="integration-grid">
        {integrations.map(
          ({ name, purpose, description, icon: Icon, href }) => (
            <section className="panel integration-card" key={name}>
              <div className="integration-heading">
                <Icon size={28} />
                <span className="muted-tag">Not connected</span>
              </div>
              <p className="eyebrow">{purpose}</p>
              <h2>{name}</h2>
              <p>{description}</p>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Read documentation
                <ArrowUpRight size={15} />
              </a>
            </section>
          ),
        )}
      </div>
      <section className="panel implementation-note">
        <h2>Scaffold status</h2>
        <p>
          The demo works without accounts or API keys. Provider interfaces and
          environment placeholders are included, but live calling and analysis
          are not implemented. Adding a key alone will not turn them on.
        </p>
        <p>
          Before live use: connect authentication, persistent application and
          consent records, call deduplication, signed webhook processing, and
          the provider adapters.
        </p>
      </section>
    </>
  );
}
