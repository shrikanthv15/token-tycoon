// Playwright smoke test for shop purchases (extra desk and chair)
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Buy subscription and hire a model to have a desk
  await page.evaluate(() => {
    window.__tt.buySub('claude');
    window.__tt.hire('haiku');
  });
  await page.waitForTimeout(500);

  // Record initial desk count
  const initialDeskCount = await page.evaluate(() => window.__tt.deskObjs.length);

  // Switch to SHOP tab
  await page.evaluate(() => { window.__tt.tab = 'shop'; window.__tt.scene.renderSidebar(); });
  await page.waitForTimeout(200);

  // Click BUY on first shop item (Extra Chair) if affordable
  await page.evaluate(() => {
    const shopRows = window.__tt.scene.sideC.list.filter(c => c.type === 'Container');
    // Find a row with BUY button
    const buyBtn = shopRows.find(c => c.list.some(child => child.text && child.text.includes('[ BUY ]')));
    if (buyBtn) {
      // Simulate pointerdown on button
      const btn = buyBtn.list.find(child => child.text && child.text.includes('[ BUY ]'));
      if (btn && btn.input && btn.input.enabled) btn.emit('pointerdown');
    }
  });
  await page.waitForTimeout(500);

  const finalDeskCount = await page.evaluate(() => window.__tt.deskObjs.length);
  if (finalDeskCount <= initialDeskCount) throw new Error('Desk count did not increase after buying extra desk');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('SHOP_PURCHASE SMOKE PASS');
})().catch(e => { console.error('SHOP_PURCHASE SMOKE FAIL:', e.message); process.exit(1); });
