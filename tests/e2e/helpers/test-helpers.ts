import { Page, Locator, expect } from '@playwright/test';
import { testSelectors, testConfig } from '../fixtures/test-data';

/**
 * Common helper functions for E2E tests
 */

/**
 * Wait for element to be visible and stable
 */
export async function waitForElement(page: Page, selector: string, timeout = testConfig.defaultTimeout) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  return element;
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToDisappear(page: Page, selector: string, timeout = testConfig.defaultTimeout) {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Fill form field with validation
 */
export async function fillFormField(page: Page, selector: string, value: string, options: { 
  validate?: boolean;
  timeout?: number;
} = {}) {
  const { validate = true, timeout = testConfig.defaultTimeout } = options;
  
  const field = await waitForElement(page, selector, timeout);
  await field.clear();
  await field.fill(value);
  
  if (validate) {
    await expect(field).toHaveValue(value);
  }
}

/**
 * Click button and wait for action to complete
 */
export async function clickButton(page: Page, selector: string, options: {
  waitForNavigation?: boolean;
  waitForSelector?: string;
  timeout?: number;
} = {}) {
  const { waitForNavigation = false, waitForSelector, timeout = testConfig.defaultTimeout } = options;
  
  const button = await waitForElement(page, selector, timeout);
  
  if (waitForNavigation) {
    await Promise.all([
      page.waitForNavigation({ timeout }),
      button.click()
    ]);
  } else if (waitForSelector) {
    await Promise.all([
      page.waitForSelector(waitForSelector, { timeout }),
      button.click()
    ]);
  } else {
    await button.click();
  }
}

/**
 * Login helper function
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  
  await fillFormField(page, testSelectors.emailInput, email);
  await fillFormField(page, testSelectors.passwordInput, password);
  
  await clickButton(page, testSelectors.submitButton, {
    waitForNavigation: true,
    timeout: testConfig.longTimeout
  });
  
  // Verify login success
  await expect(page.locator(testSelectors.userMenu)).toBeVisible();
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  await clickButton(page, testSelectors.userMenu);
  await clickButton(page, testSelectors.logoutButton, {
    waitForNavigation: true
  });
  
  // Verify logout success
  await expect(page).toHaveURL('/');
}

/**
 * Navigate to module and wait for content to load
 */
export async function navigateToModule(page: Page, moduleId: string) {
  await page.goto(`/modules/${moduleId}`);
  await waitForElement(page, testSelectors.moduleContent);
}

/**
 * Start a quiz and wait for first question
 */
export async function startQuiz(page: Page, moduleId: string, quizId: string) {
  await page.goto(`/modules/${moduleId}/quiz/${quizId}`);
  await waitForElement(page, testSelectors.quizContainer);
  await waitForElement(page, testSelectors.questionText);
}

/**
 * Answer multiple choice question
 */
export async function answerMultipleChoice(page: Page, optionIndex: number) {
  const options = page.locator(testSelectors.answerOption);
  await options.nth(optionIndex).click();
}

/**
 * Submit quiz and wait for results
 */
export async function submitQuiz(page: Page) {
  await clickButton(page, testSelectors.submitQuiz, {
    waitForSelector: '[data-testid=\"quiz-results\"]',
    timeout: testConfig.longTimeout
  });
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(page: Page, urlPattern: string | RegExp, method = 'GET') {
  return page.waitForResponse(response => {
    const url = response.url();
    const matchesPattern = typeof urlPattern === 'string' 
      ? url.includes(urlPattern)
      : urlPattern.test(url);
    
    return matchesPattern && response.request().method() === method;
  });
}

/**
 * Check for console errors
 */
export async function checkForConsoleErrors(page: Page, options: {
  allowedErrors?: string[];
  timeout?: number;
} = {}) {
  const { allowedErrors = [], timeout = 5000 } = options;
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorText = msg.text();
      const isAllowed = allowedErrors.some(allowed => errorText.includes(allowed));
      if (!isAllowed) {
        errors.push(errorText);
      }
    }
  });
  
  await page.waitForTimeout(timeout);
  
  if (errors.length > 0) {
    console.warn('Console errors detected:', errors);
    return errors;
  }
  
  return [];
}

/**
 * Verify page accessibility
 */
export async function checkAccessibility(page: Page) {
  // Basic accessibility checks
  const missingAltTexts = await page.locator('img:not([alt])').count();
  const missingLabels = await page.locator('input:not([aria-label]):not([aria-labelledby]):not([id])').count();
  
  expect(missingAltTexts).toBe(0);
  expect(missingLabels).toBe(0);
  
  // Check for proper heading hierarchy
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  if (headings.length > 0) {
    const firstHeading = await headings[0].textContent();
    expect(firstHeading).toBeTruthy();
  }
}

/**
 * Mobile viewport helper
 */
export async function setMobileViewport(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
}

/**
 * Desktop viewport helper
 */
export async function setDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
}

/**
 * Simulate slow network
 */
export async function simulateSlowNetwork(page: Page) {
  await page.context().route('**/*', route => {
    // Add 500ms delay to simulate slow network
    setTimeout(() => route.continue(), 500);
  });
}

/**
 * Clear browser storage
 */
export async function clearBrowserStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Wait for element to contain text
 */
export async function waitForText(page: Page, selector: string, text: string, timeout = testConfig.defaultTimeout) {
  await page.waitForSelector(selector, { timeout });
  await expect(page.locator(selector)).toContainText(text, { timeout });
}

/**
 * Scroll to element
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Generate test data for forms
 */
export function generateTestUser() {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `test.${timestamp}@jaqedu.com`,
    password: 'TestPassword123!'
  };
}

/**
 * Cleanup test data
 */
export async function cleanupTestData(page: Page, userEmail?: string) {
  if (!testConfig.cleanupAfterTests) return;
  
  // This would typically call cleanup APIs
  // For now, we'll just clear browser storage
  await clearBrowserStorage(page);
}