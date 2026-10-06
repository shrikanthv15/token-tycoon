// Playwright smoke test for font readability (pool meter fonts >=13px)
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
  await page.evaluate(() => { window.__tt.buySub('claude'); window.__tt.hire('haiku'); });
  await page.waitForTimeout(2000);
  // Find a taken desk
  const deskIdx = await page.evaluate(() => {
    const d = window.__tt.desks.find(d => d.taken);
    return d ? window.__tt.desks.indexOf(d) : -1;
  });
  if (deskIdx < 0) throw new Error('No desk with pool meters found');
  // Get font sizes of pool meter texts
  const fontSizes = await page.evaluate(idx => {
    const desk = window.__tt.desks[idx];
    return { h5: desk.h5Text.style.fontSize, wk: desk.wkText.style.fontSize };
  }, deskIdx);
  const getPx = s => parseInt(s.replace('px',''));
  if (getPx(fontSizes.h5) < 13) throw new Error(`h5 font size ${fontSizes.h5} < 13px`);
  if (getPx(fontSizes.wk) < 13) throw new Error(`wk font size ${fontSizes.wk} < 13px`);

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('FONT_READABILITY SMOKE PASS');
})().catch(e => { console.error('FONT_READABILITY SMOKE FAIL:', e.message); process.exit(1); });
