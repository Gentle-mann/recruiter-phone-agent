from __future__ import annotations

import json
import os
import queue
import re
import subprocess
import threading
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, render_template, request
from twilio.rest import Client
from twilio.twiml.voice_response import Gather, VoiceResponse

load_dotenv()

app = Flask(__name__)


def apply_cors(resp: Response) -> Response:
    origin = request.headers.get("Origin", "")
    if origin.startswith("http://127.0.0.1:") or origin.startswith("http://localhost:"):
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp


@app.before_request
def cors_preflight():
    if request.method == "OPTIONS":
        return apply_cors(app.make_response(("", 204)))


@app.after_request
def cors_headers(resp: Response):
    return apply_cors(resp)


VOICE = "Polly.Joanna"
TRIAL_TEMPLATE_URL = "https://webhooks.twilio.com/v1/Voice/Template/voice_speech_recognition"
LISTENERS: list[queue.Queue] = []
LOCK = threading.Lock()
TUNNEL_PROC: subprocess.Popen[str] | None = None

SCRIPT = [
    {
        "id": "opening",
        "label": "Opening",
        "prompt": (
            "Hi {name}, this is AI assistant calling from Callscreen about the Backend Engineer role. "
            "I wanted a few minutes for a short screen. "
            "Is now a good time for a quick chat?"
        ),
        "hints": "yes, yeah, sure, okay, ok, no, not a good time, busy, later",
        "timeout": 4,
        "speech_timeout": "auto",
    },
    {
        "id": "eligibility",
        "label": "Eligibility",
        "prompt": (
            "Thanks. Two quick checks. This is a full-time role, "
            "and we need authorization to work in the United States. "
            "Does that work for you?"
        ),
        "hints": "yes, yeah, sure, okay, authorized, work authorization, visa, sponsor, no, not authorized, part time, contractor",
        "timeout": 4,
        "speech_timeout": "auto",
    },
    {
        "id": "thesis",
        "label": "Experience",
        "prompt": (
            "Thank you. On your resume you mentioned you re-architected the payments ledger. "
            "What was breaking before, and what did you personally own?"
        ),
        "hints": "postgres, kafka, ledger, billing, scale, shard, locks, reconciliation, on call, design, production",
        "timeout": 8,
        "speech_timeout": "3",
    },
    {
        "id": "questions",
        "label": "Additional questions",
        "prompt": "Do you have any questions for me before we wrap up?",
        "hints": "no, nope, nothing, I'm good, yes, team, remote, process, salary, manager",
        "timeout": 6,
        "speech_timeout": "auto",
    },
]

SCRIPT_BY_ID = {step["id"]: step for step in SCRIPT}
STEP_ORDER = [step["id"] for step in SCRIPT]

state: dict[str, Any] = {
    "public_base_url": os.getenv("PUBLIC_BASE_URL", "").rstrip("/"),
    "account_sid": os.getenv("TWILIO_ACCOUNT_SID", "").strip(),
    "auth_token": os.getenv("TWILIO_AUTH_TOKEN", "").strip(),
    "from_number": os.getenv("TWILIO_FROM", "+17372324091").strip(),
    "to_number": os.getenv("TWILIO_TO", "+16283096310").strip(),
    "candidate_name": os.getenv("CANDIDATE_NAME", "Jordan Lee").strip() or "Jordan Lee",
    "call": None,
    "events": [],
}


@dataclass
class CallRecord:
    sid: str
    status: str
    from_number: str
    to_number: str
    candidate_name: str
    step: str = "opening"
    turns: list[dict[str, Any]] = field(default_factory=list)
    retries: int = 0
    started_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def log_event(kind: str, message: str, extra: dict[str, Any] | None = None) -> None:
    event = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "kind": kind,
        "message": message,
        "extra": extra or {},
    }
    with LOCK:
        state["events"].append(event)
        state["events"] = state["events"][-80:]
        listeners = list(LISTENERS)
    payload = json.dumps(event)
    for listener in listeners:
        try:
            listener.put_nowait(payload)
        except queue.Full:
            pass


