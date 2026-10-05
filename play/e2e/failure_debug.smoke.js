// Playwright smoke test for failure debugging flow
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Ensure a sub and staffer exist
  await page.evaluate(() => { window.__tt.buySub('claude'); window.__tt.hire('haiku'); });
  await page.waitForTimeout(2000);
  await page.evaluate(() => { window.__tt.spawnJob(1, 10); });
  await page.waitForTimeout(400);

  // Assign the job, then force a deterministic failure: risk=1 makes
  // completeJob always fail (Math.random() > 1 is never true). Keep pools
  // full - POOL DRY blocks assignment, so zeroing pools can never fail a job.
  await page.evaluate(() => {
    const S = window.__tt.state;
    window.__tt.assign(S.jobs[S.jobs.length - 1].id, 0);
    const st = S.staff[0];
    st.risk = 1;
    st.workT = st.workDur - 300; // complete almost immediately
  });
  await page.waitForFunction(() => !!window.__tt.state.staff[0].failMarker, null, { timeout: 20000 });

  // Click the staffer to open the debug modal
  await page.evaluate(() => { window.__tt.state.staff[0].spr.emit('pointerdown'); });
  await page.waitForTimeout(800);

  // Click the [ DEBUG ] button inside the modal (depth 81)
  const debugged = await page.evaluate(() => {
    const modal = window.__tt.scene.children.list.find(c => c.depth === 81);
    if (!modal) return false;
    const btn = modal.list.find(t => t.text === '[ DEBUG ]');
    if (btn && btn.input && btn.input.enabled) { btn.emit('pointerdown'); return true; }
    return false;
  });
  if (!debugged) throw new Error('Debug button not clickable');
  await page.waitForTimeout(600);

  // Marker cleared, debug handler detached, staffer still employed
  const st = await page.evaluate(() => {
    const s = window.__tt.state.staff[0];
    return { markerGone: !s.failMarker, handlerCleared: !s.debugHandler, staff: window.__tt.state.staff.length };
  });
  if (!st.markerGone || !st.handlerCleared || st.staff !== 1) {
    throw new Error('Debug did not resolve cleanly: ' + JSON.stringify(st));
  }

  // Click-to-fire restored after debug: clicking the staffer fires them
  await page.evaluate(() => { window.__tt.state.staff[0].spr.emit('pointerdown'); });
  await page.waitForTimeout(1500);
  const staffAfter = await page.evaluate(() => window.__tt.state.staff.length);
  if (staffAfter !== 0) throw new Error('click-to-fire not restored after debug');

  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('FAILURE_DEBUG SMOKE PASS');
  await browser.close();
  process.exit(0);
})().catch(e => { console.error('FAILURE_DEBUG SMOKE FAIL:', e.message); process.exit(1); });
