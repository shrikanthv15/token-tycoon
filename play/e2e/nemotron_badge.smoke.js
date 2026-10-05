// Playwright smoke test for AI badge UI and source indicator
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Enable bridge and stub requestJobs to return AI job
  await page.evaluate(() => {
    if (!window.NemotronBridge) window.NemotronBridge = {};
    window.NemotronBridge.isEnabled = () => true;
    window.NemotronBridge.requestJobs = () => Promise.resolve([
      { title: 'AI Badge Test', description: 'Check AI badge', stars: 2, pay: 30 }
    ]);
  });

  // Trigger job generation via bridge
  await page.evaluate(() => { window.__tt.spawnJob(); });
  // Wait until job appears
  await page.waitForFunction(() => window.__tt.state && window.__tt.state.jobs && window.__tt.state.jobs.length >= 1);
  const job = await page.evaluate(() => window.__tt.state.jobs[0]);
  if (!job.ai) throw new Error('AI flag not set on job');

  // Verify badge text exists in the card container
  const badgeExists = await page.evaluate(() => {
    const card = window.__tt.state.jobs[0].card;
    if (!card) return false;
    const children = card.list || [];
    return children.some(c => c.text === 'AI');
  });
  if (!badgeExists) throw new Error('AI badge text not found in UI');

  // Verify source indicator shows AI
  const sourceText = await page.evaluate(() => {
    const txt = window.__tt.jobSourceText;
    return txt ? txt.text : '';
  });
  if (!sourceText.includes('AI')) throw new Error('Source indicator not updated to AI');

  // Now disable bridge and generate a local job
  await page.evaluate(() => {
    window.NemotronBridge.isEnabled = () => false;
  });
  await page.evaluate(() => { window.__tt.spawnJob(); });
  await page.waitForTimeout(500);
  const sourceAfter = await page.evaluate(() => window.__tt.jobSourceText ? window.__tt.jobSourceText.text : '');
  if (!sourceAfter.includes('LOCAL')) throw new Error('Source indicator not fallback to LOCAL');

  await browser.close();
  if (errors.length) throw new Error('Encountered errors: ' + errors.join(' | '));
  console.log('NEMOTRON_BADGE SMOKE PASS');
})().catch(e => { console.error('NEMOTRON_BADGE SMOKE FAIL:', e.message); process.exit(1); });
