import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { AuthHelper } from '../helpers/auth-helper';

/**
 * Page Object Model for Login Page
 * Handles all interactions with the login page
 */
export class LoginPage extends BasePage {
  private authHelper: AuthHelper;

  constructor(page: Page) {
    super(page);
    this.authHelper = new AuthHelper(page);
  }

  // Page URL
  readonly url = '/auth/login';

  // Page elements
  get emailInput(): Locator {
    return this.page.locator('[data-testid="email-input"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('[data-testid="password-input"]');
  }

  get loginButton(): Locator {
    return this.page.locator('[data-testid="login-button"]');
  }

  get forgotPasswordLink(): Locator {
    return this.page.locator('[data-testid="forgot-password-link"]');
  }

  get registerLink(): Locator {
    return this.page.locator('[data-testid="register-link"]');
  }

  get rememberMeCheckbox(): Locator {
    return this.page.locator('[data-testid="remember-me-checkbox"]');
  }

  get showPasswordButton(): Locator {
    return this.page.locator('[data-testid="show-password-button"]');
  }

  get loginForm(): Locator {
    return this.page.locator('[data-testid="login-form"]');
  }

  get validationError(): Locator {
    return this.page.locator('[data-testid="validation-error"]');
  }

  get serverError(): Locator {
    return this.page.locator('[data-testid="server-error"]');
  }

  // Page actions
  async navigateToLogin(): Promise<void> {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async toggleRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.click();
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordButton.click();
  }

  async clickLoginButton(): Promise<void> {
    await this.loginButton.click();
  }

  async clickForgotPasswordLink(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  async clickRegisterLink(): Promise<void> {
    await this.registerLink.click();
  }

  async submitLoginForm(): Promise<void> {
    await this.loginForm.submit();
  }

  // Complete login flow
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLoginButton();
    await this.waitForPageLoad();
  }

  async loginWithValidCredentials(): Promise<void> {
    const testUser = await this.authHelper.getTestUser();
    await this.login(testUser.email, testUser.password);
  }

  async loginAsAdmin(): Promise<void> {
    const adminUser = await this.authHelper.getAdminUser();
    await this.login(adminUser.email, adminUser.password);
  }

  async loginWithInvalidCredentials(): Promise<void> {
    await this.login('invalid@email.com', 'wrongpassword');
  }

  // Validation helpers
  async isLoginFormVisible(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="login-form"]');
  }

  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.loginButton.isEnabled();
  }

  async isLoginButtonDisabled(): Promise<boolean> {
    return await this.loginButton.isDisabled();
  }

  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }

  async getPasswordValue(): Promise<string> {
    return await this.passwordInput.inputValue();
  }

  async isRememberMeChecked(): Promise<boolean> {
    return await this.rememberMeCheckbox.isChecked();
  }

  async isPasswordVisible(): Promise<boolean> {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'text';
  }

  async hasValidationError(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="validation-error"]');
  }

  async getValidationError(): Promise<string> {
    if (await this.hasValidationError()) {
      return await this.getElementText('[data-testid="validation-error"]');
    }
    return '';
  }

  async hasServerError(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="server-error"]');
  }

  async getServerError(): Promise<string> {
    if (await this.hasServerError()) {
      return await this.getElementText('[data-testid="server-error"]');
    }
    return '';
  }

  // Form validation checks
  async expectEmailToBeRequired(): Promise<void> {
    await this.fillEmail('');
    await this.clickLoginButton();
    await this.expectToBeVisible('[data-testid="validation-error"]');
  }

  async expectPasswordToBeRequired(): Promise<void> {
    await this.fillPassword('');
    await this.clickLoginButton();
    await this.expectToBeVisible('[data-testid="validation-error"]');
  }

  async expectValidEmailFormat(): Promise<void> {
    await this.fillEmail('invalid-email');
    await this.clickLoginButton();
    await this.expectToBeVisible('[data-testid="validation-error"]');
  }

  // Wait for redirect after successful login
  async waitForLoginRedirect(): Promise<void> {
    await this.page.waitForURL(/dashboard|\/$/);
  }

  // Clear form
  async clearForm(): Promise<void> {
    await this.emailInput.clear();
    await this.passwordInput.clear();
    if (await this.isRememberMeChecked()) {
      await this.toggleRememberMe();
    }
  }

  // Auto-fill demo credentials (for demo/testing purposes)
  async fillDemoCredentials(): Promise<void> {
    await this.fillEmail('demo@jaquedu.com');
    await this.fillPassword('demo123');
  }

  // Social login (if implemented)
  get googleLoginButton(): Locator {
    return this.page.locator('[data-testid="google-login-button"]');
  }

  get githubLoginButton(): Locator {
    return this.page.locator('[data-testid="github-login-button"]');
  }

  async loginWithGoogle(): Promise<void> {
    await this.googleLoginButton.click();
    // Handle OAuth popup if needed
  }

  async loginWithGithub(): Promise<void> {
    await this.githubLoginButton.click();
    // Handle OAuth popup if needed
  }
}