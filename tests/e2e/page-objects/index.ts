/**
 * Page Objects Export
 * Central export point for all page object models
 */

export { BasePage } from './base-page';
export { LoginPage } from './login-page';
export { DashboardPage } from './dashboard-page';
export { AdminDashboardPage } from './admin-dashboard-page';
export { ModulePage } from './module-page';

// Page object factory for easy instantiation
import { Page } from '@playwright/test';
import { BasePage } from './base-page';
import { LoginPage } from './login-page';
import { DashboardPage } from './dashboard-page';
import { AdminDashboardPage } from './admin-dashboard-page';
import { ModulePage } from './module-page';

export class PageObjectFactory {
  static createLoginPage(page: Page): LoginPage {
    return new LoginPage(page);
  }

  static createDashboardPage(page: Page): DashboardPage {
    return new DashboardPage(page);
  }

  static createAdminDashboardPage(page: Page): AdminDashboardPage {
    return new AdminDashboardPage(page);
  }

  static createModulePage(page: Page): ModulePage {
    return new ModulePage(page);
  }
}

// Page object manager for handling multiple page objects
export class PageObjectManager {
  public loginPage: LoginPage;
  public dashboardPage: DashboardPage;
  public adminDashboardPage: AdminDashboardPage;
  public modulePage: ModulePage;

  constructor(private page: Page) {
    this.loginPage = new LoginPage(page);
    this.dashboardPage = new DashboardPage(page);
    this.adminDashboardPage = new AdminDashboardPage(page);
    this.modulePage = new ModulePage(page);
  }

  // Navigation helper methods
  async goToLogin(): Promise<LoginPage> {
    await this.loginPage.navigateToLogin();
    return this.loginPage;
  }

  async goToDashboard(): Promise<DashboardPage> {
    await this.dashboardPage.navigateToDashboard();
    return this.dashboardPage;
  }

  async goToAdminDashboard(): Promise<AdminDashboardPage> {
    await this.adminDashboardPage.navigateToAdminDashboard();
    return this.adminDashboardPage;
  }

  async goToModule(moduleId: string): Promise<ModulePage> {
    await this.modulePage.navigateToModule(moduleId);
    return this.modulePage;
  }

  // Authentication flow helpers
  async loginAsUser(): Promise<DashboardPage> {
    await this.loginPage.navigateToLogin();
    await this.loginPage.loginWithValidCredentials();
    return this.dashboardPage;
  }

  async loginAsAdmin(): Promise<AdminDashboardPage> {
    await this.loginPage.navigateToLogin();
    await this.loginPage.fillEmail('admin@test.jaquedu.com');
    await this.loginPage.fillPassword('AdminTest123!');
    await this.loginPage.clickLoginButton();
    return this.adminDashboardPage;
  }

  // Common workflows
  async completeLoginFlow(): Promise<DashboardPage> {
    const loginPage = await this.goToLogin();
    await loginPage.loginWithValidCredentials();
    await loginPage.waitForLoginRedirect();
    return this.dashboardPage;
  }

  async completeAdminLoginFlow(): Promise<AdminDashboardPage> {
    const loginPage = await this.goToLogin();
    await loginPage.fillEmail('admin@test.jaquedu.com');
    await loginPage.fillPassword('AdminTest123!');
    await loginPage.clickLoginButton();
    await loginPage.waitForLoginRedirect();
    return this.adminDashboardPage;
  }

  // Utility methods
  async takeScreenshotOfCurrentPage(name: string): Promise<string> {
    return await this.page.screenshot({ 
      path: `tests/e2e/test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
}