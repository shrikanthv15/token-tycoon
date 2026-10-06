// Playwright smoke test for job tier tabs UI
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Spawn jobs of each tier
  await page.evaluate(() => {
    window.__tt.spawnJob(1, 10, 'Tier1 Job', 'desc');
    window.__tt.spawnJob(2, 20, 'Tier2 Job', 'desc');
    window.__tt.spawnJob(3, 30, 'Tier3 Job', 'desc');
  });
  await page.waitForTimeout(500);

  const tiers = [
    { label: 'ALL', id: 'all', expectedCount: 3 },
    { label: '★1', id: '1', expectedCount: 1 },
    { label: '★2', id: '2', expectedCount: 1 },
    { label: '★3', id: '3', expectedCount: 1 },
  ];

  for (const t of tiers) {
    await page.click(`text=${t.label}`);
    // wait for UI update
    await page.waitForTimeout(200);
    const result = await page.evaluate((expected) => {
      const tier = window.__tt.jobTier;
      const cardCount = window.__tt.scene.sideC.list.filter(c => c.getData && c.getData('jobId')).length;
      return { tier, cardCount, expected };
    }, t.expectedCount);
    if (result.tier !== t.id) throw new Error(`Tier not set correctly after clicking ${t.label}`);
    if (result.cardCount !== t.expectedCount) throw new Error(`Card count ${result.cardCount} != expected ${t.expectedCount} for tier ${t.label}`);
  }

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('TIER_TABS SMOKE PASS');
})().catch(e => { console.error('TIER_TABS SMOKE FAIL:', e.message); process.exit(1); });