def public_url() -> str:
    return (state.get("public_base_url") or "").rstrip("/")


def twilio_client() -> Client:
    sid = state["account_sid"]
    token = state["auth_token"]
    if not sid or not token:
        raise RuntimeError("Add your Twilio Auth Token in the form, then try again.")
    return Client(sid, token)


def is_trial_param_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return "disallowed parameters" in message or "trial accounts have limited" in message


def place_outbound_call(to: str, from_number: str, twiml: str, status_url: str):
    """Create a call with trial-safe parameters.

    New Twilio trial accounts reject custom webhook URLs and extra Call
    fields such as StatusCallbackEvent. Inline TwiML still works, and if
    that is blocked we start from Twilio's speech template then replace
    the instructions before the callee answers.
    """
    client = twilio_client()
    attempts = [
        {"to": to, "from_": from_number, "twiml": twiml, "status_callback": status_url},
        {"to": to, "from_": from_number, "twiml": twiml},
        {"to": to, "from_": from_number, "url": f"{public_url()}/voice"},
    ]
    last_error: Exception | None = None
    for kwargs in attempts:
        try:
            return client.calls.create(**kwargs)
        except Exception as exc:
            last_error = exc
            if is_trial_param_error(exc):
                continue
            raise

    call = client.calls.create(
        to=to,
        from_=from_number,
        url=TRIAL_TEMPLATE_URL,
        status_callback=status_url,
    )
    try:
        return client.calls(call.sid).update(twiml=twiml)
    except Exception:
        try:
            return client.calls(call.sid).update(url=f"{public_url()}/voice", method="POST")
        except Exception as exc:
            log_event(
                "error",
                "Call started with Twilio's trial template, but custom question TwiML was blocked.",
            )
            if last_error:
                raise last_error from exc
            raise


def say_text(response: VoiceResponse, text: str) -> None:
    response.say(text, voice=VOICE)


def closing_line(name: str) -> str:
    person = (name or "").strip()
    if person:
        return f"Great. Thanks for your time, {person}. Have a good day!"
    return "Great. Thanks for your time. Have a good day!"


def candidate_name() -> str:
    return (state.get("candidate_name") or "Jordan Lee").strip() or "Jordan Lee"


def formatted_prompt(step: dict[str, Any], name: str | None = None) -> str:
    return step["prompt"].format(name=name or candidate_name())


def prompt_twiml(step_id: str, preface: str | None = None) -> str:
    step = SCRIPT_BY_ID[step_id]
    response = VoiceResponse()
    if preface:
        say_text(response, preface)
    # Say the prompt outside Gather so speech cannot barge in and cut it off.
    say_text(response, formatted_prompt(step))
    action = f"{public_url()}/gather" if public_url() else "/gather"
    gather = Gather(
        input="speech",
        action=f"{action}?step={step_id}",
        method="POST",
        timeout=step["timeout"],
        speech_timeout=step["speech_timeout"],
        language="en-US",
        speech_model="phone_call",
        action_on_empty_result=True,
        hints=step["hints"],
        barge_in=False,
    )
    response.append(gather)
    say_text(response, "I did not hear a reply. Goodbye.")
    response.hangup()
    return str(response)


def hangup_twiml(*lines: str) -> str:
    response = VoiceResponse()
    for line in lines:
        if line:
            say_text(response, line)
    response.hangup()
    return str(response)


def next_step_id(step_id: str) -> str | None:
    index = STEP_ORDER.index(step_id)
    if index + 1 < len(STEP_ORDER):
        return STEP_ORDER[index + 1]
    return None


def normalize_speech(speech: str) -> str:
    text = re.sub(r"[^a-z\s]", " ", speech.lower())
    return f" {re.sub(r'\s+', ' ', text).strip()} "


def looks_like_no(speech: str) -> bool:
    text = normalize_speech(speech)
    strong_no = (
        " not a good time ",
        " not now ",
        " not really ",
        " not available ",
        " cannot ",
        " busy ",
        " later ",
        " call back ",
        " unavailable ",
    )
    if any(token in text for token in strong_no):
        return True
    return any(token in text for token in (" no ", " nope ")) and not looks_like_yes(speech)


