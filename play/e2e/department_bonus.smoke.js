// Playwright smoke test for department creation bonus effect
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__tt, null, { timeout: 15000 });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game did not boot');

  const cashBefore = await page.evaluate(() => Math.round(window.__tt.state.cash));

  // Create a department
  await page.evaluate(() => {
    if (typeof window.__tt.scene?.createDepartment === 'function') {
      window.__tt.scene.createDepartment();
    }
  });

  const cashAfter = await page.evaluate(() => Math.round(window.__tt.state.cash));
  if (cashAfter - cashBefore < 10) throw new Error(`Cash bonus not applied, before=${cashBefore}, after=${cashAfter}`);

  await browser.close();
  if (errors.length) throw new Error('Errors: ' + errors.join(' | '));
  console.log('DEPT_BONUS SMOKE PASS');
})().catch(e => { console.error('DEPT_BONUS SMOKE FAIL:', e.message); process.exit(1); });
