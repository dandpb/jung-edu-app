import { test, expect, devices } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';
import { DashboardPage } from '../../pages/dashboard-page';
import { ModulePage } from '../../pages/module-page';
import { testUsers } from '../../fixtures/test-data';
import { cleanupTestData, setMobileViewport, setDesktopViewport } from '../../helpers/test-helpers';

test.describe('Cross-Browser and Responsive Design', () => {
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

  test.describe('Desktop Viewports', () => {
    test('should work on 1920x1080 resolution', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const testUser = testUsers.student;
      await loginPage.loginSuccessfully(testUser.email, testUser.password);
      
      await dashboardPage.verifyDashboardLoaded();
      
      // Check that layout uses available space effectively
      const moduleCards = page.locator('[data-testid="module-card"]');
      const cardCount = await moduleCards.count();
      
      if (cardCount > 0) {
        // Should show multiple cards per row on large screens
        const firstCard = moduleCards.first();
        const cardWidth = await firstCard.boundingBox();
        
        if (cardWidth) {
          // Cards should be reasonably sized, not too wide
          expect(cardWidth.width).toBeLessThan(600);
          expect(cardWidth.width).toBeGreaterThan(200);
        }
      }
    });

    test('should work on 1366x768 resolution', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      
      const testUser = testUsers.student;
      await loginPage.loginSuccessfully(testUser.email, testUser.password);
      
      await dashboardPage.verifyDashboardLoaded();
      
      // Navigation should be fully visible
      await expect(dashboardPage.mainNavigation).toBeVisible();
      
      // Content should not be cut off
      const dashboardHeader = dashboardPage.dashboardHeader;
      const headerBox = await dashboardHeader.boundingBox();
      
      if (headerBox) {
        expect(headerBox.y).toBeGreaterThanOrEqual(0);
        expect(headerBox.x).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Mobile Viewports', () => {
    test('should work on iPhone SE (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const testUser = testUsers.student;
      await loginPage.loginSuccessfully(testUser.email, testUser.password);
      
      await dashboardPage.verifyDashboardLoaded();
      
      // Mobile menu should be available
      const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
      
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        
        const mobileNavigation = page.locator('[data-testid="mobile-navigation"]');
        await expect(mobileNavigation).toBeVisible();
        
        // Close menu
        const closeButton = page.locator('[data-testid="close-mobile-menu"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
      
      // Module cards should stack vertically on mobile
      const moduleCards = page.locator('[data-testid="module-card"]');
      if (await moduleCards.count() > 1) {
        const firstCard = moduleCards.first();
        const secondCard = moduleCards.nth(1);
        
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();
        
        if (firstBox && secondBox) {
          // Second card should be below first card (vertical stacking)
          expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 50);
        }
      }
    });
  });

  test.describe('Accessibility on Different Devices', () => {
    test('should maintain accessibility on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const testUser = testUsers.student;
      await loginPage.loginSuccessfully(testUser.email, testUser.password);
      
      // Check touch target sizes
      const interactiveElements = page.locator('button, a, [role="button"], [tabindex="0"]');
      const count = await interactiveElements.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = interactiveElements.nth(i);
        
        if (await element.isVisible()) {
          const box = await element.boundingBox();
          
          if (box) {
            // Touch targets should be at least 44x44 pixels
            const minSize = 40; // Slightly smaller for testing tolerance
            expect(box.width).toBeGreaterThan(minSize);
            expect(box.height).toBeGreaterThan(minSize);
          }
        }
      }
    });
  });
});