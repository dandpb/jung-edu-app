/**
 * Test Environment Setup Helpers
 * Utilities to configure clean test environment without webpack dev server overlay
 */

import { Page } from '@playwright/test';

export class TestEnvSetup {
  
  /**
   * Disable webpack dev server overlay that intercepts clicks
   */
  static async disableWebpackOverlay(page: Page) {
    // Inject script to disable webpack-dev-server overlay
    await page.addInitScript(() => {
      // Disable webpack error overlay
      if (window.__webpack_dev_server__) {
        window.__webpack_dev_server__.socketClose = () => {};
      }
      
      // Disable error overlay iframe
      const style = document.createElement('style');
      style.innerHTML = `
        iframe[src*="webpack-dev-server"] {
          display: none !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
        [data-react-error-overlay] {
          display: none !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
        .react-error-overlay {
          display: none !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
      `;
      document.head.appendChild(style);
      
      // Set test mode flags
      window.localStorage.setItem('test-mode', 'true');
      window.localStorage.setItem('disable-dev-overlay', 'true');
    });
  }
  
  /**
   * Setup clean test environment
   */
  static async setupCleanTestEnv(page: Page) {
    await this.disableWebpackOverlay(page);
    
    // Clear any existing storage (with error handling for blank pages)
    try {
      await page.evaluate(() => {
        if (typeof Storage !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem('test-mode', 'true');
          localStorage.setItem('disable-dev-overlay', 'true');
        }
      });
    } catch (error) {
      // Storage not available on blank page - will be set when navigating to app
      console.log('Storage not available yet, will be set on navigation');
    }
  }
  
  /**
   * Setup mock auth state in localStorage
   */
  static async setupMockAuth(page: Page, userType: 'admin' | 'user' = 'user') {
    const authUser = userType === 'admin' 
      ? {
          id: 'admin-test-user',
          role: 'admin',
          email: 'admin@jaquedu.com',
          username: 'admin',
          name: 'Test Admin',
          permissions: ['manage_users', 'manage_modules', 'manage_content', 'view_analytics']
        }
      : {
          id: 'user-test-user', 
          role: 'user',
          email: 'user@jaquedu.com',
          username: 'testuser',
          name: 'Test User',
          permissions: ['view_content', 'take_quizzes', 'view_progress']
        };
    
    await page.evaluate((user) => {
      localStorage.setItem('test-mode', 'true');
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', `mock_${user.role}_token_${Date.now()}`);
      localStorage.setItem('auth_refresh_token', `mock_${user.role}_refresh_token_${Date.now()}`);
      
      if (user.role === 'user') {
        localStorage.setItem('jungAppProgress', JSON.stringify({
          userId: user.id,
          completedModules: ['intro-psychology'],
          quizScores: { 'intro-psychology': 85 },
          totalTime: 3600,
          lastAccessed: Date.now(),
          notes: [
            { id: '1', moduleId: 'intro-psychology', content: 'Test note', timestamp: Date.now() }
          ]
        }));
      }
    }, authUser);
  }
  
  /**
   * Wait for React app to fully initialize
   */
  static async waitForReactApp(page: Page) {
    await page.waitForFunction(() => {
      return window.React && document.querySelector('[data-testid]');
    }, { timeout: 10000 });
  }
  
  /**
   * Ensure no overlays are blocking interactions
   */
  static async ensureNoOverlays(page: Page) {
    // Remove any error overlays that might be present
    await page.evaluate(() => {
      const overlays = document.querySelectorAll(
        'iframe[src*="webpack-dev-server"], [data-react-error-overlay], .react-error-overlay'
      );
      overlays.forEach(overlay => overlay.remove());
    });
  }
}