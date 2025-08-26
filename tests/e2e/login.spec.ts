import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/login-page';
import { DashboardPage } from './page-objects/dashboard-page';

/**
 * E2E Tests for Authentication Flow
 * Tests user login, logout, and authentication validation
 */
test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('should display login form correctly', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    // Verify login form elements are present
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    // Test email validation
    await loginPage.clickLoginButton();
    await expect(loginPage.validationError).toBeVisible();
    
    // Test invalid email format
    await loginPage.fillEmail('invalid-email');
    await loginPage.clickLoginButton();
    await expect(loginPage.validationError).toBeVisible();
    
    // Test password validation
    await loginPage.fillEmail('test@example.com');
    await loginPage.fillPassword('');
    await loginPage.clickLoginButton();
    await expect(loginPage.validationError).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    await loginPage.login('invalid@email.com', 'wrongpassword');
    
    // Should show server error
    await expect(loginPage.serverError).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.navigateToLogin();
    
    // Use demo credentials
    await loginPage.fillDemoCredentials();
    await loginPage.clickLoginButton();
    
    // Should redirect to dashboard
    await loginPage.waitForLoginRedirect();
    await expect(page).toHaveURL(/dashboard|\/$/);
    
    // Should show dashboard elements
    await expect(dashboardPage.welcomeMessage).toBeVisible();
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