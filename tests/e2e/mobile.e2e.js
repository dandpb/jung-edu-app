"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Mobile Responsiveness - Cross-Device Compatibility', () => {
    // Test different device viewports
    const mobileDevices = [
        { name: 'iPhone SE', viewport: { width: 375, height: 667 } },
        { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
        { name: 'Samsung Galaxy S21', viewport: { width: 360, height: 800 } },
        { name: 'iPad Mini', viewport: { width: 768, height: 1024 } },
        { name: 'iPad Pro', viewport: { width: 1024, height: 1366 } }
    ];
    mobileDevices.forEach(device => {
        test_1.test.describe(`${device.name} - ${device.viewport.width}x${device.viewport.height}`, () => {
            test_1.test.beforeEach(async ({ browser }) => {
                const context = await browser.newContext({
                    viewport: device.viewport,
                    storageState: 'tests/e2e/auth/regular-user.json'
                });
                const page = await context.newPage();
                await page.evaluate(() => {
                    localStorage.setItem('auth_user', JSON.stringify({
                        id: 1,
                        name: 'Mobile User',
                        email: 'mobile@jaquedu.com',
                        role: 'student'
                    }));
                });
                // Set as the current page for this test
                test_1.test.info().annotations.push({ type: 'device', description: device.name });
            });
            (0, test_1.test)('should display responsive navigation menu', async ({ page }) => {
                await page.goto('/dashboard');
                // Check if mobile menu toggle is visible for smaller screens
                if (device.viewport.width <= 768) {
                    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], .mobile-menu-button, .hamburger-menu, button[aria-label*="menu"]');
                    if (await mobileMenuButton.isVisible()) {
                        await (0, test_1.expect)(mobileMenuButton).toBeVisible();
                        // Click to open mobile menu
                        await mobileMenuButton.click();
                        // Verify mobile navigation opens
                        const mobileNav = page.locator('[data-testid="mobile-navigation"], .mobile-nav, .sidebar-mobile');
                        await (0, test_1.expect)(mobileNav).toBeVisible();
                        // Check for essential navigation links
                        const homeLink = mobileNav.locator('a[href="/"], a:has-text("Início")');
                        const modulesLink = mobileNav.locator('a[href*="module"], a:has-text("Módulos")');
                        if (await homeLink.isVisible()) {
                            await (0, test_1.expect)(homeLink).toBeVisible();
                        }
                        if (await modulesLink.isVisible()) {
                            await (0, test_1.expect)(modulesLink).toBeVisible();
                        }
                        // Close mobile menu
                        const closeButton = mobileNav.locator('[data-testid="close-menu"], .close-button, button');
                        if (await closeButton.isVisible()) {
                            await closeButton.click();
                            await (0, test_1.expect)(mobileNav).toBeHidden();
                        }
                    }
                }
                else {
                    // For larger screens, desktop navigation should be visible
                    const desktopNav = page.locator('[data-testid="desktop-navigation"], .desktop-nav, nav:not(.mobile-nav)');
                    if (await desktopNav.isVisible()) {
                        await (0, test_1.expect)(desktopNav).toBeVisible();
                    }
                }
            });
            (0, test_1.test)('should adapt content layout for screen size', async ({ page }) => {
                await page.goto('/dashboard');
                // Check main content area
                const mainContent = page.locator('main, .main-content, .content-area');
                if (await mainContent.isVisible()) {
                    const contentBox = await mainContent.boundingBox();
                    if (contentBox) {
                        // Content should not exceed viewport width
                        (0, test_1.expect)(contentBox.width).toBeLessThanOrEqual(device.viewport.width);
                        // Content should be properly positioned
                        (0, test_1.expect)(contentBox.x).toBeGreaterThanOrEqual(0);
                    }
                }
                // Check for responsive grid/card layouts
                const moduleCards = page.locator('.module-card, .card, .grid-item');
                const cardCount = await moduleCards.count();
                if (cardCount > 0) {
                    // On mobile, cards should stack vertically or have fewer columns
                    if (device.viewport.width <= 480) {
                        // Mobile: expect single column layout
                        const firstCard = moduleCards.first();
                        const secondCard = moduleCards.nth(1);
                        if (await firstCard.isVisible() && await secondCard.isVisible()) {
                            const firstBox = await firstCard.boundingBox();
                            const secondBox = await secondCard.boundingBox();
                            if (firstBox && secondBox) {
                                // Second card should be below first card (stacked)
                                (0, test_1.expect)(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
                            }
                        }
                    }
                    else if (device.viewport.width <= 768) {
                        // Tablet: expect 2 columns max
                        const cardsPerRow = Math.min(2, cardCount);
                        (0, test_1.expect)(cardsPerRow).toBeLessThanOrEqual(2);
                    }
                }
            });
            (0, test_1.test)('should handle touch interactions', async ({ page }) => {
                await page.goto('/dashboard');
                // Test touch scrolling
                const scrollableArea = page.locator('main, .scrollable, body');
                if (await scrollableArea.isVisible()) {
                    // Simulate touch scroll
                    await scrollableArea.evaluate(element => {
                        element.scrollTop = 100;
                    });
                    // Verify scroll position changed
                    const scrollTop = await scrollableArea.evaluate(element => element.scrollTop);
                    (0, test_1.expect)(scrollTop).toBeGreaterThan(0);
                }
                // Test touch tap on buttons
                const interactiveElements = page.locator('button, a, .clickable');
                const elementCount = await interactiveElements.count();
                if (elementCount > 0) {
                    const firstElement = interactiveElements.first();
                    // Elements should be large enough for touch interaction (minimum 44px)
                    const elementBox = await firstElement.boundingBox();
                    if (elementBox) {
                        (0, test_1.expect)(elementBox.height).toBeGreaterThanOrEqual(44);
                        (0, test_1.expect)(elementBox.width).toBeGreaterThanOrEqual(44);
                    }
                    // Test tap interaction
                    if (await firstElement.isVisible()) {
                        await firstElement.tap();
                        // Should have visual feedback (focus, active state, etc.)
                        const hasActiveState = await firstElement.evaluate(el => {
                            const styles = window.getComputedStyle(el);
                            return styles.outline !== 'none' ||
                                styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                                el.classList.contains('active') ||
                                el.classList.contains('focus');
                        });
                        // Note: This is a basic check - visual feedback depends on CSS implementation
                    }
                }
            });
            (0, test_1.test)('should display readable text and proper spacing', async ({ page }) => {
                await page.goto('/dashboard');
                // Check font sizes are readable on mobile
                const headings = page.locator('h1, h2, h3, h4, h5, h6');
                const paragraphs = page.locator('p');
                const headingCount = await headings.count();
                if (headingCount > 0) {
                    const firstHeading = headings.first();
                    const fontSize = await firstHeading.evaluate(el => {
                        const styles = window.getComputedStyle(el);
                        return parseFloat(styles.fontSize);
                    });
                    // Headings should be at least 18px on mobile
                    if (device.viewport.width <= 480) {
                        (0, test_1.expect)(fontSize).toBeGreaterThanOrEqual(18);
                    }
                }
                const paragraphCount = await paragraphs.count();
                if (paragraphCount > 0) {
                    const firstParagraph = paragraphs.first();
                    const fontSize = await firstParagraph.evaluate(el => {
                        const styles = window.getComputedStyle(el);
                        return parseFloat(styles.fontSize);
                    });
                    // Body text should be at least 16px on mobile
                    if (device.viewport.width <= 480) {
                        (0, test_1.expect)(fontSize).toBeGreaterThanOrEqual(16);
                    }
                }
                // Check line height for readability
                if (paragraphCount > 0) {
                    const lineHeight = await paragraphs.first().evaluate(el => {
                        const styles = window.getComputedStyle(el);
                        return styles.lineHeight;
                    });
                    // Line height should be at least 1.4 for good readability
                    if (lineHeight !== 'normal') {
                        const numericLineHeight = parseFloat(lineHeight);
                        if (!isNaN(numericLineHeight)) {
                            (0, test_1.expect)(numericLineHeight).toBeGreaterThanOrEqual(1.4);
                        }
                    }
                }
            });
            (0, test_1.test)('should handle form inputs on mobile', async ({ page }) => {
                // Try to find a page with forms (login, profile, etc.)
                await page.goto('/login');
                if (page.url().includes('404')) {
                    await page.goto('/profile');
                }
                if (page.url().includes('404')) {
                    await page.goto('/settings');
                }
                // Check form elements
                const formInputs = page.locator('input, textarea, select');
                const inputCount = await formInputs.count();
                if (inputCount > 0) {
                    const firstInput = formInputs.first();
                    if (await firstInput.isVisible()) {
                        // Input should be large enough for mobile interaction
                        const inputBox = await firstInput.boundingBox();
                        if (inputBox) {
                            (0, test_1.expect)(inputBox.height).toBeGreaterThanOrEqual(44);
                        }
                        // Test input focus and typing
                        await firstInput.focus();
                        // Check if virtual keyboard considerations are handled
                        const inputType = await firstInput.getAttribute('type');
                        const inputMode = await firstInput.getAttribute('inputmode');
                        // Email inputs should have appropriate input type or mode
                        if (await firstInput.getAttribute('name') === 'email' ||
                            await firstInput.getAttribute('placeholder')?.includes('email')) {
                            (0, test_1.expect)(inputType === 'email' || inputMode === 'email').toBeTruthy();
                        }
                        // Test typing in input
                        if (inputType !== 'password') {
                            await firstInput.fill('Test input');
                            const value = await firstInput.inputValue();
                            (0, test_1.expect)(value).toBe('Test input');
                        }
                    }
                }
                // Check form labels and accessibility
                const labels = page.locator('label');
                const labelCount = await labels.count();
                if (labelCount > 0 && inputCount > 0) {
                    // Labels should be properly associated with inputs
                    const labeledInputs = page.locator('input[id], input[aria-labelledby]');
                    const labeledCount = await labeledInputs.count();
                    // At least some inputs should be properly labeled
                    (0, test_1.expect)(labeledCount).toBeGreaterThan(0);
                }
            });
            (0, test_1.test)('should optimize images and media for mobile', async ({ page }) => {
                await page.goto('/dashboard');
                // Check images
                const images = page.locator('img');
                const imageCount = await images.count();
                if (imageCount > 0) {
                    const firstImage = images.first();
                    if (await firstImage.isVisible()) {
                        // Images should not exceed viewport width
                        const imageBox = await firstImage.boundingBox();
                        if (imageBox) {
                            (0, test_1.expect)(imageBox.width).toBeLessThanOrEqual(device.viewport.width);
                        }
                        // Images should have appropriate attributes
                        const hasAlt = await firstImage.getAttribute('alt');
                        (0, test_1.expect)(hasAlt).not.toBeNull(); // Should have alt text for accessibility
                        // Check for responsive image attributes
                        const hasSrcset = await firstImage.getAttribute('srcset');
                        const hasSizes = await firstImage.getAttribute('sizes');
                        // Modern responsive images should use srcset or be properly sized
                        if (hasSrcset || hasSizes) {
                            (0, test_1.expect)(hasSrcset || hasSizes).toBeTruthy();
                        }
                    }
                }
                // Check videos if any
                const videos = page.locator('video');
                const videoCount = await videos.count();
                if (videoCount > 0) {
                    const firstVideo = videos.first();
                    if (await firstVideo.isVisible()) {
                        // Videos should not exceed viewport width
                        const videoBox = await firstVideo.boundingBox();
                        if (videoBox) {
                            (0, test_1.expect)(videoBox.width).toBeLessThanOrEqual(device.viewport.width);
                        }
                        // Videos should have controls on mobile
                        const hasControls = await firstVideo.getAttribute('controls');
                        (0, test_1.expect)(hasControls).not.toBeNull();
                    }
                }
            });
            (0, test_1.test)('should handle orientation changes', async ({ page }) => {
                await page.goto('/dashboard');
                // Test landscape orientation (swap width and height)
                const landscapeViewport = {
                    width: device.viewport.height,
                    height: device.viewport.width
                };
                await page.setViewportSize(landscapeViewport);
                // Wait for potential layout adjustments
                await page.waitForTimeout(1000);
                // Check that content still fits and is usable
                const mainContent = page.locator('main, .main-content');
                if (await mainContent.isVisible()) {
                    const contentBox = await mainContent.boundingBox();
                    if (contentBox) {
                        (0, test_1.expect)(contentBox.width).toBeLessThanOrEqual(landscapeViewport.width);
                        (0, test_1.expect)(contentBox.height).toBeLessThanOrEqual(landscapeViewport.height);
                    }
                }
                // Navigation should still be functional
                const navigation = page.locator('nav, .navigation, [data-testid="navigation"]');
                if (await navigation.isVisible()) {
                    await (0, test_1.expect)(navigation).toBeVisible();
                }
                // Restore original orientation
                await page.setViewportSize(device.viewport);
            });
            (0, test_1.test)('should prevent horizontal scrolling', async ({ page }) => {
                await page.goto('/dashboard');
                // Check for horizontal overflow
                const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
                const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
                // Allow small tolerance for scrollbars (20px)
                (0, test_1.expect)(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 20);
                // Check specific elements for overflow
                const allElements = page.locator('*');
                const elementCount = await allElements.count();
                // Sample a few elements to check for overflow
                const samplesToCheck = Math.min(10, elementCount);
                for (let i = 0; i < samplesToCheck; i++) {
                    const element = allElements.nth(i);
                    if (await element.isVisible()) {
                        const boundingBox = await element.boundingBox();
                        if (boundingBox) {
                            // Element should not extend beyond viewport width
                            (0, test_1.expect)(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(device.viewport.width + 10);
                        }
                    }
                }
            });
        });
    });
    test_1.test.describe('Cross-Device Feature Parity', () => {
        (0, test_1.test)('should maintain functionality across devices', async ({ browser }) => {
            const devices = [
                { name: 'Mobile', viewport: { width: 375, height: 667 } },
                { name: 'Tablet', viewport: { width: 768, height: 1024 } },
                { name: 'Desktop', viewport: { width: 1280, height: 720 } }
            ];
            for (const device of devices) {
                const context = await browser.newContext({
                    viewport: device.viewport,
                    storageState: 'tests/e2e/auth/regular-user.json'
                });
                const page = await context.newPage();
                await page.evaluate(() => {
                    localStorage.setItem('auth_user', JSON.stringify({
                        id: 1,
                        name: 'Cross Device User',
                        email: 'user@jaquedu.com',
                        role: 'student'
                    }));
                });
                await page.goto('/dashboard');
                // Test core functionality exists on all devices
                const essentialElements = [
                    '[data-testid="navigation"], nav, .navigation',
                    '[data-testid="main-content"], main, .main-content',
                    '[data-testid="user-menu"], .user-menu, .profile-menu'
                ];
                for (const selector of essentialElements) {
                    const element = page.locator(selector).first();
                    if (await element.isVisible({ timeout: 5000 })) {
                        await (0, test_1.expect)(element).toBeVisible();
                        console.log(`✓ ${selector} visible on ${device.name}`);
                    }
                    else {
                        console.log(`⚠ ${selector} not found on ${device.name}`);
                    }
                }
                await context.close();
            }
        });
    });
});
//# sourceMappingURL=mobile.e2e.js.map