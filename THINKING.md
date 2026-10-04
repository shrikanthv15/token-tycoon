# Thinking — everything so far (2026-10-04)

## Shrikanth's raw inputs, distilled
- Loves these games: Factorio-likes, Infinite Craft (browser), Human Resource
  Machine / TIS-100-style Steam coding puzzlers, n8n drag-and-drop workflows.
- "Factoryo" = Factorio-like: multiple machines, maximize profit.
- The twist he wants: **not AI building the game — AI models as the pieces
  you play with.** Different models (Opus 5.5, Haiku, Fable 5.1, Codex,
  GPT-6 Astra 6.1, Sol, Luna) with different cost/speed/quality. Win by
  maximizing output utility with the **fewest tokens**.
- Browser-only. No 3D, no GPU workloads.
- Models come in on **a belt**; you optimize routing as the game proceeds.
- Difficulty must ramp: not just basics — harder jobs, tighter constraints.
- **Agent levels** (Hermes agents, OpenClaw agents): unlock with levels, but
  they require **setup time** before they're productive.
- **Entropy**: things break, new model versions drop and invalidate your
  setups. Do you build an "updater model" that refreshes all your models?
- **Context** as a mechanic: context fills, auto-compacts, you lose detail.
- **SOUL.md for every agent** (like his real fleet): define their soul,
  their .md files, how they grow — plus **skills** that attach to agents.
- **Office space showcase**: agents have an office — departments, desks,
  who reports to whom. BUT: not just a showcase like others are building —
  a **management game**: how well can *you* manage it?
- **Subscriptions & providers, level-gated**: Claude Code, Codex, OpenClaw,
  Ollama (local), OpenRouter, LiteLLM — different cost models, unlocked as
  you level. "Whatever they want to set, but they only get it after certain
  levels."
- Stay current: model rosters and provider landscape must track reality
  (e.g. OpenClaw Enterprise, Sep 2026 — see RESEARCH.md).
- Audiences: (1) **AI companies testing candidates** — can you manage
  models/cost/quality? (2) **Beginners learning to work with AI**.
  Fun first; these are the business case.

## The three options proposed (2026-10-04)
1. **Token Tycoon** — direct Factorio translation. Job belt, model machines,
   drag-and-drop pipelines, tokens as resource, quarterly profit target.
2. **Pipeline Architect** — puzzle levels with fixed constraints
   ("100 tickets, $5 budget, 95% correct"). Infinite Craft-style node discovery.
3. **Model Arena** — you ARE a model; fixed tasks, choose token spend per
   task, scored on quality-per-token vs rivals. Includes "Darts" precision
   mode (bullseye = max quality at min tokens).
- Shrikanth: "I like all three here, lets mash them all up."

## Open questions (for Shrikanth + Claude/Codex)
1. **Core fantasy**: tycoon-first (build an empire) or puzzle-first (solve
   levels)? The mashup needs a spine — which loop is the "main game"?
2. **Office vs pipeline view**: is the office floor the main screen (with
   pipelines as a zoom-in), or vice versa?
3. **Win/lose**: quarterly profit target? Campaign with an ending? Endless?
   What does "beating" the hiring-assessment version look like — a score
   employers can read?
4. **Fidelity of the AI sim**: real token counts and real model pricing, or
   game-balanced abstractions? (Real = educational + assessment credibility;
   abstract = more fun, less maintenance as models change.)
5. **Multiplayer**: leaderboards? Shared company (co-op office)? Or
   single-player only for v1?
6. **The assessment angle**: is there a real product here (B2B hiring tool),
   or is it flavor for the game? This changes everything about scoring.
7. **Scope of v1**: what's the smallest playable thing that proves the fun?
8. **Name**: Token Tycoon (working title) vs tokenspender vs something cooler.
9. **Temporal**: v2 for durable seasons/scheduled entropy — still the plan?

## Session 2 — budget, sessions, and models doing the work (2026-10-04 ~17:10)

Shrikanth's thinking, cleaned up (transcription quirks noted in brackets):

**The core loop he's describing:**
1. Player gets a starting budget — **$100/month credit** — and spends it on
   **subscriptions** of their choice (Claude Code, OpenClaw, OpenRouter,
   LiteLLM, Ollama…).
2. **Jobs arrive** (emails to triage, code fixes, briefs…). As the player's
   **level rises, job volume and payouts both increase**.
3. Budget splits into **sessions** (e.g. 5 sessions on different things).
   Each session has **context** — a finite resource to manage alongside money.

**The big mechanic: models do the work, not the player.**
- You do NOT drag-and-drop a model into place. The model has to *do its
  work*: you ask model A to set up model B, and it may or may not be
  capable. Example: Kimi (Moonshot, strong at coding) earns money on the
  email job → player tells Kimi to "set up Claude for me" → **Kimi can't do
  it** (capability mismatch). A weak model (e.g. Gemma) can't set up
  OpenClaw ["OpenFlow" in transcription] properly.
- **Failure is a puzzle, not just a penalty.** "The model might be wrong —
  it's wrong, it's wrong, it's wrong. That's where the human has to come
  in: what is wrong, and what do they need to find out to do it right?"
  The player diagnoses failures and intervenes.
- **Getting agents to talk to each other is the game.** What's missing is
  often a **protocol** — ACP / A2A-style agent-to-agent connection. The
  player has to *learn* that: how do they know? How do they build the
  wiring? Discovery/invention is a mechanic.

**Resource tradeoffs with real texture:**
- Ollama is free — but it downloads models **onto your disk**; "their space
  is also going." Free ≠ costless.
- Context fills per session; spend money to refresh it, or lose quality.

**GBrain as a discoverable feature:** a knowledge base the player can
*learn about* in-game — ask it "which model is best for this?" — but only
after discovering it exists. Knowledge itself is progression.

**Autonomy vs hallucination:** the AI can take over the entire company
["CNN" in transcription] and the human just talks to it — IF the AI is
good enough. But there's always a **hallucination probability**: it can do
something wrong, silently. Trust is a resource you manage.

**Shrikanth's scoping rule:** "There are endless possibilities here — so
let's box all of those in and work one at a time."

## The boxes (proposed order, one at a time)
1. **Budget & subscriptions** — the $100/mo: what costs what, how
   subscriptions differ (seat vs usage vs free-but-local).
2. **Job stream & level scaling** — what jobs arrive, how volume/payout
   scale, what "level" means.
3. **Setup-is-work** — models install/configure each other; capability
   profiles gate what each model can do *to* another.
4. **Failure & human debugging** — wrong outputs as diagnosable puzzles;
   what info the player gets, what fixing costs.
5. **Protocols** — A2A/ACP discovery: how players learn wiring exists, how
   they build it.
6. **Sessions & context** — splitting budget into sessions, context as a
   managed resource, compaction costs.
7. **GBrain** — discovery, what it answers, how it changes play.
8. **Autonomy & hallucination** — handing the company to an AI, trust as a
   managed resource, when it goes wrong.

Box 1 is the natural first: everything else spends the budget.
