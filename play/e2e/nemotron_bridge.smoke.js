// Playwright smoke test for Nemotron bridge integration
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Enable Nemotron bridge
  await page.evaluate(() => { if (window.NemotronBridge && typeof window.NemotronBridge.setEnabled === 'function') { window.NemotronBridge.setEnabled(true); } });

  // ---------- Test A: valid remote job list ----------
  await page.route('**/api/generate-jobs', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { title: 'AI Job A', description: 'Remote AI job', stars: 2, pay: 30 },
        { title: 'AI Job B', description: 'Another job', stars: 1, pay: 20 }
      ])
    });
  });

  // Trigger job generation via bridge
  await page.evaluate(() => { window.__tt.spawnJob(); });
  // Wait for jobs to appear (should be at least 2)
  await page.waitForFunction(() => window.__tt.state && window.__tt.state.jobs && window.__tt.state.jobs.length >= 2);
  const jobsA = await page.evaluate(() => window.__tt.state.jobs.map(j => j.title));
  if (!jobsA.includes('AI Job A') || !jobsA.includes('AI Job B')) throw new Error('Valid remote jobs not present');

  // ---------- Test B: timeout / invalid response fallback ----------
  await page.unroute('**/api/generate-jobs'); // remove previous route
  // Simulate timeout by delaying beyond bridge timeout (3s)
  await page.route('**/api/generate-jobs', async route => {
    await new Promise(r => setTimeout(r, 4000)); // 4s delay > timeout
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  const beforeCount = await page.evaluate(() => window.__tt.state.jobs.length);
  await page.evaluate(() => { window.__tt.spawnJob(); });
  // Wait a short moment for fallback local job to be added
  await page.waitForTimeout(500);
  const afterCount = await page.evaluate(() => window.__tt.state.jobs.length);
  if (afterCount <= beforeCount) throw new Error('Fallback local job not generated on timeout/invalid');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('NEMOTRON_BRIDGE SMOKE PASS');
})().catch(e => { console.error('NEMOTRON_BRIDGE SMOKE FAIL:', e.message); process.exit(1); });
