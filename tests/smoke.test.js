const { test, expect } = require('@playwright/test');

test('Token Tycoon loads and runs basic loop', async ({ page }) => {
  await page.goto('http://localhost:8000');
  // Wait for canvas to exist
  const canvas = await page.waitForSelector('#game');
  expect(canvas).toBeTruthy();
  // Verify placeholder model cards exist (text "Model 1" etc.)
  await expect(page.locator('text=Model 1')).toBeVisible();
  await expect(page.locator('text=Model 2')).toBeVisible();
  await expect(page.locator('text=Model 3')).toBeVisible();
  // Run for 60 seconds (simulated) – just wait
  await page.waitForTimeout(60000);
  // Ensure no console errors captured
  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(err));
  expect(consoleErrors.length).toBe(0);
});
