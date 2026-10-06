#!/usr/bin/env python3
"""Pixel-diff eval screenshots vs baselines (PIL, no new deps).
Usage:
  python3 diff_shots.py                       # diff latest run vs baseline/
  python3 diff_shots.py --run <ts-dir>        # diff a specific run dir
  python3 diff_shots.py --set-baseline        # copy latest run shots -> baseline/ (human-approved only)
  python3 diff_shots.py --threshold 20        # fail threshold % changed pixels
Exit 0 = all checkpoints within threshold (or no baseline yet -> SKIP note).
"""
import os, sys, shutil
from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, 'eval-shots')
BASE = os.path.join(SHOTS, 'baseline')
CHECKPOINTS = ['shot_boot.png', 'shot_hired.png', 'shot_assigned.png', 'shot_done.png']

def changed_pct(a_path, b_path):
    a = Image.open(a_path).convert('RGB')
    b = Image.open(b_path).convert('RGB')
    if a.size != b.size:
        return 100.0
    diff = ImageChops.difference(a, b).convert('L')
    hist = diff.histogram()
    total = a.size[0] * a.size[1]
    changed = sum(hist[13:])  # pixels differing by more than ~5%
    return round(100.0 * changed / total, 2)

def latest_run():
    runs = sorted(d for d in os.listdir(SHOTS)
                  if os.path.isdir(os.path.join(SHOTS, d)) and d != 'baseline')
    return os.path.join(SHOTS, runs[-1]) if runs else None

def main():
    args = sys.argv[1:]
    threshold = 12.0
    if '--threshold' in args:
        threshold = float(args[args.index('--threshold') + 1])
    run_dir = None
    if '--run' in args:
        run_dir = os.path.join(SHOTS, args[args.index('--run') + 1])
    else:
        run_dir = latest_run()
    if not run_dir or not os.path.isdir(run_dir):
        print('DIFF SKIP: no eval run found'); return 0
    if '--set-baseline' in args:
        os.makedirs(BASE, exist_ok=True)
        for c in CHECKPOINTS:
            src = os.path.join(run_dir, c)
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(BASE, c))
        print(f'baseline set from {run_dir} (human-approved only)')
        return 0
    if not os.path.isdir(BASE):
        print('DIFF SKIP: no baseline/ yet — run with --set-baseline after human review')
        return 0
    worst, results = 0.0, []
    for c in CHECKPOINTS:
        nb, bb = os.path.join(run_dir, c), os.path.join(BASE, c)
        if not (os.path.exists(nb) and os.path.exists(bb)):
            results.append((c, None)); continue
        p = changed_pct(nb, bb)
        results.append((c, p)); worst = max(worst, p)
    ok = True
    for c, p in results:
        status = 'SKIP' if p is None else ('PASS' if p <= threshold else 'FAIL')
        if p is not None and p > threshold: ok = False
        print(f'{status} {c}: {p}% changed (threshold {threshold}%)')
    print('DIFF ' + ('PASS' if ok else 'FAIL') + f' (worst {worst}%)')
    return 0 if ok else 1

if __name__ == '__main__':
    sys.exit(main())
