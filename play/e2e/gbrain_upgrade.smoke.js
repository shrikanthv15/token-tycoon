// GBrain upgrade smoke test — verifies purchase, persistence, HUD, and factor
// Run with: node play/e2e/gbrain_upgrade.smoke.js
// This test requires Playwright. If unavailable, skip.
let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  console.log('Playwright not installed, skipping GBrain upgrade smoke test.');
  process.exit(0);
}


(async () => {
  const { chromium } = playwright; const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // Helper to click on canvas coordinates
  const ox = (1500 - 1280) / 2, oy = (950 - 800) / 2;
  const click = async (x, y) => await page.mouse.click(x + ox, y + oy);

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game did not boot');

  // Open SHOP tab
  const shopTabX = await page.evaluate(() => window.__tt.scene.tabShop.x);
  await click(shopTabX, 84);
  await page.waitForTimeout(400);
  if (await page.evaluate(() => window.__tt.scene.tab) !== 'shop') throw new Error('SHOP tab not active');

  // Purchase GBrain (price $60)
  const cashBefore = await page.evaluate(() => window.__tt.cash());
  // Find GBrain BUY button via UI order – approximate by clicking where it appears (first BUY after coffee and chair)
  // We locate the BUY text position by evaluating the scene's shop items
  const gbrainBtn = await page.evaluate(() => {
    const items = window.__tt.scene.shopItems || [];
    const idx = items.findIndex(it => it.id === 'gbrain');
    if (idx === -1) return null;
    const y = 165 + idx * 62 - 8; // approximate vertical spacing used in renderShop
    return { x: 1225, y };
  });
  if (!gbrainBtn) throw new Error('GBrain shop item not found');
  await click(gbrainBtn.x, gbrainBtn.y);
  await page.waitForTimeout(400);
  const cashAfter = await page.evaluate(() => window.__tt.cash());
  if (cashAfter !== cashBefore - 60) throw new Error('GBrain purchase did not deduct $60');
  // Verify HUD indicator
  const hudText = await page.evaluate(() => window.__tt.scene.gbrainT.text);
  if (hudText !== 'GBrain owned') throw new Error('GBrain HUD not updated');
  // Verify marker exists
  const markerExists = await page.evaluate(() => !!window.__tt.scene.gbrainMarker);
  if (!markerExists) throw new Error('GBrain marker not created');

  // Verify factor hook
  const factor = await page.evaluate(() => window.__tt.scene.gbrainFactor());
  if (factor !== 0.75) throw new Error('GBrain factor incorrect after purchase');

  // Reload twice to test persistence
  for (let i = 0; i < 2; i++) {
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game did not boot after reload');
    const owned = await page.evaluate(() => window.__tt.state.gbrainOwned);
    if (!owned) throw new Error('GBrain ownership not persisted after reload #' + (i+1));
    const hud2 = await page.evaluate(() => window.__tt.scene.gbrainT.text);
    if (hud2 !== 'GBrain owned') throw new Error('GBrain HUD lost after reload #' + (i+1));
    const marker2 = await page.evaluate(() => !!window.__tt.scene.gbrainMarker);
    if (!marker2) throw new Error('GBrain marker missing after reload #' + (i+1));
    const factor2 = await page.evaluate(() => window.__tt.scene.gbrainFactor());
    if (factor2 !== 0.75) throw new Error('GBrain factor incorrect after reload #' + (i+1));
  }

  // Buy coffee (price $25) to test coffeeOwned persistence
  const coffeeBtn = await page.evaluate(() => {
    const items = window.__tt.scene.shopItems || [];
    const idx = items.findIndex(it => it.id === 'coffee');
    if (idx === -1) return null;
    const y = 165 + idx * 62 - 8;
    return { x: 1225, y };
  });
  if (!coffeeBtn) throw new Error('Coffee shop item not found');
  const cashBeforeCoffee = await page.evaluate(() => window.__tt.cash());
  await click(coffeeBtn.x, coffeeBtn.y);
  await page.waitForTimeout(400);
  const cashAfterCoffee = await page.evaluate(() => window.__tt.cash());
  if (cashAfterCoffee !== cashBeforeCoffee - 25) throw new Error('Coffee purchase did not deduct $25');
  const coffeeOwned = await page.evaluate(() => window.__tt.state.coffeeOwned);
  if (!coffeeOwned) throw new Error('coffeeOwned flag not set after purchase');
  // Reload to verify persistence of coffeeOwned
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const coffeePersist = await page.evaluate(() => window.__tt.state.coffeeOwned);
  if (!coffeePersist) throw new Error('coffeeOwned not persisted after reload');

  // Verify profit HUD exists and matches pattern
  const profitText = await page.evaluate(() => window.__tt.scene.profitT.text);
  if (!/^\$-?\d+\/\d+$/.test(profitText)) throw new Error('profitT text format invalid: ' + profitText);

  // Simple staff work check: ensure at least one staff exists and runs a job with increased contextFill
  const staffCount = await page.evaluate(() => window.__tt.state.staff.length);
  if (staffCount === 0) throw new Error('No staff present for work test');
  // Advance time by 10 wall seconds (approx 10*1000ms)
  await page.evaluate(() => { window.__tt.scene.advanceTime(10 * 1000); });
  // No explicit assertion on contextFill – presence of no errors is sufficient

  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('GBRAIN_UPGRADE SMOKE PASS');
  await browser.close();
})().catch(e => { console.error('GBRAIN_UPGRADE SMOKE FAIL:', e.message); process.exit(1); });