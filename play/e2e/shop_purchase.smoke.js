// Playwright smoke test for shop purchases (extra chair and desk)
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Buy a subscription and hire a model to have a desk
  await page.evaluate(() => {
    window.__tt.buySub('claude');
    window.__tt.hire('haiku');
  });
  await page.waitForTimeout(500);

  // Switch to SHOP tab
  await page.evaluate(() => { window.__tt.tab = 'shop'; window.__tt.scene.renderSidebar(); });
  await page.waitForTimeout(200);

  // Record initial desk count
  const initialDeskCount = await page.evaluate(() => window.__tt.deskObjs.length);

  // Click BUY on first shop item (Extra Chair) if affordable
  await page.evaluate(() => {
    const rows = window.__tt.scene.sideC.list.filter(c => c.type === 'Container');
    const buyRow = rows.find(r => r.list.some(child => child.text && child.text.includes('[ BUY ]')));
    if (buyRow) {
      const btn = buyRow.list.find(child => child.text && child.text.includes('[ BUY ]'));
      if (btn && btn.input && btn.input.enabled) btn.emit('pointerdown');
    }
  });
  await page.waitForTimeout(500);

  const finalDeskCount = await page.evaluate(() => window.__tt.deskObjs.length);
  if (finalDeskCount <= initialDeskCount) throw new Error('Desk count did not increase after buying extra chair');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('SHOP_PURCHASE SMOKE PASS');
})().catch(e => { console.error('SHOP_PURCHASE SMOKE FAIL:', e.message); process.exit(1); });
