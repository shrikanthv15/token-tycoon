# Token Tycoon — design brief

> Status (2026-10-04): **early v1 draft, thinking phase.** The concrete
> proposal below was written before Shrikanth's latest direction (office
> space, providers/subscriptions, audiences). Kept as a starting point —
> see THINKING.md for open questions.

Mashup of: Factorio-style factory optimization + n8n-style drag-and-drop
pipelines + Infinite Craft-style discovery + a "play as the model" arena.
Single-screen browser game. No 3D, no GPU needs.

## Fantasy
You run an AI agency. Jobs roll in on a conveyor belt. You wire AI models
into pipelines that do the work. Tokens are the resource — every job burns
them. Profit = payouts − token spend − missed-deadline penalties. Hit the
quarterly profit target or go bankrupt.

## Core loop (v1)
1. Jobs spawn on a belt (left → right): each has a type, difficulty 1–5,
   token estimate, payout, deadline timer.
2. Player drags model cards from the roster into pipeline slots
   (Intake → Router → Model → QA → Ship). v1: 3 model slots, fixed
   router (by job type), fixed QA.
3. Each job flows through the pipeline in real time. The model node burns
   tokens = estimate × model's per-token rate × difficulty factor, then
   rolls quality vs the job's bar. Pass → payout. Fail → rework (costs
   more tokens) or miss the deadline (penalty).
4. Quarter timer runs (e.g. 5 minutes). End: profit tallied vs target.

## Model roster (game stats — tunable, not real benchmarks)
- **Haiku** — cheapest, fastest, weak on difficulty 4–5.
- **Fable 5.1** (Anthropic) — balanced mid-tier, the reliable workhorse.
- **Opus 5.5** — flagship: handles anything, very expensive, slower.
- **Codex** — code specialist: half token cost on code jobs, weak elsewhere.
- **GPT-6 Astra 6.1** — fast generalist, average cost/quality.
- **Sol** — long-context specialist: excels on big email/document jobs.
- **Luna** — budget whisper: cheapest of all, fails hard jobs often.

## Job types (v1)
Code fix, email triage, writing brief, support texts, work project.
Difficulty 1–5 scales payout, token estimate, and quality bar.

## Meta systems (v1: light versions; expand later)
- **Agent levels:** Hermes / OpenClaw agent cards unlock as the player
  levels up. Slotting one takes setup time (onboarding timer counts down
  before it goes productive).
- **Entropy events (v1: 2 of them):** "Opus 5.5 → 5.6 breaks your prompts"
  (quality dip until you pay a refresh fee), "Token price hike" (rates ×1.5
  for 60s). Telegraphed 10s ahead so the player can react.
- **Context meter:** each model node has a context bar that fills per job.
  Full → auto-compact → quality dips until you hit Refresh (costs tokens).
- **SOUL.md:** each agent card has an editable soul line (pick from 3
  presets in v1, e.g. "Careful", "Fast", "Frugal") that buffs one stat.
- **Skills:** attachable chips (v1: "Code Reviewer", "Inbox Zero") that
  boost one job type on that agent.

## Difficulty ramp
Quarter 1: easy jobs, generous deadlines. Each quarter: harder mix, tighter
deadlines, nastier entropy. Endless mode after quarter 3.

## Arena mode (v1: stub button, build later)
"You are the model": fixed task set, pick your token spend per task,
scored on quality-per-token vs AI rivals. Includes the "Darts" precision
challenge (bullseye = max quality at min tokens).

## Tech (decided)
- **Phaser 3** via CDN (jsDelivr, pinned version) — 2D, Canvas/WebGL.
- **Kenney.nl CC0 packs** — UI pack + game icons. All public domain, no
  attribution needed. Download zips, vendor into `assets/`.
- Static app, no backend. Deploy target: **Vercel**.
- Look: dark neon "mission control" — belt across the top, pipeline slots
  center, roster + token/profit HUD.
- **Temporal: deferred to v2** (durable multi-day seasons, scheduled
  entropy events). v1 is pure client-side so it's playable immediately.

## v1 acceptance criteria (what "done" means)
- [ ] Opens in a desktop browser with no console errors.
- [ ] Jobs spawn on the belt; player can drag 3 model cards into slots.
- [ ] Tokens drain per job, profit updates, quarter timer ends with a
      win/lose screen vs the profit target.
- [ ] Both entropy events fire at least once per run and are telegraphed.
- [ ] Context meter fills, compacts, and Refresh restores quality.
- [ ] Playwright smoke test: start → place models → run 60s → no errors.
- [ ] Deployed to Vercel; link opens the playable game.
