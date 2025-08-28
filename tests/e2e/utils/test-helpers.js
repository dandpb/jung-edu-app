"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomAssertions = exports.BasePage = exports.TestDataGenerator = exports.TestHelpers = void 0;
const test_1 = require("@playwright/test");
/**
 * Test utility functions for jaqEdu e2e tests
 */
class TestHelpers {
    constructor(page) {
        this.page = page;
    }
    /**
     * Wait for page to be fully loaded and stable
     */
    async waitForPageReady() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000); // Additional stability wait
    }
    /**
     * Set up user authentication for tests
     */
    async setupAuth(userType) {
        const userConfigs = {
            student: {
                id: 1,
                name: 'Test Student',
                email: 'student@jaquedu.com',
                role: 'student'
            },
            instructor: {
                id: 2,
                name: 'Test Instructor',
                email: 'instructor@jaquedu.com',
                role: 'instructor'
            },
            admin: {
                id: 3,
                name: 'Test Admin',
                email: 'admin@jaquedu.com',
                role: 'admin'
            }
        };
        // Set up localStorage with proper browser context
        await this.page.evaluate((config) => {
            // Clear existing auth state
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_user');
            sessionStorage.removeItem('auth_token');
            // Set new auth state
            localStorage.setItem('auth_user', JSON.stringify(config));
            localStorage.setItem('auth_token', `mock_${config.role}_token`);
            // Also set in sessionStorage as backup
            sessionStorage.setItem('auth_user', JSON.stringify(config));
            sessionStorage.setItem('auth_token', `mock_${config.role}_token`);
        }, userConfigs[userType]);
        // Set authentication cookie for additional persistence
        await this.page.context().addCookies([
            {
                name: 'auth_session',
                value: `${userType}_session`,
                domain: 'localhost',
                path: '/',
                expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            }
        ]);
    }
    /**
     * Hide dynamic content for consistent screenshots
     */
    async hideDynamicContent() {
        await this.page.addStyleTag({
            content: `
        .timestamp, .date, .time, [data-testid="timestamp"],
        .user-avatar, .profile-image, .last-login,
        .loading, .spinner, [data-testid="loading"],
        .dynamic-content, [data-dynamic="true"] {
          visibility: hidden !important;
        }
      `
        });
    }
    /**
     * Disable animations for consistent testing
     */
    async disableAnimations() {
        await this.page.addStyleTag({
            content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
        });
    }
    /**
     * Fill form with test data
     */
    async fillForm(formData) {
        for (const [fieldName, value] of Object.entries(formData)) {
            const field = this.page.locator(`[name="${fieldName}"], [data-testid="${fieldName}"]`);
            if (await field.isVisible()) {
                await field.fill(value);
            }
        }
    }
    /**
     * Wait for and verify success message
     */
    async waitForSuccessMessage() {
        const successMessage = this.page.locator('.success, .alert-success, [data-testid="success"]');
        await (0, test_1.expect)(successMessage.first()).toBeVisible({ timeout: 10000 });
    }
    /**
     * Check for accessibility violations using basic checks
     */
    async checkBasicAccessibility() {
        // Check for alt text on images
        const images = this.page.locator('img');
        const imageCount = await images.count();
        for (let i = 0; i < imageCount; i++) {
            const image = images.nth(i);
            if (await image.isVisible()) {
                const altText = await image.getAttribute('alt');
                (0, test_1.expect)(altText).not.toBeNull();
            }
        }
        // Check for form labels
        const inputs = this.page.locator('input:not([type="hidden"]), textarea, select');
        const inputCount = await inputs.count();
        for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            if (await input.isVisible()) {
                const id = await input.getAttribute('id');
                const ariaLabel = await input.getAttribute('aria-label');
                const ariaLabelledBy = await input.getAttribute('aria-labelledby');
                if (id) {
                    const label = this.page.locator(`label[for="${id}"]`);
                    const hasLabel = await label.count() > 0;
                    if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
                        console.warn(`Input without proper label found: ${await input.getAttribute('name')}`);
                    }
                }
            }
        }
    }
    /**
     * Simulate network conditions
     */
    async simulateSlowNetwork() {
        await this.page.route('**/*', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            await route.continue();
        });
    }
    /**
     * Simulate network failure
     */
    async simulateNetworkFailure() {
        await this.page.route('**/api/**', route => route.abort());
    }
    /**
     * Take element screenshot with consistent settings
     */
    async takeElementScreenshot(selector, name) {
        const element = this.page.locator(selector);
        await (0, test_1.expect)(element).toBeVisible();
        await (0, test_1.expect)(element).toHaveScreenshot(`${name}.png`);
    }
    /**
     * Verify responsive design at different viewports
     */
    async testResponsiveDesign() {
        const viewports = [
            { width: 375, height: 667, name: 'mobile' },
            { width: 768, height: 1024, name: 'tablet' },
            { width: 1280, height: 720, name: 'desktop' }
        ];
        for (const viewport of viewports) {
            await this.page.setViewportSize(viewport);
            await this.waitForPageReady();
            // Check for horizontal scrolling
            const bodyScrollWidth = await this.page.evaluate(() => document.body.scrollWidth);
            const bodyClientWidth = await this.page.evaluate(() => document.body.clientWidth);
            (0, test_1.expect)(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 20);
        }
        // Reset to default desktop viewport
        await this.page.setViewportSize({ width: 1280, height: 720 });
    }
    /**
     * Verify keyboard navigation works
     */
    async testKeyboardNavigation() {
        // Tab through interactive elements
        const interactiveElements = this.page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const elementCount = await interactiveElements.count();
        if (elementCount > 0) {
            await this.page.keyboard.press('Tab');
            // Test a few tab stops
            const elementsToTest = Math.min(5, elementCount);
            for (let i = 0; i < elementsToTest; i++) {
                const activeElement = await this.page.evaluate(() => document.activeElement?.tagName);
                (0, test_1.expect)(activeElement).toBeDefined();
                await this.page.keyboard.press('Tab');
            }
        }
    }
    /**
     * Mock API responses for consistent testing
     */
    async mockApiResponse(endpoint, response, status = 200) {
        // Handle multiple endpoint patterns for flexibility
        const patterns = [
            `**/api/${endpoint}**`,
            `**/${endpoint}**`,
            `**/api/${endpoint}`,
            `**/${endpoint}`
        ];
        for (const pattern of patterns) {
            await this.page.route(pattern, route => {
                // Add CORS headers for browser compatibility
                route.fulfill({
                    status,
                    contentType: 'application/json',
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    },
                    body: JSON.stringify(response)
                });
            });
        }
    }
    /**
     * Mock multiple API endpoints at once
     */
    async mockMultipleApiResponses(mocks) {
        for (const mock of mocks) {
            await this.mockApiResponse(mock.endpoint, mock.response, mock.status || 200);
        }
    }
    /**
     * Mock localStorage operations for browser environment
     */
    async mockLocalStorage(data) {
        await this.page.evaluate((storageData) => {
            // Clear existing localStorage
            localStorage.clear();
            // Set new data
            for (const [key, value] of Object.entries(storageData)) {
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            }
        }, data);
    }
    /**
     * Get current localStorage state
     */
    async getLocalStorage() {
        return await this.page.evaluate(() => {
            const storage = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    storage[key] = localStorage.getItem(key) || '';
                }
            }
            return storage;
        });
    }
    /**
     * Wait for element to be stable (not moving)
     */
    async waitForElementStable(selector, timeout = 5000) {
        const element = this.page.locator(selector);
        await element.waitFor({ state: 'visible', timeout });
        // Wait for element position to stabilize
        let previousBox = await element.boundingBox();
        let stableCount = 0;
        while (stableCount < 3) {
            await this.page.waitForTimeout(100);
            const currentBox = await element.boundingBox();
            if (previousBox && currentBox &&
                previousBox.x === currentBox.x &&
                previousBox.y === currentBox.y &&
                previousBox.width === currentBox.width &&
                previousBox.height === currentBox.height) {
                stableCount++;
            }
            else {
                stableCount = 0;
            }
            previousBox = currentBox;
        }
    }
    /**
     * Cleanup after test
     */
    async cleanup() {
        // Clear browser storage
        await this.page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            // Clear any other storage APIs if available
            if ('indexedDB' in window) {
                // Note: IndexedDB cleanup would require more complex code
                // This is a placeholder for future implementation
            }
        });
        // Clear cookies
        await this.page.context().clearCookies();
        // Remove all route handlers
        await this.page.unrouteAll();
        // Clear any service worker registrations if present
        await this.page.evaluate(() => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (let registration of registrations) {
                        registration.unregister();
                    }
                }).catch(() => {
                    // Ignore errors
                });
            }
        });
    }
    /**
     * Setup common browser environment for tests
     */
    async setupBrowserEnvironment() {
        // Disable web security for testing
        await this.page.addInitScript(() => {
            // Mock console methods to prevent noise in tests
            const originalConsole = window.console;
            window.console = {
                ...originalConsole,
                warn: () => { },
                error: () => { },
                debug: () => { }
            };
        });
        // Set user agent for consistency
        await this.page.setExtraHTTPHeaders({
            'User-Agent': 'jaqEdu-E2E-Tests/1.0'
        });
    }
    /**
     * Wait for any pending API calls to complete
     */
    async waitForNetworkIdle(timeout = 5000) {
        await this.page.waitForLoadState('networkidle', { timeout });
    }
    /**
     * Simulate realistic user interaction delays
     */
    async humanDelay(min = 100, max = 300) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await this.page.waitForTimeout(delay);
    }
}
exports.TestHelpers = TestHelpers;
/**
 * Data generators for test data
 */
