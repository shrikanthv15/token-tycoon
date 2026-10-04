const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(err));
  await page.goto('http://localhost:8000');
  const canvas = await page.$('#game');
  if (!canvas) {
    console.error('Canvas not found');
    process.exit(1);
  }
  const texts = ['Model 1', 'Model 2', 'Model 3'];
  for (const t of texts) {
    const el = await page.$(`text=${t}`);
    if (!el) {
      console.error(`Missing ${t}`);
      process.exit(1);
    }
  }
  // wait 5 seconds instead of 60 for speed
  await page.waitForTimeout(5000);
  if (consoleErrors.length) {
    console.error('Console errors:', consoleErrors);
    process.exit(1);
  }
  await browser.close();
  console.log('Smoke test passed');
  process.exit(0);
})();
