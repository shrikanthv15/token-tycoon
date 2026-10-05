// Token Tycoon v3 smoke test — run: node smoke3.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // phaser boot
  const booted = await page.evaluate(() => !!window.__tt);
  console.log('booted:', booted);
  if (!booted) throw new Error('game did not boot');

  // buy Claude + hire Haiku
  await page.evaluate(() => { window.__tt.buySub('claude'); window.__tt.hire('haiku'); });
  await page.waitForTimeout(2200); // walk-in tween
  const staff = await page.evaluate(() => window.__tt.state.staff.length);
  const seated = await page.evaluate(() => {
    const s = window.__tt.state.staff[0];
    return s && Math.abs(s.spr.y - (s.desk.y - 64)) < 5;
  });
  console.log('staff:', staff, '| seated at desk:', seated);
  if (staff !== 1 || !seated) throw new Error('hire/walk-in failed');

  // spawn a job and DRAG it with a real mouse onto desk 0 (proves DnD)
  // ★1 job: Haiku (cap 1) has ~94% success, 40s work -> 20s at 2x
  await page.evaluate(() => window.__tt.spawnJob(1, 10));
  await page.waitForTimeout(600);
  const card = await page.evaluate(() => {
    const j = window.__tt.state.jobs[0];
    return j && j.card ? { x: j.card.x, y: j.card.y, id: j.id } : null;
  });
  console.log('job card at:', card);
  if (!card) throw new Error('no job card');
  // canvas is 1280x800 centered in the 1500x950 viewport -> offset, not scale
  const ox = (1500 - 1280) / 2, oy = (950 - 800) / 2;
  await page.mouse.move(card.x + ox, card.y + oy);
  await page.mouse.down();
  await page.mouse.move(220 + ox, 330 + oy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  const busy = await page.evaluate(() => window.__tt.state.staff[0].busy);
  console.log('employee busy after drop:', busy);
  if (!busy) throw new Error('drag-drop assign failed');

  // fast-forward: wait for completion (40s work at 1x -> 20s at 2x; poll to 40s)
  await page.evaluate(() => { window.__tt.state.speed = 2; });
  let cycles = 0;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(1000);
    cycles = await page.evaluate(() => window.__tt.state.done + window.__tt.state.failed);
    if (cycles > 0) break;
  }
  const rev = await page.evaluate(() => window.__tt.state.revenue);
  console.log('work cycles completed:', cycles, '| revenue:', rev);
  if (cycles < 1) throw new Error('job never completed');

  // pool drained?
  const pools = await page.evaluate(() => window.__tt.state.subs.claude);
  console.log('pools after job:', pools);
  if (pools.h5 >= 400) throw new Error('pool did not drain');

  await page.screenshot({ path: '/tmp/tt3_shot.png' });
  console.log('errors:', errors.length ? errors : 'none');
  if (errors.length) throw new Error('page errors: ' + errors.join(' | '));
  await browser.close();
  console.log('SMOKE3 PASS');
})().catch(e => { console.error('SMOKE3 FAIL:', e.message); process.exit(1); });
