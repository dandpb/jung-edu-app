import { test, expect } from '@playwright/test';
import { PageObjectManager } from './page-objects';
import { E2EHelpers } from './helpers';
import { TestUsersFixture } from './fixtures/test-users';
import { TestConfigManager } from './config/test-config';

/**
 * Example E2E Test Suite
 * Demonstrates how to use all the E2E utilities and page objects
 */

// Get configuration
const config = TestConfigManager.getInstance();

test.describe('E2E Testing Utilities Demo', () => {
  let pageManager: PageObjectManager;
  let helpers: E2EHelpers;
  let usersFixture: TestUsersFixture;

  test.beforeEach(async ({ page, context }) => {
    // Initialize utilities
    pageManager = new PageObjectManager(page);
    helpers = new E2EHelpers(page, context);
    usersFixture = TestUsersFixture.getInstance();

    // Take initial screenshot if enabled
    if (config.shouldTakeScreenshots()) {
      await helpers.screenshot.takeScreenshot('test-start');
    }
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    if (config.shouldTakeScreenshots()) {
      await helpers.screenshot.takeScreenshot('test-end');
    }

    // Logout if logged in
    if (await helpers.auth.isLoggedIn()) {
      await helpers.auth.logout();
    }
  });

  test('User Login Flow', async ({ page }) => {
    // Navigate to login page
    const loginPage = await pageManager.goToLogin();

    // Verify login page is loaded
    await expect(loginPage.loginForm).toBeVisible();

    // Login with test user
    await loginPage.loginWithValidCredentials();

    // Wait for redirect and verify dashboard
    await loginPage.waitForLoginRedirect();
    const dashboardPage = pageManager.dashboardPage;
    
    await expect(dashboardPage.userAvatar).toBeVisible();
    expect(await helpers.auth.isLoggedIn()).toBe(true);

    // Take screenshot of successful login
    await helpers.screenshot.takeScreenshot('successful-login');
  });

  test('Admin Dashboard Access', async ({ page }) => {
    // Login as admin
    await helpers.auth.loginAsAdmin();

    // Navigate to admin dashboard
    const adminPage = await pageManager.goToAdminDashboard();

    // Verify admin features are visible
    await expect(adminPage.adminTitle).toBeVisible();
    await expect(adminPage.systemOverview).toBeVisible();
    await expect(adminPage.userManagement).toBeVisible();

    // Test switching between tabs
    await adminPage.switchToUsersTab();
    await helpers.wait.waitForPageLoad();
    await expect(adminPage.userTable).toBeVisible();

    await adminPage.switchToModulesTab();
    await helpers.wait.waitForPageLoad();
    await expect(adminPage.moduleTable).toBeVisible();

    // Take screenshot of admin dashboard
    await helpers.screenshot.takeScreenshot('admin-dashboard');
  });

  test('Module Interaction', async ({ page }) => {
    // Login as student
    await helpers.auth.loginAsUser('student');

    // Go to dashboard and find a module
    const dashboardPage = await pageManager.goToDashboard();
    
    await helpers.wait.waitForElementToBeVisible('[data-testid="module-card"]');
    
    // Click on first module
    await dashboardPage.clickModuleCard(0);

    // Interact with module
    const modulePage = pageManager.modulePage;
    
    await expect(modulePage.moduleTitle).toBeVisible();
    await expect(modulePage.moduleDescription).toBeVisible();

    // Test navigation within module
    if (await modulePage.isElementVisible('[data-testid="next-button"]')) {
      await modulePage.goToNextSection();
      await helpers.wait.waitForPageLoad();
    }

    // Test notes functionality
    if (await modulePage.isElementVisible('[data-testid="notes-toggle"]')) {
      await modulePage.toggleNotes();
      await modulePage.addNote('This is a test note from E2E test');
      
      // Verify note was saved
      expect(await modulePage.getNotes()).toContain('This is a test note');
    }

    // Take screenshot of module interaction
    await helpers.screenshot.takeScreenshot('module-interaction');
  });

  test('Multi-Language Support', async ({ page }) => {
    if (!config.shouldTestI18n()) {
      test.skip('I18n testing is disabled');
    }

    // Test different languages
    const languages = config.getI18nConfig().supportedLanguages;

    for (const language of languages) {
      // Login with user for this language
      const user = language === 'es' 
        ? usersFixture.getSpanishUser()
        : language === 'pt-br'
        ? usersFixture.getPortugueseUser()
        : usersFixture.getStudentUser();

      await helpers.auth.login(user.email, user.password);

      // Switch language if needed
      const dashboardPage = await pageManager.goToDashboard();
      
      if (language !== 'en') {
        await dashboardPage.switchLanguage(language as any);
        await helpers.wait.waitForPageLoad();
      }

      // Verify language switch
      await helpers.screenshot.takeScreenshot(`language-${language}`);

      // Logout for next iteration
      await helpers.auth.logout();
    }
  });

  test('Error Handling and Recovery', async ({ page }) => {
    // Test various error scenarios
    const loginPage = await pageManager.goToLogin();

    // Test invalid credentials
    await loginPage.loginWithInvalidCredentials();
    
    // Verify error message appears
    await helpers.wait.waitForElementToBeVisible('[data-testid="server-error"]');
    expect(await loginPage.hasServerError()).toBe(true);

    // Take error screenshot
    await helpers.screenshot.takeScreenshot('login-error');

    // Clear form and try valid credentials
    await loginPage.clearForm();
    await loginPage.loginWithValidCredentials();

    // Verify successful recovery
    await loginPage.waitForLoginRedirect();
    expect(await helpers.auth.isLoggedIn()).toBe(true);
  });

  test('Performance Monitoring', async ({ page }) => {
    if (!config.shouldMonitorPerformance()) {
      test.skip('Performance monitoring is disabled');
    }

    // Measure page load performance
    const performance = await helpers.measurePagePerformance('dashboard-load', async () => {
      await helpers.auth.loginAsUser('student');
      await pageManager.goToDashboard();
    });

    // Verify performance meets thresholds
    const thresholds = config.getPerformanceConfig().thresholds;
    expect(performance.duration).toBeLessThan(thresholds.loadTime);
    expect(performance.success).toBe(true);

    console.log('Performance metrics:', performance);
  });

  test('API Integration Testing', async ({ page }) => {
    // Login to get auth token
    await helpers.auth.loginAsUser('student');

    // Test API endpoints through helper
    const userProgress = await helpers.api.getUserProgress();
    expect(userProgress).toBeDefined();

    const modules = await helpers.api.getModuleList();
    expect(Array.isArray(modules.data || modules)).toBe(true);

    // Test creating and cleaning up test data
    if (config.shouldCleanupTestData()) {
      await helpers.api.cleanupTestData();
    }
  });

  test('Visual Regression Testing', async ({ page }) => {
    // Login and navigate to a stable page
    await helpers.auth.loginAsUser('student');
    const dashboardPage = await pageManager.goToDashboard();

    // Wait for page to stabilize
    await helpers.wait.waitForLoadingToFinish();
    await helpers.wait.waitForPageLoad();

    // Take baseline screenshot
    const baselineExists = await helpers.screenshot.compareWithBaseline('dashboard', {
      fullPage: true,
      threshold: 0.05
    });

    expect(baselineExists).toBe(true);

    // Test responsive design
    const responsiveScreenshots = await helpers.screenshot.takeResponsiveScreenshots('dashboard');
    expect(responsiveScreenshots.length).toBeGreaterThan(0);
  });

  test('Form Validation and Submission', async ({ page }) => {
    const loginPage = await pageManager.goToLogin();

    // Test form validation
    await loginPage.expectEmailToBeRequired();
    await loginPage.expectPasswordToBeRequired();
    await loginPage.expectValidEmailFormat();

    // Test successful form submission
    await loginPage.fillDemoCredentials();
    await loginPage.submitLoginForm();
    
    await loginPage.waitForLoginRedirect();
    expect(await helpers.auth.isLoggedIn()).toBe(true);
  });

  test('Browser and Context Management', async ({ page, context }) => {
    // Test multiple contexts (incognito mode)
    const incognitoContext = await helpers.browser.createIncognitoContext();
    const incognitoPage = await helpers.browser.createPage('incognito', 'main');

    // Login in main context
    await helpers.auth.loginAsUser('student');

    // Verify incognito context is not logged in
    const incognitoHelpers = new E2EHelpers(incognitoPage);
    expect(await incognitoHelpers.auth.isLoggedIn()).toBe(false);

    // Cleanup
    await helpers.browser.closeContext('incognito');
  });
});

