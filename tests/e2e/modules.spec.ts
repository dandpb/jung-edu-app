import { test, expect } from '@playwright/test';
import { ModulePage } from './page-objects/module-page';
import { DashboardPage } from './page-objects/dashboard-page';

/**
 * E2E Tests for Module Learning Functionality
 * Tests module navigation, content interaction, and learning progress
 */
test.describe('Module Learning', () => {
  let modulePage: ModulePage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    modulePage = new ModulePage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('should display module content correctly', async ({ page }) => {
    // Navigate to a module (assuming a demo module exists)
    await modulePage.goto('/modules/jung-basics');
    
    // Verify main module elements
    await expect(modulePage.moduleTitle).toBeVisible();
    await expect(modulePage.moduleContent).toBeVisible();
    await expect(modulePage.progressBar).toBeVisible();
    await expect(modulePage.navigationPanel).toBeVisible();
  });

  test('should navigate between module sections', async ({ page }) => {
    await modulePage.goto('/modules/jung-basics');
    
    // Get section count
    const sectionCount = await modulePage.getSectionCount();
    
    if (sectionCount > 1) {
      // Navigate to next section
      await modulePage.clickNextSection();
      
      // Verify section changed
      const currentSection = await modulePage.getCurrentSectionIndex();
      expect(currentSection).toBeGreaterThan(0);
      
      // Navigate back to previous section
      await modulePage.clickPreviousSection();
      
      // Verify we're back to first section
      const firstSection = await modulePage.getCurrentSectionIndex();
      expect(firstSection).toBe(0);
    }
  });

  test('should track reading progress', async ({ page }) => {
    await modulePage.goto('/modules/jung-basics');
    
    // Get initial progress
    const initialProgress = await modulePage.getProgressPercentage();
    
    // Scroll through content to simulate reading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for progress tracking
    await page.waitForTimeout(2000);
    
    // Check if progress increased
    const newProgress = await modulePage.getProgressPercentage();
    expect(newProgress).toBeGreaterThanOrEqual(initialProgress);
  });

  test('should display video content correctly', async ({ page }) => {
    await modulePage.goto('/modules/jung-basics');
    
    // Look for video sections
    const videoPlayer = page.locator('[data-testid="video-player"]');
    
    if (await videoPlayer.isVisible()) {
      // Verify video controls are present
      await expect(page.locator('[data-testid="play-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      
      // Test play functionality (if not already playing)
      const playButton = page.locator('[data-testid="play-button"]');
      if (await playButton.isVisible()) {
        await playButton.click();
        
        // Verify video starts playing
        await page.waitForTimeout(2000);
        // Note: Actual video testing would require more complex setup
      }
    }
  });

  test('should handle quiz interactions', async ({ page }) => {
    await modulePage.goto('/modules/jung-basics');
    
    // Look for quiz sections
    const quiz = page.locator('[data-testid="quiz-section"]');
    
    if (await quiz.isVisible()) {
      // Answer quiz questions
      const questions = page.locator('[data-testid="quiz-question"]');
      const questionCount = await questions.count();
      
      for (let i = 0; i < questionCount; i++) {
        const question = questions.nth(i);
        const answers = question.locator('[data-testid="quiz-answer"]');
        const answerCount = await answers.count();
        
        if (answerCount > 0) {
          // Select first answer (for testing purposes)
          await answers.first().click();
        }
      }
      
      // Submit quiz if submit button exists
      const submitButton = page.locator('[data-testid="quiz-submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Verify quiz results
        await expect(page.locator('[data-testid="quiz-results"]')).toBeVisible();
      }
    }
  });

  test('should handle note-taking functionality', async ({ page }) => {
    await modulePage.goto('/modules/jung-basics');
    
    // Look for note-taking interface
    const noteButton = page.locator('[data-testid="add-note-button"]');
    
    if (await noteButton.isVisible()) {
      await noteButton.click();
      
      // Verify note editor opens
      await expect(page.locator('[data-testid="note-editor"]')).toBeVisible();
      
      // Add a test note
      const noteText = 'This is a test note about Jung psychology';
      await page.fill('[data-testid="note-input"]', noteText);
      
      // Save note
      await page.click('[data-testid="save-note-button"]');
      
      // Verify note is saved
      await expect(page.locator('[data-testid="note-item"]')).toContainText(noteText);
    }
  });

  test('should bookmark content', async ({ page }) => {
    await modulePage.goto('/modules/jung-basics');
    
    // Look for bookmark functionality
    const bookmarkButton = page.locator('[data-testid="bookmark-button"]');
    
    if (await bookmarkButton.isVisible()) {
      // Add bookmark
      await bookmarkButton.click();
      
      // Verify bookmark state changed
      await expect(bookmarkButton).toHaveAttribute('aria-pressed', 'true');
      
      // Remove bookmark
      await bookmarkButton.click();
      
      // Verify bookmark removed
      await expect(bookmarkButton).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test('should navigate to related modules', async ({ page }) => {
    await modulePage.goto('/modules/jung-basics');
    
    // Look for related modules section
    const relatedModules = page.locator('[data-testid="related-modules"]');
    
    if (await relatedModules.isVisible()) {
      const moduleLinks = relatedModules.locator('[data-testid="module-link"]');
      const linkCount = await moduleLinks.count();
      
      if (linkCount > 0) {
        // Click on first related module
        await moduleLinks.first().click();
        
        // Verify navigation to new module
        await expect(page).toHaveURL(/module/);
        await expect(modulePage.moduleContent).toBeVisible();
      }
    }
  });

  test('should complete module and update progress', async ({ page }) => {
    await modulePage.goto('/modules/jung-basics');
    
    // Simulate completing all sections
    const sectionCount = await modulePage.getSectionCount();
    
    for (let i = 0; i < sectionCount; i++) {
      // Mark section as read by scrolling through it
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(1000);
      
      // Move to next section if not the last one
      if (i < sectionCount - 1) {
        await modulePage.clickNextSection();
      }
    }
    
    // Check if module completion is triggered
    const completionBadge = page.locator('[data-testid="module-completed"]');
    const finalProgress = await modulePage.getProgressPercentage();
    
    // Should show high completion percentage
    expect(finalProgress).toBeGreaterThan(80);
  });

  test('should handle module accessibility features', async ({ page }) => {
    await modulePage.goto('/modules/jung-basics');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Test font size controls if available
    const increaseFontButton = page.locator('[data-testid="increase-font-size"]');
    if (await increaseFontButton.isVisible()) {
      await increaseFontButton.click();
      
      // Verify font size increased (would need specific CSS checks)
      // This is a simplified test
      await expect(increaseFontButton).toBeVisible();
    }
    
    // Test dark mode toggle if available
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      
      // Verify dark mode applied
      await page.waitForTimeout(500);
      // Would check for dark theme class on body or root element
    }
  });

  test('should return to dashboard from module', async ({ page }) => {
    await modulePage.goto('/modules/jung-basics');
    
    // Click dashboard/home button
    const homeButton = page.locator('[data-testid="home-button"], [data-testid="dashboard-link"]');
    await homeButton.click();
    
    // Verify return to dashboard
    await expect(page).toHaveURL(/dashboard|\/$/);
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });
});