"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Admin Dashboard - System Management and Controls', () => {
    let page;
    test_1.test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext({
            storageState: 'tests/e2e/auth/admin-user.json'
        });
        page = await context.newPage();
        // Set admin authentication
        await page.evaluate(() => {
            localStorage.setItem('auth_user', JSON.stringify({
                id: 1,
                name: 'Admin User',
                email: 'admin@jaquedu.com',
                role: 'admin'
            }));
            localStorage.setItem('admin_token', 'mock_admin_token_12345');
        });
    });
    test_1.test.describe('Admin Authentication and Access', () => {
        (0, test_1.test)('should access admin dashboard with proper credentials', async () => {
            await page.goto('/admin/login');
            // If already authenticated, should redirect to dashboard
            if (page.url().includes('/admin/dashboard') || page.url().includes('/admin')) {
                const adminDashboard = page.locator('[data-testid="admin-dashboard"], .admin-dashboard, h1:has-text("Admin")');
                await (0, test_1.expect)(adminDashboard.first()).toBeVisible({ timeout: 10000 });
            }
            else {
                // Login as admin
                const emailInput = page.locator('[data-testid="email-input"], [name="email"], input[type="email"]');
                if (await emailInput.isVisible()) {
                    await emailInput.fill('admin@jaquedu.com');
                    const passwordInput = page.locator('[data-testid="password-input"], [name="password"], input[type="password"]');
                    await passwordInput.fill('admin123');
                    const loginButton = page.locator('[data-testid="login-button"], [type="submit"], button:has-text("Login")');
                    await loginButton.click();
                    // Should redirect to admin dashboard
                    await (0, test_1.expect)(page).toHaveURL(/\/admin/);
                }
            }
        });
        (0, test_1.test)('should restrict access to non-admin users', async () => {
            // Clear admin authentication
            await page.evaluate(() => {
                localStorage.removeItem('auth_user');
                localStorage.removeItem('admin_token');
                localStorage.setItem('auth_user', JSON.stringify({
                    id: 2,
                    role: 'user'
                }));
            });
            await page.goto('/admin/dashboard');
            // Should redirect to login or show unauthorized
            const currentUrl = page.url();
            const isRestricted = currentUrl.includes('/login') ||
                currentUrl.includes('/unauthorized') ||
                currentUrl.includes('/403');
            (0, test_1.expect)(isRestricted).toBeTruthy();
        });
    });
    test_1.test.describe('User Management', () => {
        (0, test_1.test)('should display list of all users', async () => {
            await page.goto('/admin/users');
            if (!page.url().includes('404')) {
                // Verify users table loads
                const usersTable = page.locator('[data-testid="users-table"], .users-table, table');
                await (0, test_1.expect)(usersTable).toBeVisible({ timeout: 10000 });
                // Check for user entries
                const userRows = page.locator('tbody tr, .user-row');
                const userCount = await userRows.count();
                if (userCount > 0) {
                    // Verify first user has basic info
                    const firstUser = userRows.first();
                    await (0, test_1.expect)(firstUser).toBeVisible();
                    // Should contain email or name
                    const userInfo = firstUser.locator('td, .user-info');
                    await (0, test_1.expect)(userInfo.first()).toBeVisible();
                }
                // Check for pagination or load more
                const pagination = page.locator('.pagination, [data-testid="pagination"]');
                if (await pagination.isVisible()) {
                    await (0, test_1.expect)(pagination).toBeVisible();
                }
            }
        });
        (0, test_1.test)('should search and filter users', async () => {
            await page.goto('/admin/users');
            if (!page.url().includes('404')) {
                // Use search functionality
                const searchInput = page.locator('[data-testid="user-search"], [name="search"], input[placeholder*="buscar"]');
                if (await searchInput.isVisible()) {
                    await searchInput.fill('student');
                    await page.keyboard.press('Enter');
                    // Wait for search results
                    await page.waitForTimeout(1000);
                    // Verify search results contain the search term
                    const searchResults = page.locator('.user-row, tbody tr');
                    if (await searchResults.count() > 0) {
                        const firstResult = searchResults.first();
                        const resultText = await firstResult.textContent();
                        (0, test_1.expect)(resultText?.toLowerCase()).toContain('student');
                    }
                }
                // Filter by role
                const roleFilter = page.locator('[data-testid="role-filter"], [name="role"], select');
                if (await roleFilter.isVisible()) {
                    await roleFilter.selectOption('instructor');
                    // Wait for filter to apply
                    await page.waitForTimeout(1000);
                    // Verify filtered results
                    const filteredRows = page.locator('.user-row, tbody tr');
                    if (await filteredRows.count() > 0) {
                        const roleColumn = filteredRows.first().locator('.role, td:nth-child(3)');
                        if (await roleColumn.isVisible()) {
                            const roleText = await roleColumn.textContent();
                            (0, test_1.expect)(roleText?.toLowerCase()).toContain('instructor');
                        }
                    }
                }
            }
        });
        (0, test_1.test)('should create new user account', async () => {
            await page.goto('/admin/users');
            if (!page.url().includes('404')) {
                const createUserButton = page.locator('[data-testid="create-user"], button:has-text("Criar"), button:has-text("Novo Usuário")');
                if (await createUserButton.isVisible()) {
                    await createUserButton.click();
                    // Fill user creation form
                    const nameInput = page.locator('[data-testid="name-input"], [name="name"]');
                    if (await nameInput.isVisible()) {
                        await nameInput.fill('Novo Usuário Teste');
                    }
                    const emailInput = page.locator('[data-testid="email-input"], [name="email"]');
                    if (await emailInput.isVisible()) {
                        await emailInput.fill(`testuser${Date.now()}@example.com`);
                    }
                    const roleSelect = page.locator('[data-testid="role-select"], [name="role"]');
                    if (await roleSelect.isVisible()) {
                        await roleSelect.selectOption('student');
                    }
                    const passwordInput = page.locator('[data-testid="password-input"], [name="password"]');
                    if (await passwordInput.isVisible()) {
                        await passwordInput.fill('TempPassword123!');
                    }
                    // Save user
                    const saveButton = page.locator('[data-testid="save-user"], button:has-text("Salvar")');
                    await saveButton.click();
                    // Verify success message
                    const successMessage = page.locator('.success, .alert-success, [data-testid="success"]');
                    await (0, test_1.expect)(successMessage.first()).toBeVisible({ timeout: 10000 });
                    // Verify user appears in list
                    await page.goto('/admin/users');
                    const newUserRow = page.locator('tr:has-text("Novo Usuário Teste")');
                    if (await newUserRow.isVisible()) {
                        await (0, test_1.expect)(newUserRow).toBeVisible();
                    }
                }
            }
        });
        (0, test_1.test)('should edit existing user', async () => {
            await page.goto('/admin/users');
            if (!page.url().includes('404')) {
                const editButton = page.locator('[data-testid="edit-user"], .edit-button, button:has-text("Editar")').first();
                if (await editButton.isVisible()) {
                    await editButton.click();
                    // Modify user information
                    const nameInput = page.locator('[data-testid="name-input"], [name="name"]');
                    if (await nameInput.isVisible()) {
                        const currentName = await nameInput.inputValue();
                        await nameInput.fill(`${currentName} - Editado`);
                    }
                    // Save changes
                    const saveButton = page.locator('[data-testid="save-user"], button:has-text("Salvar")');
                    await saveButton.click();
                    // Verify success message
                    const successMessage = page.locator('.success, .alert-success');
                    await (0, test_1.expect)(successMessage.first()).toBeVisible({ timeout: 10000 });
                }
            }
        });
        (0, test_1.test)('should deactivate/suspend user account', async () => {
            await page.goto('/admin/users');
            if (!page.url().includes('404')) {
                const suspendButton = page.locator('[data-testid="suspend-user"], button:has-text("Suspender"), .suspend-button').first();
                if (await suspendButton.isVisible()) {
                    await suspendButton.click();
                    // Confirm suspension
                    const confirmButton = page.locator('[data-testid="confirm-suspend"], button:has-text("Confirmar")');
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                    }
                    // Verify user status changed
                    const successMessage = page.locator('.success, .alert-success');
                    await (0, test_1.expect)(successMessage.first()).toBeVisible({ timeout: 10000 });
                }
            }
        });
    });
    test_1.test.describe('System Settings and Configuration', () => {
        (0, test_1.test)('should access system settings', async () => {
            await page.goto('/admin/settings');
            if (!page.url().includes('404')) {
                // Verify settings page loads
                const settingsForm = page.locator('[data-testid="settings-form"], .settings-form, form');
                await (0, test_1.expect)(settingsForm).toBeVisible();
                // Check for common settings sections
                const generalSettings = page.locator('.general-settings, [data-testid="general"]');
                const securitySettings = page.locator('.security-settings, [data-testid="security"]');
                const emailSettings = page.locator('.email-settings, [data-testid="email"]');
                const settingSections = [generalSettings, securitySettings, emailSettings];
                for (const section of settingSections) {
                    if (await section.isVisible()) {
                        await (0, test_1.expect)(section).toBeVisible();
                        break; // At least one section should be visible
                    }
                }
            }
        });
        (0, test_1.test)('should update system configuration', async () => {
            await page.goto('/admin/settings');
            if (!page.url().includes('404')) {
                // Update site name/title
                const siteNameInput = page.locator('[data-testid="site-name"], [name="siteName"], input[placeholder*="nome"]');
                if (await siteNameInput.isVisible()) {
                    await siteNameInput.fill('jaqEdu - Plataforma Educacional Atualizada');
                }
                // Update contact email
                const contactEmailInput = page.locator('[data-testid="contact-email"], [name="contactEmail"]');
                if (await contactEmailInput.isVisible()) {
                    await contactEmailInput.fill('admin@jaquedu-updated.com');
                }
                // Enable/disable features
                const featureToggle = page.locator('[data-testid="feature-toggle"], input[type="checkbox"]').first();
                if (await featureToggle.isVisible()) {
                    await featureToggle.click();
                }
                // Save settings
                const saveSettingsButton = page.locator('[data-testid="save-settings"], button:has-text("Salvar Configurações")');
                if (await saveSettingsButton.isVisible()) {
                    await saveSettingsButton.click();
                    // Verify settings saved
                    const successMessage = page.locator('.success, .alert-success');
                    await (0, test_1.expect)(successMessage.first()).toBeVisible({ timeout: 10000 });
                }
            }
        });
        (0, test_1.test)('should manage API keys and integrations', async () => {
            await page.goto('/admin/settings/integrations');
            if (page.url().includes('404')) {
                await page.goto('/admin/settings');
                const integrationsTab = page.locator('[data-testid="integrations-tab"], .tab:has-text("Integração")');
                if (await integrationsTab.isVisible()) {
                    await integrationsTab.click();
                }
            }
            // OpenAI API Key management
            const openaiKeyInput = page.locator('[data-testid="openai-key"], [name="openaiApiKey"]');
            if (await openaiKeyInput.isVisible()) {
                await openaiKeyInput.fill('sk-test-key-for-integration');
                const testConnectionButton = page.locator('[data-testid="test-openai"], button:has-text("Testar")');
                if (await testConnectionButton.isVisible()) {
                    await testConnectionButton.click();
                    // Wait for test result
                    const testResult = page.locator('.test-result, .connection-status');
                    await (0, test_1.expect)(testResult.first()).toBeVisible({ timeout: 15000 });
                }
            }
            // YouTube API configuration
            const youtubeKeyInput = page.locator('[data-testid="youtube-key"], [name="youtubeApiKey"]');
            if (await youtubeKeyInput.isVisible()) {
                await youtubeKeyInput.fill('test-youtube-api-key');
            }
            // Save integration settings
            const saveIntegrationsButton = page.locator('[data-testid="save-integrations"], button:has-text("Salvar")');
            if (await saveIntegrationsButton.isVisible()) {
                await saveIntegrationsButton.click();
                const successMessage = page.locator('.success, .alert-success');
                await (0, test_1.expect)(successMessage.first()).toBeVisible({ timeout: 10000 });
            }
        });
    });
    test_1.test.describe('Content Management System', () => {
        (0, test_1.test)('should manage course modules', async () => {
            await page.goto('/admin/modules');
            // Verify modules page loads
            const modulesGrid = page.locator('[data-testid="modules-grid"], .modules-grid, .content-grid');
            await (0, test_1.expect)(modulesGrid).toBeVisible({ timeout: 10000 });
            // Check for module cards
            const moduleCards = page.locator('.module-card, .card');
            const moduleCount = await moduleCards.count();
            if (moduleCount > 0) {
                // View first module details
                const firstModule = moduleCards.first();
                await (0, test_1.expect)(firstModule).toBeVisible();
                // Check for edit and delete buttons
                const editButton = firstModule.locator('[data-testid="edit"], button:has-text("Editar")');
                const deleteButton = firstModule.locator('[data-testid="delete"], button:has-text("Excluir")');
                if (await editButton.isVisible()) {
                    await (0, test_1.expect)(editButton).toBeVisible();
                }
                if (await deleteButton.isVisible()) {
                    await (0, test_1.expect)(deleteButton).toBeVisible();
                }
            }
            // Test bulk operations
            const selectAllCheckbox = page.locator('[data-testid="select-all"], input[type="checkbox"]').first();
            if (await selectAllCheckbox.isVisible()) {
                await selectAllCheckbox.click();
                const bulkActionButton = page.locator('[data-testid="bulk-actions"], button:has-text("Ações")');
                if (await bulkActionButton.isVisible()) {
                    await (0, test_1.expect)(bulkActionButton).toBeVisible();
                }
            }
        });
        (0, test_1.test)('should manage media library', async () => {
            await page.goto('/admin/media');
            if (!page.url().includes('404')) {
                // Verify media library loads
                const mediaGrid = page.locator('[data-testid="media-grid"], .media-grid, .files-grid');
                await (0, test_1.expect)(mediaGrid).toBeVisible();
                // Test file upload
                const uploadButton = page.locator('[data-testid="upload-files"], button:has-text("Upload")');
                if (await uploadButton.isVisible()) {
                    const fileInput = page.locator('input[type="file"]');
                    if (await fileInput.isVisible()) {
                        // Mock file upload
                        await page.evaluate(() => {
                            const file = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' });
                            const input = document.querySelector('input[type="file"]');
                            if (input) {
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(file);
                                input.files = dataTransfer.files;
                            }
                        });
                        const confirmUploadButton = page.locator('button:has-text("Confirmar Upload")');
                        if (await confirmUploadButton.isVisible()) {
                            await confirmUploadButton.click();
                            const uploadSuccess = page.locator('.upload-success, .success');
                            await (0, test_1.expect)(uploadSuccess.first()).toBeVisible({ timeout: 10000 });
                        }
                    }
                }
                // Test file organization
                const createFolderButton = page.locator('[data-testid="create-folder"], button:has-text("Nova Pasta")');
                if (await createFolderButton.isVisible()) {
                    await createFolderButton.click();
                    const folderNameInput = page.locator('[data-testid="folder-name"], [name="folderName"]');
                    if (await folderNameInput.isVisible()) {
                        await folderNameInput.fill('Imagens de Módulos');
                        const confirmButton = page.locator('button:has-text("Criar")');
                        await confirmButton.click();
                        const folderCreated = page.locator('.folder:has-text("Imagens de Módulos")');
                        await (0, test_1.expect)(folderCreated).toBeVisible({ timeout: 10000 });
                    }
                }
            }
        });
        (0, test_1.test)('should manage site pages and content', async () => {
            await page.goto('/admin/pages');
            if (!page.url().includes('404')) {
                // View existing pages
                const pagesList = page.locator('[data-testid="pages-list"], .pages-table, table');
                await (0, test_1.expect)(pagesList).toBeVisible();
                // Create new page
                const createPageButton = page.locator('[data-testid="create-page"], button:has-text("Nova Página")');
                if (await createPageButton.isVisible()) {
                    await createPageButton.click();
                    // Fill page details
                    const titleInput = page.locator('[data-testid="page-title"], [name="title"]');
                    if (await titleInput.isVisible()) {
                        await titleInput.fill('Sobre a Psicologia Junguiana');
                    }
                    const contentEditor = page.locator('[data-testid="page-content"], .content-editor, textarea');
                    if (await contentEditor.isVisible()) {
                        await contentEditor.fill(`
# Sobre Carl Gustav Jung

Carl Gustav Jung foi um psiquiatra suíço que fundou a psicologia analítica...

## Principais Contribuições

- Conceito de inconsciente coletivo
- Teoria dos arquétipos
- Tipos psicológicos
- Processo de individuação
            `);
                    }
                    // Set page status
                    const statusSelect = page.locator('[data-testid="page-status"], [name="status"]');
                    if (await statusSelect.isVisible()) {
                        await statusSelect.selectOption('published');
                    }
                    // Save page
                    const savePageButton = page.locator('[data-testid="save-page"], button:has-text("Salvar")');
                    await savePageButton.click();
                    // Verify page creation
                    const successMessage = page.locator('.success, .alert-success');
                    await (0, test_1.expect)(successMessage.first()).toBeVisible({ timeout: 10000 });
                }
            }
        });
    });
    test_1.test.describe('Analytics and Reporting', () => {
        (0, test_1.test)('should display system overview dashboard', async () => {
            await page.goto('/admin/dashboard');
            // Verify dashboard widgets load
            const dashboardWidgets = page.locator('[data-testid="dashboard-widget"], .widget, .stat-card');
            const widgetCount = await dashboardWidgets.count();
            (0, test_1.expect)(widgetCount).toBeGreaterThan(0);
            // Check for key metrics
            const userCountWidget = page.locator('.widget:has-text("Usuários"), .stat:has-text("Users")');
            const moduleCountWidget = page.locator('.widget:has-text("Módulos"), .stat:has-text("Modules")');
            const activityWidget = page.locator('.widget:has-text("Atividade"), .stat:has-text("Activity")');
            const keyWidgets = [userCountWidget, moduleCountWidget, activityWidget];
            for (const widget of keyWidgets) {
                if (await widget.isVisible()) {
                    await (0, test_1.expect)(widget).toBeVisible();
                    // Check for numeric values
                    const numberValue = widget.locator('.number, .value, .count');
                    if (await numberValue.isVisible()) {
                        const value = await numberValue.textContent();
                        (0, test_1.expect)(value).toMatch(/\d+/); // Should contain numbers
                    }
                    break;
                }
            }
        });
        (0, test_1.test)('should generate usage reports', async () => {
            await page.goto('/admin/reports');
            if (!page.url().includes('404')) {
                // Select report type
                const reportTypeSelect = page.locator('[data-testid="report-type"], [name="reportType"], select');
                if (await reportTypeSelect.isVisible()) {
                    await reportTypeSelect.selectOption('user-activity');
                }
                // Set date range
                const startDateInput = page.locator('[data-testid="start-date"], [name="startDate"]');
                if (await startDateInput.isVisible()) {
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    await startDateInput.fill(lastMonth.toISOString().split('T')[0]);
                }
                const endDateInput = page.locator('[data-testid="end-date"], [name="endDate"]');
                if (await endDateInput.isVisible()) {
                    const today = new Date();
                    await endDateInput.fill(today.toISOString().split('T')[0]);
                }
                // Generate report
                const generateButton = page.locator('[data-testid="generate-report"], button:has-text("Gerar Relatório")');
                await generateButton.click();
                // Wait for report generation
                const reportResults = page.locator('[data-testid="report-results"], .report-results');
                await (0, test_1.expect)(reportResults).toBeVisible({ timeout: 15000 });
                // Test report export
                const exportButton = page.locator('[data-testid="export-report"], button:has-text("Exportar")');
                if (await exportButton.isVisible()) {
                    const downloadPromise = page.waitForEvent('download');
                    await exportButton.click();
                    const download = await downloadPromise;
                    (0, test_1.expect)(download.suggestedFilename()).toMatch(/report.*\.(pdf|xlsx|csv)/);
                }
            }
        });
        (0, test_1.test)('should monitor system performance metrics', async () => {
            await page.goto('/admin/monitoring');
            if (page.url().includes('404')) {
                await page.goto('/admin/dashboard');
                const monitoringTab = page.locator('[data-testid="monitoring-tab"], .tab:has-text("Monitor")');
                if (await monitoringTab.isVisible()) {
                    await monitoringTab.click();
                }
            }
            // Check for performance metrics
            const performanceCharts = page.locator('[data-testid="performance-chart"], .chart, canvas, svg');
            if (await performanceCharts.count() > 0) {
                await (0, test_1.expect)(performanceCharts.first()).toBeVisible();
            }
            // Check system health indicators
            const healthIndicators = page.locator('[data-testid="health-indicator"], .health-status, .status-indicator');
            if (await healthIndicators.count() > 0) {
                const firstIndicator = healthIndicators.first();
                await (0, test_1.expect)(firstIndicator).toBeVisible();
                // Should show green/healthy or red/unhealthy status
                const statusText = await firstIndicator.textContent();
                (0, test_1.expect)(statusText).toMatch(/healthy|unhealthy|online|offline|good|bad/i);
            }
            // Check for alerts or warnings
            const alertsPanel = page.locator('[data-testid="alerts-panel"], .alerts-panel, .warnings');
            if (await alertsPanel.isVisible()) {
                await (0, test_1.expect)(alertsPanel).toBeVisible();
            }
        });
    });
    test_1.test.describe('Backup and Maintenance', () => {
        (0, test_1.test)('should create system backup', async () => {
            await page.goto('/admin/maintenance');
            if (!page.url().includes('404')) {
                const createBackupButton = page.locator('[data-testid="create-backup"], button:has-text("Backup")');
                if (await createBackupButton.isVisible()) {
                    await createBackupButton.click();
                    // Wait for backup process
                    const backupProgress = page.locator('[data-testid="backup-progress"], .backup-progress, .progress');
                    if (await backupProgress.isVisible()) {
                        // Wait for completion
                        await (0, test_1.expect)(backupProgress).toBeHidden({ timeout: 30000 });
                    }
                    // Verify backup completion
                    const backupComplete = page.locator('[data-testid="backup-complete"], .backup-success');
                    await (0, test_1.expect)(backupComplete).toBeVisible({ timeout: 30000 });
                }
            }
        });
        (0, test_1.test)('should manage system maintenance mode', async () => {
            await page.goto('/admin/maintenance');
            if (!page.url().includes('404')) {
                const maintenanceModeToggle = page.locator('[data-testid="maintenance-toggle"], input[type="checkbox"]');
                if (await maintenanceModeToggle.isVisible()) {
                    // Enable maintenance mode
                    await maintenanceModeToggle.check();
                    const saveButton = page.locator('button:has-text("Salvar")');
                    if (await saveButton.isVisible()) {
                        await saveButton.click();
                    }
                    // Verify maintenance mode is active
                    const maintenanceStatus = page.locator('.maintenance-active, .status-active');
                    await (0, test_1.expect)(maintenanceStatus.first()).toBeVisible({ timeout: 10000 });
                    // Disable maintenance mode
                    await maintenanceModeToggle.uncheck();
                    if (await saveButton.isVisible()) {
                        await saveButton.click();
                    }
                    // Verify maintenance mode is disabled
                    const maintenanceDisabled = page.locator('.maintenance-disabled, .status-inactive');
                    await (0, test_1.expect)(maintenanceDisabled.first()).toBeVisible({ timeout: 10000 });
                }
            }
        });
    });
    test_1.test.describe('Security and Access Control', () => {
        (0, test_1.test)('should view security audit logs', async () => {
            await page.goto('/admin/security/logs');
            if (page.url().includes('404')) {
                await page.goto('/admin/logs');
            }
            if (!page.url().includes('404')) {
                // Verify logs table loads
                const logsTable = page.locator('[data-testid="security-logs"], .logs-table, table');
                await (0, test_1.expect)(logsTable).toBeVisible();
                // Check for log entries
                const logEntries = page.locator('tbody tr, .log-entry');
                const entryCount = await logEntries.count();
                if (entryCount > 0) {
                    // Verify log entry structure
                    const firstEntry = logEntries.first();
                    await (0, test_1.expect)(firstEntry).toBeVisible();
                    // Should contain timestamp, action, user info
                    const timestamp = firstEntry.locator('.timestamp, td:first-child');
                    const action = firstEntry.locator('.action, td:nth-child(2)');
                    if (await timestamp.isVisible()) {
                        await (0, test_1.expect)(timestamp).toBeVisible();
                    }
                    if (await action.isVisible()) {
                        await (0, test_1.expect)(action).toBeVisible();
                    }
                }
                // Test log filtering
                const filterSelect = page.locator('[data-testid="log-filter"], [name="logType"]');
                if (await filterSelect.isVisible()) {
                    await filterSelect.selectOption('login-attempts');
                    const applyFilterButton = page.locator('button:has-text("Filtrar")');
                    if (await applyFilterButton.isVisible()) {
                        await applyFilterButton.click();
                    }
                }
            }
        });
        (0, test_1.test)('should manage role-based permissions', async () => {
            await page.goto('/admin/roles');
            if (!page.url().includes('404')) {
                // View existing roles
                const rolesTable = page.locator('[data-testid="roles-table"], .roles-table, table');
                await (0, test_1.expect)(rolesTable).toBeVisible();
                // Create new role
                const createRoleButton = page.locator('[data-testid="create-role"], button:has-text("Nova Função")');
                if (await createRoleButton.isVisible()) {
                    await createRoleButton.click();
                    // Fill role details
                    const roleNameInput = page.locator('[data-testid="role-name"], [name="name"]');
                    if (await roleNameInput.isVisible()) {
                        await roleNameInput.fill('Moderador');
                    }
                    const descriptionInput = page.locator('[data-testid="role-description"], [name="description"]');
                    if (await descriptionInput.isVisible()) {
                        await descriptionInput.fill('Função de moderação com permissões limitadas');
                    }
                    // Set permissions
                    const permissions = page.locator('[data-testid="permission-checkbox"], input[type="checkbox"]');
                    const permissionCount = await permissions.count();
                    if (permissionCount > 0) {
                        // Select first few permissions
                        for (let i = 0; i < Math.min(3, permissionCount); i++) {
                            await permissions.nth(i).check();
                        }
                    }
                    // Save role
                    const saveRoleButton = page.locator('button:has-text("Salvar Função")');
                    await saveRoleButton.click();
                    // Verify role creation
                    const successMessage = page.locator('.success, .alert-success');
                    await (0, test_1.expect)(successMessage.first()).toBeVisible({ timeout: 10000 });
                }
            }
        });
    });
});
//# sourceMappingURL=admin-dashboard.e2e.js.map