test.describe('Advanced E2E Scenarios', () => {
  test('Complete User Journey', async ({ page, context }) => {
    const pageManager = new PageObjectManager(page);
    const helpers = new E2EHelpers(page, context);

    // Step 1: Register new user
    const testUser = TestUsersFixture.getInstance().generateRandomUser('student');
    
    // Note: This would require a registration page object
    // await pageManager.goToRegister();
    // await register with testUser data

    // Step 2: Login
    await pageManager.goToLogin();
    await helpers.auth.login(testUser.email, testUser.password);

    // Step 3: Complete onboarding (if exists)
    // Navigate through any onboarding flow

    // Step 4: Explore dashboard
    const dashboardPage = await pageManager.goToDashboard();
    await expect(dashboardPage.welcomeMessage).toBeVisible();

    // Step 5: Start learning journey
    await dashboardPage.exploreModules();
    
    // Step 6: Complete a module
    const modulePage = pageManager.modulePage;
    // Navigate through module content
    // Take quizzes
    // Complete module

    // Step 7: Check progress
    await pageManager.goToDashboard();
    await dashboardPage.viewProgress();

    // Step 8: Logout
    await helpers.auth.logout();

    // Take final screenshot
    await helpers.screenshot.takeScreenshot('complete-user-journey');
  });
});

// Test configuration examples
test.describe('Configuration-based Testing', () => {
  test('Run tests based on environment', async ({ page }) => {
    const config = TestConfigManager.getInstance();
    
    if (config.isProduction()) {
      // Skip certain tests in production
      test.skip('This test should not run in production');
    }

    if (config.isDevelopment() && config.isDebugMode()) {
      // Extended timeouts for debugging
      test.setTimeout(120000);
    }

    // Regular test logic here
    const helpers = new E2EHelpers(page);
    await helpers.auth.loginAsUser('student');
    
    // Test continues...
  });
});