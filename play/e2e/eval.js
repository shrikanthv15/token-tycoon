// Token Tycoon scored eval — run: node e2e/eval.js [URL]
// Concrete checks only: each check is pass/fail with a detail string.
// Screenshots -> e2e/eval-shots/<ts>/ ; scorecard.json written there too.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.argv[2] || 'http://127.0.0.1:8903/index.html';
const OX = (1500 - 1280) / 2, OY = (950 - 800) / 2; // canvas offset in viewport

(async () => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const shotDir = path.join(__dirname, 'eval-shots', ts);
  fs.mkdirSync(shotDir, { recursive: true });
  const checks = [];
  const errors = [];
  const check = (name, pass, detail) => checks.push({ name, pass: !!pass, detail: String(detail) });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const ev = (fn) => page.evaluate(fn);

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const booted = await ev(() => !!window.__tt);
  check('boot', booted, 'window.__tt ' + (booted ? 'present' : 'missing'));
  if (!booted) throw new Error('game did not boot');
  await page.screenshot({ path: path.join(shotDir, 'shot_boot.png') });

  // hire
  await ev(() => { window.__tt.buySub('claude'); window.__tt.hire('haiku'); });
  await page.waitForTimeout(2200);
  const staff = await ev(() => window.__tt.state.staff.length);
  const seated = await ev(() => { const s = window.__tt.state.staff[0]; return s && Math.abs(s.spr.y - (s.desk.y - 64)) < 5; });
  check('hire', staff === 1 && seated, `staff=${staff} seated=${seated}`);
  await page.screenshot({ path: path.join(shotDir, 'shot_hired.png') });

  // assign via real mouse drag-drop
  await ev(() => window.__tt.spawnJob(1, 10));
  await page.waitForTimeout(600);
  const card = await ev(() => { const j = window.__tt.state.jobs[0]; return j && j.card ? { x: j.card.x, y: j.card.y } : null; });
  let busy = false;
  if (card) {
    await page.mouse.move(card.x + OX, card.y + OY);
    await page.mouse.down();
    await page.mouse.move(220 + OX, 330 + OY, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(800);
    busy = await ev(() => window.__tt.state.staff[0].busy);
  }
  check('assign', busy, busy ? 'staff busy after drop' : 'drag-drop failed (card=' + JSON.stringify(card) + ')');
  await page.screenshot({ path: path.join(shotDir, 'shot_assigned.png') });

  // complete at 2x
  await ev(() => { window.__tt.state.speed = 2; });
  let cycles = 0;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(1000);
    cycles = await ev(() => window.__tt.state.done + window.__tt.state.failed);
    if (cycles > 0) break;
  }
  check('complete', cycles > 0, `cycles=${cycles}`);
  const rev = await ev(() => window.__tt.state.revenue);
  const doneN = await ev(() => window.__tt.state.done);
  // revenue must be > 0 iff a job succeeded (failed jobs pay nothing — correct)
  check('revenue', (rev > 0) === (doneN > 0), `revenue=${rev} done=${doneN}`);
  const pools = await ev(() => window.__tt.state.subs.claude);
  check('pool_drains', pools && pools.h5 < 400, `h5=${pools && pools.h5}`);
  await page.screenshot({ path: path.join(shotDir, 'shot_done.png') });

  // pause state (PAN-40/54 regression): speed 0 -> button reads '▶'
  const pauseLabel = await ev(() => {
    window.__tt.state.speed = 0;
    window.__tt.scene.updatePauseButton();
    return window.__tt.scene.pauseBtn._label.text;
  });
  check('pause_state', pauseLabel === '\u25b6', `label=${JSON.stringify(pauseLabel)}`);
  await ev(() => { window.__tt.state.speed = 1; window.__tt.scene.updatePauseButton(); });

  // departments structure present
  const depts = await ev(() => window.__tt.departments);
  check('departments', depts !== undefined && depts !== null, `type=${Array.isArray(depts) ? 'array[' + depts.length + ']' : typeof depts}`);

  check('no_page_errors', errors.length === 0, errors.length ? errors.join(' | ').slice(0, 300) : 'none');
  await browser.close();

  const passed = checks.filter(c => c.pass).length;
  const scorecard = { ts, url: URL, score: `${passed}/${checks.length}`, pass: passed === checks.length, checks };
  fs.writeFileSync(path.join(shotDir, 'scorecard.json'), JSON.stringify(scorecard, null, 1));
  fs.appendFileSync(path.join(__dirname, 'eval-shots', 'runs.log'), `${ts} ${URL} ${scorecard.score} ${scorecard.pass ? 'pass' : 'FAIL'}\n`);
  for (const c of checks) console.log((c.pass ? 'PASS' : 'FAIL') + ' ' + c.name + ' — ' + c.detail);
  console.log('EVAL ' + (scorecard.pass ? 'PASS' : 'FAIL') + ` (${scorecard.score}) shots: ${shotDir}`);
  process.exit(scorecard.pass ? 0 : 1);
})().catch(e => { console.error('EVAL ERROR:', e.message); process.exit(1); });
