import { Page } from '@playwright/test';
/**
 * Test utility functions for jaqEdu e2e tests
 */
export declare class TestHelpers {
    private page;
    constructor(page: Page);
    /**
     * Wait for page to be fully loaded and stable
     */
    waitForPageReady(): Promise<void>;
    /**
     * Set up user authentication for tests
     */
    setupAuth(userType: 'student' | 'instructor' | 'admin'): Promise<void>;
    /**
     * Hide dynamic content for consistent screenshots
     */
    hideDynamicContent(): Promise<void>;
    /**
     * Disable animations for consistent testing
     */
    disableAnimations(): Promise<void>;
    /**
     * Fill form with test data
     */
    fillForm(formData: Record<string, string>): Promise<void>;
    /**
     * Wait for and verify success message
     */
    waitForSuccessMessage(): Promise<void>;
    /**
     * Check for accessibility violations using basic checks
     */
    checkBasicAccessibility(): Promise<void>;
    /**
     * Simulate network conditions
     */
    simulateSlowNetwork(): Promise<void>;
    /**
     * Simulate network failure
     */
    simulateNetworkFailure(): Promise<void>;
    /**
     * Take element screenshot with consistent settings
     */
    takeElementScreenshot(selector: string, name: string): Promise<void>;
    /**
     * Verify responsive design at different viewports
     */
    testResponsiveDesign(): Promise<void>;
    /**
     * Verify keyboard navigation works
     */
    testKeyboardNavigation(): Promise<void>;
    /**
     * Mock API responses for consistent testing
     */
    mockApiResponse(endpoint: string, response: any, status?: number): Promise<void>;
    /**
     * Mock multiple API endpoints at once
     */
    mockMultipleApiResponses(mocks: Array<{
        endpoint: string;
        response: any;
        status?: number;
    }>): Promise<void>;
    /**
     * Mock localStorage operations for browser environment
     */
    mockLocalStorage(data: Record<string, any>): Promise<void>;
    /**
     * Get current localStorage state
     */
    getLocalStorage(): Promise<Record<string, string>>;
    /**
     * Wait for element to be stable (not moving)
     */
    waitForElementStable(selector: string, timeout?: number): Promise<void>;
    /**
     * Cleanup after test
     */
    cleanup(): Promise<void>;
    /**
     * Setup common browser environment for tests
     */
    setupBrowserEnvironment(): Promise<void>;
    /**
     * Wait for any pending API calls to complete
     */
    waitForNetworkIdle(timeout?: number): Promise<void>;
    /**
     * Simulate realistic user interaction delays
     */
    humanDelay(min?: number, max?: number): Promise<void>;
}
/**
 * Data generators for test data
 */
export declare class TestDataGenerator {
    static generateEmail(): string;
    static generatePassword(): string;
    static generateUserData(): {
        name: string;
        email: string;
        password: string;
    };
    static generateModuleData(): {
        title: string;
        description: string;
        difficulty: string;
        duration: string;
        content: string;
    };
    static generateQuizData(): {
        title: string;
        questions: {
            question: string;
            options: string[];
            correct: number;
        }[];
    };
}
/**
 * Page object model base class
 */
export declare abstract class BasePage {
    protected page: Page;
    constructor(page: Page);
    protected waitForPageLoad(): Promise<void>;
    protected clickElement(selector: string): Promise<void>;
    protected fillInput(selector: string, value: string): Promise<void>;
    protected selectOption(selector: string, value: string): Promise<void>;
}
/**
 * Custom assertions for jaqEdu specific checks
 */
export declare class CustomAssertions {
    private page;
    constructor(page: Page);
    toBeAccessible(): Promise<void>;
    toBeResponsive(): Promise<void>;
    toSupportKeyboardNavigation(): Promise<void>;
}
//# sourceMappingURL=test-helpers.d.ts.map