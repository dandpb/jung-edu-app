import { Browser, BrowserContext, Page, devices } from '@playwright/test';

/**
 * Browser Helper
 * Manages browser instances, contexts, and configurations for E2E tests
 */
export class BrowserHelper {
  private browser?: Browser;
  private contexts: Map<string, BrowserContext> = new Map();
  private pages: Map<string, Page> = new Map();

  constructor(browser?: Browser) {
    this.browser = browser;
  }

  // Browser management
  setBrowser(browser: Browser): void {
    this.browser = browser;
  }

  getBrowser(): Browser {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    return this.browser;
  }

  // Context management
  async createContext(
    name: string = 'default',
    options: {
      viewport?: { width: number; height: number };
      userAgent?: string;
      locale?: string;
      timezone?: string;
      permissions?: string[];
      geolocation?: { latitude: number; longitude: number };
      extraHTTPHeaders?: Record<string, string>;
      ignoreHTTPSErrors?: boolean;
      offline?: boolean;
      storageStatePath?: string;
    } = {}
  ): Promise<BrowserContext> {
    const browser = this.getBrowser();
    
    const context = await browser.newContext({
      viewport: options.viewport || { width: 1920, height: 1080 },
      userAgent: options.userAgent,
      locale: options.locale || 'en-US',
      timezoneId: options.timezone,
      permissions: options.permissions,
      geolocation: options.geolocation,
      extraHTTPHeaders: options.extraHTTPHeaders,
      ignoreHTTPSErrors: options.ignoreHTTPSErrors || false,
      offline: options.offline || false,
      storageState: options.storageStatePath
    });
    
    this.contexts.set(name, context);
    return context;
  }

  async createMobileContext(
    name: string = 'mobile',
    deviceName: string = 'iPhone 12'
  ): Promise<BrowserContext> {
    const browser = this.getBrowser();
    const device = devices[deviceName];
    
    if (!device) {
      throw new Error(`Device ${deviceName} not found`);
    }
    
    const context = await browser.newContext(device);
    this.contexts.set(name, context);
    return context;
  }

  async createTabletContext(
    name: string = 'tablet',
    deviceName: string = 'iPad Pro'
  ): Promise<BrowserContext> {
    const browser = this.getBrowser();
    const device = devices[deviceName];
    
    if (!device) {
      throw new Error(`Device ${deviceName} not found`);
    }
    
    const context = await browser.newContext(device);
    this.contexts.set(name, context);
    return context;
  }

