# recruiter-phone-agent

Callscreen is the recruiter product. A Flask voice agent places the real phone screen.

| Path | What it is |
|---|---|
| `callscreen/` | Recruiter board, filled demo application, pipeline |
| `app.py` | Twilio outbound screen. Dials `TWILIO_TO`. |

## Two-window demo

1. Copy env templates and fill Twilio keys. Never commit `.env`.

```bash
cp .env.example .env
cp callscreen/.env.example callscreen/.env
```

`TWILIO_TO` in the root `.env` is the number that actually rings. The apply page phone field is display-only.

2. Start the voice agent, then the board.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

```bash
cd callscreen
npm install
npm start
```

3. Open the board at http://localhost:5180 on **Live**.
4. In a second window open http://localhost:5180/apply.
5. Click **Submit application**. Jordan Lee’s card appears on the live board, moves through Application → Socials → Phone call, then Flask dials `TWILIO_TO`.

Demo mode stays a simulated pipeline with sample candidates. It does not receive the apply walkthrough.

The board talks to Flask through the Vite `/voice` proxy. If `app.py` is not running, the card stays on Phone call with an error.

`cloudflared` must be on your PATH so Twilio can reach the webhook unless `PUBLIC_BASE_URL` is set.

## Callscreen

See [callscreen/README.md](callscreen/README.md) for Live vs Demo, Convex, and `/apply`.
