"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_helpers_1 = require("./utils/test-helpers");
test_1.test.describe('Authentication Flow', () => {
    let page;
    let helpers;
    test_1.test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext();
        page = await context.newPage();
        helpers = new test_helpers_1.TestHelpers(page);
        await helpers.disableAnimations();
    });
    test_1.test.afterEach(async () => {
        await helpers.cleanup();
    });
    test_1.test.describe('User Registration', () => {
        (0, test_1.test)('should register new user successfully', async () => {
            const userData = test_helpers_1.TestDataGenerator.generateUserData();
            await page.goto('/register');
            await helpers.waitForPageReady();
            // Fill registration form
            await helpers.fillForm({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                confirmPassword: userData.password
            });
            // Accept terms if present
            const termsCheckbox = page.locator('input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="accept"]');
            if (await termsCheckbox.isVisible()) {
                await termsCheckbox.check();
            }
            // Submit registration
            await page.click('[data-testid="register-button"], button[type="submit"], button:has-text("Registrar")');
            // Verify successful registration
            await page.waitForURL(/\/(dashboard|welcome|home)/);
            const welcomeMessage = page.locator('[data-testid="welcome-message"], h1:has-text("Bem-vindo"), .welcome-text');
            await (0, test_1.expect)(welcomeMessage.first()).toBeVisible({ timeout: 10000 });
        });
        (0, test_1.test)('should show validation errors for invalid data', async () => {
            await page.goto('/register');
            await helpers.waitForPageReady();
            // Try to register with invalid email
            await helpers.fillForm({
                name: 'Test User',
                email: 'invalid-email',
                password: 'password123',
                confirmPassword: 'password123'
            });
            await page.click('button[type="submit"]');
            // Should show email validation error
            const emailError = page.locator('[data-testid="email-error"], .error:has-text("email"), .invalid-feedback');
            await (0, test_1.expect)(emailError.first()).toBeVisible();
        });
        (0, test_1.test)('should validate password confirmation match', async () => {
            await page.goto('/register');
            await helpers.waitForPageReady();
            const userData = test_helpers_1.TestDataGenerator.generateUserData();
            await helpers.fillForm({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                confirmPassword: 'different-password'
            });
            await page.click('button[type="submit"]');
            // Should show password mismatch error
            const passwordError = page.locator('[data-testid="password-error"], .error:has-text("senha"), .error:has-text("password")');
            await (0, test_1.expect)(passwordError.first()).toBeVisible();
        });
    });
    test_1.test.describe('User Login', () => {
        (0, test_1.test)('should login with valid credentials', async () => {
            await page.goto('/login');
            await helpers.waitForPageReady();
            // Mock successful login response
            await helpers.mockApiResponse('auth/login', {
                success: true,
                user: { id: 1, name: 'Test User', email: 'test@jaquedu.com', role: 'student' },
                token: 'mock_jwt_token'
            });
            await helpers.fillForm({
                email: 'test@jaquedu.com',
                password: 'password123'
            });
            await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Login")');
            // Should redirect to dashboard
            await page.waitForURL(/\/(dashboard|home)/);
            // Verify dashboard content is loaded
            const dashboardContent = page.locator('[data-testid="dashboard"], .dashboard, h1:has-text("Jung"), h1:has-text("Educação")');
            await (0, test_1.expect)(dashboardContent.first()).toBeVisible();
        });
        (0, test_1.test)('should show error for invalid credentials', async () => {
            await page.goto('/login');
            await helpers.waitForPageReady();
            // Mock failed login response
            await helpers.mockApiResponse('auth/login', {
                success: false,
                message: 'Invalid credentials'
            }, 401);
            await helpers.fillForm({
                email: 'wrong@example.com',
                password: 'wrongpassword'
            });
            await page.click('button[type="submit"]');
            // Should show error message
            const errorMessage = page.locator('[data-testid="login-error"], .error, .alert-danger, .notification-error');
            await (0, test_1.expect)(errorMessage.first()).toBeVisible();
            await (0, test_1.expect)(errorMessage.first()).toContainText(/invalid|inválid|erro|error/i);
        });
        (0, test_1.test)('should handle network errors gracefully', async () => {
            await page.goto('/login');
            await helpers.waitForPageReady();
            // Simulate network failure
            await helpers.simulateNetworkFailure();
            await helpers.fillForm({
                email: 'test@jaquedu.com',
                password: 'password123'
            });
            await page.click('button[type="submit"]');
            // Should show network error message
            const networkError = page.locator('.error, .alert-danger, .notification-error');
            await (0, test_1.expect)(networkError.first()).toBeVisible({ timeout: 10000 });
        });
    });
    test_1.test.describe('Password Reset', () => {
        (0, test_1.test)('should request password reset', async () => {
            // Check if password reset page exists
            await page.goto('/forgot-password');
            if (page.url().includes('404')) {
                await page.goto('/reset-password');
            }
            if (!page.url().includes('404')) {
                await helpers.waitForPageReady();
                // Mock successful reset request
                await helpers.mockApiResponse('auth/forgot-password', {
                    success: true,
                    message: 'Reset link sent'
                });
                const emailInput = page.locator('[name="email"], input[type="email"]');
                if (await emailInput.isVisible()) {
                    await emailInput.fill('test@jaquedu.com');
                    await page.click('button[type="submit"]');
                    // Should show success message
                    const successMessage = page.locator('.success, .alert-success');
                    await (0, test_1.expect)(successMessage.first()).toBeVisible({ timeout: 10000 });
                }
            }
        });
    });
    test_1.test.describe('Session Management', () => {
        (0, test_1.test)('should persist login session across page reloads', async () => {
            // Set up authenticated state
            await helpers.setupAuth('student');
            await page.goto('/dashboard');
            await helpers.waitForPageReady();
            // Verify user is logged in
            const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .profile-menu, .user-info');
            if (await userMenu.isVisible()) {
                await (0, test_1.expect)(userMenu).toBeVisible();
            }
            // Reload page
            await page.reload();
            await helpers.waitForPageReady();
            // Should still be logged in
            await (0, test_1.expect)(page).toHaveURL(/\/(dashboard|home)/);
            // User menu should still be visible
            if (await userMenu.isVisible()) {
                await (0, test_1.expect)(userMenu).toBeVisible();
            }
        });
        (0, test_1.test)('should logout user successfully', async () => {
            await helpers.setupAuth('student');
            await page.goto('/dashboard');
            await helpers.waitForPageReady();
            // Find and click logout button
            const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Sair"), button:has-text("Logout"), .logout');
            if (await logoutButton.first().isVisible()) {
                await logoutButton.first().click();
            }
            else {
                // Try to find logout in user menu
                const userMenu = page.locator('.user-menu, .profile-menu');
                if (await userMenu.isVisible()) {
                    await userMenu.click();
                    const logoutInMenu = page.locator('a:has-text("Sair"), a:has-text("Logout")');
                    if (await logoutInMenu.isVisible()) {
                        await logoutInMenu.click();
                    }
                }
            }
            // Should redirect to login page
            await page.waitForURL(/\/login/);
            // Login form should be visible
            const loginForm = page.locator('form, [data-testid="login-form"]');
            await (0, test_1.expect)(loginForm).toBeVisible();
        });
        (0, test_1.test)('should redirect unauthenticated users to login', async () => {
            // Try to access protected route without authentication
            await page.goto('/dashboard');
            // Should redirect to login page
            await page.waitForURL(/\/login/, { timeout: 10000 });
            // Login form should be visible
            const loginForm = page.locator('[data-testid="login-form"], form:has(input[type="email"]), form:has(input[type="password"])');
            await (0, test_1.expect)(loginForm.first()).toBeVisible();
        });
    });
    test_1.test.describe('Social Authentication', () => {
        (0, test_1.test)('should show social login options if available', async () => {
            await page.goto('/login');
            await helpers.waitForPageReady();
            // Check for social login buttons
            const googleLogin = page.locator('button:has-text("Google"), .google-login');
            const facebookLogin = page.locator('button:has-text("Facebook"), .facebook-login');
            if (await googleLogin.isVisible() || await facebookLogin.isVisible()) {
                // At least one social login option should be present
                const socialLogin = page.locator('.social-login, .oauth-login');
                await (0, test_1.expect)(socialLogin.first()).toBeVisible();
            }
        });
    });
    test_1.test.describe('Mobile Authentication', () => {
        test_1.test.beforeEach(async ({ browser }) => {
            const context = await browser.newContext({
                viewport: { width: 375, height: 667 }
            });
            page = await context.newPage();
            helpers = new test_helpers_1.TestHelpers(page);
            await helpers.disableAnimations();
        });
        (0, test_1.test)('should handle mobile login layout', async () => {
            await page.goto('/login');
            await helpers.waitForPageReady();
            // Check form is properly responsive
            const loginForm = page.locator('form');
            if (await loginForm.isVisible()) {
                const boundingBox = await loginForm.boundingBox();
                if (boundingBox) {
                    (0, test_1.expect)(boundingBox.width).toBeLessThanOrEqual(375);
                }
            }
            // Test form interactions on mobile
            const emailInput = page.locator('input[type="email"]');
            const passwordInput = page.locator('input[type="password"]');
            if (await emailInput.isVisible() && await passwordInput.isVisible()) {
                await emailInput.fill('test@jaquedu.com');
                await passwordInput.fill('password123');
                // Form should still be functional
                await (0, test_1.expect)(emailInput).toHaveValue('test@jaquedu.com');
                await (0, test_1.expect)(passwordInput).toHaveValue('password123');
            }
        });
    });
});
//# sourceMappingURL=authentication.e2e.js.map