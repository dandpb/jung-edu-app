import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { testSelectors, testPaths } from '../fixtures/test-data';

/**
 * Dashboard page object model
 */
export class DashboardPage extends BasePage {
  readonly dashboardHeader: Locator;
  readonly welcomeMessage: Locator;
  readonly moduleCards: Locator;
  readonly progressBar: Locator;
  readonly progressSection: Locator;
  readonly progressChart: Locator;
  readonly completionStats: Locator;
  readonly recentModulesSection: Locator;
  readonly recentModulesList: Locator;
  readonly quickActionsSection: Locator;
  readonly recentActivity: Locator;
  readonly quickActions: Locator;
  readonly searchBox: Locator;
  readonly filterDropdown: Locator;
  readonly viewToggle: Locator;
  readonly continueStudyingButton: Locator;
  readonly browseModulesButton: Locator;
  readonly viewProfileButton: Locator;
  readonly profileMenuItem: Locator;
  readonly settingsMenuItem: Locator;
  readonly logoutMenuItem: Locator;
  readonly navigationMenu: Locator;
  readonly mobileNavigationMenu: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardHeader = page.locator('[data-testid="dashboard-header"]');
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
    this.moduleCards = page.locator('[data-testid="module-card"]');
    this.progressBar = page.locator('[data-testid="progress-bar"]');
    this.progressSection = page.locator('[data-testid="progress-section"]');
    this.progressChart = page.locator('[data-testid="progress-chart"]');
    this.completionStats = page.locator('[data-testid="completion-stats"]');
    this.recentModulesSection = page.locator('[data-testid="recent-modules-section"]');
    this.recentModulesList = page.locator('[data-testid="recent-modules-list"]');
    this.quickActionsSection = page.locator('[data-testid="quick-actions-section"]');
    this.recentActivity = page.locator('[data-testid="recent-activity"]');
    this.quickActions = page.locator('[data-testid="quick-actions"]');
    this.searchBox = page.locator('[data-testid="search-box"]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    this.viewToggle = page.locator('[data-testid="view-toggle"]');
    this.continueStudyingButton = page.locator('[data-testid="quick-action-search"]');
    this.browseModulesButton = page.locator('[data-testid="quick-action-progress"]');
    this.viewProfileButton = page.locator('[data-testid="user-menu"]');
    this.profileMenuItem = page.locator('[data-testid="profile-menu-item"]');
    this.settingsMenuItem = page.locator('[data-testid="settings-menu-item"]');
    this.logoutMenuItem = page.locator('[data-testid="logout-button"]');
    this.navigationMenu = page.locator('[data-testid="main-navigation"]');
    this.mobileNavigationMenu = page.locator('[data-testid="mobile-navigation"]');
  }

  /**
   * Navigate to dashboard
   */
  async goto(path = '/dashboard') {
    await this.page.goto(path);
    await this.waitForPageLoad();
    // Give the auth context time to check test mode and set up the user
    await this.page.waitForTimeout(1000);
    await expect(this.dashboardHeader).toBeVisible();
  }

  /**
   * Verify dashboard loads correctly
   */
  async verifyDashboardLoaded() {
    await expect(this.dashboardHeader).toBeVisible();
    await expect(this.welcomeMessage).toBeVisible();
    
    // Check that essential elements are present
    await expect(this.mainNavigation).toBeVisible();
    await expect(this.userMenu).toBeVisible();
  }

  /**
   * Get number of available modules
   */
  async getModuleCount(): Promise<number> {
    await this.moduleCards.first().waitFor({ state: 'visible', timeout: 10000 });
    return await this.moduleCards.count();
  }

  /**
   * Click on a specific module by index
   */
  async clickModule(index: number) {
    const moduleCard = this.moduleCards.nth(index);
    await expect(moduleCard).toBeVisible();
    
    const moduleTitle = await moduleCard.locator('[data-testid=\"module-title\"]').textContent();
    await moduleCard.click();
    
    // Wait for module page to load
    await this.page.waitForLoadState('networkidle');
    return moduleTitle;
  }

