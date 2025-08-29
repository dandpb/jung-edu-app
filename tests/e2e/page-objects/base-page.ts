import { Page, Locator, expect } from '@playwright/test';
import { WaitHelper } from '../helpers/wait-helper';
import { ScreenshotHelper } from '../helpers/screenshot-helper';

/**
 * Base page class that all page objects should extend
 * Provides common functionality and utilities for all pages
 */
export abstract class BasePage {
  protected waitHelper: WaitHelper;
  protected screenshotHelper: ScreenshotHelper;

  constructor(protected page: Page) {
    this.waitHelper = new WaitHelper(page);
    this.screenshotHelper = new ScreenshotHelper(page);
  }

  // Common elements that appear on all pages
  get loadingSpinner(): Locator {
    return this.page.locator('[data-testid="loading-spinner"]');
  }

  get errorMessage(): Locator {
    return this.page.locator('[data-testid="error-message"]');
  }

  get successMessage(): Locator {
    return this.page.locator('[data-testid="success-message"]');
  }

  get languageSwitcher(): Locator {
    return this.page.locator('[data-testid="language-switcher"]');
  }

  get navigation(): Locator {
    return this.page.locator('[data-testid="navigation"]');
  }

  // Common actions
  async goto(path: string = ''): Promise<void> {
    const baseUrl = 'http://localhost:3000';
    const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
    await this.page.goto(fullUrl);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.waitHelper.waitForElementToBeVisible('body');
  }

  async waitForNoLoadingSpinner(timeout: number = 10000): Promise<void> {
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout });
    } catch (error) {
      // Loading spinner might not exist, which is fine
    }
  }

  async clickElement(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await element.click();
  }

  async fillField(selector: string, value: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await element.fill(value);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await element.selectOption(value);
  }

  async getElementText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  async isElementVisible(selector: string): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isElementHidden(selector: string): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'hidden', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async takeScreenshot(name: string): Promise<string> {
    return await this.screenshotHelper.takeScreenshot(name);
  }

  async takeElementScreenshot(selector: string, name: string): Promise<string> {
    return await this.screenshotHelper.takeElementScreenshot(selector, name);
  }

  // Validation helpers
  async expectToBeVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectToBeHidden(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async expectToHaveText(selector: string, text: string): Promise<void> {
    await expect(this.page.locator(selector)).toHaveText(text);
  }

  async expectToContainText(selector: string, text: string): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async expectUrlToContain(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`.*${path}.*`));
  }

  // Language switching
  async switchLanguage(language: 'en' | 'pt-br'): Promise<void> {
    if (await this.isElementVisible('[data-testid="language-switcher"]')) {
      await this.clickElement('[data-testid="language-switcher"]');
      await this.clickElement(`[data-testid="language-option-${language}"]`);
      await this.waitForPageLoad();
    }
  }

  // Error handling
  async hasError(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="error-message"]');
  }

  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return await this.getElementText('[data-testid="error-message"]');
    }
    return '';
  }

  async hasSuccess(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="success-message"]');
  }

  async getSuccessMessage(): Promise<string> {
    if (await this.hasSuccess()) {
      return await this.getElementText('[data-testid="success-message"]');
    }
    return '';
  }

  // Form helpers
  async submitForm(formSelector: string = 'form'): Promise<void> {
    await this.page.locator(formSelector).submit();
  }

  async resetForm(formSelector: string = 'form'): Promise<void> {
    await this.page.locator(`${formSelector} [type="reset"]`).click();
  }

  // Wait for API calls
  async waitForApiCall(urlPattern: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'): Promise<void> {
    await this.page.waitForResponse(response => 
      response.url().includes(urlPattern) && response.request().method() === method
    );
  }

  // Scroll helpers
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }
}