def looks_like_yes(speech: str) -> bool:
    text = normalize_speech(speech)
    return any(token in text for token in (" yes ", " yeah ", " yep ", " sure ", " okay ", " ok "))


def has_no_questions(speech: str) -> bool:
    text = f" {re.sub(r'[^a-z\s]', ' ', speech.lower())} "
    return any(
        token in text
        for token in (" no ", " nope ", " nothing ", " i'm good ", " im good ", " all good ", " no questions ")
    )


@app.get("/")
def home():
    return render_template("index.html")


def current_ask(record: CallRecord | None) -> dict[str, str] | None:
    if not record or record.step not in SCRIPT_BY_ID:
        return None
    step = SCRIPT_BY_ID[record.step]
    return {
        "id": step["id"],
        "label": step["label"],
        "prompt": formatted_prompt(step, record.candidate_name),
    }


@app.get("/api/state")
def api_state():
    call = state["call"]
    return jsonify(
        {
            "public_base_url": public_url(),
            "account_sid": state["account_sid"],
            "has_auth_token": bool(state["auth_token"]),
            "from_number": state["from_number"],
            "to_number": state["to_number"],
            "candidate_name": state["candidate_name"],
            "script": SCRIPT,
            "ask": current_ask(call),
            "call": asdict(call) if call else None,
            "events": state["events"][-40:],
        }
    )


@app.get("/api/events")
def api_events():
    listener: queue.Queue = queue.Queue(maxsize=50)
    with LOCK:
        LISTENERS.append(listener)

    def stream():
        try:
            while True:
                try:
                    payload = listener.get(timeout=20)
                    yield f"data: {payload}\n\n"
                except queue.Empty:
                    yield ": keep-alive\n\n"
        finally:
            with LOCK:
                if listener in LISTENERS:
                    LISTENERS.remove(listener)

    return Response(stream(), mimetype="text/event-stream")


@app.post("/api/call")
def api_call():
    body = request.get_json(silent=True) or {}
    if not state["auth_token"]:
        load_dotenv()
        state["auth_token"] = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    if body.get("auth_token"):
        state["auth_token"] = str(body["auth_token"]).strip()
    if body.get("account_sid"):
        state["account_sid"] = str(body["account_sid"]).strip()
    if body.get("from_number"):
        state["from_number"] = str(body["from_number"]).strip()
    if body.get("to_number"):
        state["to_number"] = str(body["to_number"]).strip()
    if body.get("candidate_name"):
        state["candidate_name"] = str(body["candidate_name"]).strip() or "Mister"

    base = public_url()
    if not base:
        return jsonify({"error": "Public tunnel is not ready yet. Wait a few seconds and retry."}), 503
    if not state["auth_token"]:
        return jsonify({"error": "Paste your Twilio Auth Token. It stays on this machine."}), 400

    try:
        call = place_outbound_call(
            to=state["to_number"],
            from_number=state["from_number"],
            twiml=prompt_twiml("opening"),
            status_url=f"{base}/status",
        )
    except Exception as exc:
        log_event("error", str(exc))
        return jsonify({"error": str(exc)}), 400

    record = CallRecord(
        sid=call.sid,
        status=call.status,
        from_number=state["from_number"],
        to_number=state["to_number"],
        candidate_name=state["candidate_name"],
        step="opening",
    )
    state["call"] = record
    log_event("call", f"Calling {record.to_number}", {"sid": record.sid, "status": record.status})
    log_event("ask", formatted_prompt(SCRIPT[0], record.candidate_name), {"step": "opening", "label": "Opening"})
    return jsonify(asdict(record))


@app.post("/voice")
def voice():
    log_event("voice", "Call answered. Starting the screening.")
    record: CallRecord | None = state.get("call")
    if record:
        record.step = "opening"
        record.retries = 0
    return Response(prompt_twiml("opening"), mimetype="application/xml")


