# Token Tycoon Eval Loop (standing)

Shrikanth's order 2026-10-05: "we need like good evals over here all around our thing."
No vibes — every deploy and every feature card is scored on concrete checks.

## What runs, and when

After every verified deploy (hook into the `token-tycoon-v2-updates` audit flow,
right after the live-alias verification step):

1. `node e2e/eval.js [URL]` — scored scripted playthrough (default: local
   `http://127.0.0.1:8903/index.html`; pass the live alias to eval production).
2. `python3 e2e/diff_shots.py` — pixel-diff of checkpoint screenshots vs
   `e2e/eval-shots/baseline/` (PIL, no new deps).

Both must pass for the deploy to be called good. A failing eval blocks the
"shipped" call the same way a failing smoke test does.

## Scored checks (v1 — all through the real game, `window.__tt` + real mouse)

| # | Check | How |
|---|-------|-----|
| 1 | boot | `window.__tt` exists after load |
| 2 | no page errors | zero pageerror/console-error events |
| 3 | hire | buySub('claude') + hire('haiku') → 1 staff, seated at desk |
| 4 | assign | spawnJob + real mouse drag-drop onto desk → staff busy |
| 5 | complete | done+failed > 0 within 40s at 2× speed |
| 6 | revenue | revenue > 0 after completion |
| 7 | pool drains | claude h5 pool < 400 after job |
| 8 | pause state | speed=0 → pause button label reads `II` (PAN-40/54 regression) |
| 9 | departments | state carries a departments structure |

Each check records pass/fail + detail. Scorecard JSON lands in
`e2e/eval-shots/<timestamp>/scorecard.json`. Exit code 0 = all pass.

## Screenshot checkpoints

`shot_boot.png`, `shot_hired.png`, `shot_assigned.png`, `shot_done.png`
captured during the playthrough. `diff_shots.py` reports % changed pixels per
checkpoint vs baseline; default fail threshold 12% (tune per checkpoint in the
script). Baselines are (re)set with `diff_shots.py --set-baseline` after a
human confirms the new look is correct — never auto-accept.

## Rules for agents

- Feature cards (PAN-56+) must keep the eval green: extend `eval.js` with a
  check for the new behavior when the feature ships (e.g. shop purchase,
  department effect, tier tabs).
- A card is not "verified done" if it breaks the eval.
- Screenshot diffs that fail on intentional visual changes get new baselines
  only after human (Shrikanth or Kratos Muse) review.

## Log

Every run appends one line to `e2e/eval-shots/runs.log`:
`<ts> <url> <score> <pass|FAIL>`.
