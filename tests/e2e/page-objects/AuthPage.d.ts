import { Page } from '@playwright/test';
import { BasePage } from '../utils/test-helpers';
export declare class AuthPage extends BasePage {
    constructor(page: Page);
    get emailInput(): import("playwright-core").Locator;
    get passwordInput(): import("playwright-core").Locator;
    get loginButton(): import("playwright-core").Locator;
    get registerButton(): import("playwright-core").Locator;
    get nameInput(): import("playwright-core").Locator;
    get confirmPasswordInput(): import("playwright-core").Locator;
    get termsCheckbox(): import("playwright-core").Locator;
    get errorMessage(): import("playwright-core").Locator;
    get successMessage(): import("playwright-core").Locator;
    get logoutButton(): import("playwright-core").Locator;
    navigateToLogin(): Promise<void>;
    navigateToRegister(): Promise<void>;
    login(email: string, password: string): Promise<void>;
    register(userData: {
        name: string;
        email: string;
        password: string;
        confirmPassword?: string;
        acceptTerms?: boolean;
    }): Promise<void>;
    logout(): Promise<void>;
    expectLoginSuccess(): Promise<void>;
    expectRegistrationSuccess(): Promise<void>;
    expectLoginError(): Promise<void>;
    expectLogoutSuccess(): Promise<void>;
    expectValidationError(field: 'email' | 'password' | 'name'): Promise<void>;
}
//# sourceMappingURL=AuthPage.d.ts.map