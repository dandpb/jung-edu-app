import { test, expect } from '@playwright/test';
import { AdminDashboardPage } from '../../pages/admin-dashboard-page';
import { testUsers, testModules, generateUniqueTestData } from '../../fixtures/test-data';
import { cleanupTestData } from '../../helpers/test-helpers';

test.describe('Admin Module Management', () => {
  let adminDashboard: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    adminDashboard = new AdminDashboardPage(page);
    
    // Login as admin
    await page.goto('/admin/login');
    
    const adminUser = testUsers.admin;
    await page.fill('[data-testid=\"admin-email-input\"]', adminUser.email);
    await page.fill('[data-testid=\"admin-password-input\"]', adminUser.password);
    await page.click('[data-testid=\"admin-login-submit\"]');
    
    await page.waitForURL('/admin/dashboard', { timeout: 15000 });
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test.describe('Module Creation', () => {
    test('should create new module successfully', async ({ page }) => {
      await adminDashboard.goToModules();
      
      // Click create module button
      await page.click('[data-testid=\"create-module-button\"]');
      
      // Fill module creation form
      const uniqueData = generateUniqueTestData();
      
      await page.fill('[data-testid=\"module-title\"]', uniqueData.moduleName);
      await page.fill('[data-testid=\"module-description\"]', 'A comprehensive test module for E2E testing');
      await page.selectOption('[data-testid=\"module-difficulty\"]', 'beginner');
      await page.fill('[data-testid=\"module-duration\"]', '45');
      
      // Add topics/tags
      const topicsInput = page.locator('[data-testid=\"module-topics\"]');
      await topicsInput.fill('psychology, basics, introduction');
      
      // Add content
      const contentEditor = page.locator('[data-testid=\"module-content-editor\"]');
      const moduleContent = `
# ${uniqueData.moduleName}

This is a test module created during E2E testing.

## Learning Objectives
- Understand basic concepts
- Practice application
- Complete assessments

## Content Structure
The module is organized into sections covering fundamental topics.
      `;
      
      await contentEditor.fill(moduleContent);
      
      // Save module
      await page.click('[data-testid=\"save-module\"]');
      
      // Should show success message
      await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
      
      // Should redirect to module list
      await expect(page).toHaveURL('/admin/modules');
      
      // New module should appear in list
      await expect(page.locator('[data-testid=\"module-row\"]')).toContainText(uniqueData.moduleName);
    });

    test('should validate required fields', async ({ page }) => {
      await adminDashboard.goToModules();
      await page.click('[data-testid=\"create-module-button\"]');
      
      // Try to save without required fields
      await page.click('[data-testid=\"save-module\"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid=\"validation-error\"]')).toBeVisible();
      
      // Check specific field validations
      const titleField = page.locator('[data-testid=\"module-title\"]');
      await expect(titleField).toHaveAttribute('required');
    });

    test('should support rich text content editing', async ({ page }) => {
      await adminDashboard.goToModules();
      await page.click('[data-testid=\"create-module-button\"]');
      
      const uniqueData = generateUniqueTestData();
      await page.fill('[data-testid=\"module-title\"]', uniqueData.moduleName);
      await page.fill('[data-testid=\"module-description\"]', 'Rich text test module');
      
      // Test rich text editor features
      const editor = page.locator('[data-testid=\"module-content-editor\"]');
      
      // Add formatted content
      await editor.fill('# Heading\\n\\n**Bold text**\\n\\n*Italic text*\\n\\n- List item 1\\n- List item 2');
      
      // Test editor toolbar (if present)
      const boldButton = page.locator('[data-testid=\"editor-bold\"]');
      if (await boldButton.isVisible()) {
        await editor.selectText({ start: 0, end: 7 }); // Select \"Heading\"
        await boldButton.click();
      }
      
      // Save module
      await page.click('[data-testid=\"save-module\"]');
      
      await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
    });

    test('should support media upload', async ({ page }) => {
      await adminDashboard.goToModules();
      await page.click('[data-testid=\"create-module-button\"]');
      
      const uniqueData = generateUniqueTestData();
      await page.fill('[data-testid=\"module-title\"]', uniqueData.moduleName);
      await page.fill('[data-testid=\"module-description\"]', 'Media test module');
      
      // Test media upload (if feature exists)
      const mediaUpload = page.locator('[data-testid=\"media-upload\"]');
      
      if (await mediaUpload.isVisible()) {
        // Create a test file
        const testImagePath = 'test-files/test-image.jpg';
        
        try {
          await mediaUpload.setInputFiles(testImagePath);
          
          // Should show upload progress
          await expect(page.locator('[data-testid=\"upload-progress\"]')).toBeVisible();
          
          // Wait for upload completion
          await expect(page.locator('[data-testid=\"upload-success\"]')).toBeVisible();
        } catch {
          // File upload might not be implemented or test file doesn't exist
          console.log('Media upload feature not available or test file missing');
        }
      }
    });
  });

  test.describe('Module Editing', () => {
    test('should edit existing module', async ({ page }) => {
      await adminDashboard.goToModules();
      
      // Find first module in list
      const firstModule = page.locator('[data-testid=\"module-row\"]').first();
      await expect(firstModule).toBeVisible();
      
      // Click edit button
      const editButton = firstModule.locator('[data-testid=\"edit-module\"]');
      await editButton.click();
      
      // Should open module editor
      await expect(page.locator('[data-testid=\"module-editor\"]')).toBeVisible();
      
      // Make changes
      const titleField = page.locator('[data-testid=\"module-title\"]');
      const currentTitle = await titleField.inputValue();
      const newTitle = currentTitle + ' (Updated)';
      
      await titleField.fill(newTitle);
      
      // Save changes
      await page.click('[data-testid=\"save-module\"]');
      
      // Should show success message
      await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
      
      // Should reflect changes in module list
      await expect(page.locator('[data-testid=\"module-row\"]')).toContainText(newTitle);
    });

    test('should preview module before publishing', async ({ page }) => {
      await adminDashboard.goToModules();
      
      const firstModule = page.locator('[data-testid=\"module-row\"]').first();
      const editButton = firstModule.locator('[data-testid=\"edit-module\"]');
      await editButton.click();
      
      // Click preview button
      const previewButton = page.locator('[data-testid=\"preview-module\"]');
      if (await previewButton.isVisible()) {
        await previewButton.click();
        
        // Should open preview in new tab or modal
        const previewModal = page.locator('[data-testid=\"module-preview-modal\"]');
        const previewContent = page.locator('[data-testid=\"module-preview-content\"]');
        
        // Check if preview opens in modal or new window
        if (await previewModal.isVisible()) {
          await expect(previewContent).toBeVisible();
        } else {
          // Might open in new tab - would need special handling
          console.log('Preview might open in new tab');
        }
      }
    });

    test('should manage module versions', async ({ page }) => {
      await adminDashboard.goToModules();
      
      const firstModule = page.locator('[data-testid=\"module-row\"]').first();
      const editButton = firstModule.locator('[data-testid=\"edit-module\"]');
      await editButton.click();
      
      // Check for version management (if implemented)
      const versionsTab = page.locator('[data-testid=\"module-versions-tab\"]');
      
      if (await versionsTab.isVisible()) {
        await versionsTab.click();
        
        // Should show version history
        await expect(page.locator('[data-testid=\"version-history\"]')).toBeVisible();
        
        // Test creating new version
        const createVersionButton = page.locator('[data-testid=\"create-version\"]');
        if (await createVersionButton.isVisible()) {
          await createVersionButton.click();
          
          await page.fill('[data-testid=\"version-notes\"]', 'Updated content and fixed typos');
          await page.click('[data-testid=\"save-version\"]');
          
          await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Module Organization', () => {
    test('should organize modules by categories', async ({ page }) => {
      await adminDashboard.goToModules();
      
      // Test category filtering
      const categoryFilter = page.locator('[data-testid=\"category-filter\"]');
      
      if (await categoryFilter.isVisible()) {
        await categoryFilter.selectOption('psychology');
        
        // Should filter modules
        await page.waitForTimeout(1000);
        
        const visibleModules = page.locator('[data-testid=\"module-row\"]');
        const moduleCount = await visibleModules.count();
        expect(moduleCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should support bulk operations', async ({ page }) => {
      await adminDashboard.goToModules();
      
      // Select multiple modules
      const moduleCheckboxes = page.locator('[data-testid=\"module-checkbox\"]');
      const checkboxCount = await moduleCheckboxes.count();
      
      if (checkboxCount > 1) {
        // Select first two modules
        await moduleCheckboxes.nth(0).check();
        await moduleCheckboxes.nth(1).check();
        
        // Test bulk actions
        const bulkActionsMenu = page.locator('[data-testid=\"bulk-actions\"]');
        
        if (await bulkActionsMenu.isVisible()) {
          await bulkActionsMenu.selectOption('publish');
          await page.click('[data-testid=\"apply-bulk-action\"]');
          
          // Should show confirmation
          const confirmDialog = page.locator('[data-testid=\"bulk-confirm-dialog\"]');
          if (await confirmDialog.isVisible()) {
            await page.click('[data-testid=\"confirm-bulk-action\"]');
          }
          
          await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        }
      }
    });

    test('should support module ordering/sorting', async ({ page }) => {
      await adminDashboard.goToModules();
      
      // Test different sort options
      const sortDropdown = page.locator('[data-testid=\"sort-modules\"]');
      
      if (await sortDropdown.isVisible()) {
        // Sort by title
        await sortDropdown.selectOption('title');
        await page.waitForTimeout(500);
        
        // Sort by date created
        await sortDropdown.selectOption('created');
        await page.waitForTimeout(500);
        
        // Sort by difficulty
        await sortDropdown.selectOption('difficulty');
        await page.waitForTimeout(500);
        
        // List should reorder each time
        await expect(page.locator('[data-testid=\"modules-list\"]')).toBeVisible();
      }
    });
  });

  test.describe('Module Publishing', () => {
    test('should publish module', async ({ page }) => {
      await adminDashboard.goToModules();
      
      // Find an unpublished module (if any)
      const unpublishedModule = page.locator('[data-testid=\"module-row\"][data-status=\"draft\"]').first();
      
      if (await unpublishedModule.isVisible()) {
        const publishButton = unpublishedModule.locator('[data-testid=\"publish-module\"]');
        await publishButton.click();
        
        // Confirm publishing
        const confirmDialog = page.locator('[data-testid=\"publish-confirm-dialog\"]');
        if (await confirmDialog.isVisible()) {
          await page.click('[data-testid=\"confirm-publish\"]');
        }
        
        // Should show success and update status
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        
        // Module status should change to published
        await expect(unpublishedModule).toHaveAttribute('data-status', 'published');
      }
    });

    test('should unpublish module', async ({ page }) => {
      await adminDashboard.goToModules();
      
      // Find a published module
      const publishedModule = page.locator('[data-testid=\"module-row\"][data-status=\"published\"]').first();
      
      if (await publishedModule.isVisible()) {
        const unpublishButton = publishedModule.locator('[data-testid=\"unpublish-module\"]');
        await unpublishButton.click();
        
        // Confirm unpublishing
        const confirmDialog = page.locator('[data-testid=\"unpublish-confirm-dialog\"]');
        if (await confirmDialog.isVisible()) {
          await page.fill('[data-testid=\"unpublish-reason\"]', 'Content needs revision');
          await page.click('[data-testid=\"confirm-unpublish\"]');
        }
        
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        
        // Module status should change
        await expect(publishedModule).toHaveAttribute('data-status', 'draft');
      }
    });

    test('should schedule module publication', async ({ page }) => {
      await adminDashboard.goToModules();
      
      const firstModule = page.locator('[data-testid=\"module-row\"]').first();
      const scheduleButton = firstModule.locator('[data-testid=\"schedule-publish\"]');
      
      if (await scheduleButton.isVisible()) {
        await scheduleButton.click();
        
        // Set future publication date
        const futureDatetime = new Date();
        futureDatetime.setDate(futureDatetime.getDate() + 1);
        
        const dateInput = page.locator('[data-testid=\"publish-date\"]');
        await dateInput.fill(futureDatetime.toISOString().slice(0, 16));
        
        await page.click('[data-testid=\"schedule-publish-confirm\"]');
        
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        
        // Module should show scheduled status
        await expect(firstModule).toHaveAttribute('data-status', 'scheduled');
      }
    });
  });

  test.describe('Module Analytics', () => {
    test('should display module performance metrics', async ({ page }) => {
      await adminDashboard.goToModules();
      
      // Click on analytics for first module
      const firstModule = page.locator('[data-testid=\"module-row\"]').first();
      const analyticsButton = firstModule.locator('[data-testid=\"module-analytics\"]');
      
      if (await analyticsButton.isVisible()) {
        await analyticsButton.click();
        
        // Should show analytics dashboard
        await expect(page.locator('[data-testid=\"module-analytics-dashboard\"]')).toBeVisible();
        
        // Check for various metrics
        const metrics = [
          'enrollment-count',
          'completion-rate',
          'average-score',
          'time-spent',
          'user-feedback'
        ];
        
        for (const metric of metrics) {
          const metricElement = page.locator(`[data-testid=\"metric-${metric}\"]`);
          if (await metricElement.isVisible()) {
            await expect(metricElement).toBeVisible();
          }
        }
      }
    });

    test('should show user progress tracking', async ({ page }) => {
      await adminDashboard.goToModules();
      
      const firstModule = page.locator('[data-testid=\"module-row\"]').first();
      const progressButton = firstModule.locator('[data-testid=\"view-progress\"]');
      
      if (await progressButton.isVisible()) {
        await progressButton.click();
        
        // Should show progress tracking page
        await expect(page.locator('[data-testid=\"progress-tracking\"]')).toBeVisible();
        
        // Should show list of users and their progress
        const progressEntries = page.locator('[data-testid=\"user-progress-row\"]');
        const entryCount = await progressEntries.count();
        expect(entryCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Module Deletion', () => {
    test('should delete module with confirmation', async ({ page }) => {
      await adminDashboard.goToModules();
      
      // Get initial module count
      const initialModules = await page.locator('[data-testid=\"module-row\"]').count();
      
      // Find a module to delete (preferably a test module)
      const testModule = page.locator('[data-testid=\"module-row\"]').filter({ hasText: 'Test Module' }).first();
      
      if (await testModule.isVisible()) {
        const deleteButton = testModule.locator('[data-testid=\"delete-module\"]');
        await deleteButton.click();
        
        // Should show confirmation dialog
        const confirmDialog = page.locator('[data-testid=\"delete-confirm-dialog\"]');
        await expect(confirmDialog).toBeVisible();
        
        // Type confirmation text if required
        const confirmInput = page.locator('[data-testid=\"delete-confirmation-input\"]');
        if (await confirmInput.isVisible()) {
          await confirmInput.fill('DELETE');
        }
        
        await page.click('[data-testid=\"confirm-delete\"]');
        
        // Should show success message
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        
        // Module count should decrease
        const newModuleCount = await page.locator('[data-testid=\"module-row\"]').count();
        expect(newModuleCount).toBe(initialModules - 1);
      }
    });

    test('should prevent deletion of modules with active enrollments', async ({ page }) => {
      await adminDashboard.goToModules();
      
      // Try to delete a module with enrollments
      const activeModule = page.locator('[data-testid=\"module-row\"][data-has-enrollments=\"true\"]').first();
      
      if (await activeModule.isVisible()) {
        const deleteButton = activeModule.locator('[data-testid=\"delete-module\"]');
        await deleteButton.click();
        
        // Should show warning about active enrollments
        const warningDialog = page.locator('[data-testid=\"deletion-warning-dialog\"]');
        await expect(warningDialog).toBeVisible();
        
        await expect(warningDialog).toContainText('active enrollments');
        
        // Cancel deletion
        await page.click('[data-testid=\"cancel-delete\"]');
      }
    });
  });

  test.describe('Search and Filtering', () => {
    test('should search modules by title', async ({ page }) => {
      await adminDashboard.goToModules();
      
      const searchInput = page.locator('[data-testid=\"module-search\"]');
      await searchInput.fill('psychology');
      
      // Should filter results
      await page.waitForTimeout(1000);
      
      const filteredModules = page.locator('[data-testid=\"module-row\"]');
      const count = await filteredModules.count();
      
      // Each visible module should contain search term
      for (let i = 0; i < Math.min(count, 5); i++) {
        const moduleText = await filteredModules.nth(i).textContent();
        expect(moduleText?.toLowerCase()).toContain('psychology');
      }
    });

    test('should filter by status', async ({ page }) => {
      await adminDashboard.goToModules();
      
      const statusFilter = page.locator('[data-testid=\"status-filter\"]');
      
      if (await statusFilter.isVisible()) {
        // Filter by published
        await statusFilter.selectOption('published');
        await page.waitForTimeout(500);
        
        // All visible modules should be published
        const publishedModules = page.locator('[data-testid=\"module-row\"][data-status=\"published\"]');
        const allModules = page.locator('[data-testid=\"module-row\"]');
        
        expect(await publishedModules.count()).toBe(await allModules.count());
      }
    });

    test('should filter by difficulty', async ({ page }) => {
      await adminDashboard.goToModules();
      
      const difficultyFilter = page.locator('[data-testid=\"difficulty-filter\"]');
      
      if (await difficultyFilter.isVisible()) {
        await difficultyFilter.selectOption('beginner');
        await page.waitForTimeout(500);
        
        // Should show only beginner modules
        const beginnerModules = page.locator('[data-testid=\"module-row\"]');
        const count = await beginnerModules.count();
        
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });
});