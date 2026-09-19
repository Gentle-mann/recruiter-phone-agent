"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Mic, PhoneOff, Send } from "lucide-react";

type Turn = { id: string; role: string; text: string };
export function AgentPreview() {
  return (
    <ConversationProvider>
      <AgentSession />
    </ConversationProvider>
  );
}
function AgentSession() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(false);
  const [textOnly, setTextOnly] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [message, setMessage] = useState("");
  const starting = useRef(false);
  const mounted = useRef(true);
  const abort = useRef<AbortController | null>(null);
  const conversation = useConversation({
    onConnect: ({ conversationId }) => {
      starting.current = false;
      setPending(false);
      setConversationId(conversationId);
    },
    onDisconnect: () => {
      starting.current = false;
      setPending(false);
    },
    onError: () => {
      starting.current = false;
      setPending(false);
      setError(
        "The conversation could not continue. Check your microphone permission and connection, then try again.",
      );
    },
    onMessage: ({ message, role, event_id }) => {
      if (!message) return;
      const id =
        event_id === undefined ? crypto.randomUUID() : `${role}-${event_id}`;
      setTurns((previous) => {
        const existing = previous.findIndex((turn) => turn.id === id);
        if (existing < 0) return [...previous, { id, role, text: message }];
        return previous.map((turn, index) =>
          index === existing ? { id, role, text: message } : turn,
        );
      });
    },
  });
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    fetch("/api/elevenlabs/status", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Status unavailable");
        const result = await response.json();
        setConfigured(result.configured === true);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setConfigured(false);
          setError("Could not check ElevenLabs configuration.");
        }
      });
    return () => {
      mounted.current = false;
      controller.abort();
      abort.current?.abort();
    };
  }, []);
  const active = conversation.status === "connected";
  const busy = pending || conversation.status === "connecting";
  async function start() {
    if (!consent || !configured || active || starting.current) return;
    starting.current = true;
    setPending(true);
    setError("");
    setTurns([]);
    setConversationId("");
    abort.current = new AbortController();
    try {
      const response = await fetch("/api/elevenlabs/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
        signal: AbortSignal.any([
          abort.current.signal,
          AbortSignal.timeout(12000),
        ]),
      });
      const result = await response.json();
      if (!response.ok || !result.signedUrl)
        throw new Error(result.error || "Could not start the agent.");
      if (!mounted.current || abort.current.signal.aborted) return;
      conversation.startSession({
        signedUrl: result.signedUrl,
        connectionType: "websocket",
        textOnly,
      });
    } catch (failure) {
      if (mounted.current) {
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not start the agent.",
        );
        setPending(false);
      }
      starting.current = false;
    }
  }
  function end() {
    abort.current?.abort();
    conversation.endSession();
    starting.current = false;
    setPending(false);
  }
  function send(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!active || !text) return;
    conversation.sendUserMessage(text);
    setTurns((previous) => [
      ...previous,
      { id: crypto.randomUUID(), role: "user", text },
    ]);
    setMessage("");
  }
  return (
    <div className="agent-preview">
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">ELEVENLABS · LIVE PRACTICE</p>
          <h1>
            Meet your
            <br />
            recruiting assistant.
          </h1>
          <p className="subtitle">
            Try a short conversation for the fictional Northstar support role.
          </p>
        </div>
      </div>
      <section className="panel agent-session">
        <div className="integration-heading">
          <Mic size={28} />
          <span className="muted-tag">
            {active
              ? conversation.isSpeaking
                ? "Agent speaking"
                : "Connected"
              : busy
                ? "Connecting…"
                : "Ready to practice"}
          </span>
        </div>
        <h2>A real AI conversation. A fictional application.</h2>
        <p>
          Voice mode uses your microphone. ElevenLabs processes your audio or
          text and may retain the transcript. This uses your ElevenLabs
          allowance. Please use made-up details. No phone number is dialed.
        </p>
        {configured === false && (
          <div className="demo-notice">
            <div>
              <strong>One setup step remains</strong>
              <p>
                Add your ElevenLabs API key to the local environment file and
                restart the app. Your key stays on this computer’s server.
              </p>
            </div>
          </div>
        )}
        <label className="scenario-label">
          Conversation mode
          <select
            disabled={active || busy}
            value={textOnly ? "text" : "voice"}
            onChange={(event) => setTextOnly(event.target.value === "text")}
          >
            <option value="voice">Voice · microphone and speakers</option>
            <option value="text">Text · no microphone</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={consent}
            disabled={active || busy}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span>
            I agree to send my practice conversation to ElevenLabs for
            processing.
          </span>
        </label>
        <div className="agent-actions">
          {active || busy ? (
            <button className="button primary" onClick={end}>
              <PhoneOff size={17} />
              End conversation
            </button>
          ) : (
            <button
              className="button primary"
              onClick={start}
              disabled={!consent || configured !== true}
            >
              {configured === null
                ? "Checking connection…"
                : "Start conversation"}
              <Mic size={17} />
            </button>
          )}
          {active && !textOnly && (
            <button
              className="button secondary"
              onClick={() => conversation.setMuted(!conversation.isMuted)}
            >
              {conversation.isMuted ? "Unmute microphone" : "Mute microphone"}
            </button>
          )}
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {conversationId && (
          <p className="candidate-footnote">
            Conversation ID: {conversationId}
          </p>
        )}
      </section>
      <section className="panel agent-session">
        <h2>Conversation transcript</h2>
        <p>
          Live text can change as speech is recognized. It stays here for this
          session; an interview brief is not generated yet.
        </p>
        <div className="agent-transcript" role="log" aria-live="polite">
          {turns.length ? (
            turns.map((turn) => (
              <div className="agent-turn" key={turn.id}>
                <strong>{turn.role === "user" ? "You" : "Firstcall"}</strong>
                <p>{turn.text}</p>
              </div>
            ))
          ) : (
            <p className="candidate-footnote">
              Your conversation will appear here after you start.
            </p>
          )}
        </div>
        {active && textOnly && (
          <form className="agent-message" onSubmit={send}>
            <input
              aria-label="Message to the agent"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              placeholder="Type a fictional answer…"
            />
            <button
              className="button primary"
              disabled={!message.trim()}
              type="submit"
            >
              <Send size={16} />
              Send
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
