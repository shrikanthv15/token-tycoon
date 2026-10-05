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

  // Force a failure by setting low pool and then assign a job that will fail
  await page.evaluate(() => {
    const S = window.__tt.state;
    const subId = 'claude';
    if (S.subs[subId]) { S.subs[subId].h5 = 0; S.subs[subId].wk = 0; }
    // spawn a 3-star job (hard) to increase failure chance
    window.__tt.spawnJob(3, 10);
  });

  // Assign the job to the staffer (first desk)
  const staff = await page.evaluate(() => window.__tt.state.staff[0]);
  const jobId = await page.evaluate(() => window.__tt.state.jobs[0].id);
  await page.evaluate((jid) => { window.__tt.assign(jid, 0); }, jobId);
  await page.waitForTimeout(5000);

  // If job failed, a debug marker should appear
  const hasFail = await page.evaluate(() => !!window.__tt.state.staff[0].failMarker);
  if (!hasFail) throw new Error('Expected failure marker not present');

  // Click the staffer to open debug UI
  await page.evaluate(() => { const s = window.__tt.state.staff[0]; s.spr.emit('pointerdown'); });
  await page.waitForTimeout(1000);

  // Click debug button
  await page.evaluate(() => {
    const overlay = window.__tt.scene.children.list.find(c => c.depth === 81);
    if (!overlay) throw new Error('Debug overlay not found');
    // simulate clicking the debug button by calling its handler directly
    const btn = overlay.list.find(t => t.text === '[ DEBUG ]');
    if (btn && btn.input && btn.input.enabled) btn.emit('pointerdown');
  });

  await page.waitForTimeout(500);
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('FAILURE_DEBUG SMOKE PASS');
  await browser.close();
  process.exit(0);
})();
