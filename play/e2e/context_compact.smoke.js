// Playwright smoke test for context and compact UI elements
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game did not boot');

  // Setup: buy sub and hire ONE staffer (haiku)
  await page.evaluate(() => { window.__tt.buySub('claude'); window.__tt.hire('haiku'); });
  await page.waitForTimeout(2000);

  // Ensure staff present
  const staffCount = await page.evaluate(() => window.__tt.state.staff.length);
  if (staffCount < 1) throw new Error('Expected at least 1 staff after hiring');

  // Manually set contextFill and risk on the staff to simulate accumulation
  await page.evaluate(() => {
    const staff = window.__tt.state.staff[0];
    staff.contextFill = 45;
    staff.risk = 0.3;
  });

  // Verify the staff has the expected values before compact
  const contextFillBefore = await page.evaluate(() => window.__tt.state.staff[0].contextFill);
  if (contextFillBefore <= 0) throw new Error('Context fill should be >0 before compact');

  // Call compact on first staff member
  await page.evaluate(() => { window.__tt.scene.compact(window.__tt.state.staff[0]); });
  await page.waitForFunction(() => {
    const st = window.__tt.state.staff[0];
    return st.contextFill === 0 && st.risk === 0 && st.busy === false;
  }, null, { timeout: 60000, polling: 500 });
  // After compact, expect contextFill, risk, busy to be zero
  const after = await page.evaluate(() => ({
    cf: window.__tt.state.staff[0].contextFill,
    risk: window.__tt.state.staff[0].risk,
    busy: window.__tt.state.staff[0].busy,
  }));
  if (after.cf !== 0 || after.risk !== 0 || after.busy !== false) {
    throw new Error('Compact did not reset context/risk/busy');
  }

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('CONTEXT_COMPACT SMOKE PASS');
})().catch(e => { console.error('CONTEXT_COMPACT SMOKE FAIL:', e.message); process.exit(1); });
