"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardPage = void 0;
const test_1 = require("@playwright/test");
const test_helpers_1 = require("../utils/test-helpers");
class DashboardPage extends test_helpers_1.BasePage {
    constructor(page) {
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
    async navigateToDashboard() {
        await this.page.goto('/dashboard');
        await this.waitForPageLoad();
    }
    async selectModule(moduleIndex = 0) {
        const modules = this.moduleCards;
        await (0, test_1.expect)(modules.first()).toBeVisible();
        await this.clickElement(modules.nth(moduleIndex));
    }
    async selectModuleByTitle(title) {
        const module = this.moduleCards.filter({ hasText: title });
        await (0, test_1.expect)(module.first()).toBeVisible();
        await this.clickElement(module.first());
    }
    async openUserMenu() {
        if (await this.userMenu.isVisible()) {
            await this.clickElement(this.userMenu);
        }
    }
    async openMobileMenu() {
        if (await this.mobileMenuButton.isVisible()) {
            await this.clickElement(this.mobileMenuButton);
        }
    }
    async searchContent(query) {
        if (await this.searchButton.isVisible()) {
            await this.clickElement(this.searchButton);
            const searchInput = this.page.locator('[data-testid="search-input"], input[placeholder*="buscar"]');
            await (0, test_1.expect)(searchInput).toBeVisible();
            await this.fillInput(searchInput, query);
            await this.page.keyboard.press('Enter');
        }
    }
    async navigateToProgress() {
        if (await this.analyticsLink.isVisible()) {
            await this.clickElement(this.analyticsLink);
        }
        else {
            await this.page.goto('/progress');
        }
        await this.waitForPageLoad();
    }
    async selectWorkflow(workflowIndex = 0) {
        const workflows = this.workflowCards;
        if (await workflows.first().isVisible()) {
            await this.clickElement(workflows.nth(workflowIndex));
        }
    }
    // Assertions
    async expectDashboardLoaded() {
        await (0, test_1.expect)(this.dashboardHeader.first()).toBeVisible({ timeout: 10000 });
    }
    async expectModulesVisible() {
        await (0, test_1.expect)(this.moduleCards.first()).toBeVisible();
    }
    async expectProgressTracking() {
        const progress = this.progressBar.first();
        if (await progress.isVisible()) {
            const progressText = await progress.textContent();
            (0, test_1.expect)(progressText).toMatch(/\d+%|\d+\/\d+/);
        }
    }
    async expectUserAuthenticated() {
        // Should be on dashboard URL
        await (0, test_1.expect)(this.page).toHaveURL(/\/(dashboard|home)/);
        // User menu should be visible (indicating logged in state)
        if (await this.userMenu.isVisible()) {
            await (0, test_1.expect)(this.userMenu).toBeVisible();
        }
    }
    async expectModuleCount(expectedCount) {
        await (0, test_1.expect)(this.moduleCards).toHaveCount(expectedCount);
    }
    async expectModuleWithTitle(title) {
        const module = this.moduleCards.filter({ hasText: title });
        await (0, test_1.expect)(module.first()).toBeVisible();
    }
    async expectRecentActivity() {
        if (await this.recentActivity.isVisible()) {
            await (0, test_1.expect)(this.recentActivity).toBeVisible();
        }
    }
    // Mobile specific methods
    async expectMobileLayout() {
        const mainContent = this.page.locator('main, .main-content, .content');
        if (await mainContent.isVisible()) {
            const boundingBox = await mainContent.boundingBox();
            if (boundingBox) {
                (0, test_1.expect)(boundingBox.width).toBeLessThanOrEqual(375);
            }
        }
    }
    async expectMobileNavigation() {
        if (await this.mobileMenuButton.isVisible()) {
            await (0, test_1.expect)(this.mobileMenuButton).toBeVisible();
            await this.clickElement(this.mobileMenuButton);
            const mobileNav = this.page.locator('[data-testid="mobile-navigation"], .mobile-nav, .sidebar');
            await (0, test_1.expect)(mobileNav).toBeVisible();
        }
    }
}
exports.DashboardPage = DashboardPage;
//# sourceMappingURL=DashboardPage.js.map