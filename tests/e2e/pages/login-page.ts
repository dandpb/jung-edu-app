import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { testSelectors, testPaths, testConfig } from '../fixtures/test-data';

/**
 * Login page object model
 */
export class LoginPage extends BasePage {
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.loginForm = page.locator(testSelectors.loginForm);
    this.emailInput = page.locator(testSelectors.emailInput);
    this.passwordInput = page.locator(testSelectors.passwordInput);
    this.submitButton = page.locator(testSelectors.submitButton);
    this.registerLink = page.locator('[data-testid=\"register-link\"]');
    this.forgotPasswordLink = page.locator('[data-testid=\"forgot-password-link\"]');
    this.rememberMeCheckbox = page.locator('[data-testid=\"remember-me-checkbox\"]');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto(testPaths.login);
    await this.waitForPageLoad();
    await expect(this.loginForm).toBeVisible();
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string, rememberMe = false) {
    await this.goto();
    
    // Fill in credentials
    await this.fillField(testSelectors.emailInput, email);
    await this.fillField(testSelectors.passwordInput, password);
    
    // Set remember me if requested
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    
    // Submit form and wait for navigation
    await this.clickAndWait(testSelectors.submitButton, {
      waitForNavigation: true,
      timeout: testConfig.longTimeout
    });
  }

  /**
   * Login with valid credentials and verify success
   */
  async loginSuccessfully(email: string, password: string) {
    await this.login(email, password);
    
    // Verify redirect to dashboard
    await expect(this.page).toHaveURL(testPaths.dashboard);
    await expect(this.userMenu).toBeVisible();
  }

  /**
   * Attempt login with invalid credentials
   */
  async loginWithInvalidCredentials(email: string, password: string) {
    await this.login(email, password);
    
    // Should remain on login page with error message
    await expect(this.page).toHaveURL(testPaths.login);
    await this.waitForErrorMessage();
  }

  /**
   * Navigate to register page
   */
  async goToRegister() {
    await this.registerLink.click();
    await expect(this.page).toHaveURL(testPaths.register);
  }

  /**
   * Navigate to forgot password page
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
    await expect(this.page).toHaveURL(testPaths.forgotPassword);
  }

  /**
   * Verify login form validation
   */
  async testFormValidation() {
    await this.goto();
    
    // Test empty form submission
    await this.submitButton.click();
    await expect(this.emailInput).toHaveAttribute('required');
    await expect(this.passwordInput).toHaveAttribute('required');
    
    // Test invalid email format
    await this.fillField(testSelectors.emailInput, 'invalid-email');
    await this.submitButton.click();
    // Browser should show validation message for invalid email
  }

  /**
   * Test password visibility toggle
   */
  async testPasswordVisibility() {
    await this.goto();
    
    const passwordToggle = this.page.locator('[data-testid=\"password-toggle\"]');
    if (await passwordToggle.isVisible()) {
      await this.fillField(testSelectors.passwordInput, 'testpassword');
      
      // Password should be hidden initially
      await expect(this.passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle to show password
      await passwordToggle.click();
      await expect(this.passwordInput).toHaveAttribute('type', 'text');
      
      // Click toggle to hide password again
      await passwordToggle.click();
      await expect(this.passwordInput).toHaveAttribute('type', 'password');
    }
  }

  /**
   * Test social login if available
   */
  async testSocialLogin() {
    await this.goto();
    
    const googleLogin = this.page.locator('[data-testid=\"google-login\"]');
    const githubLogin = this.page.locator('[data-testid=\"github-login\"]');
    
    if (await googleLogin.isVisible()) {
      await expect(googleLogin).toBeEnabled();
    }
    
    if (await githubLogin.isVisible()) {
      await expect(githubLogin).toBeEnabled();
    }
  }
}