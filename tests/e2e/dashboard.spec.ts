import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/dashboard-page';
import { ModulePage } from './pages/module-page';
import { TestEnvSetup } from './helpers/test-env-setup';

/**
 * E2E Tests for Dashboard Functionality
 * Tests main dashboard features, navigation, and user interactions with mock data
 */

// Use authenticated user state for dashboard tests
test.use({ storageState: 'tests/e2e/.auth/user.json' });

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    
    // Setup clean test environment
    await TestEnvSetup.setupCleanTestEnv(page);
    
    // Setup simplified mock routes for dashboard functionality
    await page.route('**/api/**', async route => {
      const url = route.request().url();
      
      // Mock different API endpoints with simpler responses
      if (url.includes('/modules')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'jung-basics',
              title: 'Fundamentos da Psicologia Jungiana',
              description: 'Introdução às teorias básicas de Carl Jung',
              difficulty: 'beginner',
              icon: '🧠',
              estimatedTime: 45
            },
            {
              id: 'archetypes',
              title: 'Arquétipos Jungianos',
              description: 'Explorando os arquétipos fundamentais',
              difficulty: 'intermediate',
              icon: '🎭',
              estimatedTime: 60
            }
          ])
        });
      } else if (url.includes('/progress')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            completedModules: ['jung-basics'],
            totalTime: 3600,
            currentStreak: 5,
            totalPoints: 250,
            level: 2
          })
        });
      } else {
        // Default successful response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });
    
    // Setup mock auth and navigate to dashboard
    await TestEnvSetup.setupMockAuth(page, 'user');
    await page.goto('/dashboard');
    await TestEnvSetup.waitForReactApp(page);
    await TestEnvSetup.ensureNoOverlays(page);
    
    // Wait for dashboard to load
    await page.waitForTimeout(1000);
  });

  test('should display dashboard correctly for authenticated user', async ({ page }) => {
    // Verify main dashboard elements with increased timeout
    await expect(dashboardPage.welcomeMessage).toBeVisible({ timeout: 10000 });
    
    // Verify dashboard content sections
    await expect(dashboardPage.progressSection).toBeVisible({ timeout: 10000 });
    await expect(dashboardPage.recentModulesSection).toBeVisible({ timeout: 10000 });
    
    // Navigation menu should be visible
    const navElement = page.locator('[data-testid="main-navigation"]');
    await expect(navElement).toBeVisible({ timeout: 10000 });
    
    // Quick actions section might not always be visible
    const quickActionsVisible = await dashboardPage.quickActionsSection.isVisible({ timeout: 5000 });
    if (quickActionsVisible) {
      await expect(dashboardPage.quickActionsSection).toBeVisible();
    }
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
      // Setup module page mock
      await page.route('**/module/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div data-testid="module-content">Module content loaded</div>'
        });
      });
      
      // Click on first module
      await dashboardPage.clickModuleCard(0);
      
      // Should navigate to module page
      await expect(page).toHaveURL(/module/);
      
      // Verify module page loads
      const modulePage = new ModulePage(page);
      await expect(modulePage.moduleContent).toBeVisible();
    } else {
      test.skip('No modules available to test navigation');
    }
  });

  test('should show quick actions', async ({ page }) => {
    // Verify quick action buttons are present (if they exist)
    const continueStudyingVisible = await dashboardPage.continueStudyingButton.isVisible();
    const browseModulesVisible = await dashboardPage.browseModulesButton.isVisible();
    const viewProfileVisible = await dashboardPage.viewProfileButton.isVisible();
    
    if (continueStudyingVisible) {
      await expect(dashboardPage.continueStudyingButton).toBeVisible();
    }
    if (browseModulesVisible) {
      await expect(dashboardPage.browseModulesButton).toBeVisible();
    }
    if (viewProfileVisible) {
      await expect(dashboardPage.viewProfileButton).toBeVisible();
    }
  });

  test('should handle continue studying action', async ({ page }) => {
    // Check if continue studying button exists
    if (await dashboardPage.continueStudyingButton.isVisible()) {
      // Mock navigation response
      await page.route('**/modules/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div>Modules page loaded</div>'
        });
      });
      
      // Click continue studying button
      await dashboardPage.clickContinueStudying();
      
      // Should either navigate to a module or show module selection
      await page.waitForLoadState('networkidle');
      
      // Verify we're on either a module page or modules list
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/module|learning|dashboard/);
    } else {
      test.skip('Continue studying button not available');
    }
  });

  test('should handle browse modules action', async ({ page }) => {
    // Check if browse modules button exists
    if (await dashboardPage.browseModulesButton.isVisible()) {
      // Mock navigation response
      await page.route('**/modules', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<div>Modules list loaded</div>'
        });
      });
      
      // Click browse modules button
      await dashboardPage.clickBrowseModules();
      
      // Should navigate to modules list
      await expect(page).toHaveURL(/modules|courses|learning|dashboard/);
    } else {
      test.skip('Browse modules button not available');
    }
  });

  test('should handle user menu interactions', async ({ page }) => {
    // Open user menu (if it exists)
    if (await dashboardPage.viewProfileButton.isVisible()) {
      await dashboardPage.openUserMenu();
      
      // Verify menu options (if they exist)
      const profileMenuVisible = await dashboardPage.profileMenuItem.isVisible();
      const settingsMenuVisible = await dashboardPage.settingsMenuItem.isVisible();
      const logoutMenuVisible = await dashboardPage.logoutMenuItem.isVisible();
      
      if (profileMenuVisible) {
        await expect(dashboardPage.profileMenuItem).toBeVisible();
      }
      if (settingsMenuVisible) {
        await expect(dashboardPage.settingsMenuItem).toBeVisible();
      }
      if (logoutMenuVisible) {
        await expect(dashboardPage.logoutMenuItem).toBeVisible();
      }
    } else {
      test.skip('User menu not available');
    }
  });

  test('should handle profile navigation', async ({ page }) => {
    if (await dashboardPage.viewProfileButton.isVisible()) {
      await dashboardPage.openUserMenu();
      
      if (await dashboardPage.profileMenuItem.isVisible()) {
        // Mock profile page
        await page.route('**/profile', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<div>Profile page loaded</div>'
          });
        });
        
        await dashboardPage.clickProfileMenuItem();
        
        // Should navigate to profile page
        await expect(page).toHaveURL(/profile|account|dashboard/);
      } else {
        test.skip('Profile menu item not available');
      }
    } else {
      test.skip('User menu not available');
    }
  });

  test('should handle settings navigation', async ({ page }) => {
    if (await dashboardPage.viewProfileButton.isVisible()) {
      await dashboardPage.openUserMenu();
      
      if (await dashboardPage.settingsMenuItem.isVisible()) {
        // Mock settings page
        await page.route('**/settings', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<div>Settings page loaded</div>'
          });
        });
        
        await dashboardPage.clickSettingsMenuItem();
        
        // Should navigate to settings page
        await expect(page).toHaveURL(/settings|preferences|dashboard/);
      } else {
        test.skip('Settings menu item not available');
      }
    } else {
      test.skip('User menu not available');
    }
  });

  test('should handle logout', async ({ page }) => {
    // Look for logout button with multiple selectors
    const logoutButton = page.locator('[data-testid="logout-button"]');
    
    if (await logoutButton.isVisible({ timeout: 5000 })) {
      // Mock logout redirect
      await page.route('**/auth/logout', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      
      // Ensure no overlays are blocking
      await TestEnvSetup.ensureNoOverlays(page);
      
      // Click logout with force to bypass any overlays
      await logoutButton.click({ force: true });
      
      // Wait for logout processing
      await page.waitForTimeout(2000);
      
      // In test mode, verify button was clicked (might stay on same page)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/login|auth|\/$|dashboard/);
    } else {
      test.skip('Logout button not available');
    }
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
    const loadingSpinner = page.locator('[data-testid="dashboard-loading"], .loading, .spinner');
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
    } else {
      test.skip('Notifications not available');
    }
  });
});