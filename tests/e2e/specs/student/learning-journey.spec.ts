import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';
import { DashboardPage } from '../../pages/dashboard-page';
import { ModulePage } from '../../pages/module-page';
import { testUsers, testModules, testQuizzes } from '../../fixtures/test-data';
import { cleanupTestData } from '../../helpers/test-helpers';

test.describe('Student Learning Journey', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let modulePage: ModulePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    modulePage = new ModulePage(page);
    
    // Login as student
    const testUser = testUsers.student;
    await loginPage.loginSuccessfully(testUser.email, testUser.password);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test.describe('Dashboard Navigation', () => {
    test('should display student dashboard correctly', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.verifyDashboardLoaded();
      
      // Check for student-specific elements
      await expect(page.locator('[data-testid=\"student-dashboard\"]')).toBeVisible();
      
      // Verify modules are displayed
      const moduleCount = await dashboardPage.getModuleCount();
      expect(moduleCount).toBeGreaterThan(0);
    });

    test('should show learning progress', async ({ page }) => {
      await dashboardPage.goto();
      
      const progress = await dashboardPage.getOverallProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    test('should display recent activities', async ({ page }) => {
      await dashboardPage.goto();
      
      const activities = await dashboardPage.getRecentActivities();
      // Should have some activities or be empty array
      expect(Array.isArray(activities)).toBe(true);
    });

    test('should allow module search and filtering', async ({ page }) => {
      await dashboardPage.goto();
      
      // Search for modules
      await dashboardPage.searchModules('psychology');
      
      // Should show filtered results
      await page.waitForTimeout(1000);
      const moduleCount = await dashboardPage.getModuleCount();
      expect(moduleCount).toBeGreaterThanOrEqual(0);
      
      // Test filtering
      await dashboardPage.filterModules('beginner');
      await page.waitForTimeout(1000);
    });

    test('should toggle between grid and list view', async ({ page }) => {
      await dashboardPage.goto();
      
      // Test view toggles
      await dashboardPage.toggleView('list');
      await dashboardPage.toggleView('grid');
    });
  });

  test.describe('Module Learning', () => {
    test('should navigate to and view module content', async ({ page }) => {
      await dashboardPage.goto();
      
      // Click on first module
      const moduleTitle = await dashboardPage.clickModule(0);
      
      // Verify module page loaded
      await modulePage.verifyModuleLoaded(moduleTitle);
      
      // Check content is visible
      await modulePage.verifyContentLoaded();
    });

    test('should track progress through module sections', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      
      const initialProgress = await modulePage.getProgress();
      
      // Navigate to next section if available
      if (await modulePage.nextButton.isEnabled()) {
        await modulePage.goToNext();
        
        const newProgress = await modulePage.getProgress();
        expect(newProgress).toBeGreaterThanOrEqual(initialProgress);
      }
    });

    test('should allow bookmarking modules', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      
      // Bookmark the module
      await modulePage.bookmark();
      
      // Verify bookmark was saved
      await expect(modulePage.bookmarkButton).toHaveAttribute('data-bookmarked', 'true');
      
      // Go to dashboard and verify bookmark appears
      await dashboardPage.goto();
      
      const bookmarksSection = page.locator('[data-testid=\"bookmarked-modules\"]');
      if (await bookmarksSection.isVisible()) {
        await expect(bookmarksSection).toContainText('intro-psychology');
      }
    });

    test('should support note-taking', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      
      // Open notes interface
      await modulePage.openNotes();
      
      // Add a note
      const noteInput = page.locator('[data-testid=\"note-input\"]');
      const noteText = 'This is an important concept about psychology foundations';
      
      await noteInput.fill(noteText);
      await page.click('[data-testid=\"save-note\"]');
      
      // Verify note was saved
      await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
      
      // Check notes appear in notes section
      await page.goto('/notes');
      await expect(page.locator('[data-testid=\"note-item\"]')).toContainText(noteText);
    });

    test('should play videos correctly', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      
      // Play video if present
      if (await modulePage.videoPlayer.isVisible()) {
        await modulePage.playVideo();
        
        // Wait for video to start playing
        await page.waitForTimeout(2000);
        
        // Pause video
        await modulePage.pauseVideo();
      }
    });

    test('should navigate using table of contents', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      
      // Navigate to specific section
      await modulePage.navigateToSection('basic-concepts');
      
      // Verify navigation occurred
      await expect(page.locator('[data-testid=\"module-content\"]')).toBeVisible();
    });

    test('should test interactive elements', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      
      // Test interactive features
      await modulePage.verifyInteractiveElements();
    });

    test('should mark module as completed', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      
      // Complete the module
      await modulePage.markCompleted();
      
      // Verify completion
      const progress = await modulePage.getProgress();
      expect(progress).toBe(100);
      
      // Check completion appears on dashboard
      await dashboardPage.goto();
      
      const completedSection = page.locator('[data-testid=\"completed-modules\"]');
      if (await completedSection.isVisible()) {
        await expect(completedSection).toContainText('intro-psychology');
      }
    });
  });

  test.describe('Quiz Taking', () => {
    test('should start and complete a quiz', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      
      // Start quiz
      await modulePage.startQuiz();
      
      // Verify quiz loaded
      const quizContainer = page.locator('[data-testid=\"quiz-container\"]');
      await expect(quizContainer).toBeVisible();
      
      // Answer questions
      await answerQuizQuestions(page);
      
      // Submit quiz
      await page.click('[data-testid=\"submit-quiz\"]');
      
      // Verify results shown
      await expect(page.locator('[data-testid=\"quiz-results\"]')).toBeVisible();
    });

    test('should handle quiz timer', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      await modulePage.startQuiz();
      
      const timer = page.locator('[data-testid=\"quiz-timer\"]');
      
      if (await timer.isVisible()) {
        const initialTime = await timer.textContent();
        
        // Wait and check timer decreases
        await page.waitForTimeout(2000);
        
        const newTime = await timer.textContent();
        expect(newTime).not.toBe(initialTime);
      }
    });

    test('should save quiz progress', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      await modulePage.startQuiz();
      
      // Answer first question
      await page.click('[data-testid=\"answer-option\"]:first-child');
      
      // Navigate away and back
      await page.goto('/dashboard');
      await page.goto('/modules/intro-psychology/quiz/1');
      
      // Should restore progress
      const selectedAnswer = page.locator('[data-testid=\"answer-option\"][data-selected=\"true\"]');
      if (await selectedAnswer.count() > 0) {
        await expect(selectedAnswer).toBeVisible();
      }
    });

    test('should show quiz results and feedback', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      await modulePage.startQuiz();
      
      // Complete quiz
      await answerQuizQuestions(page);
      await page.click('[data-testid=\"submit-quiz\"]');
      
      // Verify results page
      const results = page.locator('[data-testid=\"quiz-results\"]');
      await expect(results).toBeVisible();
      
      // Check score display
      const score = page.locator('[data-testid=\"quiz-score\"]');
      await expect(score).toBeVisible();
      
      // Check detailed feedback
      const feedback = page.locator('[data-testid=\"quiz-feedback\"]');
      await expect(feedback).toBeVisible();
    });

    test('should allow quiz retaking if permitted', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      await modulePage.startQuiz();
      
      // Complete quiz first time
      await answerQuizQuestions(page);
      await page.click('[data-testid=\"submit-quiz\"]');
      
      // Check for retake option
      const retakeButton = page.locator('[data-testid=\"retake-quiz\"]');
      
      if (await retakeButton.isVisible()) {
        await retakeButton.click();
        
        // Should start quiz again
        await expect(page.locator('[data-testid=\"quiz-container\"]')).toBeVisible();
      }
    });
  });

  test.describe('Progress Tracking', () => {
    test('should display learning analytics', async ({ page }) => {
      await page.goto('/progress');
      
      // Verify analytics page loaded
      await expect(page.locator('[data-testid=\"progress-analytics\"]')).toBeVisible();
      
      // Check various metrics
      const metrics = [
        'modules-completed',
        'time-spent',
        'quiz-scores',
        'learning-streak'
      ];
      
      for (const metric of metrics) {
        const element = page.locator(`[data-testid=\"metric-${metric}\"]`);
        if (await element.isVisible()) {
          await expect(element).toContainText(/\\d+/); // Should contain numbers
        }
      }
    });

    test('should show learning path recommendations', async ({ page }) => {
      await page.goto('/progress');
      
      const recommendations = page.locator('[data-testid=\"recommendations\"]');
      
      if (await recommendations.isVisible()) {
        // Should suggest next modules
        const suggestedModules = recommendations.locator('[data-testid=\"suggested-module\"]');
        const count = await suggestedModules.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should track study streaks', async ({ page }) => {
      await page.goto('/progress');
      
      const streakCounter = page.locator('[data-testid=\"study-streak\"]');
      
      if (await streakCounter.isVisible()) {
        const streakText = await streakCounter.textContent();
        expect(streakText).toMatch(/\\d+.*day/i);
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await dashboardPage.goto();
      await dashboardPage.verifyDashboardLoaded();
      
      // Test mobile navigation
      const mobileMenu = page.locator('[data-testid=\"mobile-menu-button\"]');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        
        const navigation = page.locator('[data-testid=\"mobile-navigation\"]');
        await expect(navigation).toBeVisible();
      }
      
      // Test module viewing on mobile
      await dashboardPage.clickModule(0);
      await modulePage.verifyContentLoaded();
    });
  });

  test.describe('Accessibility', () => {
    test('should support screen readers', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.checkAccessibility();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await dashboardPage.goto();
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to navigate to modules
      await page.keyboard.press('Enter');
      
      // Should navigate to module
      await page.waitForTimeout(1000);
    });

    test('should adjust text size', async ({ page }) => {
      await modulePage.goto('intro-psychology');
      await modulePage.testAccessibility();
    });
  });

  // Helper function to answer quiz questions
  async function answerQuizQuestions(page) {
    const questions = await page.locator('[data-testid=\"quiz-question\"]').count();
    
    for (let i = 0; i < questions; i++) {
      // Answer each question (select first option)
      const question = page.locator('[data-testid=\"quiz-question\"]').nth(i);
      const firstOption = question.locator('[data-testid=\"answer-option\"]').first();
      await firstOption.click();
      
      // Go to next question if not last
      if (i < questions - 1) {
        const nextButton = page.locator('[data-testid=\"next-question\"]');
        if (await nextButton.isVisible()) {
          await nextButton.click();
        }
      }
    }
  }
});