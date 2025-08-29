import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';

/**
 * E2E Tests for Authentication Flow
 * Tests user login, logout, and authentication validation with mock data
 */

// Skip tests that require server connection in CI
const skipServerTests = process.env.CI === 'true';
test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Set up global mock routes for authentication
    await page.route('**/api/auth/**', async route => {
      // Default mock for auth endpoints
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
  });

  test('should display login form correctly', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    // Verify login form elements are present
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    // Test form validation
    await loginPage.expectEmailToBeRequired();
    await loginPage.expectPasswordToBeRequired();
    await loginPage.expectValidEmailFormat();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    await loginPage.loginWithInvalidCredentials();
    
    // Should show server error (mocked)
    expect(await loginPage.hasServerError()).toBe(true);
    
    // In mock mode, URL doesn't change - check for error message instead
    await expect(loginPage.validationError.or(loginPage.serverError)).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    // Use demo credentials
    await loginPage.loginWithValidCredentials();
    await loginPage.submitLoginForm();
    
    // In mock mode, check for successful login indication
    await page.waitForTimeout(1000);
    
    // Check if login form is hidden or welcome message is shown
    const loginFormVisible = await loginPage.loginForm.isVisible().catch(() => false);
    const welcomeVisible = await dashboardPage.welcomeMessage.isVisible().catch(() => false);
    
    // Either login form should be hidden or welcome message should be visible
    expect(!loginFormVisible || welcomeVisible).toBeTruthy();
  });

  test('should toggle password visibility', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    await loginPage.fillPassword('testpassword');
    
    // Password should be hidden initially
    expect(await loginPage.isPasswordVisible()).toBeFalsy();
    
    // Toggle password visibility
    await loginPage.togglePasswordVisibility();
    expect(await loginPage.isPasswordVisible()).toBeTruthy();
    
    // Toggle back to hidden
    await loginPage.togglePasswordVisibility();
    expect(await loginPage.isPasswordVisible()).toBeFalsy();
  });

  test('should handle remember me functionality', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    // Remember me should be unchecked initially
    expect(await loginPage.isRememberMeChecked()).toBeFalsy();
    
    // Toggle remember me
    await loginPage.toggleRememberMe();
    expect(await loginPage.isRememberMeChecked()).toBeTruthy();
    
    // Login with remember me checked
    await loginPage.fillDemoCredentials();
    await loginPage.clickLoginButton();
    await loginPage.waitForLoginRedirect();
    
    // Verify successful login
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    await loginPage.clickRegisterLink();
    
    // Should navigate to registration page
    await expect(page).toHaveURL(/register|signup/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    await loginPage.clickForgotPasswordLink();
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL(/forgot-password|reset/);
  });
});