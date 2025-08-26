import { Page, Locator, expect } from '@playwright/test';

/**
 * Wait Helper
 * Provides advanced waiting utilities for E2E tests
 */
export class WaitHelper {
  constructor(private page: Page) {}

  // Element visibility waits
  async waitForElementToBeVisible(
    selector: string, 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.locator(selector).waitFor({ 
      state: 'visible', 
      timeout 
    });
  }

  async waitForElementToBeHidden(
    selector: string, 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.locator(selector).waitFor({ 
      state: 'hidden', 
      timeout 
    });
  }

  async waitForElementToBeAttached(
    selector: string, 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.locator(selector).waitFor({ 
      state: 'attached', 
      timeout 
    });
  }

  async waitForElementToBeDetached(
    selector: string, 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.locator(selector).waitFor({ 
      state: 'detached', 
      timeout 
    });
  }

  // Element state waits
  async waitForElementToBeEnabled(
    selector: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).toBeEnabled({ timeout });
  }

  async waitForElementToBeDisabled(
    selector: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).toBeDisabled({ timeout });
  }

  async waitForElementToBeEditable(
    selector: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).toBeEditable({ timeout });
  }

  async waitForElementToBeChecked(
    selector: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).toBeChecked({ timeout });
  }

  async waitForElementToBeUnchecked(
    selector: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeChecked({ timeout });
  }

  // Text-based waits
  async waitForElementToContainText(
    selector: string, 
    text: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(text, { timeout });
  }

  async waitForElementToHaveText(
    selector: string, 
    text: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveText(text, { timeout });
  }

  async waitForElementTextToChange(
    selector: string, 
    initialText: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).not.toHaveText(initialText, { timeout });
  }

  // Value-based waits
  async waitForElementToHaveValue(
    selector: string, 
    value: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveValue(value, { timeout });
  }

  async waitForElementToHaveAttribute(
    selector: string, 
    attribute: string, 
    value: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveAttribute(attribute, value, { timeout });
  }

  async waitForElementToHaveClass(
    selector: string, 
    className: string, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveClass(new RegExp(className), { timeout });
  }

  // Count-based waits
  async waitForElementCount(
    selector: string, 
    count: number, 
    timeout: number = 30000
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveCount(count, { timeout });
  }

  async waitForMinimumElementCount(
    selector: string, 
    minCount: number, 
    timeout: number = 30000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const count = await this.page.locator(selector).count();
      if (count >= minCount) {
        return;
      }
      await this.page.waitForTimeout(100);
    }
    
    throw new Error(`Expected at least ${minCount} elements matching "${selector}", but found less after ${timeout}ms`);
  }

  async waitForMaximumElementCount(
    selector: string, 
    maxCount: number, 
    timeout: number = 30000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const count = await this.page.locator(selector).count();
      if (count <= maxCount) {
        return;
      }
      await this.page.waitForTimeout(100);
    }
    
    throw new Error(`Expected at most ${maxCount} elements matching "${selector}", but found more after ${timeout}ms`);
  }

  // Network-based waits
  async waitForResponse(
    urlPattern: string | RegExp, 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.waitForResponse(urlPattern, { timeout });
  }

  async waitForRequest(
    urlPattern: string | RegExp, 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.waitForRequest(urlPattern, { timeout });
  }

  async waitForAPICall(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    timeout: number = 30000
  ): Promise<void> {
    await this.page.waitForResponse(
      response => response.url().includes(endpoint) && response.request().method() === method,
      { timeout }
    );
  }

  async waitForSuccessfulAPICall(
    endpoint: string, 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.waitForResponse(
      response => response.url().includes(endpoint) && response.ok(),
      { timeout }
    );
  }

  // Page state waits
  async waitForPageLoad(timeout: number = 30000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async waitForDOMContentLoaded(timeout: number = 30000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout });
  }

  async waitForPageToLoad(timeout: number = 30000): Promise<void> {
    await this.page.waitForLoadState('load', { timeout });
  }

  // URL-based waits
  async waitForURL(
    urlPattern: string | RegExp, 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  async waitForURLToContain(
    urlPart: string, 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.waitForURL(url => url.includes(urlPart), { timeout });
  }

  // Custom condition waits
  async waitForCondition(
    condition: () => Promise<boolean>, 
    timeout: number = 30000,
    pollInterval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.page.waitForTimeout(pollInterval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  async waitForFunction(
    fn: string | (() => unknown), 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.waitForFunction(fn, { timeout });
  }

  // Animation and transition waits
  async waitForAnimation(
    selector: string, 
    timeout: number = 5000
  ): Promise<void> {
    // Wait for CSS animations to complete
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return true;
        
        const computedStyle = getComputedStyle(element);
        return computedStyle.animationPlayState === 'running' ? false : true;
      },
      selector,
      { timeout }
    );
  }

  async waitForTransition(
    selector: string, 
    timeout: number = 5000
  ): Promise<void> {
    // Wait for CSS transitions to complete
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return true;
        
        const computedStyle = getComputedStyle(element);
        return computedStyle.transitionDuration === '0s';
      },
      selector,
      { timeout }
    );
  }

  // Loading state waits
  async waitForLoadingToFinish(
    loadingSelector: string = '[data-testid="loading-spinner"]',
    timeout: number = 30000
  ): Promise<void> {
    try {
      // First check if loading spinner exists
      await this.page.locator(loadingSelector).waitFor({ state: 'visible', timeout: 1000 });
      // Then wait for it to disappear
      await this.page.locator(loadingSelector).waitFor({ state: 'hidden', timeout });
    } catch {
      // Loading spinner might not exist, which is fine
    }
  }

  async waitForFormSubmission(
    formSelector: string = 'form',
    timeout: number = 30000
  ): Promise<void> {
    // Wait for form to be submitted (typically button becomes disabled)
    await this.waitForElementToBeDisabled(`${formSelector} [type="submit"]`, timeout);
  }

  // Scroll-based waits
  async waitForElementToBeInViewport(
    selector: string, 
    timeout: number = 30000
  ): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded({ timeout });
    
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      },
      selector,
      { timeout }
    );
  }

  // Error handling waits
  async waitForNoErrors(
    errorSelector: string = '[data-testid="error-message"]',
    timeout: number = 5000
  ): Promise<void> {
    try {
      await this.page.locator(errorSelector).waitFor({ state: 'hidden', timeout });
    } catch {
      // No error element found, which is good
    }
  }

  async waitForErrorToAppear(
    errorSelector: string = '[data-testid="error-message"]',
    timeout: number = 10000
  ): Promise<void> {
    await this.page.locator(errorSelector).waitFor({ state: 'visible', timeout });
  }

  // File-based waits
  async waitForDownload(timeout: number = 30000): Promise<void> {
    await this.page.waitForEvent('download', { timeout });
  }

  async waitForFileUpload(
    fileInputSelector: string,
    timeout: number = 30000
  ): Promise<void> {
    await this.page.waitForEvent('filechooser', { timeout });
  }

  // Modal and popup waits
  async waitForModal(
    modalSelector: string = '[data-testid="modal"]',
    timeout: number = 10000
  ): Promise<void> {
    await this.page.locator(modalSelector).waitFor({ state: 'visible', timeout });
  }

  async waitForModalToClose(
    modalSelector: string = '[data-testid="modal"]',
    timeout: number = 10000
  ): Promise<void> {
    await this.page.locator(modalSelector).waitFor({ state: 'hidden', timeout });
  }

  // Toast/notification waits
  async waitForToast(
    toastSelector: string = '[data-testid="toast"]',
    timeout: number = 10000
  ): Promise<void> {
    await this.page.locator(toastSelector).waitFor({ state: 'visible', timeout });
  }

  async waitForToastToDisappear(
    toastSelector: string = '[data-testid="toast"]',
    timeout: number = 10000
  ): Promise<void> {
    await this.page.locator(toastSelector).waitFor({ state: 'hidden', timeout });
  }

  // Retry mechanisms
  async retryUntilSuccess<T>(
    action: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await action();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await this.page.waitForTimeout(delay);
        }
      }
    }
    
    throw lastError!;
  }

  async retryWhileCondition(
    action: () => Promise<void>,
    condition: () => Promise<boolean>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      await action();
      
      if (!(await condition())) {
        return;
      }
      
      if (i < maxRetries - 1) {
        await this.page.waitForTimeout(delay);
      }
    }
    
    throw new Error(`Action failed after ${maxRetries} retries`);
  }
}