# Demo runbook — 2 minutes, word for word

> Before going on stage: both servers running (`:8787` + `:5173`), page loaded
> (the FullEnrich prewarm fires on load — it's ready by the time you finish the intro),
> `USE_FIXTURES=1`, audio volume OK. Backup video within reach.

## 0:00 — Opening (hallway on screen)
> "28% of a salesperson's time goes to selling. The rest? Preparation — 1 to 3 hours
> per account, or worse: no preparation at all. This is **Locus**: every
> door is an account, and behind every door, an agent has already done the work."

**[Click: Enter Sephora]** — the zoom plays, the briefing voice speaks.

## 0:25 — The room
> "Yesterday's Sephora meeting. Claire and Julien, we know them. But the budget is
> Marc's call — and nobody knows Marc. A grey silhouette."

**[Click: Run the agent]**

## 0:40 — THE moment (the graph builds itself)
> "The agent reads the transcript, and this is the account the way IT sees it. The
> Sillage signals drop in — Marc took the job yesterday. And there… **FullEnrich just
> found him. For real, right now.**" *(point at the · LIVE badge and the green dot)*

**[Click the Marc node]** → the dossier: verified email, phone, LinkedIn.

## 1:10 — Exploration (the jury participates)
**[Dock: ❓ Ask]**
> "Ask it a question." *(or ask it yourself: "Who owns the budget?")*

**[Dock: ◈ Intel]** → the angle, the open commitments, the signal feed.

## 1:35 — The follow-up
**[Click the "Follow-up ready ✉" node, then Send]**
> "The email just went out — for real, via Resend. *(show the inbox if possible)*
> One full day per rep, per week, given back to selling. That's the promise."

## 1:55 — Close
> "The agent is serious. Only the door is playful. Thank you."

---

## Value lines (weave in during the demo)

- **Prioritization (lobby, pointing at the directory):** "It doesn't just brief you before the meeting. It tells you which door to knock on today — Sephora is flagged TODAY because a signal landed yesterday and a commitment is open."
- **Open loops (when the commitments appear in the graph):** "Every promise made in a meeting becomes a tracked object with an owner and a deadline. Nothing said in a meeting can silently evaporate anymore."
- **Relationship capital (Q&A, 'who buys this'):** "When a rep quits, the deal room stays. Your pipeline stops being your employees' memory — that's why the owner buys, not just the VP Sales."

## Hardened Q&A (rehearsed answers)

- **"What did the agent actually do?"** → show the artifacts: dossier (isLive badge), signals, email. The badge says honestly what came from the network.
- **"Why 3D / is this a video game?"** → "You're right, and it's deliberate. The agent is serious, only the door is playful. Space helps adoption and memory."
- **"The sponsors?"** → Sillage = the eyes (signals), FullEnrich = the hands (identification). Claude orchestrates them via MCP.
- **"Who buys this?"** → VP Sales. ~€50/rep/month. Conversion goes up because every follow-up is prepared.
- **"Monday morning?"** → every rep opens their hallway: the doors already have their briefings.
- **"Where do the companies come from? What's the criteria?"** → An account gets a door when there's a real interaction trace: a calendar meeting with their domain, a recorded call mentioning them, an active email thread, or an inbound request. Domain → company via FullEnrich, deduped; personal/internal domains filtered out. READY once there's at least one transcript or signal. No CRM import, no manual entry.
- **"Is it real real-time?"** → the FullEnrich call is real (LIVE badge). The stage signals are pinned for reliability; the Sillage connector is wired in the repo.

## Fallback plans

1. Wifi dead → everything plays on fixtures except the LIVE badge (say: "live call cut, here's the behavior").
2. Backend crash → the UI shows the error and returns to the lobby; restart `npm run dev` (10s).
3. Everything crashes → **the backup video** (recorded at 4pm).

## Submission checklist (5:30pm)

- [ ] 2-min video recorded and edited
- [ ] Repo pushed (README + credits OK)
- [ ] Written description submitted
- [ ] `.env` never committed (verified: gitignored)
