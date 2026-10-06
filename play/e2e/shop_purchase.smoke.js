// Token Tycoon PAN-58 shop smoke test — SHOP tab + buyable desks + persistence.
// Real mouse clicks (canvas game — no DOM queries). Run: node shop_purchase.smoke.js
// (local server on 127.0.0.1:8903 serving play/)
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const ox = (1500 - 1280) / 2, oy = (950 - 800) / 2; // canvas centered in viewport
  const click = async (x, y) => { await page.mouse.click(x + ox, y + oy); };

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('game did not boot');

  // SHOP tab at x=1206 must be on-canvas and clickable with a real mouse
  const tabX = await page.evaluate(() => window.__tt.scene.tabShop.x);
  if (!(tabX > 0 && tabX < 1280)) throw new Error('SHOP tab off-canvas: x=' + tabX);
  await click(1206, 84);
  await page.waitForTimeout(400);
  if (await page.evaluate(() => window.__tt.scene.tab) !== 'shop') throw new Error('SHOP tab not clickable');

  // real mouse click on the first BUY button (desk row at y=165 -> button at ~(1225,157))
  const n0 = await page.evaluate(() => window.__tt.scene.deskObjs.length);
  const cash0 = await page.evaluate(() => window.__tt.cash());
  await click(1225, 157);
  await page.waitForTimeout(400);
  const n1 = await page.evaluate(() => window.__tt.scene.deskObjs.length);
  const cash1 = await page.evaluate(() => window.__tt.cash());
  if (n1 !== n0 + 1) throw new Error('BUY button did not add a desk');
  if (cash1 !== cash0 - 10) throw new Error('desk purchase did not deduct $10');
  const d = await page.evaluate(() => {
    const x = window.__tt.scene.deskObjs[window.__tt.scene.deskObjs.length - 1];
    return { x: x.x, y: x.y, bought: x.bought };
  });
  if (!(d.x > 0 && d.x < 950 && d.y > 0 && d.y < 800)) throw new Error('bought desk off-canvas');
  if (!d.bought) throw new Error('bought flag missing');

  // reload -> bought desk restored before staff seating
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('game did not boot after reload');
  const nR = await page.evaluate(() => window.__tt.scene.deskObjs.length);
  const bR = await page.evaluate(() => window.__tt.scene.deskObjs.filter(x => x.bought).length);
  if (nR !== n1 || bR !== 1) throw new Error(`persistence failed: desks=${nR} bought=${bR}`);

  console.log('pageerrors:', errors.length ? errors : 'none');
  if (errors.length) throw new Error('pageerrors: ' + errors.join(' | '));
  console.log('SHOP_PURCHASE SMOKE PASS');
  await browser.close();
})().catch(e => { console.error('SHOP_PURCHASE SMOKE FAIL:', e.message); process.exit(1); });
