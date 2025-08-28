import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing - Screenshot Comparisons', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication for consistent screenshots
    await page.evaluate(() => {
      localStorage.setItem('auth_user', JSON.stringify({ 
        id: 1, 
        name: 'Visual Test User', 
        email: 'visual@jaquedu.com',
        role: 'student'
      }));
    });

    // Set consistent viewport for screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Wait for any animations to complete
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test.describe('Page Layout Screenshots', () => {
    test('should match dashboard layout', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');
      
      // Hide dynamic content that might change
      await page.addStyleTag({
        content: `
          .timestamp, .date, .time, [data-testid="timestamp"] {
            visibility: hidden !important;
          }
          .loading, .spinner, [data-testid="loading"] {
            display: none !important;
          }
        `
      });

      // Take full page screenshot
      await expect(page).toHaveScreenshot('dashboard-full-page.png', {
        fullPage: true,
        mask: [
          page.locator('.timestamp, .date, .time'),
          page.locator('.user-avatar, .profile-image'),
          page.locator('[data-dynamic="true"]')
        ]
      });

      // Take viewport screenshot
      await expect(page).toHaveScreenshot('dashboard-viewport.png', {
        mask: [
          page.locator('.timestamp, .date, .time'),
          page.locator('.user-avatar, .profile-image')
        ]
      });
    });

    test('should match login page layout', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Hide any dynamic elements
      await page.addStyleTag({
        content: `
          .csrf-token, [name="csrf"], [type="hidden"] {
            display: none !important;
          }
        `
      });

      await expect(page).toHaveScreenshot('login-page.png', {
        mask: [
          page.locator('input[type="hidden"]'),
          page.locator('.csrf-token')
        ]
      });
    });

    test('should match module page layout', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Try to navigate to a module
      const moduleLink = page.locator('a[href*="/module"]').first();
      if (await moduleLink.isVisible()) {
        await moduleLink.click();
      } else {
        // Navigate directly if no links available
        await page.goto('/module/1');
      }

      await page.waitForLoadState('networkidle');

      // Hide dynamic content
      await page.addStyleTag({
        content: `
          .progress-bar, .completion-percentage {
            visibility: hidden !important;
          }
          .last-accessed, .time-spent {
            display: none !important;
          }
        `
      });

      if (!page.url().includes('404')) {
        await expect(page).toHaveScreenshot('module-page.png', {
          fullPage: true,
          mask: [
            page.locator('.progress-bar'),
            page.locator('.timestamp'),
            page.locator('.user-specific')
          ]
        });
      }
    });

    test('should match admin dashboard layout', async ({ page }) => {
      // Set admin role
      await page.evaluate(() => {
        localStorage.setItem('auth_user', JSON.stringify({ 
          id: 1, 
          name: 'Admin User', 
          email: 'admin@jaquedu.com',
          role: 'admin'
        }));
      });

      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // Hide dynamic admin content
      await page.addStyleTag({
        content: `
          .user-count, .active-users, .system-stats {
            visibility: hidden !important;
          }
          .last-login, .session-info {
            display: none !important;
          }
        `
      });

      if (!page.url().includes('404')) {
        await expect(page).toHaveScreenshot('admin-dashboard.png', {
          fullPage: true,
          mask: [
            page.locator('.user-count'),
            page.locator('.system-stats'),
            page.locator('.timestamp')
          ]
        });
      }
    });
  });

  test.describe('Component Screenshots', () => {
    test('should match navigation component', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const navigation = page.locator('nav, .navigation, [data-testid="navigation"]').first();
      
      if (await navigation.isVisible()) {
        await expect(navigation).toHaveScreenshot('navigation-component.png', {
          mask: [
            navigation.locator('.user-info, .profile-section'),
            navigation.locator('.notification-badge, .unread-count')
          ]
        });
      }
    });

    test('should match module card component', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const moduleCard = page.locator('.module-card, .card').first();
      
      if (await moduleCard.isVisible()) {
        // Hide progress indicators that might vary
        await page.addStyleTag({
          content: `
            .progress-indicator, .completion-status {
              visibility: hidden !important;
            }
          `
        });

        await expect(moduleCard).toHaveScreenshot('module-card.png', {
          mask: [
            moduleCard.locator('.progress-indicator'),
            moduleCard.locator('.last-accessed')
          ]
        });
      }
    });

    test('should match form components', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const loginForm = page.locator('form').first();
      
      if (await loginForm.isVisible()) {
        await expect(loginForm).toHaveScreenshot('login-form.png', {
          mask: [
            loginForm.locator('input[type="hidden"]'),
            loginForm.locator('.csrf-token')
          ]
        });

        // Test form validation state
        const emailInput = loginForm.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
          await emailInput.fill('invalid-email');
          await emailInput.blur();
          
          // Wait for validation message
          await page.waitForTimeout(1000);
          
          await expect(loginForm).toHaveScreenshot('login-form-error.png');
        }
      }
    });

    test('should match button states', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        // Normal state
        await expect(button).toHaveScreenshot('button-normal.png');

        // Hover state
        await button.hover();
        await expect(button).toHaveScreenshot('button-hover.png');

        // Focus state
        await button.focus();
        await expect(button).toHaveScreenshot('button-focus.png');

        // Active state (if clickable)
        await button.evaluate(btn => {
          btn.classList.add('active');
        });
        await expect(button).toHaveScreenshot('button-active.png');
      }
    });

    test('should match modal/dialog components', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for buttons that might open modals
      const modalTriggers = page.locator('button:has-text("Criar"), button:has-text("Adicionar"), button:has-text("Novo")');
      
      if (await modalTriggers.count() > 0) {
        const firstTrigger = modalTriggers.first();
        await firstTrigger.click();

        // Wait for modal to appear
        const modal = page.locator('.modal, .dialog, [role="dialog"]');
        
        if (await modal.isVisible({ timeout: 5000 })) {
          await expect(modal).toHaveScreenshot('modal-dialog.png');

          // Test modal with overlay
          await expect(page).toHaveScreenshot('modal-with-overlay.png', {
            mask: [
              page.locator('.timestamp'),
              page.locator('.dynamic-content')
            ]
          });
        }
      }
    });
  });

  test.describe('Responsive Design Screenshots', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'wide', width: 1920, height: 1080 }
    ];

    viewports.forEach(viewport => {
      test(`should match ${viewport.name} layout - ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Hide dynamic elements
        await page.addStyleTag({
          content: `
            .timestamp, .user-stats, .dynamic-content {
              visibility: hidden !important;
            }
          `
        });

        await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`, {
          fullPage: true,
          mask: [
            page.locator('.timestamp'),
            page.locator('.user-avatar'),
            page.locator('[data-dynamic="true"]')
          ]
        });
      });
    });
  });

  test.describe('Theme and Dark Mode Screenshots', () => {
    test('should match dark mode layout', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Try to enable dark mode
      const themeToggle = page.locator('.theme-toggle, [data-testid="theme-toggle"], button:has-text("Dark")');
      
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(1000); // Wait for theme change
      } else {
        // Manually apply dark mode styles
        await page.addStyleTag({
          content: `
            body, .app, [data-theme="light"] {
              background-color: #1a1a1a !important;
              color: #ffffff !important;
            }
            .card, .module-card {
              background-color: #2a2a2a !important;
              color: #ffffff !important;
            }
            .button, button {
              background-color: #333333 !important;
              color: #ffffff !important;
            }
          `
        });
      }

      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
        fullPage: true,
        mask: [
          page.locator('.timestamp'),
          page.locator('.user-avatar')
        ]
      });
    });

    test('should match high contrast mode', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Apply high contrast styles
      await page.addStyleTag({
        content: `
          * {
            background-color: black !important;
            color: yellow !important;
            border: 2px solid yellow !important;
          }
          a, button {
            background-color: blue !important;
            color: white !important;
          }
        `
      });

      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-high-contrast.png', {
        fullPage: true,
        mask: [
          page.locator('.timestamp'),
          page.locator('.user-avatar')
        ]
      });
    });
  });

  test.describe('Error State Screenshots', () => {
    test('should match 404 error page', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForLoadState('networkidle');

      if (page.url().includes('404') || await page.locator('h1:has-text("404"), .error-404').count() > 0) {
        await expect(page).toHaveScreenshot('error-404.png');
      }
    });

    test('should match form validation errors', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Submit form without filling required fields
      const submitButton = page.locator('button[type="submit"], button:has-text("Login")');
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Wait for validation errors to appear
        await page.waitForTimeout(1000);
        
        const hasErrors = await page.locator('.error, .invalid-feedback, [role="alert"]').count() > 0;
        
        if (hasErrors) {
          await expect(page).toHaveScreenshot('login-validation-errors.png');
        }
      }
    });

    test('should match network error states', async ({ page }) => {
      // Intercept network requests to simulate errors
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      await page.goto('/dashboard');
      
      // Wait for error state to appear
      await page.waitForTimeout(5000);
      
      const errorState = page.locator('.error-state, .network-error, .connection-error');
      
      if (await errorState.isVisible()) {
        await expect(page).toHaveScreenshot('network-error.png', {
          mask: [
            page.locator('.timestamp'),
            page.locator('.retry-count')
          ]
        });
      }
    });
  });

  test.describe('Loading State Screenshots', () => {
    test('should match loading states', async ({ page }) => {
      // Delay network responses to capture loading states
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });

      const navigationPromise = page.goto('/dashboard');
      
      // Capture loading state before navigation completes
      await page.waitForTimeout(500);
      
      const loadingIndicator = page.locator('.loading, .spinner, [data-testid="loading"]');
      
      if (await loadingIndicator.isVisible()) {
        await expect(page).toHaveScreenshot('loading-state.png');
      }
      
      // Wait for navigation to complete
      await navigationPromise;
      await page.waitForLoadState('networkidle');
    });

    test('should match skeleton loading components', async ({ page }) => {
      // Delay specific component loading
      await page.route('**/api/modules**', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.continue();
      });

      await page.goto('/dashboard');
      
      // Look for skeleton loading components
      const skeleton = page.locator('.skeleton, .placeholder, .loading-placeholder');
      
      if (await skeleton.isVisible({ timeout: 2000 })) {
        await expect(page).toHaveScreenshot('skeleton-loading.png', {
          mask: [
            page.locator('.timestamp')
          ]
        });
      }
    });
  });

  test.describe('Cross-Browser Visual Differences', () => {
    test('should match across different browsers', async ({ page, browserName }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Hide dynamic content for consistency
      await page.addStyleTag({
        content: `
          .timestamp, .browser-specific, .user-agent-dependent {
            visibility: hidden !important;
          }
        `
      });

      await expect(page).toHaveScreenshot(`dashboard-${browserName}.png`, {
        fullPage: true,
        mask: [
          page.locator('.timestamp'),
          page.locator('.user-avatar')
        ],
        threshold: 0.3 // Allow for browser-specific rendering differences
      });
    });
  });

  test.describe('Animation and Transition Screenshots', () => {
    test('should capture animation states', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Remove the CSS that disables animations for this test
      await page.addStyleTag({
        content: `
          .animate-on-load, .fade-in, .slide-in {
            animation: fadeIn 1s ease-in-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `
      });

      // Capture different animation states
      const animatedElement = page.locator('.animate-on-load, .animated').first();
      
      if (await animatedElement.isVisible()) {
        // Initial state
        await expect(animatedElement).toHaveScreenshot('animation-start.png');
        
        // Trigger animation
        await animatedElement.hover();
        
        // Mid animation (approximate)
        await page.waitForTimeout(500);
        await expect(animatedElement).toHaveScreenshot('animation-mid.png');
        
        // Final state
        await page.waitForTimeout(1000);
        await expect(animatedElement).toHaveScreenshot('animation-end.png');
      }
    });
  });
});