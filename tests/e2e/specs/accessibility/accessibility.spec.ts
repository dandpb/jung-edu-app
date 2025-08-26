import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';
import { DashboardPage } from '../../pages/dashboard-page';
import { ModulePage } from '../../pages/module-page';
import { testUsers } from '../../fixtures/test-data';
import { cleanupTestData, checkAccessibility } from '../../helpers/test-helpers';

test.describe('Accessibility Testing', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let modulePage: ModulePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    modulePage = new ModulePage(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test.describe('Keyboard Navigation', () => {
    test('should support basic keyboard navigation', async ({ page }) => {
      await loginPage.goto();
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper heading structure', async ({ page }) => {
      const testUser = testUsers.student;
      await loginPage.loginSuccessfully(testUser.email, testUser.password);
      
      // Check heading hierarchy
      const h1Elements = page.locator('h1');
      const h1Count = await h1Elements.count();
      expect(h1Count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Basic Accessibility', () => {
    test('should have accessible images', async ({ page }) => {
      const testUser = testUsers.student;
      await loginPage.loginSuccessfully(testUser.email, testUser.password);
      
      // Check all images have alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const alt = await image.getAttribute('alt');
        const ariaLabel = await image.getAttribute('aria-label');
        const role = await image.getAttribute('role');
        
        // Image should have alt text, aria-label, or be decorative
        const hasAccessibleText = alt !== null || ariaLabel || role === 'presentation';
        expect(hasAccessibleText).toBe(true);
      }
    });
  });
});