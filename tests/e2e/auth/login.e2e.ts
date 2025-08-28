/**
 * E2E Tests for Authentication Flow
 * 
 * Tests user login, logout, and authentication state management
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';
import { TEST_CONFIG } from '../../../playwright.config.enhanced';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with a clean state
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Navigate to login page
    await loginPage.navigateToLogin();
    
    // Verify login page is loaded
    await expect(page).toHaveTitle(/Login|jaqEdu/);
    await loginPage.expectToBeVisible('[data-testid="login-form"]');

    // Perform login with test user credentials
    await loginPage.login(
      TEST_CONFIG.auth.testUserEmail,
      TEST_CONFIG.auth.testUserPassword
    );

    // Verify successful login
    await loginPage.waitForLoginRedirect();
    await dashboardPage.waitForPageLoad();
    
    // Verify user is on dashboard
    await expect(page).toHaveURL(/dashboard/);
    await dashboardPage.expectToBeVisible('[data-testid="dashboard-grid"]');
    
    // Verify user is logged in
    const isLoggedIn = await dashboardPage.isUserLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigateToLogin();
    
    // Attempt login with invalid credentials
    await loginPage.loginWithInvalidCredentials();

    // Verify error message is displayed
    const hasError = await loginPage.hasServerError();
    expect(hasError).toBe(true);
    
    const errorMessage = await loginPage.getServerError();
    expect(errorMessage).toContain('Invalid');

    // Verify user remains on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should validate required fields', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigateToLogin();

    // Test empty email validation
    await loginPage.fillEmail('');
    await loginPage.fillPassword('somepassword');
    await loginPage.clickLoginButton();
    
    await loginPage.expectEmailToBeRequired();

    // Test empty password validation  
    await loginPage.fillEmail('test@example.com');
    await loginPage.fillPassword('');
    await loginPage.clickLoginButton();
    
    await loginPage.expectPasswordToBeRequired();

    // Test invalid email format
    await loginPage.fillEmail('invalid-email');
    await loginPage.fillPassword('somepassword');
    await loginPage.clickLoginButton();
    
    await loginPage.expectValidEmailFormat();
  });

  test('should toggle password visibility', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigateToLogin();
    await loginPage.fillPassword('testpassword');

    // Password should be hidden initially
    let isVisible = await loginPage.isPasswordVisible();
    expect(isVisible).toBe(false);

    // Toggle password visibility
    await loginPage.togglePasswordVisibility();
    isVisible = await loginPage.isPasswordVisible();
    expect(isVisible).toBe(true);

    // Toggle back to hidden
    await loginPage.togglePasswordVisibility();
    isVisible = await loginPage.isPasswordVisible();
    expect(isVisible).toBe(false);
  });

  test('should handle remember me functionality', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigateToLogin();

    // Remember me should be unchecked by default
    let isChecked = await loginPage.isRememberMeChecked();
    expect(isChecked).toBe(false);

    // Toggle remember me
    await loginPage.toggleRememberMe();
    isChecked = await loginPage.isRememberMeChecked();
    expect(isChecked).toBe(true);
  });

  test('should successfully log out', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // First log in
    await loginPage.navigateToLogin();
    await loginPage.login(
      TEST_CONFIG.auth.testUserEmail,
      TEST_CONFIG.auth.testUserPassword
    );
    
    await dashboardPage.waitForPageLoad();
    
    // Then log out
    await dashboardPage.logout();
    
    // Verify redirect to login page
    await expect(page).toHaveURL(/login/);
    await loginPage.expectToBeVisible('[data-testid="login-form"]');
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/login/);
    
    const loginPage = new LoginPage(page);
    await loginPage.expectToBeVisible('[data-testid="login-form"]');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigateToLogin();
    await loginPage.clickForgotPasswordLink();
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL(/forgot-password|reset/);
  });

  test('should navigate to register page', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigateToLogin();
    await loginPage.clickRegisterLink();
    
    // Should navigate to register page
    await expect(page).toHaveURL(/register|signup/);
  });

  test('@performance should load login page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    
    const loginPage = new LoginPage(page);
    await loginPage.waitForPageLoad();
    await loginPage.expectToBeVisible('[data-testid="login-form"]');
    
    const loadTime = Date.now() - startTime;
    
    // Login page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`Login page loaded in ${loadTime}ms`);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Simulate offline network
    await page.context().setOffline(true);
    
    await loginPage.navigateToLogin();
    await loginPage.login(
      TEST_CONFIG.auth.testUserEmail,
      TEST_CONFIG.auth.testUserPassword
    );

    // Should show network error
    const hasError = await loginPage.hasServerError();
    expect(hasError).toBe(true);

    // Restore network
    await page.context().setOffline(false);
  });

  test('should maintain session across page reloads', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Log in
    await loginPage.navigateToLogin();
    await loginPage.login(
      TEST_CONFIG.auth.testUserEmail,
      TEST_CONFIG.auth.testUserPassword
    );
    
    await dashboardPage.waitForPageLoad();

    // Reload the page
    await page.reload();
    await dashboardPage.waitForPageLoad();

    // Should still be logged in
    const isLoggedIn = await dashboardPage.isUserLoggedIn();
    expect(isLoggedIn).toBe(true);
    
    await expect(page).toHaveURL(/dashboard/);
  });
});