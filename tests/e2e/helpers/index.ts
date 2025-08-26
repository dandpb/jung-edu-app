/**
 * E2E Helpers Export
 * Central export point for all E2E testing helpers
 */

export { AuthHelper } from './auth-helper';
export { WaitHelper } from './wait-helper';
export { ScreenshotHelper } from './screenshot-helper';
export { ApiHelper } from './api-helper';
export { BrowserHelper } from './browser-helper';

// Utility class that combines all helpers for easy access
import { Page, BrowserContext } from '@playwright/test';
import { AuthHelper } from './auth-helper';
import { WaitHelper } from './wait-helper';
import { ScreenshotHelper } from './screenshot-helper';
import { ApiHelper } from './api-helper';
import { BrowserHelper } from './browser-helper';

/**
 * Combined Helpers Manager
 * Provides easy access to all helper utilities
 */
export class E2EHelpers {
  public auth: AuthHelper;
  public wait: WaitHelper;
  public screenshot: ScreenshotHelper;
  public api: ApiHelper;
  public browser: BrowserHelper;

  constructor(page: Page, browserContext?: BrowserContext) {
    this.auth = new AuthHelper(page);
    this.wait = new WaitHelper(page);
    this.screenshot = new ScreenshotHelper(page);
    this.api = new ApiHelper(page);
    
    // Browser helper needs the browser context, not just page
    if (browserContext) {
      this.browser = new BrowserHelper();
      this.browser.setBrowser(browserContext.browser()!);
    } else {
      this.browser = new BrowserHelper(page.context().browser()!);
    }
  }

  // Convenience method to initialize all helpers with authentication
  async initializeWithAuth(role: 'admin' | 'teacher' | 'student' = 'student'): Promise<void> {
    await this.auth.loginAsUser(role);
  }

  // Common workflow helpers
  async setupTestSession(options: {
    role?: 'admin' | 'teacher' | 'student';
    takeScreenshot?: boolean;
    screenshotName?: string;
  } = {}): Promise<void> {
    const { role = 'student', takeScreenshot = true, screenshotName = 'session-start' } = options;
    
    await this.auth.loginAsUser(role);
    
    if (takeScreenshot) {
      await this.screenshot.takeScreenshot(screenshotName);
    }
  }

  async cleanupTestSession(options: {
    takeScreenshot?: boolean;
    screenshotName?: string;
    clearAuth?: boolean;
  } = {}): Promise<void> {
    const { takeScreenshot = true, screenshotName = 'session-end', clearAuth = true } = options;
    
    if (takeScreenshot) {
      await this.screenshot.takeScreenshot(screenshotName);
    }
    
    if (clearAuth) {
      await this.auth.logout();
    }
  }

  // Error handling and debugging
  async captureErrorState(errorName: string, additionalInfo: string = ''): Promise<string> {
    const screenshotPath = await this.screenshot.takeErrorScreenshot(errorName, additionalInfo);
    
    // Also log current user state
    const isLoggedIn = await this.auth.isLoggedIn();
    const currentUser = await this.auth.getCurrentUser();
    
    console.error(`Error captured: ${errorName}`, {
      screenshot: screenshotPath,
      isLoggedIn,
      currentUser,
      additionalInfo
    });
    
    return screenshotPath;
  }

  // Performance monitoring
  async measurePagePerformance(actionName: string, action: () => Promise<void>): Promise<any> {
    const startTime = Date.now();
    
    try {
      await action();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Take performance screenshot
      await this.screenshot.takeScreenshot(`${actionName}-performance`);
      
      return {
        actionName,
        duration,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await this.captureErrorState(`${actionName}-error`, error.message);
      
      return {
        actionName,
        duration: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Helper factory functions
export const createAuthHelper = (page: Page): AuthHelper => new AuthHelper(page);
export const createWaitHelper = (page: Page): WaitHelper => new WaitHelper(page);
export const createScreenshotHelper = (page: Page): ScreenshotHelper => new ScreenshotHelper(page);
export const createApiHelper = (page?: Page): ApiHelper => new ApiHelper(page);
export const createBrowserHelper = (browser?: any): BrowserHelper => new BrowserHelper(browser);

// Combined helper factory
export const createE2EHelpers = (page: Page, browserContext?: BrowserContext): E2EHelpers => {
  return new E2EHelpers(page, browserContext);
};