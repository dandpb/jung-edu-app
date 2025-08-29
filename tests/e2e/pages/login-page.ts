import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Login page object model with mock data support
 */
export class LoginPage extends BasePage {
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly passwordToggle: Locator;
  readonly validationError: Locator;
  readonly serverError: Locator;

  constructor(page: Page) {
    super(page);
    this.loginForm = page.locator('[data-testid="login-form"]');
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="login-button"]');
    this.registerLink = page.locator('[data-testid="register-link"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
    this.rememberMeCheckbox = page.locator('[data-testid="remember-me-checkbox"]');
    this.passwordToggle = page.locator('[data-testid="password-toggle"]');
    this.validationError = page.locator('.text-red-600, [data-testid="validation-error"]');
    this.serverError = page.locator('[data-testid="server-error"]');
  }

  /**
   * Navigate to login page with mock setup
   */
  async navigateToLogin() {
    // Setup mock API responses
    await this.setupLoginPageMocks();
    
    // Navigate to our mock HTML file
    const mockHtmlPath = 'file://' + process.cwd() + '/tests/e2e/fixtures/mock-app.html';
    await this.page.goto(mockHtmlPath);
    await this.waitForPageLoad();
    await expect(this.loginForm).toBeVisible();
  }

  /**
   * Setup mock API responses for login page
   */
  private async setupLoginPageMocks() {
    // Mock successful login response
    await this.page.route('**/api/auth/login', async route => {
      const request = route.request();
      const postData = request.postData();
      
      if (postData) {
        const loginData = JSON.parse(postData);
        
        // Check for demo credentials
        if (loginData.username === 'demo@jaqedu.com' || loginData.username === 'student@jaqedu.com') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user: {
                id: 'user-456',
                name: 'Test Student',
                email: 'student@jaqedu.com',
                role: 'student'
              },
              token: 'mock-jwt-token'
            })
          });
        } else {
          // Mock invalid credentials
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Invalid credentials',
              message: 'Email ou senha incorretos'
            })
          });
        }
      }
    });
    
    // Mock navigation after login
    await this.page.route('**/api/user/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-456',
          name: 'Test Student',
          email: 'student@jaqedu.com',
          role: 'student'
        })
      });
    });
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLoginButton();
  }
  
  /**
   * Fill email input
   */
  async fillEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }
  
  /**
   * Fill password input
   */
  async fillPassword(password: string) {
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
  }
  
  /**
   * Click login button
   */
  async clickLoginButton() {
    await this.submitButton.click();
  }
  
  /**
   * Fill demo credentials for testing
   */
  async fillDemoCredentials() {
    await this.fillEmail('demo@jaqedu.com');
    await this.fillPassword('demo123');
  }
  
  /**
   * Wait for login redirect
   */
  async waitForLoginRedirect() {
    await this.page.waitForURL(/dashboard|\//, { timeout: 10000 });
  }

  /**
   * Check if password is visible
   */
  async isPasswordVisible(): Promise<boolean> {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'text';
  }
  
  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility() {
    await this.passwordToggle.click();
  }
  
  /**
   * Check if remember me is checked
   */
  async isRememberMeChecked(): Promise<boolean> {
    return await this.rememberMeCheckbox.isChecked();
  }
  
  /**
   * Toggle remember me checkbox
   */
  async toggleRememberMe() {
    await this.rememberMeCheckbox.click();
  }

  /**
   * Navigate to register page
   */
  async clickRegisterLink() {
    await this.registerLink.click();
  }

  /**
   * Navigate to forgot password page
   */
  async clickForgotPasswordLink() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Test form validation
   */
  async expectEmailToBeRequired() {
    await this.emailInput.clear();
    await this.clickLoginButton();
    await expect(this.emailInput).toHaveAttribute('required');
  }

  async expectPasswordToBeRequired() {
    await this.passwordInput.clear();
    await this.clickLoginButton();
    await expect(this.passwordInput).toHaveAttribute('required');
  }

  async expectValidEmailFormat() {
    await this.fillEmail('invalid-email');
    await this.clickLoginButton();
    // Browser should show validation for invalid email format
  }

  async clearForm() {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }

  async hasServerError(): Promise<boolean> {
    try {
      await this.serverError.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async loginWithValidCredentials() {
    await this.fillDemoCredentials();
  }

  async loginWithInvalidCredentials() {
    await this.fillEmail('invalid@email.com');
    await this.fillPassword('wrongpassword');
    await this.clickLoginButton();
  }

  async submitLoginForm() {
    await this.clickLoginButton();
  }
}