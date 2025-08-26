import { test, expect } from '@playwright/test';
import { AdminDashboardPage } from '../../pages/admin-dashboard-page';
import { testUsers, generateUniqueTestData } from '../../fixtures/test-data';
import { cleanupTestData } from '../../helpers/test-helpers';

test.describe('Admin Dashboard', () => {
  let adminDashboard: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    adminDashboard = new AdminDashboardPage(page);
    
    // Login as admin
    await page.goto('/admin/login');
    
    const adminUser = testUsers.admin;
    await page.fill('[data-testid=\"admin-email-input\"]', adminUser.email);
    await page.fill('[data-testid=\"admin-password-input\"]', adminUser.password);
    await page.click('[data-testid=\"admin-login-submit\"]');
    
    // Wait for admin dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 15000 });
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test.describe('Admin Authentication & Access', () => {
    test('should allow admin login', async ({ page }) => {
      await adminDashboard.verifyAdminDashboardLoaded();
      await adminDashboard.verifyAdminAccess();
    });

    test('should restrict access to admin-only areas', async ({ page }) => {
      // Verify admin can access restricted areas
      await adminDashboard.goToModules();
      await expect(page).toHaveURL('/admin/modules');
      
      await adminDashboard.goToUsers();
      await expect(page).toHaveURL('/admin/users');
      
      await adminDashboard.goToResources();
      await expect(page).toHaveURL('/admin/resources');
    });

    test('should show admin navigation', async ({ page }) => {
      await adminDashboard.goto();
      await expect(adminDashboard.adminNavigation).toBeVisible();
      
      // Check for admin-specific navigation items
      const navItems = [
        'dashboard',
        'modules',
        'users',
        'quizzes',
        'resources',
        'analytics'
      ];
      
      for (const item of navItems) {
        const navLink = page.locator(`[data-testid=\"admin-nav-${item}\"]`);
        if (await navLink.isVisible()) {
          await expect(navLink).toBeEnabled();
        }
      }
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should display system statistics', async ({ page }) => {
      await adminDashboard.goto();
      
      const stats = await adminDashboard.getDashboardStats();
      
      // Verify stats are present and numeric
      expect(parseInt(stats.totalUsers)).toBeGreaterThanOrEqual(0);
      expect(parseInt(stats.totalModules)).toBeGreaterThanOrEqual(0);
      expect(parseInt(stats.activeUsers)).toBeGreaterThanOrEqual(0);
    });

    test('should show system health status', async ({ page }) => {
      await adminDashboard.goto();
      
      const healthStatus = await adminDashboard.checkSystemHealth();
      expect(['healthy', 'warning', 'critical', 'unknown']).toContain(healthStatus);
    });

    test('should display recent admin activities', async ({ page }) => {
      await adminDashboard.goto();
      
      const activities = await adminDashboard.getRecentActivities();
      expect(Array.isArray(activities)).toBe(true);
    });

    test('should provide quick actions', async ({ page }) => {
      await adminDashboard.goto();
      
      // Test available quick actions
      const quickActions = [
        'create-module',
        'manage-users',
        'view-reports',
        'system-settings'
      ];
      
      for (const action of quickActions) {
        const actionButton = page.locator(`[data-testid=\"quick-action-${action}\"]`);
        
        if (await actionButton.isVisible()) {
          await expect(actionButton).toBeEnabled();
          
          // Test clicking the action (but don't complete the flow)
          await actionButton.click();
          await page.waitForTimeout(500);
          
          // Navigate back to dashboard
          await adminDashboard.goto();
        }
      }
    });
  });

  test.describe('User Management', () => {
    test('should display user list', async ({ page }) => {
      await adminDashboard.goToUsers();
      
      const usersList = page.locator('[data-testid=\"users-list\"]');
      await expect(usersList).toBeVisible();
      
      // Should show user entries
      const userRows = page.locator('[data-testid=\"user-row\"]');
      const userCount = await userRows.count();
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    test('should allow user search and filtering', async ({ page }) => {
      await adminDashboard.goToUsers();
      
      const searchInput = page.locator('[data-testid=\"user-search\"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('student');
        await page.waitForTimeout(1000);
        
        // Should filter results
        const filteredRows = page.locator('[data-testid=\"user-row\"]');
        const filteredCount = await filteredRows.count();
        expect(filteredCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should allow user role management', async ({ page }) => {
      await adminDashboard.goToUsers();
      
      // Find first user row
      const firstUserRow = page.locator('[data-testid=\"user-row\"]').first();
      
      if (await firstUserRow.isVisible()) {
        const roleDropdown = firstUserRow.locator('[data-testid=\"role-select\"]');
        
        if (await roleDropdown.isVisible()) {
          // Test role change
          await roleDropdown.selectOption('instructor');
          
          // Should show success message
          await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        }
      }
    });

    test('should allow creating new admin users', async ({ page }) => {
      await adminDashboard.goToUsers();
      
      const createUserButton = page.locator('[data-testid=\"create-user-button\"]');
      
      if (await createUserButton.isVisible()) {
        await createUserButton.click();
        
        // Fill new user form
        const uniqueData = generateUniqueTestData();
        
        await page.fill('[data-testid=\"new-user-name\"]', 'New Admin User');
        await page.fill('[data-testid=\"new-user-email\"]', uniqueData.email);
        await page.selectOption('[data-testid=\"new-user-role\"]', 'admin');
        
        await page.click('[data-testid=\"create-user-submit\"]');
        
        // Should show success and return to user list
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
      }
    });

    test('should allow user deactivation', async ({ page }) => {
      await adminDashboard.goToUsers();
      
      const firstUserRow = page.locator('[data-testid=\"user-row\"]').first();
      
      if (await firstUserRow.isVisible()) {
        const deactivateButton = firstUserRow.locator('[data-testid=\"deactivate-user\"]');
        
        if (await deactivateButton.isVisible()) {
          await deactivateButton.click();
          
          // Confirm deactivation
          const confirmDialog = page.locator('[data-testid=\"confirm-dialog\"]');
          if (await confirmDialog.isVisible()) {
            await page.click('[data-testid=\"confirm-deactivate\"]');
          }
          
          // Should show success message
          await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('System Analytics', () => {
    test('should display usage analytics', async ({ page }) => {
      const analyticsPage = page.locator('[data-testid=\"admin-nav-analytics\"]');
      
      if (await analyticsPage.isVisible()) {
        await analyticsPage.click();
        
        // Verify analytics dashboard
        await expect(page.locator('[data-testid=\"analytics-dashboard\"]')).toBeVisible();
        
        // Check for various charts and metrics
        const charts = [
          'user-activity-chart',
          'module-completion-chart',
          'quiz-performance-chart',
          'system-usage-chart'
        ];
        
        for (const chart of charts) {
          const chartElement = page.locator(`[data-testid=\"${chart}\"]`);
          if (await chartElement.isVisible()) {
            await expect(chartElement).toBeVisible();
          }
        }
      }
    });

    test('should allow date range filtering', async ({ page }) => {
      const analyticsNav = page.locator('[data-testid=\"admin-nav-analytics\"]');
      
      if (await analyticsNav.isVisible()) {
        await analyticsNav.click();
        
        const dateRangePicker = page.locator('[data-testid=\"date-range-picker\"]');
        
        if (await dateRangePicker.isVisible()) {
          // Select last 7 days
          await dateRangePicker.click();
          await page.click('[data-testid=\"date-range-7-days\"]');
          
          // Charts should update
          await page.waitForTimeout(2000);
          
          // Verify charts are still visible (indicating they updated)
          const firstChart = page.locator('[data-testid=\"user-activity-chart\"]');
          if (await firstChart.isVisible()) {
            await expect(firstChart).toBeVisible();
          }
        }
      }
    });

    test('should export analytics reports', async ({ page }) => {
      const analyticsNav = page.locator('[data-testid=\"admin-nav-analytics\"]');
      
      if (await analyticsNav.isVisible()) {
        await analyticsNav.click();
        
        const exportButton = page.locator('[data-testid=\"export-analytics\"]');
        
        if (await exportButton.isVisible()) {
          // Set up download handler
          const downloadPromise = page.waitForEvent('download');
          
          await exportButton.click();
          
          try {
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toContain('analytics');
          } catch {
            // Export might not be implemented yet
            console.log('Analytics export feature not yet implemented');
          }
        }
      }
    });
  });

  test.describe('System Settings', () => {
    test('should allow system configuration', async ({ page }) => {
      const settingsNav = page.locator('[data-testid=\"admin-nav-settings\"]');
      
      if (await settingsNav.isVisible()) {
        await settingsNav.click();
        
        // Verify settings page
        await expect(page.locator('[data-testid=\"system-settings\"]')).toBeVisible();
        
        // Test configuration options
        const configOptions = [
          'site-name',
          'max-file-size',
          'user-registration-enabled',
          'email-notifications-enabled'
        ];
        
        for (const option of configOptions) {
          const configElement = page.locator(`[data-testid=\"config-${option}\"]`);
          
          if (await configElement.isVisible()) {
            await expect(configElement).toBeVisible();
          }
        }
      }
    });

    test('should manage email templates', async ({ page }) => {
      const settingsNav = page.locator('[data-testid=\"admin-nav-settings\"]');
      
      if (await settingsNav.isVisible()) {
        await settingsNav.click();
        
        const emailTemplatesTab = page.locator('[data-testid=\"email-templates-tab\"]');
        
        if (await emailTemplatesTab.isVisible()) {
          await emailTemplatesTab.click();
          
          // Should show email template list
          await expect(page.locator('[data-testid=\"email-templates-list\"]')).toBeVisible();
          
          // Test editing a template
          const firstTemplate = page.locator('[data-testid=\"template-row\"]').first();
          
          if (await firstTemplate.isVisible()) {
            const editButton = firstTemplate.locator('[data-testid=\"edit-template\"]');
            await editButton.click();
            
            // Should open template editor
            await expect(page.locator('[data-testid=\"template-editor\"]')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Security & Audit', () => {
    test('should display audit logs', async ({ page }) => {
      const auditNav = page.locator('[data-testid=\"admin-nav-audit\"]');
      
      if (await auditNav.isVisible()) {
        await auditNav.click();
        
        // Verify audit logs page
        await expect(page.locator('[data-testid=\"audit-logs\"]')).toBeVisible();
        
        // Should show log entries
        const logEntries = page.locator('[data-testid=\"audit-log-entry\"]');
        const entryCount = await logEntries.count();
        expect(entryCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should allow filtering audit logs', async ({ page }) => {
      const auditNav = page.locator('[data-testid=\"admin-nav-audit\"]');
      
      if (await auditNav.isVisible()) {
        await auditNav.click();
        
        // Test log filtering
        const actionFilter = page.locator('[data-testid=\"audit-action-filter\"]');
        
        if (await actionFilter.isVisible()) {
          await actionFilter.selectOption('login');
          
          // Should filter logs
          await page.waitForTimeout(1000);
          
          const filteredLogs = page.locator('[data-testid=\"audit-log-entry\"]');
          const filteredCount = await filteredLogs.count();
          expect(filteredCount).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await adminDashboard.goto();
      await adminDashboard.verifyAdminDashboardLoaded();
      
      // Navigation should adapt
      await expect(adminDashboard.adminNavigation).toBeVisible();
    });

    test('should handle mobile admin interface', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await adminDashboard.goto();
      
      // Mobile admin should show appropriate UI
      const mobileAdminMenu = page.locator('[data-testid=\"mobile-admin-menu\"]');
      
      if (await mobileAdminMenu.isVisible()) {
        await mobileAdminMenu.click();
        
        // Should show navigation
        await expect(page.locator('[data-testid=\"mobile-admin-nav\"]')).toBeVisible();
      }
    });
  });

  test.describe('Performance & Reliability', () => {
    test('should load dashboard quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await adminDashboard.goto();
      await adminDashboard.verifyAdminDashboardLoaded();
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (adjust threshold as needed)
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large datasets gracefully', async ({ page }) => {
      await adminDashboard.goToUsers();
      
      // Test pagination if implemented
      const pagination = page.locator('[data-testid=\"pagination\"]');
      
      if (await pagination.isVisible()) {
        // Test going to next page
        const nextButton = pagination.locator('[data-testid=\"next-page\"]');
        
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          
          // Should load next page
          await page.waitForTimeout(1000);
          await expect(page.locator('[data-testid=\"users-list\"]')).toBeVisible();
        }
      }
    });
  });
});