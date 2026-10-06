// Playwright smoke test for font readability across HUD elements
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Set up a desk with pool meters
  await page.evaluate(() => {
    window.__tt.buySub('claude');
    window.__tt.hire('haiku');
  });
  await page.waitForTimeout(500);

  // Evaluate font sizes of pool meter texts
  const fontSizes = await page.evaluate(() => {
    const desk = window.__tt.desks.find(d => d.taken);
    if (!desk) return null;
    const sizes = {};
    const getSize = t => t && t.style && t.style.fontSize ? parseInt(t.style.fontSize) : null;
    // Phaser Text objects store style in .style.fontSize (string like '13px')
    sizes.h5Text = getSize(desk.h5Text);
    sizes.wkText = getSize(desk.wkText);
    sizes.h5Timer = getSize(desk.h5Timer);
    sizes.wkTimer = getSize(desk.wkTimer);
    return sizes;
  });
  if (!fontSizes) throw new Error('No desk with pool meters found');
  const minSize = 13; // readability threshold
  for (const [key, size] of Object.entries(fontSizes)) {
    if (!size || size < minSize) throw new Error(`Font size for ${key} is ${size || 'null'}, below ${minSize}px`);
  }

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('FONT_READABILITY SMOKE PASS');
})().catch(e => { console.error('FONT_READABILITY SMOKE FAIL:', e.message); process.exit(1); });
