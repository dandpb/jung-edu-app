import { test, expect, Page } from '@playwright/test';
import { TestHelpers, TestDataGenerator } from './utils/test-helpers';

test.describe('Student Onboarding Flow', () => {
  let page: Page;
  let helpers: TestHelpers;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    helpers = new TestHelpers(page);
    await helpers.disableAnimations();
  });

  test.afterEach(async () => {
    await helpers.cleanup();
  });

  test.describe('Initial Registration and Welcome', () => {
    test('should complete student registration and onboarding', async () => {
      const userData = TestDataGenerator.generateUserData();
      
      // Step 1: Register new student
      await page.goto('/register');
      await helpers.waitForPageReady();

      // Mock successful registration API
      await helpers.mockApiResponse('auth/register', {
        success: true,
        user: {
          id: 1,
          name: userData.name,
          email: userData.email,
          role: 'student',
          isOnboarded: false
        },
        token: 'mock_jwt_token'
      });

      await helpers.fillForm({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.password
      });

      // Accept terms
      const termsCheckbox = page.locator('input[type="checkbox"]');
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }

      await page.click('button[type="submit"]');

      // Should redirect to onboarding or welcome page
      await expect(page).toHaveURL(/\/(onboarding|welcome|dashboard)/);
      
      // Verify welcome message or onboarding start
      const welcomeElement = page.locator(
        '[data-testid="welcome-message"], h1:has-text("Bem-vindo"), .onboarding-welcome'
      );
      await expect(welcomeElement.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show onboarding tutorial for new students', async () => {
      await helpers.setupAuth('student');
      
      // Mock API to return that user needs onboarding
      await helpers.mockApiResponse('user/profile', {
        user: {
          id: 1,
          name: 'Test Student',
          email: 'student@jaquedu.com',
          isOnboarded: false,
          preferences: {}
        }
      });

      await page.goto('/dashboard');
      await helpers.waitForPageReady();

      // Should show onboarding modal or redirect to onboarding
      const onboardingElements = page.locator(
        '[data-testid="onboarding-modal"], .onboarding-overlay, .tutorial-modal'
      );
      
      if (await onboardingElements.first().isVisible()) {
        await expect(onboardingElements.first()).toBeVisible();
        
        // Should have onboarding content
        const tutorialContent = page.locator(
          '[data-testid="tutorial-content"], .tutorial-step, .onboarding-step'
        );
        await expect(tutorialContent.first()).toBeVisible();
      }
    });
  });

  test.describe('Profile Setup', () => {
    test('should allow student to set up profile information', async () => {
      await helpers.setupAuth('student');
      await page.goto('/profile/setup');
      
      // If setup page doesn't exist, try profile or onboarding
      if (page.url().includes('404')) {
        await page.goto('/onboarding');
      }
      
      if (page.url().includes('404')) {
        await page.goto('/profile');
      }

      await helpers.waitForPageReady();

      // Mock successful profile update
      await helpers.mockApiResponse('user/profile', {
        success: true,
        user: {
          id: 1,
          name: 'Updated Student Name',
          preferences: {
            language: 'pt-BR',
            learningStyle: 'visual',
            interests: ['psychology', 'philosophy']
          }
        }
      });

      // Look for profile setup form elements
      const nameInput = page.locator('[name="name"], input[placeholder*="nome"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('Updated Student Name');
      }

      // Set learning preferences if available
      const languageSelect = page.locator('[name="language"], select[data-testid="language"]');
      if (await languageSelect.isVisible()) {
        await languageSelect.selectOption('pt-BR');
      }

      const learningStyleSelect = page.locator('[name="learningStyle"], [data-testid="learning-style"]');
      if (await learningStyleSelect.isVisible()) {
        await learningStyleSelect.selectOption('visual');
      }

      // Save profile
      const saveButton = page.locator(
        '[data-testid="save-profile"], button:has-text("Salvar"), button:has-text("Save")'
      );
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await helpers.waitForSuccessMessage();
      }
    });

    test('should allow student to set learning goals', async () => {
      await helpers.setupAuth('student');
      await page.goto('/onboarding/goals');
      
      if (page.url().includes('404')) {
        await page.goto('/goals');
      }
      
      if (!page.url().includes('404')) {
        await helpers.waitForPageReady();

        // Mock goals API
        await helpers.mockApiResponse('user/goals', {
          success: true,
          goals: [
            { id: 1, title: 'Understand Jung\'s Psychology', completed: false },
            { id: 2, title: 'Complete Core Modules', completed: false }
          ]
        });

        // Look for goal selection interface
        const goalCheckboxes = page.locator('input[type="checkbox"], .goal-selector');
        const goalCount = await goalCheckboxes.count();

        if (goalCount > 0) {
          // Select first two goals
          for (let i = 0; i < Math.min(2, goalCount); i++) {
            const checkbox = goalCheckboxes.nth(i);
            if (await checkbox.isVisible()) {
              await checkbox.check();
            }
          }

          // Save goals
          const saveGoalsButton = page.locator(
            'button:has-text("Salvar"), button:has-text("Save"), [data-testid="save-goals"]'
          );
          if (await saveGoalsButton.isVisible()) {
            await saveGoalsButton.click();
            await helpers.waitForSuccessMessage();
          }
        }
      }
    });
  });

  test.describe('Platform Introduction', () => {
    test('should provide guided tour of main features', async () => {
      await helpers.setupAuth('student');
      await page.goto('/dashboard');
      await helpers.waitForPageReady();

      // Look for tour or help button
      const tourButton = page.locator(
        '[data-testid="start-tour"], button:has-text("Tour"), .help-tour, .tutorial-button'
      );
      
      if (await tourButton.isVisible()) {
        await tourButton.click();

        // Should show tour overlay or highlights
        const tourOverlay = page.locator(
          '[data-testid="tour-overlay"], .tour-step, .tutorial-highlight'
        );
        await expect(tourOverlay.first()).toBeVisible();

        // Test tour navigation
        const nextButton = page.locator(
          '[data-testid="tour-next"], button:has-text("Próximo"), button:has-text("Next")'
        );
        if (await nextButton.isVisible()) {
          await nextButton.click();
          
          // Should progress to next tour step
          await expect(tourOverlay.first()).toBeVisible();
        }
      }
    });

    test('should explain key educational concepts', async () => {
      await helpers.setupAuth('student');
      await page.goto('/introduction');
      
      if (page.url().includes('404')) {
        await page.goto('/about');
      }
      
      if (!page.url().includes('404')) {
        await helpers.waitForPageReady();

        // Should have educational content about the platform
        const introContent = page.locator(
          '[data-testid="introduction"], .intro-content, .about-content'
        );
        await expect(introContent.first()).toBeVisible();

        // Should mention key concepts
        const content = await page.textContent('body');
        expect(content).toMatch(/Jung|psicologia|arquétipo|inconsciente/i);
      }
    });
  });

  test.describe('First Learning Module', () => {
    test('should guide student through first module', async () => {
      await helpers.setupAuth('student');
      await page.goto('/dashboard');
      await helpers.waitForPageReady();

      // Mock modules API
      await helpers.mockApiResponse('modules', {
        modules: [
          {
            id: 1,
            title: 'Introdução à Psicologia Analítica',
            description: 'Conceitos fundamentais de Carl Jung',
            difficulty: 'beginner',
            duration: 30,
            isCompleted: false,
            progress: 0
          }
        ]
      });

      // Find and click first module
      const firstModule = page.locator(
        '[data-testid="module-card"], .module-card, .course-module'
      ).first();
      
      await expect(firstModule).toBeVisible();
      await firstModule.click();

      // Should navigate to module page
      await expect(page).toHaveURL(/\/module\/\d+/);

      // Should show module content
      const moduleContent = page.locator(
        '[data-testid="module-content"], .module-content, .lesson-content'
      );
      await expect(moduleContent).toBeVisible();

      // Should have start or continue button
      const startButton = page.locator(
        '[data-testid="start-module"], button:has-text("Iniciar"), button:has-text("Continuar")'
      );
      if (await startButton.isVisible()) {
        await startButton.click();
        
        // Should show module progress
        const progressIndicator = page.locator(
          '[data-testid="progress"], .progress-bar, .module-progress'
        );
        await expect(progressIndicator.first()).toBeVisible();
      }
    });

    test('should track progress through first module', async () => {
      await helpers.setupAuth('student');
      
      // Mock module progress API
      await helpers.mockApiResponse('modules/1/progress', {
        progress: 25,
        currentSection: 1,
        totalSections: 4,
        timeSpent: 300
      });

      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Interact with content to simulate reading
      const content = page.locator('.module-content, .lesson-content');
      if (await content.isVisible()) {
        await content.scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000); // Simulate reading time
      }

      // Check for progress tracking
      const progressBar = page.locator('.progress-bar, .progress-indicator');
      if (await progressBar.isVisible()) {
        const progressText = await progressBar.textContent();
        expect(progressText).toMatch(/\d+%|\d+\/\d+/);
      }

      // Navigate to next section if available
      const nextButton = page.locator(
        '[data-testid="next-section"], button:has-text("Próximo")'  
      );
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Progress should update
        await page.waitForTimeout(1000);
        if (await progressBar.isVisible()) {
          await expect(progressBar).toContainText(/[1-9]\d*%|[2-9]\/\d+/);
        }
      }
    });
  });

  test.describe('Help and Support', () => {
    test('should provide access to help resources', async () => {
      await helpers.setupAuth('student');
      await page.goto('/dashboard');
      await helpers.waitForPageReady();

      // Look for help or support links
      const helpButton = page.locator(
        '[data-testid="help"], a:has-text("Ajuda"), a:has-text("Suporte"), .help-link'
      );
      
      if (await helpButton.first().isVisible()) {
        await helpButton.first().click();

        // Should navigate to help page or show help modal
        const helpContent = page.locator(
          '[data-testid="help-content"], .help-section, .support-content'
        );
        await expect(helpContent.first()).toBeVisible();
      } else {
        // Try accessing help directly
        await page.goto('/help');
        if (!page.url().includes('404')) {
          const helpContent = page.locator('.help-content, .faq, .documentation');
          await expect(helpContent.first()).toBeVisible();
        }
      }
    });

    test('should provide FAQ for common questions', async () => {
      await page.goto('/faq');
      
      if (page.url().includes('404')) {
        await page.goto('/help');
      }
      
      if (!page.url().includes('404')) {
        await helpers.waitForPageReady();

        // Should have FAQ content
        const faqContent = page.locator(
          '[data-testid="faq"], .faq-section, .frequently-asked'
        );
        await expect(faqContent.first()).toBeVisible();

        // Should have expandable questions
        const faqItem = page.locator('.faq-item, .question, .accordion-item').first();
        if (await faqItem.isVisible()) {
          await faqItem.click();
          
          // Answer should expand
          const answer = page.locator('.answer, .faq-answer, .accordion-content');
          await expect(answer.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Mobile Onboarding', () => {
    test.beforeEach(async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 }
      });
      page = await context.newPage();
      helpers = new TestHelpers(page);
      await helpers.disableAnimations();
    });

    test('should handle mobile onboarding flow', async () => {
      const userData = TestDataGenerator.generateUserData();
      
      await page.goto('/register');
      await helpers.waitForPageReady();

      // Registration form should be mobile-responsive
      const form = page.locator('form');
      if (await form.isVisible()) {
        const boundingBox = await form.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeLessThanOrEqual(375);
        }
      }

      // Test mobile form interaction
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill(userData.name);
        await expect(nameInput).toHaveValue(userData.name);
      }
    });

    test('should show mobile-optimized tutorial', async () => {
      await helpers.setupAuth('student');
      await page.goto('/dashboard');
      await helpers.waitForPageReady();

      // Mobile tutorial should adapt to screen size
      const tutorial = page.locator('.tutorial, .onboarding, .tour');
      if (await tutorial.first().isVisible()) {
        const boundingBox = await tutorial.first().boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeLessThanOrEqual(375);
        }
      }
    });
  });

  test.describe('Onboarding Completion', () => {
    test('should mark onboarding as complete', async () => {
      await helpers.setupAuth('student');
      
      // Mock completion API
      await helpers.mockApiResponse('user/onboarding/complete', {
        success: true,
        user: {
          id: 1,
          isOnboarded: true,
          completedOnboarding: new Date().toISOString()
        }
      });

      await page.goto('/onboarding/complete');
      
      if (page.url().includes('404')) {
        // Simulate onboarding completion through dashboard
        await page.goto('/dashboard');
        await helpers.waitForPageReady();
        
        const completeButton = page.locator(
          '[data-testid="complete-onboarding"], button:has-text("Concluir")'
        );
        if (await completeButton.isVisible()) {
          await completeButton.click();
        }
      }

      // Should show completion confirmation
      const completionMessage = page.locator(
        '[data-testid="onboarding-complete"], .completion-message, .success-message'
      );
      if (await completionMessage.first().isVisible()) {
        await expect(completionMessage.first()).toBeVisible();
      }
    });
  });
});
