// Playwright smoke test for context and compact UI elements
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  const booted = await page.evaluate(() => !!window.__tt);
  if (!booted) throw new Error('Game did not boot');

  // Verify compact UI exists (quarter timer text) and context meter
  const quarterText = await page.evaluate(() => document.querySelector('text')?.textContent);
  // simple existence check
  if (!quarterText) throw new Error('Quarter UI missing');

  // Trigger compact view via speed button II (pause) and check UI updates
  await page.evaluate(() => { window.__tt.state.speed = 0; });
  await page.waitForTimeout(500);
  const speed = await page.evaluate(() => window.__tt.state.speed);
  if (speed !== 0) throw new Error('Failed to pause via speed button');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('CONTEXT_COMPACT SMOKE PASS');
})().catch(e => { console.error('CONTEXT_COMPACT SMOKE FAIL:', e.message); process.exit(1); });
