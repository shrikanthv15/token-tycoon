# Token Tycoon — Concept Review (2026-10-04, session 3)

Shrikanth's verdict on v2: direction unclear, UI ridiculously bad, foundations
need rethinking. He asked for an honest review, not agreement. This is it.

## Where we are
- v1 (DOM dashboard, frantic) → v2 (Phaser floor, pool economy, slow) shipped
  in a single day. Playable at https://token-tycoon-tau.vercel.app/.
- His review: "I am just not sure about this project anymore." The mechanics
  changed with every message. That's the real problem — thrash, not talent.

## What he's describing (organized)
1. **The fantasy**: "build your company through AI agents" — **"how long can
   you survive?"** A survival sim. Everyone wants to start an AI company
   solo with agents.
2. **The space**: an office building. Start with **one room + one
   subscription**; earn more floors and rooms as you grow.
3. **The economy**: revenue-driven. NOT "$100 every week" — "you get money
   through the revenue you make. That's it." Costs rack up until everything
   breaks apart.
4. **The craft**: jobs come in, you route them to the right models; you wire
   models together (A2A); you debug the failures. "How can we make this
   work?" is the game.
5. **The depth**: the real provider landscape — see research below.
6. **The other game**: hiring assessment for AI engineers — **a separate
   thing**, not the same artifact.
7. **References**: management sims (supermarket sims — run the whole store).

## Provider research (new, 2026-10-04)
- **Harness vs brain vs access.** Codex CLI is Apache 2.0 — the tool is
  free, the *model* is what costs. Same split as Claude Code vs the
  Claude subscription. The game should model all three layers, not just
  "models".
- **OpenRouter**: credit wallet, pay-per-token, **no subscriptions** (5.5%
  top-up fee). BUT third parties sell quota subscriptions *on top of*
  OpenRouter ($19/$49 mo with monthly token quotas + model allowlists).
  Shrikanth's "OpenRouter subscription" instinct is real — it just lives
  one layer up.
- **ChatGPT Plus $20** → Codex included (web/CLI/IDE) with GPT-5.4,
  GPT-5.3-Codex; **Pro $100** → 5× limits, 10× Codex; **$200** → 20×.
- **GPT-6 Sol + Luna** (real, Sep 2026): Sol for demanding work/coding,
  Luna for high-volume cheap work — his fictional roster accidentally
  matches reality's shape.
- **Free tiers are request-capped, not token-capped** (OpenRouter: 20/min,
  50/day until $10 credits). Another distinct access shape for the game.

## The honest review
### What's strong
1. The survival framing is the best version yet. "How long can you survive"
   is a spine; everything before it was mechanics looking for one.
2. Revenue-driven economy — his correction, and he's right. Stipends are
   charity; revenue is a game.
3. Office floors/rooms progression — concrete, visual, endlessly expandable.
4. Provider depth (harness/brain/access) — a genuine differentiator. No
   sim does this.
5. The hiring angle is real — as a *separate* product.

### What's broken (including disagreements)
1. **Thrash.** v1→v2 in a day, mechanics changing per message. No game
   survives this. Lock the concept before building another thing.
2. **The UI.** He's right — it's programmer art with generated sprites.
   Two honest paths: (a) stylized-minimal ops-console aesthetic, done
   beautifully, achievable now; (b) real sprite work (commissioned/curated),
   later. Bad "Factorio-like" is worse than beautiful minimal.
3. **Unreal: no.** The product is a link you can send someone. Unreal is
   a different project (3D, Steam-scale). Browser (Phaser/DOM) is correct.
4. **Weekly stipend: wrong.** Covered above.
5. **Game ≠ hiring test.** One artifact doing both does both badly. The
   game teaches; the assessment measures. Separate them.
6. **Scope.** Floors, repo-paste jobs, Gstack, A2A protocol puzzles,
   multiplayer — all good, all v2+. The spine comes first.
7. **Agreements**: unlimited Haiku sessions (pool is the constraint, not
   an arbitrary 4) — yes. GBrain *and* Gstack as unlockable tools — yes.
   Paste-a-repo jobs — yes, and it's the hiring mode's killer feature.

## Three things we might build
- **A. SURVIVE** (recommend): the survival sim. Tight, beautiful, small.
- **B. ASSESS**: the hiring product. Scored scenarios, fixed budgets,
  measures architecture judgment. Separate, later.
- **C. EVERYTHING**: the full-blown version — the trap. Build it now and
  get nothing shippable.

## Recommendation
Build **A**: a 15-minute survival loop. One room, one subscription,
revenue-only income, survive 4 weeks. If that loop is fun, everything
else is expansion. If it isn't, no amount of floors will save it.

## What to focus on first — the one thing
The survival loop. Not the art, not the hiring mode, not the protocols.
One room. One sub. Revenue in, costs out. How long do you last?

## Open questions (his calls)
1. Art direction: stylized-minimal now, or real sprite work later?
2. Hiring product: confirmed separate?
3. Target session length for the survival loop?
4. Repo-paste jobs: confirmed as the hiring mode's core mechanic?
