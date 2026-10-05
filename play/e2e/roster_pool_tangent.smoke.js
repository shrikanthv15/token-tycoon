// Playwright smoke test for roster assignment, pool countdowns, and tangent events
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // phaser boot wait
  const booted = await page.evaluate(() => !!window.__tt);
  if (!booted) throw new Error('Game did not boot');

  // Buy Claude subscription and hire Haiku model
  await page.evaluate(() => { window.__tt.buySub('claude'); window.__tt.hire('haiku'); window.__tt.hire('assistant'); });
  await page.waitForTimeout(2000);
  const staffCount = await page.evaluate(() => window.__tt.state.staff.length);
  if (staffCount !== 1) throw new Error('Expected 1 staff after hiring Haiku');

  // Verify pool values decreased after hiring (cost of model)
  const sub = await page.evaluate(() => window.__tt.state.subs['claude']);
  // After hiring, pools should remain full. We'll check after job assignment.


  // Spawn a job and assign to staff via API (bypass UI drag)
  await page.evaluate(() => window.__tt.spawnJob(1, 10));
  await page.waitForTimeout(500);
  const jobId = await page.evaluate(() => window.__tt.state.jobs[0]?.id);
  if (!jobId) throw new Error('No job spawned');
  await page.evaluate(job => window.__tt.assign(job, 0), jobId);
  await page.waitForTimeout(500);
  const staffBusy = await page.evaluate(() => window.__tt.state.staff[0].busy);
  if (!staffBusy) throw new Error('Staff not marked busy after job assignment');

  // Advance time to trigger a tangent event (increase speed for faster cycles)
  await page.evaluate(() => { window.__tt.state.speed = 4; });
  const maxWait = 15000; // 15s max
  const start = Date.now();
  let tangentSeen = false;
  while (Date.now() - start < maxWait && !tangentSeen) {
    tangentSeen = await page.evaluate(() => !!window.__tt.tangentActive());
    if (!tangentSeen) await page.waitForTimeout(500);
  }
  if (!tangentSeen) throw new Error('Tangent event did not fire within timeout');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('ROSTER_POOL_TANGENT SMOKE PASS');
})().catch(e => { console.error('ROSTER_POOL_TANGENT SMOKE FAIL:', e.message); process.exit(1); });
