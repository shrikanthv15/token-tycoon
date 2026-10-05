// Playwright smoke test for rich job card UI elements
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Ensure there is at least one job in inbox
  await page.evaluate(() => window.__tt.spawnJob(2, 20));
  await page.waitForTimeout(500);

  // Check inbox job card fields
  const card = await page.evaluate(() => {
    const job = window.__tt.state.jobs[0];
    if (!job) return null;
    return { title: job.title, description: job.description, stars: job.stars, pay: job.pay };
  });
  if (!card) throw new Error('No job card found');
  if (!card.title || !card.description) throw new Error('Job card missing title/description');
  if (typeof card.stars !== 'number' || typeof card.pay !== 'number') throw new Error('Job card stars/pay invalid');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('RICH_JOB_CARD SMOKE PASS');
})().catch(e => { console.error('RICH_JOB_CARD SMOKE FAIL:', e.message); process.exit(1); });