@app.post("/gather")
def gather():
    speech = (request.form.get("SpeechResult") or "").strip()
    confidence = request.form.get("Confidence")
    call_sid = request.form.get("CallSid")
    step_id = request.args.get("step") or "opening"
    record: CallRecord | None = state.get("call")
    if record and call_sid and record.sid == call_sid:
        step_id = record.step or step_id
    elif record and not call_sid:
        step_id = record.step or step_id

    step = SCRIPT_BY_ID.get(step_id, SCRIPT[0])
    if not speech:
        log_event("answer", "No speech captured", {"sid": call_sid, "step": step_id})
        if record and record.retries < 1:
            record.retries += 1
            return Response(prompt_twiml(step_id), mimetype="application/xml")
        speech = ""

    if record:
        record.retries = 0
        record.status = "in-progress"
        record.turns.append(
            {
                "id": step_id,
                "label": step["label"],
                "prompt": formatted_prompt(step, record.candidate_name),
                "answer": speech or None,
                "confidence": confidence,
            }
        )

    log_event(
        "answer",
        speech or "No speech captured",
        {"confidence": confidence, "sid": call_sid, "step": step_id, "label": step["label"]},
    )

    if step_id == "opening" and speech and looks_like_no(speech):
        if record:
            record.step = "closed"
        return Response(
            hangup_twiml("No problem. I will try you another time. Goodbye."),
            mimetype="application/xml",
        )

    if step_id == "questions":
        extra = ""
        if speech and not has_no_questions(speech):
            extra = "Thanks for the question. I will share that with the hiring team."
        name = record.candidate_name if record else state["candidate_name"]
        if record:
            record.step = "closed"
        return Response(hangup_twiml(extra, closing_line(name)), mimetype="application/xml")

    nxt = next_step_id(step_id)
    if not nxt:
        name = record.candidate_name if record else state["candidate_name"]
        if record:
            record.step = "closed"
        return Response(hangup_twiml(closing_line(name)), mimetype="application/xml")

    preface = None
    if step_id == "eligibility" and speech and looks_like_no(speech):
        preface = "Okay, I will note that for the hiring team."
    if record:
        record.step = nxt
    log_event("ask", formatted_prompt(SCRIPT_BY_ID[nxt]), {"step": nxt, "label": SCRIPT_BY_ID[nxt]["label"]})
    return Response(prompt_twiml(nxt, preface), mimetype="application/xml")


@app.post("/status")
def status():
    call_sid = request.form.get("CallSid")
    call_status = request.form.get("CallStatus")
    record: CallRecord | None = state.get("call")
    if record and call_sid == record.sid and call_status:
        record.status = call_status
    log_event("status", call_status or "unknown", {"sid": call_sid})
    return ("", 204)


def start_cloudflare_tunnel(port: int) -> str:
    global TUNNEL_PROC
    TUNNEL_PROC = subprocess.Popen(
        [
            "cloudflared",
            "tunnel",
            "--url",
            f"http://127.0.0.1:{port}",
            "--no-autoupdate",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    assert TUNNEL_PROC.stdout is not None
    pattern = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")
    deadline = time.time() + 30
    for line in TUNNEL_PROC.stdout:
        print(line, end="", flush=True)
        match = pattern.search(line)
        if match:
            threading.Thread(target=_drain_tunnel_output, daemon=True).start()
            return match.group(0)
        if time.time() > deadline:
            break
    raise RuntimeError("Could not start a public Cloudflare tunnel for Twilio webhooks.")


def _drain_tunnel_output() -> None:
    if TUNNEL_PROC is None or TUNNEL_PROC.stdout is None:
        return
    for line in TUNNEL_PROC.stdout:
        print(line, end="", flush=True)


def main() -> None:
    port = int(os.getenv("PORT", "5050"))
    if not public_url():
        print("Opening a public tunnel so Twilio can reach this app...")
        state["public_base_url"] = start_cloudflare_tunnel(port)
    print(f"\nVoice agent UI: http://127.0.0.1:{port}")
    print(f"Twilio webhook base: {public_url()}\n")
    log_event("ready", f"Webhook tunnel ready at {public_url()}")
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False)


if __name__ == "__main__":
    main()
