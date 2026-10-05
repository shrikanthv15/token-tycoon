// Playwright smoke test for pool countdown timers (h5 and weekly)
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Buy subscription and hire a model to get a desk with pool meters
  await page.evaluate(() => {
    window.__tt.buySub('claude');
    window.__tt.hire('haiku');
  });
  await page.waitForTimeout(500);

  // Wait a moment for UI to render pool meters
  await page.waitForTimeout(500);
  const desk = await page.evaluate(() => {
    const d = window.__tt.desks.find(d => d.taken);
    return d ? { idx: window.__tt.desks.indexOf(d) } : null;
  });
  if (!desk) throw new Error('No desk with pool meters found');

  // Grab timer texts from the first taken desk
  const timers = await page.evaluate(() => {
    const d = window.__tt.desks.find(d => d.taken);
    if (!d) return null;
    return { h5: d.h5Timer.text, wk: d.wkTimer.text };
  });
  if (!timers || !timers.h5 || !timers.wk) throw new Error('Pool timer texts missing');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('POOL_COUNTDOWN SMOKE PASS');
})().catch(e => { console.error('POOL_COUNTDOWN SMOKE FAIL:', e.message); process.exit(1); });
