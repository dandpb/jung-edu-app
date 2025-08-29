import { test, expect } from '@playwright/test';

test('simple test', async ({ page }) => {
  // Just navigate to a simple page
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
});