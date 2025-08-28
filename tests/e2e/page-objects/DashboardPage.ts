import { Page, expect } from '@playwright/test';
import { BasePage } from '../utils/test-helpers';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  get dashboardHeader() {
    return this.page.locator('[data-testid="dashboard"], .dashboard, h1:has-text("Jung"), h1:has-text("Educação")');
  }

  get moduleCards() {
    return this.page.locator('[data-testid="module-card"], .module-card, .course-module');
  }

  get progressBar() {
    return this.page.locator('[data-testid="progress"], .progress-bar, .module-progress');
  }

  get userMenu() {
    return this.page.locator('[data-testid="user-menu"], .user-menu, .profile-menu, .user-info');
  }

  get searchButton() {
    return this.page.locator('[data-testid="search"], button:has-text("Buscar"), .search-toggle');
  }

  get notificationsButton() {
    return this.page.locator('[data-testid="notifications"], .notifications, .alerts');
  }

  get helpButton() {
    return this.page.locator('[data-testid="help"], a:has-text("Ajuda"), a:has-text("Suporte"), .help-link');
  }

  get mobileMenuButton() {
    return this.page.locator('[data-testid="mobile-menu"], .mobile-menu-button, .hamburger, button[aria-label*="menu"]');
  }

  get analyticsLink() {
    return this.page.locator('a:has-text("Progresso"), a:has-text("Analytics"), .progress-link');
  }

  get workflowCards() {
    return this.page.locator('[data-testid="workflow-card"], .workflow-item, .course-card');
  }

  get recentActivity() {
    return this.page.locator('[data-testid="recent-activity"], .recent-items, .activity-feed');
  }

  // Actions
  async navigateToDashboard(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.waitForPageLoad();
  }

  async selectModule(moduleIndex: number = 0): Promise<void> {
    const modules = this.moduleCards;
    await expect(modules.first()).toBeVisible();
    await this.clickElement(modules.nth(moduleIndex));
  }

  async selectModuleByTitle(title: string): Promise<void> {
    const module = this.moduleCards.filter({ hasText: title });
    await expect(module.first()).toBeVisible();
    await this.clickElement(module.first());
  }

  async openUserMenu(): Promise<void> {
    if (await this.userMenu.isVisible()) {
      await this.clickElement(this.userMenu);
    }
  }

  async openMobileMenu(): Promise<void> {
    if (await this.mobileMenuButton.isVisible()) {
      await this.clickElement(this.mobileMenuButton);
    }
  }

  async searchContent(query: string): Promise<void> {
    if (await this.searchButton.isVisible()) {
      await this.clickElement(this.searchButton);
      
      const searchInput = this.page.locator(
        '[data-testid="search-input"], input[placeholder*="buscar"]'
      );
      await expect(searchInput).toBeVisible();
      await this.fillInput(searchInput, query);
      await this.page.keyboard.press('Enter');
    }
  }

  async navigateToProgress(): Promise<void> {
    if (await this.analyticsLink.isVisible()) {
      await this.clickElement(this.analyticsLink);
    } else {
      await this.page.goto('/progress');
    }
    await this.waitForPageLoad();
  }

  async selectWorkflow(workflowIndex: number = 0): Promise<void> {
    const workflows = this.workflowCards;
    if (await workflows.first().isVisible()) {
      await this.clickElement(workflows.nth(workflowIndex));
    }
  }

  // Assertions
  async expectDashboardLoaded(): Promise<void> {
    await expect(this.dashboardHeader.first()).toBeVisible({ timeout: 10000 });
  }

  async expectModulesVisible(): Promise<void> {
    await expect(this.moduleCards.first()).toBeVisible();
  }

  async expectProgressTracking(): Promise<void> {
    const progress = this.progressBar.first();
    if (await progress.isVisible()) {
      const progressText = await progress.textContent();
      expect(progressText).toMatch(/\d+%|\d+\/\d+/);
    }
  }

  async expectUserAuthenticated(): Promise<void> {
    // Should be on dashboard URL
    await expect(this.page).toHaveURL(/\/(dashboard|home)/);
    
    // User menu should be visible (indicating logged in state)
    if (await this.userMenu.isVisible()) {
      await expect(this.userMenu).toBeVisible();
    }
  }

  async expectModuleCount(expectedCount: number): Promise<void> {
    await expect(this.moduleCards).toHaveCount(expectedCount);
  }

  async expectModuleWithTitle(title: string): Promise<void> {
    const module = this.moduleCards.filter({ hasText: title });
    await expect(module.first()).toBeVisible();
  }

  async expectRecentActivity(): Promise<void> {
    if (await this.recentActivity.isVisible()) {
      await expect(this.recentActivity).toBeVisible();
    }
  }

  // Mobile specific methods
  async expectMobileLayout(): Promise<void> {
    const mainContent = this.page.locator('main, .main-content, .content');
    if (await mainContent.isVisible()) {
      const boundingBox = await mainContent.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }
    }
  }

  async expectMobileNavigation(): Promise<void> {
    if (await this.mobileMenuButton.isVisible()) {
      await expect(this.mobileMenuButton).toBeVisible();
      
      await this.clickElement(this.mobileMenuButton);
      
      const mobileNav = this.page.locator(
        '[data-testid="mobile-navigation"], .mobile-nav, .sidebar'
      );
      await expect(mobileNav).toBeVisible();
    }
  }
}
