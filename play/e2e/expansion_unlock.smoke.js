// Playwright smoke test for expansion unlock (rooms/floors)
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Buy subscription and hire a model to get a desk (required to see dept UI)
  await page.evaluate(() => {
    window.__tt.buySub('claude');
    window.__tt.hire('haiku');
  });
  await page.waitForTimeout(500);

  // Look for unlock UI element in the current department HUD
  const unlocksText = await page.evaluate(() => {
    const hud = document.querySelector('canvas')?.parentNode?.querySelector('div');
    // Fallback: find any text containing 'Unlocks:'
    const el = Array.from(document.body.querySelectorAll('*')).find(e => e.textContent && e.textContent.includes('Unlocks:'));
    return el ? el.textContent.trim() : null;
  });

  if (!unlocksText || !unlocksText.includes('Unlocks')) {
    throw new Error('Expansion unlock hint not found in UI');
  }

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('EXPANSION_UNLOCK SMOKE PASS');
})().catch(e => { console.error('EXPANSION_UNLOCK SMOKE FAIL:', e.message); process.exit(1); });
