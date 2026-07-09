# Locus (ex-Deal Rooms, ex-Le Bâtiment Clients)

Agentic sales-prep demo — Agentic GTM Hackathon (Anthropic × FullEnrich × Sillage), Station F, July 9, 2026. Track 2: Expansion.

**The journey:** a hallway, one door per client account. Enter Sephora → the meeting room (2 known stakeholders, 1 grey silhouette) → the agent reads the transcript and **the account comes alive as a living graph**: Sillage signals drop in one by one, the grey node lights up when **FullEnrich** identifies him (verified email, live), the follow-up attaches to the contact. Everything is clickable, you can **ask the agent questions**, and the email actually sends (Resend).

## Architecture

One repo, one `main` branch, two folders.

**`src/` — front** (Vite + React, JS)
- Entrance: `hud/PhotoCorridor.jsx` (cinematic photo hallway, account labels pinned on real doors, zoom-through transition)
- 3D scene: React Three Fiber + drei — `Room.jsx` (meeting room), `CameraRig.jsx` (scripted moves, locked camera)
- Graph: `graph/AccountGraph.jsx` (react-force-graph-2d, Obsidian-style, real-time staged build, clickable nodes)
- State: Zustand, state machine `LOBBY → ELEVATOR(transit) → ROOM_OPEN → ENRICHING → ENRICHED → EMAIL_SENT` (`store.js`)
- HUD: DOM overlay (never `drei <Html>`) — briefing, contact dossier, intel, Q&A, follow-up, dock, scene captions

**`server/` — backend** (Node + TS, Express)
- `POST /run` + `GET /run/:id` (1s polling) · `POST /prewarm` · `POST /ask` · `POST /send-email`
- `agent.ts`: Claude + **MCP connector** (FullEnrich + Sillage as `mcp_toolset`), `sanitize()` normalization at the job boundary — no raw payload ever reaches the front
- `fullenrich.ts`: REST v2 as the timing-controlled path (prewarm fired ~30s before the demo moment), full dossier normalized
- `fixtures/demo.json`: the Sephora account (transcript, stakeholders, signals, insights, email)

## Getting started

```bash
nvm use 20            # node is not on PATH by default

# backend
cd server && npm i && cp .env.example .env && npm run dev   # :8787

# front (other terminal)
npm i && npm run dev                                          # :5173
```

`USE_FIXTURES=1` (default) → everything plays offline, **except** the single live FullEnrich call (prewarm) when `FULLENRICH_TOKEN` is set. `USE_FIXTURES=0` + `ANTHROPIC_API_KEY` → the agent and the Q&A switch to live Claude + MCP. The on-screen `· LIVE / · fixture` badge always says honestly where the data came from.

## Credits

Assets and libs (CC0 / MIT):

- [React Three Fiber](https://github.com/pmndrs/react-three-fiber), [drei](https://github.com/pmndrs/drei), [three.js](https://threejs.org)
- [react-force-graph](https://github.com/vasturiano/react-force-graph) (account graph)
- [Zustand](https://github.com/pmndrs/zustand), [Framer Motion](https://motion.dev), [Tailwind](https://tailwindcss.com), [Vite](https://vite.dev)
- Starter inspiration: [`wass08/r3f-vite-starter`](https://github.com/wass08/r3f-vite-starter) (Wawa Sensei)
- Hallway photo: "NYLO Hotel Hallway" (Flickr, CC-BY) — https://www.flickr.com/photos/nylohotels/14374531255
- Voice: Gradium · Email sending: Resend · Deck: Gamma
