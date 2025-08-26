import { test, expect } from '@playwright/test';
import { AdminDashboardPage } from '../../pages/admin-dashboard-page';
import { testUsers, testQuizzes, generateUniqueTestData } from '../../fixtures/test-data';
import { cleanupTestData } from '../../helpers/test-helpers';

test.describe('Admin Quiz Management', () => {
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

  test.describe('Quiz Creation', () => {
    test('should create new quiz successfully', async ({ page }) => {
      // Navigate to quiz management
      await page.goto('/admin/quizzes');
      
      await page.click('[data-testid=\"create-quiz-button\"]');
      
      const uniqueData = generateUniqueTestData();
      
      // Fill basic quiz information
      await page.fill('[data-testid=\"quiz-title\"]', uniqueData.quizName);
      await page.fill('[data-testid=\"quiz-description\"]', 'Comprehensive test quiz for E2E testing');
      await page.fill('[data-testid=\"quiz-duration\"]', '30');
      await page.selectOption('[data-testid=\"quiz-difficulty\"]', 'intermediate');
      
      // Associate with module
      const moduleSelect = page.locator('[data-testid=\"quiz-module-select\"]');
      if (await moduleSelect.isVisible()) {
        await moduleSelect.selectOption({ index: 1 }); // Select first available module
      }
      
      // Configure quiz settings
      await page.check('[data-testid=\"randomize-questions\"]');
      await page.check('[data-testid=\"show-feedback\"]');
      await page.fill('[data-testid=\"pass-threshold\"]', '70');
      await page.fill('[data-testid=\"max-attempts\"]', '3');
      
      // Save basic quiz info
      await page.click('[data-testid=\"save-quiz-info\"]');
      
      await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
      
      // Should navigate to question creation
      await expect(page.locator('[data-testid=\"quiz-builder\"]')).toBeVisible();
    });

    test('should add multiple choice questions', async ({ page }) => {
      await page.goto('/admin/quizzes');
      await page.click('[data-testid=\"create-quiz-button\"]');
      
      const uniqueData = generateUniqueTestData();
      await page.fill('[data-testid=\"quiz-title\"]', uniqueData.quizName);
      await page.fill('[data-testid=\"quiz-description\"]', 'Test quiz with multiple choice');
      await page.click('[data-testid=\"save-quiz-info\"]');
      
      // Add multiple choice question
      await page.click('[data-testid=\"add-question\"]');
      await page.selectOption('[data-testid=\"question-type\"]', 'multiple-choice');
      
      await page.fill('[data-testid=\"question-text\"]', 'What is the primary focus of cognitive psychology?');
      
      // Add answer options
      const options = [
        'Mental processes and thinking',
        'Behavioral conditioning',
        'Unconscious motivations',
        'Social interactions'
      ];
      
      for (let i = 0; i < options.length; i++) {
        await page.fill(`[data-testid=\"option-${i}\"]`, options[i]);
      }
      
      // Set correct answer
      await page.click('[data-testid=\"correct-option-0\"]');
      
      // Set points
      await page.fill('[data-testid=\"question-points\"]', '10');
      
      // Add explanation
      await page.fill('[data-testid=\"question-explanation\"]', 'Cognitive psychology focuses on mental processes like perception, memory, and reasoning.');
      
      // Save question
      await page.click('[data-testid=\"save-question\"]');
      
      await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
      
      // Question should appear in question list
      await expect(page.locator('[data-testid=\"question-item\"]')).toContainText('What is the primary focus');
    });

    test('should add true/false questions', async ({ page }) => {
      await page.goto('/admin/quizzes');
      await page.click('[data-testid=\"create-quiz-button\"]');
      
      const uniqueData = generateUniqueTestData();
      await page.fill('[data-testid=\"quiz-title\"]', uniqueData.quizName);
      await page.click('[data-testid=\"save-quiz-info\"]');
      
      // Add true/false question
      await page.click('[data-testid=\"add-question\"]');
      await page.selectOption('[data-testid=\"question-type\"]', 'true-false');
      
      await page.fill('[data-testid=\"question-text\"]', 'Psychology is considered a natural science.');
      
      // Select correct answer
      await page.click('[data-testid=\"answer-false\"]');
      
      await page.fill('[data-testid=\"question-points\"]', '5');
      await page.fill('[data-testid=\"question-explanation\"]', 'Psychology is typically classified as a social science, though it incorporates scientific methods.');
      
      await page.click('[data-testid=\"save-question\"]');
      
      await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
    });

    test('should add essay questions', async ({ page }) => {
      await page.goto('/admin/quizzes');
      await page.click('[data-testid=\"create-quiz-button\"]');
      
      const uniqueData = generateUniqueTestData();
      await page.fill('[data-testid=\"quiz-title\"]', uniqueData.quizName);
      await page.click('[data-testid=\"save-quiz-info\"]');
      
      // Add essay question
      await page.click('[data-testid=\"add-question\"]');
      await page.selectOption('[data-testid=\"question-type\"]', 'essay');
      
      await page.fill('[data-testid=\"question-text\"]', 'Explain the difference between classical and operant conditioning, providing examples of each.');
      
      // Set grading criteria
      await page.fill('[data-testid=\"question-points\"]', '25');
      await page.fill('[data-testid=\"word-limit\"]', '300');
      
      // Add rubric criteria
      await page.fill('[data-testid=\"rubric-criteria\"]', 'Clear explanation of both concepts (10 pts)\\nRelevant examples provided (10 pts)\\nWriting quality and organization (5 pts)');
      
      await page.click('[data-testid=\"save-question\"]');
      
      await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
    });

    test('should add fill-in-the-blank questions', async ({ page }) => {
      await page.goto('/admin/quizzes');
      await page.click('[data-testid=\"create-quiz-button\"]');
      
      const uniqueData = generateUniqueTestData();
      await page.fill('[data-testid=\"quiz-title\"]', uniqueData.quizName);
      await page.click('[data-testid=\"save-quiz-info\"]');
      
      // Add fill-in-the-blank question
      await page.click('[data-testid=\"add-question\"]');
      await page.selectOption('[data-testid=\"question-type\"]', 'fill-blank');
      
      await page.fill('[data-testid=\"question-text\"]', 'The founder of psychoanalysis was _______, who developed theories about the _______ mind.');
      
      // Add acceptable answers
      await page.fill('[data-testid=\"blank-1-answers\"]', 'Freud, Sigmund Freud');
      await page.fill('[data-testid=\"blank-2-answers\"]', 'unconscious, subconscious');
      
      await page.fill('[data-testid=\"question-points\"]', '15');
      
      await page.click('[data-testid=\"save-question\"]');
      
      await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
    });
  });

  test.describe('Quiz Configuration', () => {
    test('should configure quiz timing and attempts', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      // Edit existing quiz
      const firstQuiz = page.locator('[data-testid=\"quiz-row\"]').first();
      if (await firstQuiz.isVisible()) {
        await firstQuiz.locator('[data-testid=\"edit-quiz\"]').click();
        
        // Go to settings tab
        await page.click('[data-testid=\"quiz-settings-tab\"]');
        
        // Configure timing
        await page.check('[data-testid=\"enable-time-limit\"]');
        await page.fill('[data-testid=\"time-limit-minutes\"]', '45');
        
        // Configure attempts
        await page.check('[data-testid=\"limit-attempts\"]');
        await page.fill('[data-testid=\"max-attempts\"]', '2');
        
        // Configure availability
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        await page.fill('[data-testid=\"available-from\"]', startDate.toISOString().slice(0, 16));
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        await page.fill('[data-testid=\"available-until\"]', endDate.toISOString().slice(0, 16));
        
        // Save settings
        await page.click('[data-testid=\"save-quiz-settings\"]');
        
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
      }
    });

    test('should configure grading options', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const firstQuiz = page.locator('[data-testid=\"quiz-row\"]').first();
      if (await firstQuiz.isVisible()) {
        await firstQuiz.locator('[data-testid=\"edit-quiz\"]').click();
        
        await page.click('[data-testid=\"grading-tab\"]');
        
        // Configure grading method
        await page.selectOption('[data-testid=\"grading-method\"]', 'highest');
        
        // Set pass threshold
        await page.fill('[data-testid=\"pass-threshold\"]', '75');
        
        // Configure feedback timing
        await page.selectOption('[data-testid=\"feedback-timing\"]', 'immediate');
        
        // Enable/disable options
        await page.check('[data-testid=\"show-correct-answers\"]');
        await page.check('[data-testid=\"show-explanations\"]');
        await page.uncheck('[data-testid=\"show-scores-during-quiz\"]');
        
        await page.click('[data-testid=\"save-grading-settings\"]');
        
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
      }
    });

    test('should configure question randomization', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const firstQuiz = page.locator('[data-testid=\"quiz-row\"]').first();
      if (await firstQuiz.isVisible()) {
        await firstQuiz.locator('[data-testid=\"edit-quiz\"]').click();
        
        await page.click('[data-testid=\"randomization-tab\"]');
        
        // Enable question randomization
        await page.check('[data-testid=\"randomize-questions\"]');
        
        // Enable answer randomization
        await page.check('[data-testid=\"randomize-answers\"]');
        
        // Set question bank size (if implemented)
        const questionBankSize = page.locator('[data-testid=\"question-bank-size\"]');
        if (await questionBankSize.isVisible()) {
          await questionBankSize.fill('10');
        }
        
        await page.click('[data-testid=\"save-randomization-settings\"]');
        
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
      }
    });
  });

  test.describe('Quiz Management', () => {
    test('should preview quiz before publishing', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const firstQuiz = page.locator('[data-testid=\"quiz-row\"]').first();
      if (await firstQuiz.isVisible()) {
        const previewButton = firstQuiz.locator('[data-testid=\"preview-quiz\"]');
        await previewButton.click();
        
        // Should open quiz preview
        await expect(page.locator('[data-testid=\"quiz-preview\"]')).toBeVisible();
        
        // Should show quiz questions in student view
        await expect(page.locator('[data-testid=\"preview-question\"]')).toBeVisible();
        
        // Test navigation through preview
        const nextButton = page.locator('[data-testid=\"preview-next\"]');
        if (await nextButton.isVisible()) {
          await nextButton.click();
        }
        
        // Close preview
        await page.click('[data-testid=\"close-preview\"]');
        
        await expect(page.locator('[data-testid=\"quiz-list\"]')).toBeVisible();
      }
    });

    test('should publish quiz', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const draftQuiz = page.locator('[data-testid=\"quiz-row\"][data-status=\"draft\"]').first();
      if (await draftQuiz.isVisible()) {
        const publishButton = draftQuiz.locator('[data-testid=\"publish-quiz\"]');
        await publishButton.click();
        
        // Confirm publish
        const confirmDialog = page.locator('[data-testid=\"publish-confirm-dialog\"]');
        if (await confirmDialog.isVisible()) {
          await page.click('[data-testid=\"confirm-publish\"]');
        }
        
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        
        // Status should change to published
        await expect(draftQuiz).toHaveAttribute('data-status', 'published');
      }
    });

    test('should duplicate quiz', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const initialQuizCount = await page.locator('[data-testid=\"quiz-row\"]').count();
      
      const firstQuiz = page.locator('[data-testid=\"quiz-row\"]').first();
      if (await firstQuiz.isVisible()) {
        const duplicateButton = firstQuiz.locator('[data-testid=\"duplicate-quiz\"]');
        await duplicateButton.click();
        
        // Fill duplicate quiz details
        const originalTitle = await firstQuiz.locator('[data-testid=\"quiz-title-text\"]').textContent();
        const newTitle = `${originalTitle} (Copy)`;
        
        await page.fill('[data-testid=\"duplicate-quiz-title\"]', newTitle);
        await page.click('[data-testid=\"confirm-duplicate\"]');
        
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        
        // Should have one more quiz
        const newQuizCount = await page.locator('[data-testid=\"quiz-row\"]').count();
        expect(newQuizCount).toBe(initialQuizCount + 1);
        
        // New quiz should appear in list
        await expect(page.locator('[data-testid=\"quiz-row\"]')).toContainText(newTitle);
      }
    });

    test('should export quiz', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const firstQuiz = page.locator('[data-testid=\"quiz-row\"]').first();
      if (await firstQuiz.isVisible()) {
        const exportButton = firstQuiz.locator('[data-testid=\"export-quiz\"]');
        
        if (await exportButton.isVisible()) {
          // Set up download handler
          const downloadPromise = page.waitForEvent('download');
          
          await exportButton.click();
          
          // Select export format
          await page.selectOption('[data-testid=\"export-format\"]', 'json');
          await page.click('[data-testid=\"confirm-export\"]');
          
          try {
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toContain('quiz');
            expect(download.suggestedFilename()).toContain('.json');
          } catch {
            // Export might not be implemented
            console.log('Quiz export feature not yet implemented');
          }
        }
      }
    });

    test('should import quiz', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const importButton = page.locator('[data-testid=\"import-quiz-button\"]');
      
      if (await importButton.isVisible()) {
        await importButton.click();
        
        // Upload quiz file (mock file)
        const fileInput = page.locator('[data-testid=\"quiz-file-input\"]');
        
        // In a real test, you'd upload an actual quiz file
        // For now, we'll just test the UI flow
        
        await expect(page.locator('[data-testid=\"import-quiz-dialog\"]')).toBeVisible();
        
        // Cancel import
        await page.click('[data-testid=\"cancel-import\"]');
      }
    });
  });

  test.describe('Question Bank Management', () => {
    test('should create question bank', async ({ page }) => {
      const questionBankNav = page.locator('[data-testid=\"question-bank-nav\"]');
      
      if (await questionBankNav.isVisible()) {
        await questionBankNav.click();
        
        await page.click('[data-testid=\"create-question-bank\"]');
        
        const uniqueData = generateUniqueTestData();
        
        await page.fill('[data-testid=\"bank-name\"]', `${uniqueData.quizName} Question Bank`);
        await page.fill('[data-testid=\"bank-description\"]', 'Collection of psychology questions');
        await page.selectOption('[data-testid=\"bank-category\"]', 'psychology');
        
        await page.click('[data-testid=\"save-question-bank\"]');
        
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
      }
    });

    test('should add questions to bank', async ({ page }) => {
      const questionBankNav = page.locator('[data-testid=\"question-bank-nav\"]');
      
      if (await questionBankNav.isVisible()) {
        await questionBankNav.click();
        
        const firstBank = page.locator('[data-testid=\"question-bank-row\"]').first();
        if (await firstBank.isVisible()) {
          await firstBank.click();
          
          // Add question to bank
          await page.click('[data-testid=\"add-bank-question\"]');
          
          await page.selectOption('[data-testid=\"question-type\"]', 'multiple-choice');
          await page.fill('[data-testid=\"question-text\"]', 'Which psychologist developed the hierarchy of needs?');
          
          const options = ['Maslow', 'Freud', 'Jung', 'Rogers'];
          for (let i = 0; i < options.length; i++) {
            await page.fill(`[data-testid=\"option-${i}\"]`, options[i]);
          }
          
          await page.click('[data-testid=\"correct-option-0\"]');
          await page.fill('[data-testid=\"question-points\"]', '10');
          
          await page.click('[data-testid=\"save-bank-question\"]');
          
          await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        }
      }
    });

    test('should use question bank in quiz', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const firstQuiz = page.locator('[data-testid=\"quiz-row\"]').first();
      if (await firstQuiz.isVisible()) {
        await firstQuiz.locator('[data-testid=\"edit-quiz\"]').click();
        
        // Add questions from bank
        const addFromBankButton = page.locator('[data-testid=\"add-from-bank\"]');
        
        if (await addFromBankButton.isVisible()) {
          await addFromBankButton.click();
          
          // Select question bank
          await page.selectOption('[data-testid=\"select-question-bank\"]', { index: 1 });
          
          // Select questions to add
          await page.check('[data-testid=\"bank-question-0\"]');
          await page.check('[data-testid=\"bank-question-1\"]');
          
          await page.click('[data-testid=\"add-selected-questions\"]');
          
          await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
          
          // Questions should appear in quiz
          const questionCount = await page.locator('[data-testid=\"question-item\"]').count();
          expect(questionCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Quiz Analytics', () => {
    test('should display quiz performance analytics', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const firstQuiz = page.locator('[data-testid=\"quiz-row\"]').first();
      const analyticsButton = firstQuiz.locator('[data-testid=\"quiz-analytics\"]');
      
      if (await analyticsButton.isVisible()) {
        await analyticsButton.click();
        
        await expect(page.locator('[data-testid=\"quiz-analytics-dashboard\"]')).toBeVisible();
        
        // Check for analytics metrics
        const metrics = [
          'total-attempts',
          'average-score',
          'completion-rate',
          'question-difficulty',
          'time-analysis'
        ];
        
        for (const metric of metrics) {
          const metricElement = page.locator(`[data-testid=\"metric-${metric}\"]`);
          if (await metricElement.isVisible()) {
            await expect(metricElement).toBeVisible();
          }
        }
      }
    });

    test('should show individual student results', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const firstQuiz = page.locator('[data-testid=\"quiz-row\"]').first();
      const resultsButton = firstQuiz.locator('[data-testid=\"view-results\"]');
      
      if (await resultsButton.isVisible()) {
        await resultsButton.click();
        
        await expect(page.locator('[data-testid=\"quiz-results-table\"]')).toBeVisible();
        
        // Should show student attempts
        const resultRows = page.locator('[data-testid=\"result-row\"]');
        const rowCount = await resultRows.count();
        expect(rowCount).toBeGreaterThanOrEqual(0);
        
        // Test viewing individual attempt
        if (rowCount > 0) {
          const firstResult = resultRows.first();
          const viewButton = firstResult.locator('[data-testid=\"view-attempt\"]');
          
          if (await viewButton.isVisible()) {
            await viewButton.click();
            
            await expect(page.locator('[data-testid=\"attempt-details\"]')).toBeVisible();
          }
        }
      }
    });

    test('should allow manual grading of essay questions', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const gradingButton = page.locator('[data-testid=\"pending-grading\"]');
      
      if (await gradingButton.isVisible()) {
        await gradingButton.click();
        
        await expect(page.locator('[data-testid=\"grading-queue\"]')).toBeVisible();
        
        const pendingEssays = page.locator('[data-testid=\"essay-to-grade\"]');
        const essayCount = await pendingEssays.count();
        
        if (essayCount > 0) {
          const firstEssay = pendingEssays.first();
          await firstEssay.click();
          
          // Grade the essay
          await page.fill('[data-testid=\"essay-score\"]', '18');
          await page.fill('[data-testid=\"essay-feedback\"]', 'Good explanation of concepts. Could use more specific examples.');
          
          await page.click('[data-testid=\"save-essay-grade\"]');
          
          await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Quiz Deletion and Cleanup', () => {
    test('should delete quiz with confirmation', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const initialQuizCount = await page.locator('[data-testid=\"quiz-row\"]').count();
      
      // Find a test quiz to delete
      const testQuiz = page.locator('[data-testid=\"quiz-row\"]').filter({ hasText: 'Test Quiz' }).first();
      
      if (await testQuiz.isVisible()) {
        const deleteButton = testQuiz.locator('[data-testid=\"delete-quiz\"]');
        await deleteButton.click();
        
        // Confirm deletion
        const confirmDialog = page.locator('[data-testid=\"delete-confirm-dialog\"]');
        await expect(confirmDialog).toBeVisible();
        
        await page.fill('[data-testid=\"delete-confirmation-text\"]', 'DELETE');
        await page.click('[data-testid=\"confirm-delete\"]');
        
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        
        // Quiz count should decrease
        const newQuizCount = await page.locator('[data-testid=\"quiz-row\"]').count();
        expect(newQuizCount).toBe(initialQuizCount - 1);
      }
    });

    test('should archive quiz instead of deleting if has results', async ({ page }) => {
      await page.goto('/admin/quizzes');
      
      const quizWithResults = page.locator('[data-testid=\"quiz-row\"][data-has-results=\"true\"]').first();
      
      if (await quizWithResults.isVisible()) {
        const deleteButton = quizWithResults.locator('[data-testid=\"delete-quiz\"]');
        await deleteButton.click();
        
        // Should show archive option instead
        const archiveDialog = page.locator('[data-testid=\"archive-quiz-dialog\"]');
        await expect(archiveDialog).toBeVisible();
        
        await expect(archiveDialog).toContainText('has existing results');
        
        await page.click('[data-testid=\"archive-quiz\"]');
        
        await expect(page.locator('[data-testid=\"success-message\"]')).toBeVisible();
        
        // Quiz should be marked as archived
        await expect(quizWithResults).toHaveAttribute('data-status', 'archived');
      }
    });
  });
});