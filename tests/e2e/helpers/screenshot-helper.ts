import { Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Screenshot Helper
 * Manages screenshot capture, comparison, and visual testing utilities
 */
export class ScreenshotHelper {
  private screenshotDir: string;
  private baselineDir: string;
  private actualDir: string;
  private diffDir: string;

  constructor(private page: Page) {
    const testResultsPath = 'tests/e2e/test-results';
    this.screenshotDir = path.join(testResultsPath, 'screenshots');
    this.baselineDir = path.join(testResultsPath, 'visual-baseline');
    this.actualDir = path.join(testResultsPath, 'visual-actual');
    this.diffDir = path.join(testResultsPath, 'visual-diff');
    
    // Ensure directories exist
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    [this.screenshotDir, this.baselineDir, this.actualDir, this.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Basic screenshot methods
  async takeScreenshot(
    name: string, 
    options: {
      fullPage?: boolean;
      clip?: { x: number; y: number; width: number; height: number };
      quality?: number;
      type?: 'png' | 'jpeg';
      animations?: 'disabled' | 'allow';
      caret?: 'hide' | 'initial';
    } = {}
  ): Promise<string> {
    const timestamp = this.getTimestamp();
    const filename = `${name}-${timestamp}.png`;
    const filePath = path.join(this.screenshotDir, filename);
    
    const defaultOptions = {
      fullPage: true,
      animations: 'disabled' as const,
      caret: 'hide' as const,
      type: 'png' as const,
      ...options
    };
    
    await this.page.screenshot({
      path: filePath,
      ...defaultOptions
    });
    
    return filePath;
  }

  async takeElementScreenshot(
    selector: string, 
    name: string,
    options: {
      quality?: number;
      type?: 'png' | 'jpeg';
      animations?: 'disabled' | 'allow';
    } = {}
  ): Promise<string> {
    const timestamp = this.getTimestamp();
    const filename = `${name}-element-${timestamp}.png`;
    const filePath = path.join(this.screenshotDir, filename);
    
    const element = this.page.locator(selector);
    await element.screenshot({
      path: filePath,
      animations: 'disabled',
      type: 'png',
      ...options
    });
    
    return filePath;
  }

  async takeFullPageScreenshot(name: string): Promise<string> {
    return await this.takeScreenshot(name, { fullPage: true });
  }

  async takeViewportScreenshot(name: string): Promise<string> {
    return await this.takeScreenshot(name, { fullPage: false });
  }

  // Visual comparison methods
  async takeBaselineScreenshot(
    name: string,
    options: {
      fullPage?: boolean;
      selector?: string;
      animations?: 'disabled' | 'allow';
    } = {}
  ): Promise<string> {
    const filename = `${name}-baseline.png`;
    const filePath = path.join(this.baselineDir, filename);
    
    if (options.selector) {
      await this.page.locator(options.selector).screenshot({
        path: filePath,
        animations: options.animations || 'disabled'
      });
    } else {
      await this.page.screenshot({
        path: filePath,
        fullPage: options.fullPage || true,
        animations: options.animations || 'disabled'
      });
    }
    
    return filePath;
  }

  async compareWithBaseline(
    name: string,
    options: {
      fullPage?: boolean;
      selector?: string;
      threshold?: number;
      animations?: 'disabled' | 'allow';
    } = {}
  ): Promise<boolean> {
    const actualFilename = `${name}-actual.png`;
    const actualFilePath = path.join(this.actualDir, actualFilename);
    const baselineFilePath = path.join(this.baselineDir, `${name}-baseline.png`);
    
    // Take actual screenshot
    if (options.selector) {
      await this.page.locator(options.selector).screenshot({
        path: actualFilePath,
        animations: options.animations || 'disabled'
      });
    } else {
      await this.page.screenshot({
        path: actualFilePath,
        fullPage: options.fullPage || true,
        animations: options.animations || 'disabled'
      });
    }
    
    // Check if baseline exists
    if (!fs.existsSync(baselineFilePath)) {
      console.warn(`Baseline image not found: ${baselineFilePath}`);
      // Copy actual as baseline for future comparisons
      fs.copyFileSync(actualFilePath, baselineFilePath);
      return true;
    }
    
    // Compare images (simplified comparison - in real scenario, use image comparison library)
    const actualStats = fs.statSync(actualFilePath);
    const baselineStats = fs.statSync(baselineFilePath);
    
    // Basic size comparison
    const sizeDiff = Math.abs(actualStats.size - baselineStats.size) / baselineStats.size;
    const threshold = options.threshold || 0.05; // 5% threshold
    
    return sizeDiff <= threshold;
  }

  // Advanced screenshot methods
  async takeResponsiveScreenshots(
    name: string,
    viewports: Array<{ width: number; height: number; name: string }> = []
  ): Promise<string[]> {
    const defaultViewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1366, height: 768, name: 'laptop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    const viewportsToTest = viewports.length > 0 ? viewports : defaultViewports;
    const screenshots: string[] = [];
    
    for (const viewport of viewportsToTest) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500); // Wait for layout to stabilize
      
      const screenshotPath = await this.takeScreenshot(`${name}-${viewport.name}`);
      screenshots.push(screenshotPath);
    }
    
    return screenshots;
  }

  async takeScrollingScreenshot(
    name: string,
    scrollSelector: string = 'html',
    options: {
      scrollDelay?: number;
      screenshots?: number;
    } = {}
  ): Promise<string[]> {
    const scrollDelay = options.scrollDelay || 1000;
    const numberOfScreenshots = options.screenshots || 5;
    const screenshots: string[] = [];
    
    // Get scroll height
    const scrollHeight = await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      return element ? element.scrollHeight : 0;
    }, scrollSelector);
    
    const scrollStep = scrollHeight / numberOfScreenshots;
    
    for (let i = 0; i < numberOfScreenshots; i++) {
      // Scroll to position
      await this.page.evaluate(
        ({ selector, position }) => {
          const element = document.querySelector(selector);
          if (element) {
            element.scrollTop = position;
          }
        },
        { selector: scrollSelector, position: i * scrollStep }
      );
      
      await this.page.waitForTimeout(scrollDelay);
      
      const screenshotPath = await this.takeScreenshot(`${name}-scroll-${i + 1}`);
      screenshots.push(screenshotPath);
    }
    
    return screenshots;
  }

  // Hover and interaction screenshots
  async takeHoverScreenshot(
    selector: string,
    name: string
  ): Promise<string> {
    await this.page.locator(selector).hover();
    await this.page.waitForTimeout(500); // Wait for hover effects
    
    return await this.takeScreenshot(`${name}-hover`);
  }

  async takeFocusScreenshot(
    selector: string,
    name: string
  ): Promise<string> {
    await this.page.locator(selector).focus();
    await this.page.waitForTimeout(300); // Wait for focus effects
    
    return await this.takeScreenshot(`${name}-focus`);
  }

  async takeBeforeAfterScreenshots(
    name: string,
    action: () => Promise<void>,
    options: {
      delay?: number;
      fullPage?: boolean;
      selector?: string;
    } = {}
  ): Promise<{ before: string; after: string }> {
    const delay = options.delay || 500;
    
    // Take before screenshot
    const before = await this.takeScreenshot(`${name}-before`, options);
    
    // Perform action
    await action();
    
    // Wait for changes to take effect
    await this.page.waitForTimeout(delay);
    
    // Take after screenshot
    const after = await this.takeScreenshot(`${name}-after`, options);
    
    return { before, after };
  }

  // Animation and loading screenshots
  async takeLoadingScreenshot(
    name: string,
    loadingSelector: string = '[data-testid="loading-spinner"]'
  ): Promise<string | null> {
    try {
      // Wait for loading to appear
      await this.page.locator(loadingSelector).waitFor({ state: 'visible', timeout: 5000 });
      
      // Take screenshot while loading
      const screenshot = await this.takeScreenshot(`${name}-loading`);
      
      return screenshot;
    } catch {
      // Loading might be too fast or not present
      return null;
    }
  }

  async takeAnimationScreenshots(
    name: string,
    triggerSelector: string,
    options: {
      duration?: number;
      interval?: number;
      maxScreenshots?: number;
    } = {}
  ): Promise<string[]> {
    const duration = options.duration || 3000;
    const interval = options.interval || 500;
    const maxScreenshots = options.maxScreenshots || 6;
    
    const screenshots: string[] = [];
    
    // Trigger animation
    await this.page.click(triggerSelector);
    
    const startTime = Date.now();
    let screenshotCount = 0;
    
    while (Date.now() - startTime < duration && screenshotCount < maxScreenshots) {
      const screenshot = await this.takeScreenshot(`${name}-animation-${screenshotCount + 1}`);
      screenshots.push(screenshot);
      
      screenshotCount++;
      await this.page.waitForTimeout(interval);
    }
    
    return screenshots;
  }

  // Error and debugging screenshots
  async takeErrorScreenshot(
    errorName: string,
    additionalInfo: string = ''
  ): Promise<string> {
    const timestamp = this.getTimestamp();
    const name = `error-${errorName}-${timestamp}`;
    
    if (additionalInfo) {
      // Add text overlay with error info (simplified)
      console.log(`Error screenshot: ${name} - ${additionalInfo}`);
    }
    
    return await this.takeFullPageScreenshot(name);
  }

  async takeDebugScreenshots(
    testName: string,
    steps: Array<{ name: string; action: () => Promise<void> }>
  ): Promise<string[]> {
    const screenshots: string[] = [];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Take screenshot before step
      const beforeScreenshot = await this.takeScreenshot(
        `${testName}-step-${i + 1}-${step.name}-before`
      );
      screenshots.push(beforeScreenshot);
      
      // Perform step
      await step.action();
      
      // Take screenshot after step
      const afterScreenshot = await this.takeScreenshot(
        `${testName}-step-${i + 1}-${step.name}-after`
      );
      screenshots.push(afterScreenshot);
    }
    
    return screenshots;
  }

  // Utility methods
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  async maskElements(
    selectors: string[],
    maskColor: string = '#FF0000'
  ): Promise<void> {
    for (const selector of selectors) {
      await this.page.addStyleTag({
        content: `
          ${selector} {
            background-color: ${maskColor} !important;
            color: transparent !important;
          }
        `
      });
    }
  }

  async highlightElements(
    selectors: string[],
    highlightColor: string = '#FFFF00'
  ): Promise<void> {
    for (const selector of selectors) {
      await this.page.addStyleTag({
        content: `
          ${selector} {
            outline: 3px solid ${highlightColor} !important;
            outline-offset: 2px !important;
          }
        `
      });
    }
  }

  async removeHighlights(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        * {
          outline: none !important;
        }
      `
    });
  }

  // Screenshot metadata
  async saveScreenshotMetadata(
    screenshotPath: string,
    metadata: {
      testName: string;
      url: string;
      viewport?: { width: number; height: number };
      userAgent?: string;
      timestamp?: string;
      additionalInfo?: Record<string, any>;
    }
  ): Promise<void> {
    const metadataPath = screenshotPath.replace('.png', '.json');
    const fullMetadata = {
      ...metadata,
      timestamp: metadata.timestamp || new Date().toISOString(),
      viewport: metadata.viewport || await this.page.viewportSize(),
      userAgent: metadata.userAgent || await this.page.evaluate(() => navigator.userAgent),
      url: metadata.url || this.page.url()
    };
    
    fs.writeFileSync(metadataPath, JSON.stringify(fullMetadata, null, 2));
  }

  // Cleanup methods
  async cleanupOldScreenshots(daysOld: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    [this.screenshotDir, this.actualDir, this.diffDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });
  }

  async archiveScreenshots(testName: string): Promise<void> {
    const archiveDir = path.join(this.screenshotDir, 'archive', testName);
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    // Move screenshots to archive
    const files = fs.readdirSync(this.screenshotDir);
    files.forEach(file => {
      if (file.startsWith(testName) && file.endsWith('.png')) {
        const sourcePath = path.join(this.screenshotDir, file);
        const destPath = path.join(archiveDir, file);
        fs.renameSync(sourcePath, destPath);
      }
    });
  }
}