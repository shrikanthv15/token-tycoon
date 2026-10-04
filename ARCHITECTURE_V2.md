# Token Tycoon v2 — architecture review (2026-10-04)

## What v1 got wrong (Shrikanth's review, verbatim-ish)
1. **Way too fast** — "almost impossible." Every job needs ≥2 min of
   attention. v1 jobs resolved in seconds.
2. **Wrong economy.** A $20 Claude sub doesn't charge per token — it has a
   **5-hour rolling limit + a weekly cap**. v1's per-token billing is
   fiction for seat plans.
3. **Models need to sit somewhere.** Persistent machines, reusable across
   jobs — not disposable cards.
4. **Multiple sessions, one pool.** "I can spawn multiple Haiku sessions
   but it takes from my weekly/5hr limit."
5. **Graphics need to be Factorio-grade**, not a dashboard.
6. **Jobs need a real system design** — time, pay, difficulty as one
   coherent model.
7. **Backend question**: Supabase vs Postgres for persistence.

## Research findings

### Requesty.ai (requesty.ai/models, read 2026-10-04)
- 749+ models, 35 providers, one OpenAI-compatible API. **5% markup** on
  pay-as-you-go; 0% with your own keys. This is the game's PAYG archetype:
  no caps, per-token, small markup.
- Named current models: GPT-5.2 Codex, Claude Opus 4.7 / Sonnet 4.6,
  GPT-5.4, Grok 4, Gemini 3.7 Flash, DeepSeek R1, MiniMax M2.5, Kimi.

### Claude Pro $20/mo — the two-clock system (verified, 4+ sources)
- **Rolling 5-hour session window** (starts at first message, not clock
  aligned) + **weekly cap** across all models. Either can stop you.
- **No published token numbers.** Plans are sold as multiples
  (Pro = 5× Free, Max = 5×/20× Pro). Game numbers are ours to tune.
- **One shared pool**: claude.ai + Claude Code + Desktop all draw the same
  allowance. In-game: every session you spawn draws one pool.
- **Model-specific sub-limits exist** (e.g. an "Opus limit" separate from
  the plan limit) — switching models when one caps is a genuine tactic.
- **Peak hours (05:00–11:00 PT)** burn the 5-hour allowance faster
  (token-weighted). Ready-made entropy event.
- **Overage**: optional extra usage at API rates past the cap.
- Codex Plus $20 (Sep 2026): published 5-hour estimate (15–150 GPT-6 Sol
  messages) + unpublished weekly cap. Same two-clock shape.

## v2 economy: usage pools, not per-token
Seat subscriptions become **two meters**:
- **Session pool** (the "5-hour"): drains as models work, refills on its
  clock. Big model = faster drain (Opus 6× Haiku).
- **Weekly pool** (the "weekly cap"): drains slower, refills each
  game-week. The long constraint — blow it by Thursday and you're on
  scraps.
- **Model sub-pools**: flagship models carry their own smaller cap inside
  the plan pool (the "Opus limit"). Switching to Sonnet keeps you working.
- **Parallel sessions share everything**: 4 Haiku sessions = 4× drain on
  the same two meters. This is the core optimization puzzle.
- **Pool empty → work pauses.** Options: wait for refill, switch models,
  or pay **overage at API rates** (expensive, always available).
- **PAYG plans** (OpenRouter/Requesty): no pools, per-job cost + 5%
  markup. The pressure valve when pools run dry.
- **Ollama**: $0, slow, disk cap per model, draws "power" (flat $/week).
  Free ≠ costless — same as v1.
- **Peak hours**: 09:00–15:00 game time burns pools 1.5×. Shown on the
  clock; plan around it.

## v2 pacing (concrete numbers)
- **1 game-week = 20 real minutes.** The "month" becomes a week — matches
  the weekly-cap fantasy.
- **Jobs arrive every 90–150s.** ~8–10 jobs per week.
- **Work takes 150s (1★) / 300s (2★) / 480s (3★)** at 1.0× speed.
  Every job gets its ≥2 minutes.
- **Deadlines = 2× work time.** Miss it = client walks, small rep hit.
- **Parallel machines** (3–6 by mid-game) keep it a management game, not
  a waiting game. Speed control (1×/2×/pause) for taste.
- **Payouts**: 1★ $6–10, 2★ $16–28, 3★ $36–70, scaling +25%/week.
  Difficulty: required quality 55 / 72 / 88 (unchanged).

## v2 floor: models sit somewhere
- **Persistent factory/office floor** (the Factorio view). Owned models
  are **placed machines** — they stay between jobs and between weeks.
- Each machine has **session slots** (Haiku 4, Sonnet 2, Opus 1, …).
  Assigning a job occupies a slot; sessions run in parallel.
- **Belts feed jobs in** from the right; completed/failed jobs exit left
  with a stamp. Player drags a job crate onto a machine (or auto-route
  toggle per machine — the autonomy seed).
- Machines show state at a glance: idle / working (progress ring) /
  pool-dry (red) / context-full (amber) / failed (sparks).
- **Setup-is-work survives**: first placement of a model takes 60s of
  "onboarding" with a little wrench animation. Same mechanic, slower,
  visible.

## v2 job system (one coherent model)
- Job = { type, stars, workSeconds, payout, deadline, qualityBar }.
- Quality roll on completion: model quality + noise − hallucination −
  context penalty (unchanged from v1, retuned).
- Failure → crate stamped FAILED, parks in a **debug bay**; player pays
  $2 and picks: retry (same machine, hint shown), reroute (different
  machine), or scrap.
- **Job catalog** (data, not code): ~24 templates across the 4 types with
  pay curves. Tunable without touching logic.

## Visuals: Factorio target
Factorio's look = top-down 2D industrial: animated conveyor belts, machines
with working animations + status lights, pipes, crates, day/night cycle,
dense readable detail.
- **Phaser 3**, pinned CDN. Canvas/WebGL, no build step.
- Belts: scrolling stripe textures with job crates riding them.
- Machines: base sprite + animated top (spinning / pulsing) + status lamp.
- Token/payout: particle puffs, floating numbers (restrained).
- Day/night tint across the game-week; peak-hours shown as a "rush" tint.
- Assets: Kenney.nl CC0 packs as placeholders (sci-fi/industrial generics);
  **true Factorio fidelity needs a custom sprite pass** — flagged as its
  own work item, not blocking v2 mechanics.

## Backend: Supabase vs Postgres vs local-first
- v2's fun (pacing, pools, floor, visuals) needs **no backend**.
- Backend matters when: saves persist across devices, **leaderboards**
  (the hiring-assessment angle needs comparable scores), seasons.
- **Recommendation: local-first v2** (localStorage saves). Wire
  **Supabase** when Shrikanth creates the project (still pending since
  the Git Gardener work in September) — it's the right call for auth +
  Postgres + realtime leaderboard in one. Postgres-on-VPS is the fallback
  if he wants it self-hosted.
- Schema sketch (for later): `runs`, `weeks`, `scores` (leaderboard),
  `fleet_layouts` (shareable floor designs — Infinite Craft energy).

## Build order
1. v2 economy + pacing + floor in **Phaser** (the whole game moves off DOM).
2. Job catalog data + debug bay.
3. Visual polish pass (particles, day/night, machine animations).
4. Playwright smoke (his policy) + deploy to the same Vercel project.
5. Backend (Supabase) only when persistence/leaderboard is wanted.
