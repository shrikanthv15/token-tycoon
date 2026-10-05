// Playwright smoke test for day/night tint overlay
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

  // Setup: buy subscription and hire a staffer
  await page.evaluate(() => { window.__tt.buySub('claude'); window.__tt.hire('haiku'); });
  await page.waitForTimeout(2000);

  // Ensure staff present
  const staffCount = await page.evaluate(() => window.__tt.state.staff.length);
  if (staffCount < 1) throw new Error('Expected at least 1 staff after hiring');

  // Record initial tint color (daytime)
  const dayColor = await page.evaluate(() => window.__tt.scene.tintOverlay.fillColor);

  // Advance time to trigger night (day 6). The game uses DAY_LEN = 30 seconds per day.
  // We'll fast‑forward by invoking the update loop with enough delta.
  await page.evaluate(() => {
    const S = window.__tt.state;
    // Fast forward to day 5 end then one more day to day 6
    const secs = (S.day <= 5 ? (5 - S.day + 1) * 30 : 0);
    // Simulate updates in 1‑second steps
    for (let i = 0; i < secs; i++) {
      window.__tt.scene.update(0, 1000); // delta = 1000ms
    }
  });
  await page.waitForTimeout(500);

  // Check tint color after advancing (should be night color)
  const nightColor = await page.evaluate(() => window.__tt.scene.tintOverlay.fillColor);
  if (dayColor === nightColor) throw new Error('Tint overlay did not change color for night');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('DAYNIGHT SMOKE PASS');
})().catch(e => { console.error('DAYNIGHT SMOKE FAIL:', e.message); process.exit(1); });
