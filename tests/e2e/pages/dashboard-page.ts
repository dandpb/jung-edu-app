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
  readonly recentActivity: Locator;
  readonly quickActions: Locator;
  readonly searchBox: Locator;
  readonly filterDropdown: Locator;
  readonly viewToggle: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardHeader = page.locator(testSelectors.dashboardHeader);
    this.welcomeMessage = page.locator('[data-testid=\"welcome-message\"]');
    this.moduleCards = page.locator(testSelectors.moduleCard);
    this.progressBar = page.locator(testSelectors.progressBar);
    this.recentActivity = page.locator('[data-testid=\"recent-activity\"]');
    this.quickActions = page.locator('[data-testid=\"quick-actions\"]');
    this.searchBox = page.locator('[data-testid=\"search-box\"]');
    this.filterDropdown = page.locator('[data-testid=\"filter-dropdown\"]');
    this.viewToggle = page.locator('[data-testid=\"view-toggle\"]');
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto(testPaths.dashboard);
    await this.waitForPageLoad();
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
      const match = progressText?.match(/(\\d+)%/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
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
}