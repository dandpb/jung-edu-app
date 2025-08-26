import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { testSelectors, testPaths } from '../fixtures/test-data';

/**
 * Admin dashboard page object model
 */
export class AdminDashboardPage extends BasePage {
  readonly adminNavigation: Locator;
  readonly dashboardStats: Locator;
  readonly userManagement: Locator;
  readonly moduleManagement: Locator;
  readonly systemHealth: Locator;
  readonly recentActivity: Locator;
  readonly quickActions: Locator;

  constructor(page: Page) {
    super(page);
    this.adminNavigation = page.locator(testSelectors.adminNav);
    this.dashboardStats = page.locator('[data-testid=\"dashboard-stats\"]');
    this.userManagement = page.locator('[data-testid=\"user-management\"]');
    this.moduleManagement = page.locator('[data-testid=\"module-management\"]');
    this.systemHealth = page.locator('[data-testid=\"system-health\"]');
    this.recentActivity = page.locator('[data-testid=\"admin-recent-activity\"]');
    this.quickActions = page.locator('[data-testid=\"admin-quick-actions\"]');
  }

  /**
   * Navigate to admin dashboard
   */
  async goto() {
    await this.page.goto(testPaths.adminDashboard);
    await this.waitForPageLoad();
    await expect(this.adminNavigation).toBeVisible();
  }

  /**
   * Verify admin dashboard loaded
   */
  async verifyAdminDashboardLoaded() {
    await expect(this.adminNavigation).toBeVisible();
    await expect(this.dashboardStats).toBeVisible();
    
    // Verify admin-specific elements
    await expect(this.userManagement).toBeVisible();
    await expect(this.moduleManagement).toBeVisible();
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const stats = {
      totalUsers: await this.getStatValue('total-users'),
      totalModules: await this.getStatValue('total-modules'),
      activeUsers: await this.getStatValue('active-users'),
      systemHealth: await this.getStatValue('system-health')
    };
    
    return stats;
  }

  /**
   * Get specific stat value
   */
  private async getStatValue(statName: string): Promise<string> {
    const statElement = this.dashboardStats.locator(`[data-testid=\"stat-${statName}\"]`);
    if (await statElement.isVisible()) {
      return await statElement.textContent() || '0';
    }
    return '0';
  }

  /**
   * Navigate to modules management
   */
  async goToModules() {
    await this.page.goto(testPaths.adminModules);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to user management
   */
  async goToUsers() {
    await this.page.goto(testPaths.adminUsers);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to resources management
   */
  async goToResources() {
    await this.page.goto(testPaths.adminResources);
    await this.waitForPageLoad();
  }

  /**
   * Check system health status
   */
  async checkSystemHealth(): Promise<string> {
    const healthIndicator = this.systemHealth.locator('[data-testid=\"health-indicator\"]');
    
    if (await healthIndicator.isVisible()) {
      return await healthIndicator.getAttribute('data-health-status') || 'unknown';
    }
    
    return 'unknown';
  }

  /**
   * Get recent admin activities
   */
  async getRecentActivities(): Promise<string[]> {
    const activities = await this.recentActivity.locator('[data-testid=\"activity-item\"]').allTextContents();
    return activities;
  }

  /**
   * Use quick action
   */
  async performQuickAction(actionName: string) {
    const action = this.quickActions.locator(`[data-testid=\"quick-action-${actionName}\"]`);
    await expect(action).toBeVisible();
    await action.click();
  }

  /**
   * Verify admin permissions
   */
  async verifyAdminAccess() {
    // Check for admin-only elements
    const adminOnlyElements = [
      '[data-testid=\"user-management-link\"]',
      '[data-testid=\"system-settings-link\"]',
      '[data-testid=\"admin-tools\"]'
    ];

    for (const selector of adminOnlyElements) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeEnabled();
      }
    }
  }
}