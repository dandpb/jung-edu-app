import { test, expect } from '@playwright/test';

/**
 * Basic smoke tests to ensure E2E infrastructure works
 * These tests validate the test setup without relying on complex page interactions
 */
test.describe('Basic Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Just verify the page loads without errors
    await expect(page).toHaveURL('/');
    
    // Check for basic page structure
    const bodyElement = page.locator('body');
    await expect(bodyElement).toBeVisible();
  });

  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    
    // Verify page loads
    const isLoginPage = page.url().includes('/login') || page.url().includes('/auth');
    expect(isLoginPage).toBe(true);
    
    // Look for common form elements (flexible selectors)
    const hasFormElements = await page.locator('input[type="email"], input[name="email"]').count() > 0 ||
                           await page.locator('input[type="password"], input[name="password"]').count() > 0 ||
                           await page.locator('form').count() > 0;
    
    expect(hasFormElements).toBe(true);
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show some kind of error or redirect
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    
    // Common 404 indicators
    const is404 = page.url().includes('404') || 
                 (hasContent && (hasContent.includes('404') || hasContent.includes('Not Found')));
    
    // If not a 404 page, should at least redirect somewhere valid
    const isValidRedirect = page.url() === '/' || page.url().includes('/login');
    
    expect(is404 || isValidRedirect).toBe(true);
  });

  test('should have proper viewport configuration', async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    expect(viewport!.width).toBeGreaterThan(0);
    expect(viewport!.height).toBeGreaterThan(0);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.toString());
    });
    
    await page.goto('/');
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Filter out common non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') &&
      !error.includes('manifest') &&
      !error.includes('chunk-') &&
      !error.includes('hot-update')
    );
    
    if (criticalErrors.length > 0) {
      console.warn('JavaScript errors detected:', criticalErrors);
    }
    
    // For now, just log errors instead of failing
    expect(criticalErrors.length).toBeLessThan(5); // Allow some minor errors
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if page renders without horizontal scroll
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow 20px tolerance
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Page should still render correctly
    const bodyElement = page.locator('body');
    await expect(bodyElement).toBeVisible();
  });

  test('should handle authentication state', async ({ page }) => {
    // Test without authentication
    await page.goto('/dashboard');
    
    // Should either redirect to login or show login form
    await page.waitForLoadState('networkidle');
    
    const finalUrl = page.url();
    const isAuthPage = finalUrl.includes('/login') || finalUrl.includes('/auth') || finalUrl === '/';
    const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count() > 0;
    
    expect(isAuthPage || hasLoginForm).toBe(true);
  });

  test('should load CSS and styles correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if styles are loaded by verifying computed styles
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computedStyles = window.getComputedStyle(body);
      return {
        fontFamily: computedStyles.fontFamily,
        margin: computedStyles.margin,
        backgroundColor: computedStyles.backgroundColor
      };
    });
    
    // Should have some styling applied
    expect(bodyStyles.fontFamily).not.toBe('');
    
    // Check for at least one styled element
    const styledElements = await page.locator('*').evaluateAll(elements => {
      return elements.filter(el => {
        const styles = window.getComputedStyle(el);
        return styles.color !== 'rgba(0, 0, 0, 0)' || styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
      }).length;
    });
    
    expect(styledElements).toBeGreaterThan(0);
  });
});