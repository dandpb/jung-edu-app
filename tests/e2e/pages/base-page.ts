import { Page, Locator, expect } from '@playwright/test';
import { testSelectors, testConfig } from '../fixtures/test-data';

/**
 * Base page object model with common functionality
 */
export class BasePage {
  readonly page: Page;
  
  // Common elements across all pages
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly mainNavigation: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loadingSpinner = page.locator(testSelectors.loadingSpinner);
    this.errorMessage = page.locator(testSelectors.errorMessage);
    this.successMessage = page.locator(testSelectors.successMessage);
    this.mainNavigation = page.locator(testSelectors.mainNav);
    this.userMenu = page.locator(testSelectors.userMenu);
    this.logoutButton = page.locator(testSelectors.logoutButton);
  }

  /**
   * Navigate to a specific URL
   */
  async goto(url: string) {
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    // Wait for any loading spinners to disappear
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // Ignore if no loading spinner exists
    });
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.userMenu.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    if (await this.isLoggedIn()) {
      await this.userMenu.click();
      await this.logoutButton.click();
      await this.page.waitForURL('/', { timeout: testConfig.defaultTimeout });
    }
  }

  /**
   * Wait for success message
   */
  async waitForSuccessMessage(timeout = testConfig.defaultTimeout) {
    await this.successMessage.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for error message
   */
  async waitForErrorMessage(timeout = testConfig.defaultTimeout) {
    await this.errorMessage.waitFor({ state: 'visible', timeout });
  }

  /**
   * Take screenshot of current page
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  /**
   * Check for accessibility issues
   */
  async checkAccessibility() {
    // Check for images without alt text
    const imagesWithoutAlt = await this.page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);

    // Check for inputs without labels
    const inputsWithoutLabels = await this.page.locator('input:not([aria-label]):not([aria-labelledby]):not([id])').count();
    expect(inputsWithoutLabels).toBe(0);

    // Check for proper heading structure
    const h1Count = await this.page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp, method = 'GET') {
    return this.page.waitForResponse(response => {
      const url = response.url();
      const matchesPattern = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      
      return matchesPattern && response.request().method() === method;
    });
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for element to contain text
   */
  async waitForText(selector: string, text: string, timeout = testConfig.defaultTimeout) {
    await this.page.waitForSelector(selector, { timeout });
    await expect(this.page.locator(selector)).toContainText(text, { timeout });
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector: string, value: string, validate = true) {
    const field = this.page.locator(selector);
    await field.waitFor({ state: 'visible' });
    await field.clear();
    await field.fill(value);
    
    if (validate) {
      await expect(field).toHaveValue(value);
    }
  }

  /**
   * Click element and wait for action
   */
  async clickAndWait(selector: string, options: {
    waitForNavigation?: boolean;
    waitForSelector?: string;
    timeout?: number;
  } = {}) {
    const { waitForNavigation = false, waitForSelector, timeout = testConfig.defaultTimeout } = options;
    
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    
    if (waitForNavigation) {
      await Promise.all([
        this.page.waitForNavigation({ timeout }),
        element.click()
      ]);
    } else if (waitForSelector) {
      await Promise.all([
        this.page.waitForSelector(waitForSelector, { timeout }),
        element.click()
      ]);
    } else {
      await element.click();
    }
  }
}