  async createIncognitoContext(name: string = 'incognito'): Promise<BrowserContext> {
    const browser = this.getBrowser();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      // Incognito-like settings
      storageState: undefined,
      permissions: [],
      extraHTTPHeaders: {
        'DNT': '1' // Do Not Track
      }
    });
    
    this.contexts.set(name, context);
    return context;
  }

  getContext(name: string = 'default'): BrowserContext {
    const context = this.contexts.get(name);
    if (!context) {
      throw new Error(`Context '${name}' not found`);
    }
    return context;
  }

  async closeContext(name: string): Promise<void> {
    const context = this.contexts.get(name);
    if (context) {
      await context.close();
      this.contexts.delete(name);
    }
  }

  async closeAllContexts(): Promise<void> {
    const closePromises = Array.from(this.contexts.values()).map(context => context.close());
    await Promise.all(closePromises);
    this.contexts.clear();
    this.pages.clear();
  }

  // Page management
  async createPage(
    contextName: string = 'default',
    pageName: string = 'main'
  ): Promise<Page> {
    const context = this.getContext(contextName);
    const page = await context.newPage();
    
    this.pages.set(`${contextName}:${pageName}`, page);
    return page;
  }

  getPage(contextName: string = 'default', pageName: string = 'main'): Page {
    const key = `${contextName}:${pageName}`;
    const page = this.pages.get(key);
    if (!page) {
      throw new Error(`Page '${key}' not found`);
    }
    return page;
  }

  async closePage(contextName: string = 'default', pageName: string = 'main'): Promise<void> {
    const key = `${contextName}:${pageName}`;
    const page = this.pages.get(key);
    if (page) {
      await page.close();
      this.pages.delete(key);
    }
  }

  // Viewport and device emulation
  async setViewport(
    page: Page,
    viewport: { width: number; height: number }
  ): Promise<void> {
    await page.setViewportSize(viewport);
  }

  async emulateDevice(page: Page, deviceName: string): Promise<void> {
    const device = devices[deviceName];
    if (!device) {
      throw new Error(`Device ${deviceName} not found`);
    }
    
    await page.setViewportSize(device.viewport);
    await page.setUserAgent(device.userAgent);
  }

  // Network and performance
  async enableNetworkLogging(context: BrowserContext): Promise<void> {
    context.on('request', request => {
      console.log(`→ ${request.method()} ${request.url()}`);
    });
    
    context.on('response', response => {
      console.log(`← ${response.status()} ${response.url()}`);
    });
  }

  async setNetworkConditions(
    context: BrowserContext,
    conditions: {
      offline?: boolean;
      downloadThroughput?: number;
      uploadThroughput?: number;
      latency?: number;
    }
  ): Promise<void> {
    // Set offline mode
    if (conditions.offline !== undefined) {
      await context.setOffline(conditions.offline);
    }
    
    // Note: Playwright doesn't have built-in network throttling like Puppeteer
    // You would need to implement this using a proxy or network interceptor
    if (conditions.downloadThroughput || conditions.uploadThroughput || conditions.latency) {
      console.warn('Network throttling not implemented - would require proxy setup');
    }
  }

  async interceptRequests(
    context: BrowserContext,
    urlPattern: string | RegExp,
    handler: (route: any, request: any) => Promise<void>
  ): Promise<void> {
    await context.route(urlPattern, handler);
  }

  async mockApiResponse(
    context: BrowserContext,
    urlPattern: string | RegExp,
    mockResponse: {
      status?: number;
      headers?: Record<string, string>;
      body?: string | object;
    }
  ): Promise<void> {
    await context.route(urlPattern, route => {
      route.fulfill({
        status: mockResponse.status || 200,
        headers: mockResponse.headers,
        body: typeof mockResponse.body === 'object' 
          ? JSON.stringify(mockResponse.body) 
          : mockResponse.body
      });
    });
  }

  // Cookie and storage management
  async setCookies(
    context: BrowserContext,
    cookies: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
      expires?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    }>
  ): Promise<void> {
    await context.addCookies(cookies);
  }

  async getCookies(context: BrowserContext, url?: string): Promise<any[]> {
    return await context.cookies(url);
  }

  async clearCookies(context: BrowserContext): Promise<void> {
    await context.clearCookies();
  }

  async setLocalStorage(
    page: Page,
    items: Record<string, string>
  ): Promise<void> {
    await page.evaluate((items) => {
      for (const [key, value] of Object.entries(items)) {
        localStorage.setItem(key, value);
      }
    }, items);
  }

  async getLocalStorage(page: Page): Promise<Record<string, string>> {
    return await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          items[key] = localStorage.getItem(key) || '';
        }
      }
      return items;
    });
  }

  async clearLocalStorage(page: Page): Promise<void> {
    await page.evaluate(() => localStorage.clear());
  }

  async setSessionStorage(
    page: Page,
    items: Record<string, string>
  ): Promise<void> {
    await page.evaluate((items) => {
      for (const [key, value] of Object.entries(items)) {
        sessionStorage.setItem(key, value);
      }
    }, items);
  }

  async clearSessionStorage(page: Page): Promise<void> {
    await page.evaluate(() => sessionStorage.clear());
  }

  // Geolocation and permissions
  async setGeolocation(
    context: BrowserContext,
    latitude: number,
    longitude: number
  ): Promise<void> {
    await context.setGeolocation({ latitude, longitude });
  }

  async grantPermissions(
    context: BrowserContext,
    permissions: string[],
    origin?: string
  ): Promise<void> {
    await context.grantPermissions(permissions, { origin });
  }

  // Media and recording
  async startTracing(
    context: BrowserContext,
    options: {
      screenshots?: boolean;
      snapshots?: boolean;
      sources?: boolean;
    } = {}
  ): Promise<void> {
    await context.tracing.start({
      screenshots: options.screenshots ?? true,
      snapshots: options.snapshots ?? true,
      sources: options.sources ?? true
    });
  }

  async stopTracing(context: BrowserContext, path: string): Promise<void> {
    await context.tracing.stop({ path });
  }

  async startVideoRecording(
    context: BrowserContext,
    options: {
      dir?: string;
      size?: { width: number; height: number };
    } = {}
  ): Promise<void> {
    // Video recording is typically configured at context creation
    // This is a placeholder for video recording management
    console.log('Video recording would be configured at context creation');
  }

  // Debug and development helpers
  async enableDebugMode(context: BrowserContext): Promise<void> {
    // Enable console logging
    context.on('console', msg => {
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });
    
    // Enable error logging
    context.on('pageerror', error => {
      console.error('Page error:', error);
    });
    
    // Enable request/response logging
    await this.enableNetworkLogging(context);
  }

  async waitForPageLoad(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
  }

  async waitForSelector(
    page: Page,
    selector: string,
    timeout: number = 30000
  ): Promise<void> {
    await page.waitForSelector(selector, { timeout });
  }

  // Performance monitoring
  async measurePagePerformance(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });
  }

  // Utility methods
  async takeFullPageScreenshot(page: Page, path: string): Promise<void> {
    await page.screenshot({ path, fullPage: true });
  }

  async injectScript(page: Page, scriptPath: string): Promise<void> {
    await page.addScriptTag({ path: scriptPath });
  }

  async injectCSS(page: Page, cssPath: string): Promise<void> {
    await page.addStyleTag({ path: cssPath });
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.closeAllContexts();
  }
}