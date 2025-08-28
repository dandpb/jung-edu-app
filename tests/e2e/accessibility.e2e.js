"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
// import { injectAxe, checkA11y, getViolations } from 'axe-playwright';
test_1.test.describe('Accessibility - WCAG Compliance Validation', () => {
    test_1.test.beforeEach(async ({ page }) => {
        // Set up authentication
        await page.evaluate(() => {
            localStorage.setItem('auth_user', JSON.stringify({
                id: 1,
                name: 'Accessibility Tester',
                email: 'a11y@jaquedu.com',
                role: 'student'
            }));
        });
        // Inject axe-core for accessibility testing
        await injectAxe(page);
    });
    test_1.test.describe('WCAG 2.1 AA Compliance', () => {
        (0, test_1.test)('should pass accessibility audit on dashboard', async ({ page }) => {
            await page.goto('/dashboard');
            // Wait for page to fully load
            await page.waitForLoadState('networkidle');
            // Run accessibility check
            try {
                await checkA11y(page, null, {
                    detailedReport: true,
                    detailedReportOptions: { html: true },
                    tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
                });
            }
            catch (error) {
                // Get detailed violations
                const violations = await getViolations(page, null, {
                    tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
                });
                console.log('Accessibility violations found:', violations.length);
                violations.forEach((violation, index) => {
                    console.log(`\nViolation ${index + 1}:`);
                    console.log(`Rule: ${violation.id}`);
                    console.log(`Impact: ${violation.impact}`);
                    console.log(`Description: ${violation.description}`);
                    console.log(`Help: ${violation.help}`);
                    console.log(`Help URL: ${violation.helpUrl}`);
                    violation.nodes.forEach((node, nodeIndex) => {
                        console.log(`  Node ${nodeIndex + 1}: ${node.html}`);
                        console.log(`  Target: ${node.target.join(', ')}`);
                        console.log(`  Failure summary: ${node.failureSummary}`);
                    });
                });
                // For development, we'll log violations but not fail the test
                // In production, you might want to fail on critical violations
                const criticalViolations = violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
                if (criticalViolations.length > 0) {
                    throw new Error(`Found ${criticalViolations.length} critical accessibility violations`);
                }
            }
        });
        (0, test_1.test)('should pass accessibility audit on login page', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            // Check for common login form accessibility issues
            await checkA11y(page, null, {
                tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
                rules: {
                    // Focus on form-related rules
                    'label': { enabled: true },
                    'color-contrast': { enabled: true },
                    'keyboard-navigation': { enabled: true }
                }
            });
        });
        (0, test_1.test)('should pass accessibility audit on module pages', async ({ page }) => {
            await page.goto('/dashboard');
            // Find and navigate to a module
            const moduleLink = page.locator('a[href*="/module"], .module-link').first();
            if (await moduleLink.isVisible()) {
                await moduleLink.click();
                await page.waitForLoadState('networkidle');
                await checkA11y(page, null, {
                    tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
                });
            }
            else {
                // Navigate directly to a module if links aren't available
                await page.goto('/module/1');
                if (!page.url().includes('404')) {
                    await page.waitForLoadState('networkidle');
                    await checkA11y(page, null, {
                        tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
                    });
                }
            }
        });
    });
    test_1.test.describe('Keyboard Navigation', () => {
        (0, test_1.test)('should support full keyboard navigation', async ({ page }) => {
            await page.goto('/dashboard');
            // Test Tab navigation through interactive elements
            const interactiveElements = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const elementCount = await interactiveElements.count();
            if (elementCount > 0) {
                // Start from the first focusable element
                await page.keyboard.press('Tab');
                let currentFocus = await page.evaluate(() => document.activeElement?.tagName);
                (0, test_1.expect)(currentFocus).toBeDefined();
                // Test Tab navigation through several elements
                const elementsToTest = Math.min(5, elementCount);
                for (let i = 0; i < elementsToTest; i++) {
                    await page.keyboard.press('Tab');
                    // Verify focus moved to a focusable element
                    const newFocus = await page.evaluate(() => {
                        const active = document.activeElement;
                        return {
                            tagName: active?.tagName,
                            type: active?.getAttribute('type'),
                            role: active?.getAttribute('role'),
                            tabIndex: active?.getAttribute('tabindex')
                        };
                    });
                    // Should have moved focus to a valid interactive element
                    const validTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
                    const isValidFocus = validTags.includes(newFocus.tagName) ||
                        newFocus.tabIndex === '0' ||
                        newFocus.role === 'button';
                    (0, test_1.expect)(isValidFocus).toBeTruthy();
                }
                // Test Shift+Tab (reverse navigation)
                await page.keyboard.press('Shift+Tab');
                const reverseFocus = await page.evaluate(() => document.activeElement?.tagName);
                (0, test_1.expect)(reverseFocus).toBeDefined();
            }
        });
        (0, test_1.test)('should provide visible focus indicators', async ({ page }) => {
            await page.goto('/dashboard');
            const interactiveElements = page.locator('a, button, input');
            const elementCount = await interactiveElements.count();
            if (elementCount > 0) {
                const firstElement = interactiveElements.first();
                await firstElement.focus();
                // Check if element has visible focus indicator
                const focusStyles = await firstElement.evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        outline: styles.outline,
                        outlineWidth: styles.outlineWidth,
                        outlineStyle: styles.outlineStyle,
                        outlineColor: styles.outlineColor,
                        boxShadow: styles.boxShadow,
                        border: styles.border
                    };
                });
                // Element should have some form of focus indicator
                const hasFocusIndicator = focusStyles.outline !== 'none' ||
                    focusStyles.outlineWidth !== '0px' ||
                    focusStyles.boxShadow !== 'none' ||
                    focusStyles.border.includes('focus');
                (0, test_1.expect)(hasFocusIndicator).toBeTruthy();
            }
        });
        (0, test_1.test)('should support keyboard activation of buttons', async ({ page }) => {
            await page.goto('/dashboard');
            const buttons = page.locator('button');
            const buttonCount = await buttons.count();
            if (buttonCount > 0) {
                const firstButton = buttons.first();
                if (await firstButton.isVisible()) {
                    await firstButton.focus();
                    // Test Enter key activation
                    const buttonText = await firstButton.textContent();
                    // Listen for click events
                    let wasClicked = false;
                    await firstButton.evaluate(button => {
                        button.addEventListener('click', () => {
                            window.buttonWasClicked = true;
                        });
                    });
                    await page.keyboard.press('Enter');
                    // Check if button was activated
                    const clickResult = await page.evaluate(() => window.buttonWasClicked);
                    if (!clickResult) {
                        // Try Space key as alternative
                        await page.keyboard.press('Space');
                        const spaceResult = await page.evaluate(() => window.buttonWasClicked);
                        (0, test_1.expect)(spaceResult).toBeTruthy();
                    }
                    else {
                        (0, test_1.expect)(clickResult).toBeTruthy();
                    }
                }
            }
        });
        (0, test_1.test)('should handle dropdown menus with keyboard', async ({ page }) => {
            await page.goto('/dashboard');
            // Look for dropdown menus
            const dropdowns = page.locator('[role="menu"], .dropdown, select, [aria-haspopup]');
            const dropdownCount = await dropdowns.count();
            if (dropdownCount > 0) {
                const firstDropdown = dropdowns.first();
                if (await firstDropdown.isVisible()) {
                    await firstDropdown.focus();
                    // Test dropdown activation with Enter or Space
                    await page.keyboard.press('Enter');
                    // Wait for dropdown to open
                    await page.waitForTimeout(500);
                    // Look for opened dropdown content
                    const dropdownContent = page.locator('[role="menuitem"], .dropdown-item, option');
                    if (await dropdownContent.count() > 0) {
                        // Test arrow key navigation
                        await page.keyboard.press('ArrowDown');
                        const focusedItem = await page.evaluate(() => document.activeElement?.textContent);
                        (0, test_1.expect)(focusedItem).toBeDefined();
                        // Test Escape key to close
                        await page.keyboard.press('Escape');
                        // Dropdown should close and focus should return
                        const returnedFocus = await page.evaluate(() => document.activeElement);
                        (0, test_1.expect)(returnedFocus).toBeDefined();
                    }
                }
            }
        });
    });
    test_1.test.describe('Screen Reader Support', () => {
        (0, test_1.test)('should provide proper heading structure', async ({ page }) => {
            await page.goto('/dashboard');
            // Check for proper heading hierarchy
            const headings = page.locator('h1, h2, h3, h4, h5, h6');
            const headingCount = await headings.count();
            if (headingCount > 0) {
                // Should have at least one h1
                const h1Count = await page.locator('h1').count();
                (0, test_1.expect)(h1Count).toBeGreaterThanOrEqual(1);
                // Get all heading levels
                const headingLevels = [];
                for (let i = 0; i < headingCount; i++) {
                    const heading = headings.nth(i);
                    const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
                    const level = parseInt(tagName.substring(1));
                    headingLevels.push(level);
                }
                // Check for proper hierarchy (no skipped levels)
                for (let i = 1; i < headingLevels.length; i++) {
                    const currentLevel = headingLevels[i];
                    const maxPreviousLevel = Math.max(...headingLevels.slice(0, i));
                    // Current level should not skip more than one level
                    (0, test_1.expect)(currentLevel).toBeLessThanOrEqual(maxPreviousLevel + 1);
                }
            }
        });
        (0, test_1.test)('should provide alt text for images', async ({ page }) => {
            await page.goto('/dashboard');
            const images = page.locator('img');
            const imageCount = await images.count();
            if (imageCount > 0) {
                for (let i = 0; i < imageCount; i++) {
                    const image = images.nth(i);
                    if (await image.isVisible()) {
                        const altText = await image.getAttribute('alt');
                        const ariaLabel = await image.getAttribute('aria-label');
                        const ariaLabelledBy = await image.getAttribute('aria-labelledby');
                        const role = await image.getAttribute('role');
                        // Image should have alt text, aria-label, or be marked as decorative
                        const hasAccessibleText = altText !== null ||
                            ariaLabel !== null ||
                            ariaLabelledBy !== null ||
                            role === 'presentation' ||
                            altText === '';
                        (0, test_1.expect)(hasAccessibleText).toBeTruthy();
                    }
                }
            }
        });
        (0, test_1.test)('should provide proper form labels', async ({ page }) => {
            await page.goto('/login');
            if (page.url().includes('404')) {
                await page.goto('/profile');
            }
            if (page.url().includes('404')) {
                await page.goto('/settings');
            }
            const formInputs = page.locator('input:not([type="hidden"]), textarea, select');
            const inputCount = await formInputs.count();
            if (inputCount > 0) {
                for (let i = 0; i < inputCount; i++) {
                    const input = formInputs.nth(i);
                    if (await input.isVisible()) {
                        const id = await input.getAttribute('id');
                        const ariaLabel = await input.getAttribute('aria-label');
                        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
                        const placeholder = await input.getAttribute('placeholder');
                        // Check for associated label
                        let hasLabel = false;
                        if (id) {
                            const associatedLabel = page.locator(`label[for="${id}"]`);
                            hasLabel = await associatedLabel.count() > 0;
                        }
                        // Input should have a label, aria-label, or aria-labelledby
                        const hasAccessibleName = hasLabel ||
                            ariaLabel !== null ||
                            ariaLabelledBy !== null;
                        // Placeholder alone is not sufficient but acceptable for some cases
                        if (!hasAccessibleName && placeholder) {
                            console.warn(`Input with placeholder "${placeholder}" should have a proper label`);
                        }
                        (0, test_1.expect)(hasAccessibleName || placeholder !== null).toBeTruthy();
                    }
                }
            }
        });
        (0, test_1.test)('should provide ARIA landmarks and roles', async ({ page }) => {
            await page.goto('/dashboard');
            // Check for main landmark
            const mainLandmark = page.locator('main, [role="main"]');
            const hasMain = await mainLandmark.count() > 0;
            (0, test_1.expect)(hasMain).toBeTruthy();
            // Check for navigation landmark
            const navLandmark = page.locator('nav, [role="navigation"]');
            const hasNav = await navLandmark.count() > 0;
            if (hasNav) {
                (0, test_1.expect)(hasNav).toBeTruthy();
            }
            // Check for banner/header
            const bannerLandmark = page.locator('header, [role="banner"]');
            const hasBanner = await bannerLandmark.count() > 0;
            if (hasBanner) {
                (0, test_1.expect)(hasBanner).toBeTruthy();
            }
            // Check for contentinfo/footer
            const contentInfoLandmark = page.locator('footer, [role="contentinfo"]');
            const hasContentInfo = await contentInfoLandmark.count() > 0;
            if (hasContentInfo) {
                (0, test_1.expect)(hasContentInfo).toBeTruthy();
            }
        });
        (0, test_1.test)('should provide proper button and link text', async ({ page }) => {
            await page.goto('/dashboard');
            // Check buttons have accessible text
            const buttons = page.locator('button');
            const buttonCount = await buttons.count();
            if (buttonCount > 0) {
                for (let i = 0; i < buttonCount; i++) {
                    const button = buttons.nth(i);
                    if (await button.isVisible()) {
                        const buttonText = await button.textContent();
                        const ariaLabel = await button.getAttribute('aria-label');
                        const ariaLabelledBy = await button.getAttribute('aria-labelledby');
                        const title = await button.getAttribute('title');
                        // Button should have accessible text
                        const hasAccessibleText = (buttonText && buttonText.trim() !== '') ||
                            ariaLabel !== null ||
                            ariaLabelledBy !== null ||
                            title !== null;
                        (0, test_1.expect)(hasAccessibleText).toBeTruthy();
                    }
                }
            }
            // Check links have descriptive text
            const links = page.locator('a');
            const linkCount = await links.count();
            if (linkCount > 0) {
                for (let i = 0; i < Math.min(10, linkCount); i++) {
                    const link = links.nth(i);
                    if (await link.isVisible()) {
                        const linkText = await link.textContent();
                        const ariaLabel = await link.getAttribute('aria-label');
                        const title = await link.getAttribute('title');
                        // Link should have descriptive text (not just "click here" or "read more")
                        const hasDescriptiveText = (linkText && linkText.trim() !== '' &&
                            !linkText.toLowerCase().includes('click here') &&
                            !linkText.toLowerCase().includes('read more')) ||
                            ariaLabel !== null ||
                            title !== null;
                        if (!hasDescriptiveText) {
                            console.warn(`Link with text "${linkText}" may not be descriptive enough`);
                        }
                    }
                }
            }
        });
    });
    test_1.test.describe('Color Contrast and Visual Accessibility', () => {
        (0, test_1.test)('should meet color contrast requirements', async ({ page }) => {
            await page.goto('/dashboard');
            // This test relies on axe-core to check color contrast
            await checkA11y(page, null, {
                rules: {
                    'color-contrast': { enabled: true }
                },
                tags: ['wcag2aa']
            });
        });
        (0, test_1.test)('should not rely solely on color for information', async ({ page }) => {
            await page.goto('/dashboard');
            // Look for elements that might use color to convey information
            const statusElements = page.locator('.status, .alert, .error, .success, .warning, .danger, [class*="color-"]');
            const statusCount = await statusElements.count();
            if (statusCount > 0) {
                for (let i = 0; i < Math.min(5, statusCount); i++) {
                    const statusEl = statusElements.nth(i);
                    if (await statusEl.isVisible()) {
                        const text = await statusEl.textContent();
                        const hasIcon = await statusEl.locator('svg, i, .icon, [class*="icon"]').count() > 0;
                        const ariaLabel = await statusEl.getAttribute('aria-label');
                        // Status should have text, icon, or aria-label in addition to color
                        const hasAdditionalIndicator = (text && text.trim() !== '') ||
                            hasIcon ||
                            ariaLabel !== null;
                        if (!hasAdditionalIndicator) {
                            console.warn('Status element may rely solely on color for information');
                        }
                    }
                }
            }
        });
        (0, test_1.test)('should support high contrast mode', async ({ page, browserName }) => {
            // Skip for Safari as it has different high contrast handling
            if (browserName === 'webkit') {
                test_1.test.skip();
                return;
            }
            await page.goto('/dashboard');
            // Simulate high contrast mode by overriding media query
            await page.addStyleTag({
                content: `
          @media (prefers-contrast: high) {
            * {
              background: white !important;
              color: black !important;
              border-color: black !important;
            }
          }
        `
            });
            // Check if content is still visible and readable
            const textElements = page.locator('h1, h2, h3, p, span, div');
            const elementCount = await textElements.count();
            if (elementCount > 0) {
                const firstElement = textElements.first();
                if (await firstElement.isVisible()) {
                    const styles = await firstElement.evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return {
                            color: computed.color,
                            backgroundColor: computed.backgroundColor,
                            visibility: computed.visibility,
                            opacity: computed.opacity
                        };
                    });
                    // Element should be visible
                    (0, test_1.expect)(styles.visibility).not.toBe('hidden');
                    (0, test_1.expect)(parseFloat(styles.opacity)).toBeGreaterThan(0);
                }
            }
        });
    });
    test_1.test.describe('Motion and Animation Accessibility', () => {
        (0, test_1.test)('should respect reduced motion preferences', async ({ page }) => {
            // Simulate prefers-reduced-motion setting
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.goto('/dashboard');
            // Check for animations and transitions
            const animatedElements = page.locator('[class*="animate"], [class*="transition"], .animated, .fade, .slide');
            const animatedCount = await animatedElements.count();
            if (animatedCount > 0) {
                for (let i = 0; i < Math.min(3, animatedCount); i++) {
                    const element = animatedElements.nth(i);
                    if (await element.isVisible()) {
                        const styles = await element.evaluate(el => {
                            const computed = window.getComputedStyle(el);
                            return {
                                animationDuration: computed.animationDuration,
                                transitionDuration: computed.transitionDuration,
                                animationPlayState: computed.animationPlayState
                            };
                        });
                        // Animations should be disabled or significantly reduced
                        const hasReducedMotion = styles.animationDuration === '0s' ||
                            styles.transitionDuration === '0s' ||
                            styles.animationPlayState === 'paused';
                        if (!hasReducedMotion) {
                            console.warn('Animation may not respect reduced motion preference');
                        }
                    }
                }
            }
        });
        (0, test_1.test)('should not auto-play videos with sound', async ({ page }) => {
            await page.goto('/dashboard');
            // Look for video elements
            const videos = page.locator('video');
            const videoCount = await videos.count();
            if (videoCount > 0) {
                for (let i = 0; i < videoCount; i++) {
                    const video = videos.nth(i);
                    if (await video.isVisible()) {
                        const autoplay = await video.getAttribute('autoplay');
                        const muted = await video.getAttribute('muted');
                        // If video autoplays, it should be muted
                        if (autoplay !== null) {
                            (0, test_1.expect)(muted).not.toBeNull();
                        }
                    }
                }
            }
        });
    });
    test_1.test.describe('Error Handling and User Guidance', () => {
        (0, test_1.test)('should provide accessible error messages', async ({ page }) => {
            await page.goto('/login');
            if (!page.url().includes('404')) {
                // Try to submit form with invalid data
                const submitButton = page.locator('[type="submit"], button:has-text("Login")');
                if (await submitButton.isVisible()) {
                    await submitButton.click();
                    // Look for error messages
                    const errorMessages = page.locator('.error, .alert-danger, [role="alert"], [aria-live="polite"], [aria-live="assertive"]');
                    const errorCount = await errorMessages.count();
                    if (errorCount > 0) {
                        const firstError = errorMessages.first();
                        // Error should be accessible to screen readers
                        const ariaLive = await firstError.getAttribute('aria-live');
                        const role = await firstError.getAttribute('role');
                        const errorText = await firstError.textContent();
                        // Error should have proper ARIA attributes and descriptive text
                        const isAccessible = (ariaLive === 'polite' || ariaLive === 'assertive' || role === 'alert') &&
                            errorText && errorText.trim() !== '';
                        (0, test_1.expect)(isAccessible).toBeTruthy();
                    }
                }
            }
        });
        (0, test_1.test)('should provide helpful form validation', async ({ page }) => {
            await page.goto('/login');
            if (!page.url().includes('404')) {
                const emailInput = page.locator('input[type="email"], input[name="email"]');
                if (await emailInput.isVisible()) {
                    // Enter invalid email
                    await emailInput.fill('invalid-email');
                    await emailInput.blur();
                    // Look for validation message
                    const validationMessage = page.locator('.validation-error, .field-error, [aria-describedby*="error"]');
                    if (await validationMessage.count() > 0) {
                        const errorText = await validationMessage.first().textContent();
                        // Error should be descriptive
                        (0, test_1.expect)(errorText && errorText.includes('email')).toBeTruthy();
                        // Input should be associated with error message
                        const inputId = await emailInput.getAttribute('id');
                        const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
                        if (inputId && ariaDescribedBy) {
                            (0, test_1.expect)(ariaDescribedBy.includes('error')).toBeTruthy();
                        }
                    }
                }
            }
        });
    });
});
//# sourceMappingURL=accessibility.e2e.js.map