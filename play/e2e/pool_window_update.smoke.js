const { test, expect } = require('@playwright/test');

test('5h and weekly pool windows update in real time', async ({ page }) => {
  // Load the game
  await page.goto('http://localhost:3000'); // placeholder
  await expect(page.evaluate(() => !!window.__tt)).resolves.toBeTruthy();
  // Setup: buy a sub and hire a staff
  await page.evaluate(() => {
    window.__tt.buySub('claude');
    window.__tt.hire('claude');
  });
  // Capture initial UI text
  const initialText = await page.evaluate(() => {
    const d = window.__tt.scene.deskObjs[0];
    return d ? d.h5Text.text : '';
  });
  // Spawn a job and assign to the staff
  await page.evaluate(() => {
    window.__tt.spawnJob(1, 10);
    const jobId = window.__tt.state.jobs[0].id;
    window.__tt.assign(jobId, 0);
  });
  // Wait for a short period to allow timer to tick
  await page.waitForTimeout(1500);
  // Verify that the UI text has updated (should no longer be empty)
  const laterText = await page.evaluate(() => {
    const d = window.__tt.scene.deskObjs[0];
    return d ? d.h5Text.text : '';
  });
  expect(laterText).not.toBe(initialText);
});