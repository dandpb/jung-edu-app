import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page Object Model for Admin Dashboard Page
 * Handles all interactions with the admin dashboard
 */
export class AdminDashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Page URL
  readonly url = '/admin/dashboard';

  // Header elements
  get adminTitle(): Locator {
    return this.page.locator('[data-testid="admin-title"]');
  }

  get adminNavigation(): Locator {
    return this.page.locator('[data-testid="admin-navigation"]');
  }

  get backToUserDashboard(): Locator {
    return this.page.locator('[data-testid="back-to-user-dashboard"]');
  }

  // Main sections
  get systemOverview(): Locator {
    return this.page.locator('[data-testid="system-overview"]');
  }

  get userManagement(): Locator {
    return this.page.locator('[data-testid="user-management"]');
  }

  get moduleManagement(): Locator {
    return this.page.locator('[data-testid="module-management"]');
  }

  get systemMetrics(): Locator {
    return this.page.locator('[data-testid="system-metrics"]');
  }

  get aiResourceGeneration(): Locator {
    return this.page.locator('[data-testid="ai-resource-generation"]');
  }

  // Navigation tabs
  get overviewTab(): Locator {
    return this.page.locator('[data-testid="overview-tab"]');
  }

  get usersTab(): Locator {
    return this.page.locator('[data-testid="users-tab"]');
  }

  get modulesTab(): Locator {
    return this.page.locator('[data-testid="modules-tab"]');
  }

  get resourcesTab(): Locator {
    return this.page.locator('[data-testid="resources-tab"]');
  }

  get settingsTab(): Locator {
    return this.page.locator('[data-testid="settings-tab"]');
  }

  // Quick stats cards
  get totalUsersCard(): Locator {
    return this.page.locator('[data-testid="total-users-card"]');
  }

  get activeUsersCard(): Locator {
    return this.page.locator('[data-testid="active-users-card"]');
  }

  get totalModulesCard(): Locator {
    return this.page.locator('[data-testid="total-modules-card"]');
  }

  get systemHealthCard(): Locator {
    return this.page.locator('[data-testid="system-health-card"]');
  }

  // Action buttons
  get createUserButton(): Locator {
    return this.page.locator('[data-testid="create-user-button"]');
  }

  get createModuleButton(): Locator {
    return this.page.locator('[data-testid="create-module-button"]');
  }

  get generateResourceButton(): Locator {
    return this.page.locator('[data-testid="generate-resource-button"]');
  }

  get exportDataButton(): Locator {
    return this.page.locator('[data-testid="export-data-button"]');
  }

  get systemBackupButton(): Locator {
    return this.page.locator('[data-testid="system-backup-button"]');
  }

  // Page actions
  async navigateToAdminDashboard(): Promise<void> {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async switchToOverviewTab(): Promise<void> {
    await this.overviewTab.click();
    await this.waitForPageLoad();
  }

  async switchToUsersTab(): Promise<void> {
    await this.usersTab.click();
    await this.waitForPageLoad();
  }

  async switchToModulesTab(): Promise<void> {
    await this.modulesTab.click();
    await this.waitForPageLoad();
  }

  async switchToResourcesTab(): Promise<void> {
    await this.resourcesTab.click();
    await this.waitForPageLoad();
  }

  async switchToSettingsTab(): Promise<void> {
    await this.settingsTab.click();
    await this.waitForPageLoad();
  }

  async goBackToUserDashboard(): Promise<void> {
    await this.backToUserDashboard.click();
    await this.waitForPageLoad();
  }

  // User management actions
  async createNewUser(): Promise<void> {
    await this.createUserButton.click();
    await this.waitForPageLoad();
  }

  get userTable(): Locator {
    return this.page.locator('[data-testid="user-table"]');
  }

  get userSearchInput(): Locator {
    return this.page.locator('[data-testid="user-search-input"]');
  }

  async searchUsers(query: string): Promise<void> {
    await this.userSearchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async getUserRowByEmail(email: string): Promise<Locator> {
    return this.page.locator(`[data-testid="user-row"]:has-text("${email}")`);
  }

  async editUser(email: string): Promise<void> {
    const userRow = await this.getUserRowByEmail(email);
    await userRow.locator('[data-testid="edit-user-button"]').click();
    await this.waitForPageLoad();
  }

  async deleteUser(email: string): Promise<void> {
    const userRow = await this.getUserRowByEmail(email);
    await userRow.locator('[data-testid="delete-user-button"]').click();
    await this.waitForPageLoad();
  }

  // Module management actions
  async createNewModule(): Promise<void> {
    await this.createModuleButton.click();
    await this.waitForPageLoad();
  }

  get moduleTable(): Locator {
    return this.page.locator('[data-testid="module-table"]');
  }

  get moduleSearchInput(): Locator {
    return this.page.locator('[data-testid="module-search-input"]');
  }

  async searchModules(query: string): Promise<void> {
    await this.moduleSearchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async getModuleRowByTitle(title: string): Promise<Locator> {
    return this.page.locator(`[data-testid="module-row"]:has-text("${title}")`);
  }

  async editModule(title: string): Promise<void> {
    const moduleRow = await this.getModuleRowByTitle(title);
    await moduleRow.locator('[data-testid="edit-module-button"]').click();
    await this.waitForPageLoad();
  }

  async deleteModule(title: string): Promise<void> {
    const moduleRow = await this.getModuleRowByTitle(title);
    await moduleRow.locator('[data-testid="delete-module-button"]').click();
    await this.waitForPageLoad();
  }

  // AI Resource Generation
  get aiResourceForm(): Locator {
    return this.page.locator('[data-testid="ai-resource-form"]');
  }

  get topicInput(): Locator {
    return this.page.locator('[data-testid="topic-input"]');
  }

  get difficultySelect(): Locator {
    return this.page.locator('[data-testid="difficulty-select"]');
  }

  get resourceTypeSelect(): Locator {
    return this.page.locator('[data-testid="resource-type-select"]');
  }

  get languageSelect(): Locator {
    return this.page.locator('[data-testid="language-select"]');
  }

  async generateAIResource(topic: string, difficulty: string = 'intermediate', type: string = 'module'): Promise<void> {
    await this.topicInput.fill(topic);
    await this.difficultySelect.selectOption(difficulty);
    await this.resourceTypeSelect.selectOption(type);
    await this.generateResourceButton.click();
    await this.waitForPageLoad();
  }

  // System metrics
  get metricsChart(): Locator {
    return this.page.locator('[data-testid="metrics-chart"]');
  }

  get performanceIndicator(): Locator {
    return this.page.locator('[data-testid="performance-indicator"]');
  }

  get errorRateIndicator(): Locator {
    return this.page.locator('[data-testid="error-rate-indicator"]');
  }

  get uptimeIndicator(): Locator {
    return this.page.locator('[data-testid="uptime-indicator"]');
  }

  // Validation helpers
  async isAdminDashboardLoaded(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="admin-title"]');
  }

  async getTotalUsersCount(): Promise<string> {
    return await this.getElementText('[data-testid="total-users-count"]');
  }

  async getActiveUsersCount(): Promise<string> {
    return await this.getElementText('[data-testid="active-users-count"]');
  }

  async getTotalModulesCount(): Promise<string> {
    return await this.getElementText('[data-testid="total-modules-count"]');
  }

  async getSystemHealth(): Promise<string> {
    return await this.getElementText('[data-testid="system-health-status"]');
  }

  // Data export functionality
  async exportUserData(): Promise<void> {
    await this.switchToUsersTab();
    await this.page.locator('[data-testid="export-users-button"]').click();
    // Handle file download
    await this.page.waitForEvent('download');
  }

  async exportModuleData(): Promise<void> {
    await this.switchToModulesTab();
    await this.page.locator('[data-testid="export-modules-button"]').click();
    // Handle file download
    await this.page.waitForEvent('download');
  }

  // System backup
  async performSystemBackup(): Promise<void> {
    await this.systemBackupButton.click();
    await this.waitHelper.waitForElementToBeVisible('[data-testid="backup-progress"]');
    await this.waitHelper.waitForElementToBeHidden('[data-testid="backup-progress"]');
  }

  // Bulk actions
  get selectAllCheckbox(): Locator {
    return this.page.locator('[data-testid="select-all-checkbox"]');
  }

  get bulkActionsDropdown(): Locator {
    return this.page.locator('[data-testid="bulk-actions-dropdown"]');
  }

  async selectAllItems(): Promise<void> {
    await this.selectAllCheckbox.click();
  }

  async performBulkAction(action: string): Promise<void> {
    await this.bulkActionsDropdown.click();
    await this.page.locator(`[data-testid="bulk-action-${action}"]`).click();
    await this.waitForPageLoad();
  }

  // Filtering and sorting
  get filterButton(): Locator {
    return this.page.locator('[data-testid="filter-button"]');
  }

  get sortDropdown(): Locator {
    return this.page.locator('[data-testid="sort-dropdown"]');
  }

  async applyFilter(filterType: string, value: string): Promise<void> {
    await this.filterButton.click();
    await this.page.locator(`[data-testid="filter-${filterType}"]`).selectOption(value);
    await this.page.locator('[data-testid="apply-filter-button"]').click();
    await this.waitForPageLoad();
  }

  async sortBy(criteria: string): Promise<void> {
    await this.sortDropdown.selectOption(criteria);
    await this.waitForPageLoad();
  }
}