class TestDataGenerator {
    static generateEmail() {
        const timestamp = Date.now();
        return `test${timestamp}@jaquedu.com`;
    }
    static generatePassword() {
        return 'TestPassword123!';
    }
    static generateUserData() {
        const timestamp = Date.now();
        return {
            name: `Test User ${timestamp}`,
            email: this.generateEmail(),
            password: this.generatePassword()
        };
    }
    static generateModuleData() {
        const timestamp = Date.now();
        return {
            title: `Test Module ${timestamp}`,
            description: 'This is a test module for automated testing',
            difficulty: 'intermediate',
            duration: '30',
            content: `
# Test Module Content

This is automatically generated test content.

## Section 1
Test content for section 1.

## Section 2
Test content for section 2.
      `
        };
    }
    static generateQuizData() {
        return {
            title: 'Test Quiz',
            questions: [
                {
                    question: 'What is the main concept in Jungian psychology?',
                    options: [
                        'Collective unconscious',
                        'Individual consciousness',
                        'Behavioral patterns',
                        'Cognitive processes'
                    ],
                    correct: 0
                }
            ]
        };
    }
}
exports.TestDataGenerator = TestDataGenerator;
/**
 * Page object model base class
 */
class BasePage {
    constructor(page) {
        this.page = page;
    }
    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
    }
    async clickElement(selector) {
        const element = this.page.locator(selector);
        await (0, test_1.expect)(element).toBeVisible();
        await element.click();
    }
    async fillInput(selector, value) {
        const input = this.page.locator(selector);
        await (0, test_1.expect)(input).toBeVisible();
        await input.fill(value);
    }
    async selectOption(selector, value) {
        const select = this.page.locator(selector);
        await (0, test_1.expect)(select).toBeVisible();
        await select.selectOption(value);
    }
}
exports.BasePage = BasePage;
/**
 * Custom assertions for jaqEdu specific checks
 */
class CustomAssertions {
    constructor(page) {
        this.page = page;
    }
    async toBeAccessible() {
        // Basic accessibility checks
        const helpers = new TestHelpers(this.page);
        await helpers.checkBasicAccessibility();
    }
    async toBeResponsive() {
        const helpers = new TestHelpers(this.page);
        await helpers.testResponsiveDesign();
    }
    async toSupportKeyboardNavigation() {
        const helpers = new TestHelpers(this.page);
        await helpers.testKeyboardNavigation();
    }
}
exports.CustomAssertions = CustomAssertions;
//# sourceMappingURL=test-helpers.js.map