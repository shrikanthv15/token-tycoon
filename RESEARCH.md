# Research notes

## OpenClaw Enterprise (announced 2026-09-29)
- The OpenClaw Foundation announced **OpenClaw Enterprise (OCE)** on
  Sep 29, 2026: "Kubernetes for agents" — an open-source (MIT),
  vendor-neutral **control plane for managing persistent agents** in
  sensitive environments. Pre-1.0; 1.0 expected later in 2026.
- Origin: started inside OpenAI, donated to the Foundation; developed with
  **Red Hat and NVIDIA**. (OpenAI hired OpenClaw creator Peter Steinberger.)
- Adds: multi-tenancy, hard security boundaries, standardized agentic
  primitives, IAM, lifecycle governance, auditability. Harness/model/sandbox
  are swappable — vendor neutral. Self-hosted: Docker Compose / Kubernetes.
- Context: Gartner called original OpenClaw an "unacceptable cybersecurity
  risk"; OCE is the answer to enterprise IT bans.
- **Game relevance**: OCE's world — departments, tenants, IAM roles, audit
  trails, agent lifecycles — is exactly the vocabulary of the office-space
  management layer. The game's departments/reporting/audit mechanics should
  mirror OCE concepts so the game stays credible as the ecosystem evolves.
- Shrikanth's standing ask: stay up to date on OpenClaw. Watch for the
  1.0 release and the promised security reference architecture.

## Stack decisions (verified 2026-10-04)
- **Phaser 3** (CDN, jsDelivr, pinned 3.x) — free, fast 2D HTML5 framework,
  Canvas/WebGL. Right call for "decent graphics, runs in browser."
- **Kenney.nl assets** — all CC0 (public domain), no attribution needed.
  UI pack + game icons are the starting point. Zips vendored into `assets/`.
- Static hosting (Vercel). No backend for v1.
- **Temporal deferred to v2**: durable multi-day seasons, scheduled entropy
  events (model deprecations, price shocks) as workflows. Shrikanth to
  confirm.

## Model roster (game stats are design, not benchmarks)
Haiku (cheap/fast, weak on hard) · Fable 5.1 — Anthropic (balanced mid) ·
Opus 5.5 (flagship, expensive) · Codex (code specialist) · GPT-6 Astra 6.1
(fast generalist) · Sol (long-context) · Luna (cheapest, weakest).
Correction 2026-10-04: "Faney 5.15" was a transcription of **Fable 5.1**.

## Provider/subscription layer (Shrikanth's direction, not yet designed)
Ollama (local, free tokens but slow) · LiteLLM proxy (small overhead,
mix-and-match) · OpenRouter (marketplace markup) · Claude Code / Codex
(seat subscriptions) · OpenClaw (self-hosted agents). Level-gated unlocks.
Needs a real design pass — it's currently just the list above.