  /**
   * Click on module by title
   */
  async clickModuleByTitle(title: string) {
    const moduleCard = this.moduleCards.filter({ hasText: title });
    await expect(moduleCard).toBeVisible();
    await moduleCard.click();
    
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search for modules
   */
  async searchModules(searchTerm: string) {
    await this.searchBox.fill(searchTerm);
    await this.page.keyboard.press('Enter');
    
    // Wait for search results to load
    await this.page.waitForTimeout(1000);
  }

  /**
   * Filter modules by category/difficulty
   */
  async filterModules(filterOption: string) {
    await this.filterDropdown.click();
    await this.page.locator(`[data-testid=\"filter-option-${filterOption}\"]`).click();
    
    // Wait for filtered results
    await this.page.waitForTimeout(1000);
  }

  /**
   * Toggle between grid and list view
   */
  async toggleView(viewType: 'grid' | 'list') {
    const currentView = await this.viewToggle.getAttribute('data-view');
    
    if (currentView !== viewType) {
      await this.viewToggle.click();
      await expect(this.viewToggle).toHaveAttribute('data-view', viewType);
    }
  }

  /**
   * Get user's progress percentage
   */
  async getOverallProgress(): Promise<number> {
    if (await this.progressBar.isVisible()) {
      const progressText = await this.progressBar.textContent();
      const match = progressText?.match(/(\d+)%/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  /**
   * Get progress text for validation
   */
  async getProgressText(): Promise<string> {
    const progressElement = this.page.locator('[data-testid="completion-percentage"]');
    if (await progressElement.isVisible()) {
      return await progressElement.textContent() || '';
    }
    return '';
  }

  /**
   * Get recent modules count
   */
  async getRecentModulesCount(): Promise<number> {
    return await this.moduleCards.count();
  }

  /**
   * Get module card by index
   */
  getModuleCard(index: number): Locator {
    return this.moduleCards.nth(index);
  }

  /**
   * Check recent activity
   */
  async getRecentActivities(): Promise<string[]> {
    if (await this.recentActivity.isVisible()) {
      const activities = await this.recentActivity.locator('[data-testid=\"activity-item\"]').allTextContents();
      return activities;
    }
    return [];
  }

  /**
   * Use quick action (if available)
   */
  async clickQuickAction(actionName: string) {
    const action = this.quickActions.locator(`[data-testid=\"quick-action-${actionName}\"]`);
    if (await action.isVisible()) {
      await action.click();
    }
  }

  /**
   * Verify module card information
   */
  async verifyModuleCard(index: number, expectedData: {
    title?: string;
    description?: string;
    progress?: number;
    difficulty?: string;
  }) {
    const moduleCard = this.moduleCards.nth(index);
    await expect(moduleCard).toBeVisible();
    
    if (expectedData.title) {
      await expect(moduleCard.locator('[data-testid=\"module-title\"]')).toContainText(expectedData.title);
    }
    
    if (expectedData.description) {
      await expect(moduleCard.locator('[data-testid=\"module-description\"]')).toContainText(expectedData.description);
    }
    
    if (expectedData.difficulty) {
      await expect(moduleCard.locator('[data-testid=\"module-difficulty\"]')).toContainText(expectedData.difficulty);
    }
    
    if (expectedData.progress !== undefined) {
      const progressElement = moduleCard.locator('[data-testid=\"module-progress\"]');
      if (await progressElement.isVisible()) {
        const progressText = await progressElement.textContent();
        expect(progressText).toContain(`${expectedData.progress}%`);
      }
    }
  }

  /**
   * Check if dashboard shows empty state when no modules
   */
  async verifyEmptyState() {
    const emptyState = this.page.locator('[data-testid=\"empty-state\"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No modules available');
  }

  /**
   * Test responsive layout
   */
  async testResponsiveLayout() {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(this.dashboardHeader).toBeVisible();
    
    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(this.dashboardHeader).toBeVisible();
    
    // Test desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await expect(this.dashboardHeader).toBeVisible();
  }

  /**
   * Click continue studying button
   */
  async clickContinueStudying() {
    await this.continueStudyingButton.click();
  }

  /**
   * Click browse modules button
   */
  async clickBrowseModules() {
    await this.browseModulesButton.click();
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    await this.viewProfileButton.click();
  }

  /**
   * Click profile menu item
   */
  async clickProfileMenuItem() {
    if (await this.profileMenuItem.isVisible()) {
      await this.profileMenuItem.click();
    }
  }

  /**
   * Click settings menu item
   */
  async clickSettingsMenuItem() {
    if (await this.settingsMenuItem.isVisible()) {
      await this.settingsMenuItem.click();
    }
  }

  /**
   * Click logout menu item
   */
  async clickLogoutMenuItem() {
    await this.logoutMenuItem.click();
  }

  /**
   * Click module card by index
   */
  async clickModuleCard(index: number) {
    const moduleCard = this.moduleCards.nth(index);
    await expect(moduleCard).toBeVisible();
    await moduleCard.click();
  }
}