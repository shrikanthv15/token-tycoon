// Playwright smoke test for department creation and desk assignment
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8903/index.html', { waitUntil: 'networkidle' });
  if (!await page.evaluate(() => !!window.__tt)) throw new Error('Game not booted');

  // Create a new department via exported hook (using internal method)
  await page.evaluate(() => {
    if (typeof window.__tt.scene?.createDepartment === 'function') {
      window.__tt.scene.createDepartment();
    }
  });
  // Pick the first department
  const deptIdx = await page.evaluate(() => window.__tt.state.departments.length - 1);
  if (deptIdx < 0) throw new Error('No department created');

  // Set as current department
  await page.evaluate(idx => {
    const dept = window.__tt.state.departments[idx];
    window.__tt.scene.currentDept = dept;
  }, deptIdx);

  // Toggle desk 0 into department
  await page.evaluate(() => window.__tt.toggleDeskDept(0));
  const desks = await page.evaluate(() => window.__tt.currentDept?.desks || []);
  if (!desks.includes(0)) throw new Error('Desk not assigned to department');

  await browser.close();
  if (errors.length) throw new Error('Errors: ' + errors.join(' | '));
  console.log('DEPT_TOGGLE SMOKE PASS');
})().catch(e => { console.error('DEPT_TOGGLE SMOKE FAIL:', e.message); process.exit(1); });
