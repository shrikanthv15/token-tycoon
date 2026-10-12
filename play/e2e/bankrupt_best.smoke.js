// Playwright smoke test for bankrupt best record persistence
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // Helper to wait for game boot
  const waitBoot = async () => {
    await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__tt, null, { timeout: 20000 });
  };

  // Initial load, clear state, reload, boot again
  await waitBoot();
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.waitForFunction(() => !!window.__tt, null, { timeout: 20000 });

  // ---- 1. First bankrupt (week 5, revenue 340) ----
  await page.evaluate(() => { window.__tt.state.week = 5; window.__tt.state.revenue = 340; window.__tt.scene.gameOver(); });
  await page.waitForTimeout(800);
  const best1 = await page.evaluate(() => JSON.parse(localStorage.getItem('tt_best') || 'null'));
  if (best1.weeks !== 4 || best1.revenue !== 340) throw new Error('Best after first bankrupt mismatch: ' + JSON.stringify(best1));
  // Verify overlay displays best record
  const overlayText1 = await page.evaluate(() => {
    const overlay = Array.from(window.__tt.scene.children.list).find(c => c.depth === 200);
    if (!overlay) return '';
    const texts = [];
    const traverse = (obj) => {
      if (obj.text) texts.push(obj.text);
      if (obj.list) obj.list.forEach(traverse);
      if (obj.children) obj.children.forEach(traverse);
    };
    traverse(overlay);
    return texts.join('\n');
  });
  if (!overlayText1.includes('BEST: 4 weeks ($340 revenue)')) throw new Error('Overlay missing correct BEST line');

  // ---- 2. Worse bankrupt (week 3, revenue 100) ----
  await page.reload();
  await page.waitForFunction(() => !!window.__tt, null, { timeout: 20000 });
  await page.evaluate(() => { window.__tt.state.week = 3; window.__tt.state.revenue = 100; window.__tt.scene.gameOver(); });
  await page.waitForTimeout(800);
  const best2 = await page.evaluate(() => JSON.parse(localStorage.getItem('tt_best') || 'null'));
  if (best2.weeks !== 4 || best2.revenue !== 340) throw new Error('Best should remain after worse bankrupt: ' + JSON.stringify(best2));

  // ---- 3. Better bankrupt (week 6, revenue 500) ----
  await page.reload();
  await page.waitForFunction(() => !!window.__tt, null, { timeout: 20000 });
  await page.evaluate(() => { window.__tt.state.week = 6; window.__tt.state.revenue = 500; window.__tt.scene.gameOver(); });
  await page.waitForTimeout(800);
  const best3 = await page.evaluate(() => JSON.parse(localStorage.getItem('tt_best') || 'null'));
  if (best3.weeks !== 5 || best3.revenue !== 500) throw new Error('Best should update after better bankrupt: ' + JSON.stringify(best3));

  // ---- 4. Verify persistence across reload ----
  await page.reload();
  await page.waitForFunction(() => !!window.__tt, null, { timeout: 20000 });
  const best4 = await page.evaluate(() => JSON.parse(localStorage.getItem('tt_best') || 'null'));
  if (best4.weeks !== 5 || best4.revenue !== 500) throw new Error('Best not persisted after reload: ' + JSON.stringify(best4));

  // Ensure no errors captured
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));

  console.log('BANKRUPT_BEST SMOKE PASS');
  await browser.close();
  process.exit(0);
})().catch(e => { console.error('BANKRUPT_BEST SMOKE FAIL:', e.message); process.exit(1); });