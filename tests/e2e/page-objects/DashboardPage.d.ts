import { Page } from '@playwright/test';
import { BasePage } from '../utils/test-helpers';
export declare class DashboardPage extends BasePage {
    constructor(page: Page);
    get dashboardHeader(): import("playwright-core").Locator;
    get moduleCards(): import("playwright-core").Locator;
    get progressBar(): import("playwright-core").Locator;
    get userMenu(): import("playwright-core").Locator;
    get searchButton(): import("playwright-core").Locator;
    get notificationsButton(): import("playwright-core").Locator;
    get helpButton(): import("playwright-core").Locator;
    get mobileMenuButton(): import("playwright-core").Locator;
    get analyticsLink(): import("playwright-core").Locator;
    get workflowCards(): import("playwright-core").Locator;
    get recentActivity(): import("playwright-core").Locator;
    navigateToDashboard(): Promise<void>;
    selectModule(moduleIndex?: number): Promise<void>;
    selectModuleByTitle(title: string): Promise<void>;
    openUserMenu(): Promise<void>;
    openMobileMenu(): Promise<void>;
    searchContent(query: string): Promise<void>;
    navigateToProgress(): Promise<void>;
    selectWorkflow(workflowIndex?: number): Promise<void>;
    expectDashboardLoaded(): Promise<void>;
    expectModulesVisible(): Promise<void>;
    expectProgressTracking(): Promise<void>;
    expectUserAuthenticated(): Promise<void>;
    expectModuleCount(expectedCount: number): Promise<void>;
    expectModuleWithTitle(title: string): Promise<void>;
    expectRecentActivity(): Promise<void>;
    expectMobileLayout(): Promise<void>;
    expectMobileNavigation(): Promise<void>;
}
//# sourceMappingURL=DashboardPage.d.ts.map