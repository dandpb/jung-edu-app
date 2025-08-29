import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page Object Model for Dashboard Page
 * Handles all interactions with the main dashboard
 */
export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Page URL
  readonly url = '/dashboard';

  // Header elements
  get userAvatar(): Locator {
    return this.page.locator('[data-testid="user-avatar"]');
  }

  get userMenu(): Locator {
    return this.page.locator('[data-testid="user-menu"]');
  }

  get logoutButton(): Locator {
    return this.page.locator('[data-testid="logout-button"]');
  }

  get profileButton(): Locator {
    return this.page.locator('[data-testid="profile-button"]');
  }

  get settingsButton(): Locator {
    return this.page.locator('[data-testid="settings-button"]');
  }

  // Main content areas
  get welcomeMessage(): Locator {
    return this.page.locator('[data-testid="welcome-message"]');
  }

  get dashboardGrid(): Locator {
    return this.page.locator('[data-testid="dashboard-grid"]');
  }

  get modulesList(): Locator {
    return this.page.locator('[data-testid="modules-list"]');
  }

  get progressSection(): Locator {
    return this.page.locator('[data-testid="progress-section"]');
  }

  get recentActivity(): Locator {
    return this.page.locator('[data-testid="recent-activity"]');
  }

  get quickActions(): Locator {
    return this.page.locator('[data-testid="quick-actions"]');
  }

  // Navigation elements
  get sidebarMenu(): Locator {
    return this.page.locator('[data-testid="sidebar-menu"]');
  }

  get menuToggle(): Locator {
    return this.page.locator('[data-testid="menu-toggle"]');
  }

  // Quick action buttons
  get createModuleButton(): Locator {
    return this.page.locator('[data-testid="create-module-button"]');
  }

  get exploreModulesButton(): Locator {
    return this.page.locator('[data-testid="explore-modules-button"]');
  }

  get viewProgressButton(): Locator {
    return this.page.locator('[data-testid="view-progress-button"]');
  }

  get takeQuizButton(): Locator {
    return this.page.locator('[data-testid="take-quiz-button"]');
  }

  // Statistics and widgets
  get totalModulesCount(): Locator {
    return this.page.locator('[data-testid="total-modules-count"]');
  }

  get completedModulesCount(): Locator {
    return this.page.locator('[data-testid="completed-modules-count"]');
  }

  get averageScore(): Locator {
    return this.page.locator('[data-testid="average-score"]');
  }

  get studyStreak(): Locator {
    return this.page.locator('[data-testid="study-streak"]');
  }

  // Recent modules
  get recentModulesSection(): Locator {
    return this.page.locator('[data-testid="recent-modules"]');
  }

  get moduleCard(): Locator {
    return this.page.locator('[data-testid="module-card"]');
  }

  // Page actions
  async navigateToDashboard(): Promise<void> {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async openUserMenu(): Promise<void> {
    await this.userAvatar.click();
    await this.waitHelper.waitForElementToBeVisible('[data-testid="user-menu"]');
  }

  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.logoutButton.click();
    await this.waitForPageLoad();
  }

  async goToProfile(): Promise<void> {
    await this.openUserMenu();
    await this.profileButton.click();
    await this.waitForPageLoad();
  }

  async goToSettings(): Promise<void> {
    await this.openUserMenu();
    await this.settingsButton.click();
    await this.waitForPageLoad();
  }

  async toggleSidebar(): Promise<void> {
    await this.menuToggle.click();
  }

  async createNewModule(): Promise<void> {
    await this.createModuleButton.click();
    await this.waitForPageLoad();
  }

  async exploreModules(): Promise<void> {
    await this.exploreModulesButton.click();
    await this.waitForPageLoad();
  }

  async viewProgress(): Promise<void> {
    await this.viewProgressButton.click();
    await this.waitForPageLoad();
  }

  async takeQuiz(): Promise<void> {
    await this.takeQuizButton.click();
    await this.waitForPageLoad();
  }

  // Module interactions
  async getModuleCards(): Promise<Locator[]> {
    return await this.moduleCard.all();
  }

  async clickModuleCard(index: number = 0): Promise<void> {
    const cards = await this.getModuleCards();
    if (cards[index]) {
      await cards[index].click();
      await this.waitForPageLoad();
    }
  }

  async clickModuleByTitle(title: string): Promise<void> {
    const moduleCard = this.page.locator(`[data-testid="module-card"]:has-text("${title}")`);
    await moduleCard.click();
    await this.waitForPageLoad();
  }

  // Navigation helpers
  async navigateToModules(): Promise<void> {
    await this.page.locator('[data-testid="nav-modules"]').click();
    await this.waitForPageLoad();
  }

  async navigateToProgress(): Promise<void> {
    await this.page.locator('[data-testid="nav-progress"]').click();
    await this.waitForPageLoad();
  }


  async navigateToNotes(): Promise<void> {
    await this.page.locator('[data-testid="nav-notes"]').click();
    await this.waitForPageLoad();
  }

  // Validation helpers
  async isDashboardLoaded(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="dashboard-grid"]');
  }

  async isUserLoggedIn(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="user-avatar"]');
  }

  async getWelcomeMessage(): Promise<string> {
    return await this.getElementText('[data-testid="welcome-message"]');
  }

  async getTotalModulesCount(): Promise<string> {
    return await this.getElementText('[data-testid="total-modules-count"]');
  }

  async getCompletedModulesCount(): Promise<string> {
    return await this.getElementText('[data-testid="completed-modules-count"]');
  }

  async getAverageScore(): Promise<string> {
    return await this.getElementText('[data-testid="average-score"]');
  }

  async getStudyStreak(): Promise<string> {
    return await this.getElementText('[data-testid="study-streak"]');
  }

  // Recent activity helpers
  async getRecentActivityItems(): Promise<Locator[]> {
    return await this.page.locator('[data-testid="activity-item"]').all();
  }

  async hasRecentActivity(): Promise<boolean> {
    const items = await this.getRecentActivityItems();
    return items.length > 0;
  }

  // Search functionality
  get searchInput(): Locator {
    return this.page.locator('[data-testid="search-input"]');
  }

  get searchButton(): Locator {
    return this.page.locator('[data-testid="search-button"]');
  }

  async searchModules(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.waitForPageLoad();
  }

  // Notification helpers
  get notificationBell(): Locator {
    return this.page.locator('[data-testid="notification-bell"]');
  }

  get notificationDropdown(): Locator {
    return this.page.locator('[data-testid="notification-dropdown"]');
  }

  async openNotifications(): Promise<void> {
    await this.notificationBell.click();
    await this.waitHelper.waitForElementToBeVisible('[data-testid="notification-dropdown"]');
  }

  async hasUnreadNotifications(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="notification-badge"]');
  }

  // Theme toggle
  get themeToggle(): Locator {
    return this.page.locator('[data-testid="theme-toggle"]');
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }

  async isLightTheme(): Promise<boolean> {
    const html = this.page.locator('html');
    return !(await html.getAttribute('class'))?.includes('dark');
  }

  async isDarkTheme(): Promise<boolean> {
    return !(await this.isLightTheme());
  }
}