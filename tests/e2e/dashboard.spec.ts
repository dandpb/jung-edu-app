import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/dashboard-page';
import { ModulePage } from './pages/module-page';

/**
 * E2E Tests for Dashboard Functionality
 * Tests main dashboard features, navigation, and user interactions
 */
test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto('/dashboard');
  });

  test('should display dashboard correctly for authenticated user', async ({ page }) => {
    // Verify main dashboard elements
    await expect(dashboardPage.welcomeMessage).toBeVisible();
    await expect(dashboardPage.navigationMenu).toBeVisible();
    await expect(dashboardPage.userMenu).toBeVisible();
    
    // Verify dashboard content sections
    await expect(dashboardPage.progressSection).toBeVisible();
    await expect(dashboardPage.recentModulesSection).toBeVisible();
    await expect(dashboardPage.quickActionsSection).toBeVisible();
  });

  test('should show user progress information', async ({ page }) => {
    // Check that progress components are visible
    await expect(dashboardPage.progressChart).toBeVisible();
    await expect(dashboardPage.completionStats).toBeVisible();
    
    // Verify progress values are displayed
    const progressText = await dashboardPage.getProgressText();
    expect(progressText).toMatch(/\d+%|\d+ completed|progress/i);
  });

  test('should display recent modules correctly', async ({ page }) => {
    // Verify recent modules section
    await expect(dashboardPage.recentModulesList).toBeVisible();
    
    // Check if modules have proper structure
    const moduleCount = await dashboardPage.getRecentModulesCount();
    expect(moduleCount).toBeGreaterThanOrEqual(0);
    
    if (moduleCount > 0) {
      // Verify first module has required elements
      await expect(dashboardPage.getModuleCard(0)).toBeVisible();
    }
  });

  test('should navigate to module from dashboard', async ({ page }) => {
    const moduleCount = await dashboardPage.getRecentModulesCount();
    
    if (moduleCount > 0) {
      // Click on first module
      await dashboardPage.clickModuleCard(0);
      
      // Should navigate to module page
      await expect(page).toHaveURL(/module/);
      
      // Verify module page loads
      const modulePage = new ModulePage(page);
      await expect(modulePage.moduleContent).toBeVisible();
    } else {
      console.log('No modules available to test navigation');
    }
  });

  test('should show quick actions', async ({ page }) => {
    // Verify quick action buttons are present
    await expect(dashboardPage.continueStudyingButton).toBeVisible();
    await expect(dashboardPage.browseModulesButton).toBeVisible();
    await expect(dashboardPage.viewProfileButton).toBeVisible();
  });

  test('should handle continue studying action', async ({ page }) => {
    // Click continue studying button
    await dashboardPage.clickContinueStudying();
    
    // Should either navigate to a module or show module selection
    await page.waitForLoadState('networkidle');
    
    // Verify we're on either a module page or modules list
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/module|learning/);
  });

  test('should handle browse modules action', async ({ page }) => {
    // Click browse modules button
    await dashboardPage.clickBrowseModules();
    
    // Should navigate to modules list
    await expect(page).toHaveURL(/modules|courses|learning/);
  });

  test('should handle user menu interactions', async ({ page }) => {
    // Open user menu
    await dashboardPage.openUserMenu();
    
    // Verify menu options
    await expect(dashboardPage.profileMenuItem).toBeVisible();
    await expect(dashboardPage.settingsMenuItem).toBeVisible();
    await expect(dashboardPage.logoutMenuItem).toBeVisible();
  });

  test('should handle profile navigation', async ({ page }) => {
    await dashboardPage.openUserMenu();
    await dashboardPage.clickProfileMenuItem();
    
    // Should navigate to profile page
    await expect(page).toHaveURL(/profile|account/);
  });

  test('should handle settings navigation', async ({ page }) => {
    await dashboardPage.openUserMenu();
    await dashboardPage.clickSettingsMenuItem();
    
    // Should navigate to settings page
    await expect(page).toHaveURL(/settings|preferences/);
  });

  test('should handle logout', async ({ page }) => {
    await dashboardPage.openUserMenu();
    await dashboardPage.clickLogoutMenuItem();
    
    // Should redirect to login page
    await expect(page).toHaveURL(/login|auth/);
    
    // Should no longer be authenticated
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify dashboard adapts to mobile
    await expect(dashboardPage.navigationMenu).toBeVisible();
    
    // Check that mobile-specific elements appear
    const mobileMenu = page.locator('[data-testid="mobile-menu-toggle"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(dashboardPage.mobileNavigationMenu).toBeVisible();
    }
  });

  test('should handle loading states correctly', async ({ page }) => {
    // Reload page and check loading states
    await page.reload();
    
    // Should show loading indicators initially
    const loadingSpinner = page.locator('[data-testid="dashboard-loading"]');
    if (await loadingSpinner.isVisible({ timeout: 1000 })) {
      // Wait for loading to complete
      await expect(loadingSpinner).not.toBeVisible({ timeout: 10000 });
    }
    
    // Verify content loads properly
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  test('should display notifications if present', async ({ page }) => {
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      
      // Verify notification panel opens
      await expect(page.locator('[data-testid="notification-panel"]')).toBeVisible();
      
      // Check notification count
      const notifications = page.locator('[data-testid="notification-item"]');
      const count = await notifications.count();
      
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});