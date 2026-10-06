// Playwright smoke test for AI provider unlocks per quarter
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game did not boot');

  // Buy a subscription and hire a staffer to enable quarter progression
  await page.evaluate(() => { window.__tt.buySub('claude'); window.__tt.hire('haiku'); });
  await page.waitForTimeout(2000);

  const unlocks = [];
  // Helper to trigger quarter win and capture unlocked provider
  const triggerQuarter = async (expectedProvider) => {
    // Ensure profit target is met
    await page.evaluate(() => {
      const S = window.__tt.S;
      S.cash = S.quarterStartCash + S.profitTarget + 10;
      S.quarterWeeks = 13; // force evaluation
    });
    // Call evaluateQuarter
    await page.evaluate(() => window.__tt.scene.evaluateQuarter());
    // Wait a bit for UI flash to appear
    await page.waitForTimeout(500);
    const providers = await page.evaluate(() => window.__tt.S.unlockedProviders);
    if (!providers.includes(expectedProvider)) {
      throw new Error(`Provider ${expectedProvider} not unlocked after quarter win`);
    }
    unlocks.push(expectedProvider);
  };

  // Quarter 2 unlocks OpenRouter
  await triggerQuarter('openrouter');
  // Quarter 3 unlocks OpenClaw
  await triggerQuarter('openclaw');
  // Quarter 4 unlocks HyperBrain
  await triggerQuarter('hyperbrain');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('PROVIDER_UNLOCK SMOKE PASS', unlocks);
})().catch(e => { console.error('PROVIDER_UNLOCK SMOKE FAIL:', e.message); process.exit(1); });
