"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthPage = void 0;
const test_1 = require("@playwright/test");
const test_helpers_1 = require("../utils/test-helpers");
class AuthPage extends test_helpers_1.BasePage {
    constructor(page) {
        super(page);
    }
    // Locators
    get emailInput() {
        return this.page.locator('[data-testid="email-input"], [name="email"], input[type="email"]');
    }
    get passwordInput() {
        return this.page.locator('[data-testid="password-input"], [name="password"], input[type="password"]');
    }
    get loginButton() {
        return this.page.locator('[data-testid="login-button"], button[type="submit"], button:has-text("Login")');
    }
    get registerButton() {
        return this.page.locator('[data-testid="register-button"], button[type="submit"], button:has-text("Registrar")');
    }
    get nameInput() {
        return this.page.locator('[data-testid="name-input"], [name="name"], input[placeholder*="nome"]');
    }
    get confirmPasswordInput() {
        return this.page.locator('[data-testid="confirm-password"], [name="confirmPassword"]');
    }
    get termsCheckbox() {
        return this.page.locator('[data-testid="terms-checkbox"], input[type="checkbox"]');
    }
    get errorMessage() {
        return this.page.locator('[data-testid="login-error"], .error, .alert-danger, .notification-error');
    }
    get successMessage() {
        return this.page.locator('[data-testid="welcome-message"], h1:has-text("Bem-vindo"), .welcome-text');
    }
    get logoutButton() {
        return this.page.locator('[data-testid="logout-button"], button:has-text("Sair"), button:has-text("Logout"), .logout');
    }
    // Actions
    async navigateToLogin() {
        await this.page.goto('/login');
        await this.waitForPageLoad();
    }
    async navigateToRegister() {
        await this.page.goto('/register');
        await this.waitForPageLoad();
    }
    async login(email, password) {
        await this.fillInput(this.emailInput, email);
        await this.fillInput(this.passwordInput, password);
        await this.clickElement(this.loginButton);
    }
    async register(userData) {
        await this.fillInput(this.nameInput, userData.name);
        await this.fillInput(this.emailInput, userData.email);
        await this.fillInput(this.passwordInput, userData.password);
        if (userData.confirmPassword) {
            await this.fillInput(this.confirmPasswordInput, userData.confirmPassword);
        }
        if (userData.acceptTerms && await this.termsCheckbox.isVisible()) {
            await this.termsCheckbox.check();
        }
        await this.clickElement(this.registerButton);
    }
    async logout() {
        const logoutBtn = this.logoutButton.first();
        if (await logoutBtn.isVisible()) {
            await this.clickElement(logoutBtn);
        }
        else {
            // Try to find logout in user menu
            const userMenu = this.page.locator('.user-menu, .profile-menu');
            if (await userMenu.isVisible()) {
                await userMenu.click();
                const logoutInMenu = this.page.locator('a:has-text("Sair"), a:has-text("Logout")');
                if (await logoutInMenu.isVisible()) {
                    await logoutInMenu.click();
                }
            }
        }
    }
    // Assertions
    async expectLoginSuccess() {
        await (0, test_1.expect)(this.page).toHaveURL(/\/(dashboard|home)/);
        const welcomeOrDashboard = this.page.locator('[data-testid="dashboard"], .dashboard, h1:has-text("Jung"), h1:has-text("Educação")');
        await (0, test_1.expect)(welcomeOrDashboard.first()).toBeVisible();
    }
    async expectRegistrationSuccess() {
        await (0, test_1.expect)(this.page).toHaveURL(/\/(dashboard|welcome|home)/);
        await (0, test_1.expect)(this.successMessage.first()).toBeVisible({ timeout: 10000 });
    }
    async expectLoginError() {
        await (0, test_1.expect)(this.errorMessage.first()).toBeVisible();
        await (0, test_1.expect)(this.errorMessage.first()).toContainText(/invalid|inválid|erro|error/i);
    }
    async expectLogoutSuccess() {
        await (0, test_1.expect)(this.page).toHaveURL(/\/login/);
        const loginForm = this.page.locator('[data-testid="login-form"], form:has(input[type="email"]), form:has(input[type="password"])');
        await (0, test_1.expect)(loginForm.first()).toBeVisible();
    }
    async expectValidationError(field) {
        const errorSelector = {
            email: '[data-testid="email-error"], .error:has-text("email")',
            password: '[data-testid="password-error"], .error:has-text("senha"), .error:has-text("password")',
            name: '[data-testid="name-error"], .error:has-text("nome"), .error:has-text("name")'
        };
        const error = this.page.locator(errorSelector[field]);
        await (0, test_1.expect)(error.first()).toBeVisible();
    }
}
exports.AuthPage = AuthPage;
//# sourceMappingURL=AuthPage.js.map