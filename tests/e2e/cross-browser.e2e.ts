import { test, expect, devices } from '@playwright/test';

test.describe('Cross-Browser Compatibility - Multi-Browser Testing Suite', () => {
  // Browser-specific configurations
  const browserConfigs = {
    chromium: {
      name: 'Chromium',
      features: ['webgl', 'webrtc', 'geolocation', 'notifications'],
      cssSupport: ['grid', 'flexbox', 'customProperties', 'backdrop-filter']
    },
    firefox: {
      name: 'Firefox',
      features: ['webgl', 'webrtc', 'geolocation', 'notifications'],
      cssSupport: ['grid', 'flexbox', 'customProperties', 'backdrop-filter']
    },
    webkit: {
      name: 'Safari/WebKit',
      features: ['webgl', 'geolocation', 'notifications'],
      cssSupport: ['grid', 'flexbox', 'customProperties'],
      limitations: ['backdrop-filter'] // Limited support
    }
  };

  // Test each browser type
  Object.entries(browserConfigs).forEach(([browserType, config]) => {
    test.describe(`${config.name} Browser Tests`, () => {
      test.beforeEach(async ({ page, browserName }) => {
        // Skip if browser doesn't match
        if (browserName !== browserType) {
          test.skip();
          return;
        }

        // Set up authentication
        await page.evaluate(() => {
          localStorage.setItem('auth_user', JSON.stringify({ 
            id: 1, 
            name: 'Cross Browser User', 
            email: 'crossbrowser@jaquedu.com',
            role: 'student'
          }));
        });
      });

      test('should load and display basic page content', async ({ page, browserName }) => {
        if (browserName !== browserType) test.skip();

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Verify page title
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title).not.toBe('');

        // Verify main content areas load
        const mainContent = page.locator('main, .main-content, .content');
        await expect(mainContent.first()).toBeVisible({ timeout: 10000 });

        // Verify navigation is present
        const navigation = page.locator('nav, .navigation, [data-testid="navigation"]');
        await expect(navigation.first()).toBeVisible();

        // Check for essential page elements
        const essentialElements = [
          'h1, h2, h3', // Headings
          'button, a', // Interactive elements
          'img', // Images
        ];

        for (const selector of essentialElements) {
          const elements = page.locator(selector);
          const count = await elements.count();
          expect(count).toBeGreaterThan(0);
        }
      });

      test('should handle JavaScript functionality', async ({ page, browserName }) => {
        if (browserName !== browserType) test.skip();

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Test JavaScript execution
        const jsResult = await page.evaluate(() => {
          return {
            hasLocalStorage: typeof localStorage !== 'undefined',
            hasConsole: typeof console !== 'undefined',
            hasJSON: typeof JSON !== 'undefined',
            hasPromise: typeof Promise !== 'undefined',
            hasFetch: typeof fetch !== 'undefined'
          };
        });

        expect(jsResult.hasLocalStorage).toBeTruthy();
        expect(jsResult.hasConsole).toBeTruthy();
        expect(jsResult.hasJSON).toBeTruthy();
        expect(jsResult.hasPromise).toBeTruthy();
        expect(jsResult.hasFetch).toBeTruthy();

        // Test event handling
        const button = page.locator('button').first();
        if (await button.isVisible()) {
          let clickHandled = false;
          await button.evaluate(btn => {
            btn.addEventListener('click', () => {
              (window as any).buttonClicked = true;
            });
          });

          await button.click();
          
          clickHandled = await page.evaluate(() => (window as any).buttonClicked === true);
          expect(clickHandled).toBeTruthy();
        }
      });

      test('should support CSS features', async ({ page, browserName }) => {
        if (browserName !== browserType) test.skip();

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Test CSS support
        const cssSupport = await page.evaluate(() => {
          const testDiv = document.createElement('div');
          document.body.appendChild(testDiv);
          
          const support = {
            flexbox: false,
            grid: false,
            customProperties: false,
            transforms: false,
            transitions: false,
            backdropFilter: false
          };

          // Test Flexbox
          testDiv.style.display = 'flex';
          support.flexbox = testDiv.style.display === 'flex';

          // Test Grid
          testDiv.style.display = 'grid';
          support.grid = testDiv.style.display === 'grid';

          // Test Custom Properties
          testDiv.style.setProperty('--test-prop', 'test');
          support.customProperties = testDiv.style.getPropertyValue('--test-prop') === 'test';

          // Test Transforms
          testDiv.style.transform = 'rotate(45deg)';
          support.transforms = testDiv.style.transform.includes('rotate');

          // Test Transitions
          testDiv.style.transition = 'all 0.3s ease';
          support.transitions = testDiv.style.transition.includes('0.3s');

          // Test Backdrop Filter
          testDiv.style.backdropFilter = 'blur(10px)';
          support.backdropFilter = testDiv.style.backdropFilter.includes('blur');

          document.body.removeChild(testDiv);
          return support;
        });

        // Verify expected CSS support for this browser
        if (config.cssSupport.includes('flexbox')) {
          expect(cssSupport.flexbox).toBeTruthy();
        }
        if (config.cssSupport.includes('grid')) {
          expect(cssSupport.grid).toBeTruthy();
        }
        if (config.cssSupport.includes('customProperties')) {
          expect(cssSupport.customProperties).toBeTruthy();
        }

        // Check transforms and transitions (should be supported by all modern browsers)
        expect(cssSupport.transforms).toBeTruthy();
        expect(cssSupport.transitions).toBeTruthy();

        // Backdrop filter may have limited support
        if (config.limitations && config.limitations.includes('backdrop-filter')) {
          // Don't assert, just log
          console.log(`${config.name} backdrop-filter support:`, cssSupport.backdropFilter);
        } else if (config.cssSupport.includes('backdrop-filter')) {
          expect(cssSupport.backdropFilter).toBeTruthy();
        }
      });

      test('should handle form inputs correctly', async ({ page, browserName }) => {
        if (browserName !== browserType) test.skip();

        await page.goto('/login');
        
        if (page.url().includes('404')) {
          await page.goto('/profile');
        }
        
        if (page.url().includes('404')) {
          test.skip(); // No forms available
          return;
        }

        await page.waitForLoadState('networkidle');

        // Test different input types
        const inputs = await page.locator('input').all();
        
        for (const input of inputs) {
          if (await input.isVisible()) {
            const inputType = await input.getAttribute('type');
            const inputName = await input.getAttribute('name');
            
            if (inputType === 'email') {
              // Test email input
              await input.fill('test@example.com');
              const value = await input.inputValue();
              expect(value).toBe('test@example.com');
              
              // Test invalid email (browser validation)
              await input.fill('invalid-email');
              const validity = await input.evaluate((el: HTMLInputElement) => el.validity.valid);
              expect(validity).toBeFalsy();
            }
            
            if (inputType === 'password') {
              // Test password input
              await input.fill('testpassword');
              const value = await input.inputValue();
              expect(value).toBe('testpassword');
            }
            
            if (inputType === 'text' || !inputType) {
              // Test text input
              await input.fill('Test text input');
              const value = await input.inputValue();
              expect(value).toBe('Test text input');
            }
          }
        }

        // Test form submission
        const form = page.locator('form').first();
        if (await form.isVisible()) {
          const submitButton = form.locator('button[type="submit"], input[type="submit"]');
          
          if (await submitButton.isVisible()) {
            // Fill required fields first
            const requiredInputs = form.locator('input[required]');
            const requiredCount = await requiredInputs.count();
            
            for (let i = 0; i < requiredCount; i++) {
              const requiredInput = requiredInputs.nth(i);
              const inputType = await requiredInput.getAttribute('type');
              
              if (inputType === 'email') {
                await requiredInput.fill('test@example.com');
              } else if (inputType === 'password') {
                await requiredInput.fill('testpassword123');
              } else {
                await requiredInput.fill('test value');
              }
            }

            // Test form submission
            await submitButton.click();
            
            // Form should either submit or show validation
            await page.waitForTimeout(2000);
            
            // Check if we're still on the same page or redirected
            const currentUrl = page.url();
            expect(currentUrl).toBeDefined();
          }
        }
      });

      test('should render responsive layouts correctly', async ({ page, browserName }) => {
        if (browserName !== browserType) test.skip();

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Test different viewport sizes
        const viewports = [
          { width: 375, height: 667, name: 'mobile' },
          { width: 768, height: 1024, name: 'tablet' },
          { width: 1280, height: 720, name: 'desktop' }
        ];

        for (const viewport of viewports) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.waitForTimeout(1000); // Wait for responsive adjustments

          // Check that content fits viewport
          const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
          const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
          
          // Allow small tolerance for scrollbars
          expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 20);

          // Check for mobile menu on small screens
          if (viewport.width <= 768) {
            const mobileMenu = page.locator('.mobile-menu, .hamburger, [data-testid="mobile-menu"]');
            
            if (await mobileMenu.isVisible()) {
              await mobileMenu.click();
              
              const mobileNav = page.locator('.mobile-nav, .sidebar-mobile, [data-testid="mobile-navigation"]');
              await expect(mobileNav).toBeVisible({ timeout: 5000 });
              
              // Close mobile menu
              const closeButton = mobileNav.locator('.close, [data-testid="close-menu"]');
              if (await closeButton.isVisible()) {
                await closeButton.click();
              } else {
                await mobileMenu.click(); // Toggle close
              }
            }
          }
        }

        // Reset to desktop viewport
        await page.setViewportSize({ width: 1280, height: 720 });
      });

      test('should handle media elements correctly', async ({ page, browserName }) => {
        if (browserName !== browserType) test.skip();

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Test images
        const images = page.locator('img');
        const imageCount = await images.count();
        
        if (imageCount > 0) {
          const firstImage = images.first();
          
          if (await firstImage.isVisible()) {
            // Wait for image to load
            await firstImage.waitFor({ state: 'attached' });
            
            // Check image properties
            const imageProps = await firstImage.evaluate((img: HTMLImageElement) => ({
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              complete: img.complete,
              src: img.src,
              alt: img.alt
            }));

            expect(imageProps.complete).toBeTruthy();
            expect(imageProps.naturalWidth).toBeGreaterThan(0);
            expect(imageProps.naturalHeight).toBeGreaterThan(0);
            expect(imageProps.alt).toBeDefined(); // Should have alt text
          }
        }

        // Test videos (if any)
        const videos = page.locator('video');
        const videoCount = await videos.count();
        
        if (videoCount > 0) {
          const firstVideo = videos.first();
          
          if (await firstVideo.isVisible()) {
            const videoProps = await firstVideo.evaluate((video: HTMLVideoElement) => ({
              readyState: video.readyState,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              duration: video.duration,
              paused: video.paused
            }));

            // Video should be loaded (readyState >= 1)
            expect(videoProps.readyState).toBeGreaterThanOrEqual(1);
            
            if (videoProps.videoWidth > 0) {
              expect(videoProps.videoWidth).toBeGreaterThan(0);
              expect(videoProps.videoHeight).toBeGreaterThan(0);
            }
          }
        }
      });

      test('should handle AJAX requests and fetch API', async ({ page, browserName }) => {
        if (browserName !== browserType) test.skip();

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Test fetch API availability
        const fetchSupport = await page.evaluate(() => {
          return typeof fetch !== 'undefined';
        });
        expect(fetchSupport).toBeTruthy();

        // Test making an API request (if API endpoints are available)
        const apiSupport = await page.evaluate(async () => {
          try {
            // Test with a simple API endpoint (adjust URL as needed)
            const response = await fetch('/api/health', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            return {
              success: true,
              status: response.status,
              headers: response.headers instanceof Headers
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        });

        // If API endpoint exists, it should work properly
        if (apiSupport.success) {
          expect(apiSupport.status).toBeDefined();
          expect(apiSupport.headers).toBeTruthy();
        } else {
          console.log(`API test skipped for ${config.name}:`, apiSupport.error);
        }
      });

      test('should handle local storage and session storage', async ({ page, browserName }) => {
        if (browserName !== browserType) test.skip();

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Test storage APIs
        const storageTest = await page.evaluate(() => {
          const results = {
            localStorage: false,
            sessionStorage: false,
            localStorageWrite: false,
            sessionStorageWrite: false,
            localStorageRead: false,
            sessionStorageRead: false
          };

          // Test availability
          results.localStorage = typeof localStorage !== 'undefined';
          results.sessionStorage = typeof sessionStorage !== 'undefined';

          if (results.localStorage) {
            try {
              localStorage.setItem('test', 'value');
              results.localStorageWrite = true;
              
              const value = localStorage.getItem('test');
              results.localStorageRead = value === 'value';
              
              localStorage.removeItem('test');
            } catch (e) {
              console.log('LocalStorage write/read failed:', e);
            }
          }

          if (results.sessionStorage) {
            try {
              sessionStorage.setItem('test', 'value');
              results.sessionStorageWrite = true;
              
              const value = sessionStorage.getItem('test');
              results.sessionStorageRead = value === 'value';
              
              sessionStorage.removeItem('test');
            } catch (e) {
              console.log('SessionStorage write/read failed:', e);
            }
          }

          return results;
        });

        expect(storageTest.localStorage).toBeTruthy();
        expect(storageTest.sessionStorage).toBeTruthy();
        expect(storageTest.localStorageWrite).toBeTruthy();
        expect(storageTest.sessionStorageWrite).toBeTruthy();
        expect(storageTest.localStorageRead).toBeTruthy();
        expect(storageTest.sessionStorageRead).toBeTruthy();
      });

      test('should handle date and time functionality', async ({ page, browserName }) => {
        if (browserName !== browserType) test.skip();

        await page.goto('/dashboard');
        
        // Test Date object and related functionality
        const dateTest = await page.evaluate(() => {
          const now = new Date();
          const iso = now.toISOString();
          const locale = now.toLocaleDateString();
          const time = now.getTime();
          
          return {
            validDate: !isNaN(now.getTime()),
            hasISOString: typeof now.toISOString === 'function',
            hasLocaleDateString: typeof now.toLocaleDateString === 'function',
            isoFormat: iso.includes('T') && iso.includes('Z'),
            localeFormat: locale.length > 0,
            timestamp: typeof time === 'number' && time > 0
          };
        });

        expect(dateTest.validDate).toBeTruthy();
        expect(dateTest.hasISOString).toBeTruthy();
        expect(dateTest.hasLocaleDateString).toBeTruthy();
        expect(dateTest.isoFormat).toBeTruthy();
        expect(dateTest.localeFormat).toBeTruthy();
        expect(dateTest.timestamp).toBeTruthy();
      });

      test('should handle error scenarios gracefully', async ({ page, browserName }) => {
        if (browserName !== browserType) test.skip();

        // Test network error handling
        await page.route('**/api/**', route => route.abort());
        
        await page.goto('/dashboard');
        await page.waitForTimeout(5000); // Wait for potential error states

        // Check that page doesn't crash
        const title = await page.title();
        expect(title).toBeTruthy();

        // Check that basic navigation still works
        const links = page.locator('a[href]');
        const linkCount = await links.count();
        
        if (linkCount > 0) {
          const firstLink = links.first();
          const href = await firstLink.getAttribute('href');
          expect(href).toBeTruthy();
        }

        // Test JavaScript error handling
        const jsErrorTest = await page.evaluate(() => {
          let errorCaught = false;
          
          try {
            // Intentionally cause an error
            (null as any).someMethod();
          } catch (error) {
            errorCaught = true;
          }
          
          return {
            canCatchErrors: errorCaught,
            hasErrorConstructor: typeof Error !== 'undefined'
          };
        });

        expect(jsErrorTest.canCatchErrors).toBeTruthy();
        expect(jsErrorTest.hasErrorConstructor).toBeTruthy();
      });
    });
  });

  test.describe('Cross-Browser Feature Compatibility', () => {
    test('should maintain consistent functionality across browsers', async ({ browserName }) => {
      const currentConfig = browserConfigs[browserName as keyof typeof browserConfigs];
      
      if (!currentConfig) {
        test.skip();
        return;
      }

      console.log(`Testing ${currentConfig.name} with features:`, currentConfig.features);
      console.log(`CSS Support:`, currentConfig.cssSupport);
      
      if (currentConfig.limitations) {
        console.log(`Known limitations:`, currentConfig.limitations);
      }

      // This test serves as documentation of browser-specific capabilities
      expect(currentConfig.name).toBeDefined();
      expect(currentConfig.features).toBeDefined();
      expect(currentConfig.cssSupport).toBeDefined();
    });

    test('should handle browser-specific polyfills', async ({ page, browserName }) => {
      await page.goto('/dashboard');
      
      // Check for common polyfills that might be needed
      const polyfillStatus = await page.evaluate(() => {
        return {
          promises: typeof Promise !== 'undefined',
          fetch: typeof fetch !== 'undefined',
          objectAssign: typeof Object.assign !== 'undefined',
          arrayIncludes: typeof Array.prototype.includes !== 'undefined',
          stringIncludes: typeof String.prototype.includes !== 'undefined',
          customElements: typeof customElements !== 'undefined',
          webComponents: typeof HTMLElement.prototype.attachShadow !== 'undefined'
        };
      });

      // These should be available in all modern browsers or polyfilled
      expect(polyfillStatus.promises).toBeTruthy();
      expect(polyfillStatus.fetch).toBeTruthy();
      expect(polyfillStatus.objectAssign).toBeTruthy();
      expect(polyfillStatus.arrayIncludes).toBeTruthy();
      expect(polyfillStatus.stringIncludes).toBeTruthy();

      // Log browser-specific capabilities
      console.log(`${browserName} polyfill status:`, polyfillStatus);
    });
  });
});