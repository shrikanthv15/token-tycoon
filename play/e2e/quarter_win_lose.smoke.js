// Playwright smoke test for quarter win/lose detection
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // --- Quarter win scenario ---
  await page.evaluate(() => {
    const S = window.__tt.state;
    // set profit target low so we win immediately
    S.profitTarget = 0;
    S.cash = 200; // ensure profit positive
    S.quarterStartCash = 100;
    window.__tt.evaluateQuarter(); // trigger evaluation
  });
  const quarterAfterWin = await page.evaluate(() => window.__tt.state.quarter);
  if (quarterAfterWin !== 2) throw new Error('Quarter win not detected');

  // --- Quarter lose scenario ---
  await page.evaluate(() => {
    const S = window.__tt.state;
    // reset quarter and set high target to force loss
    S.quarter = 1;
    S.cash = 0;
    S.quarterStartCash = 100;
    S.profitTarget = 1000;
    // force profit below target and cash negative to trigger loss
    S.cash = -10;
    // run evaluation (will call gameOver)
    window.__tt.evaluateQuarter();
  });
  const over = await page.evaluate(() => window.__tt.state.over);
  if (!over) throw new Error('Quarter lose (game over) not detected');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('QUARTER_WIN_LOSE SMOKE PASS');
})().catch(e => { console.error('QUARTER_WIN_LOSE SMOKE FAIL:', e.message); process.exit(1); });
