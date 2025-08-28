/**
 * Enhanced Educational Workflows E2E Tests
 * Comprehensive end-to-end testing for educational platform user journeys
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { setTimeout } from 'timers/promises';

interface StudentUser {
  email: string;
  username: string;
  password: string;
  profile?: {
    fullName: string;
    interests: string[];
    learningStyle: string;
  };
}

interface InstructorUser {
  email: string;
  username: string;
  password: string;
  credentials: {
    degree: string;
    institution: string;
    specialty: string;
  };
}

class EducationalWorkflowHelper {
  constructor(private page: Page) {}

  async navigateToHomepage() {
    await this.page.goto('/');
    await expect(this.page.locator('h1')).toContainText('jaqEdu');
  }

  async registerStudent(student: StudentUser) {
    await this.page.goto('/auth/register');
    
    await this.page.fill('[data-testid="email-input"]', student.email);
    await this.page.fill('[data-testid="username-input"]', student.username);
    await this.page.fill('[data-testid="password-input"]', student.password);
    await this.page.fill('[data-testid="confirm-password-input"]', student.password);
    
    await this.page.click('[data-testid="register-button"]');
    
    // Wait for registration success
    await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
  }

  async loginUser(email: string, password: string) {
    await this.page.goto('/auth/login');
    
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await this.page.waitForURL('/dashboard');
    await expect(this.page.locator('[data-testid="user-dashboard"]')).toBeVisible();
  }

  async completeProfileSetup(student: StudentUser) {
    // Navigate to profile setup
    await this.page.goto('/profile/setup');
    
    if (student.profile) {
      await this.page.fill('[data-testid="full-name-input"]', student.profile.fullName);
      
      // Select interests
      for (const interest of student.profile.interests) {
        await this.page.click(`[data-testid="interest-${interest}"]`);
      }
      
      // Select learning style
      await this.page.selectOption('[data-testid="learning-style-select"]', student.profile.learningStyle);
    }
    
    await this.page.click('[data-testid="save-profile-button"]');
    await expect(this.page.locator('[data-testid="profile-saved"]')).toBeVisible();
  }

  async enrollInCourse(courseName: string) {
    await this.page.goto('/courses');
    
    // Find and enroll in course
    const courseCard = this.page.locator(`[data-testid="course-card-${courseName}"]`);
    await expect(courseCard).toBeVisible();
    
    await courseCard.locator('[data-testid="enroll-button"]').click();
    
    // Confirm enrollment
    await this.page.click('[data-testid="confirm-enrollment"]');
    await expect(this.page.locator('[data-testid="enrollment-success"]')).toBeVisible();
  }

  async accessModule(moduleId: string) {
    await this.page.goto(`/modules/${moduleId}`);
    
    // Wait for module to load
    await expect(this.page.locator('[data-testid="module-content"]')).toBeVisible();
    
    // Check module loading performance
    const navigationTiming = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      };
    });
    
    expect(navigationTiming.loadTime).toBeLessThan(3000); // 3s threshold
  }

  async interactWithContent(contentType: string) {
    switch (contentType) {
      case 'text':
        await this.interactWithTextContent();
        break;
      case 'video':
        await this.interactWithVideoContent();
        break;
      case 'interactive':
        await this.interactWithInteractiveContent();
        break;
      case 'quiz':
        await this.interactWithQuizContent();
        break;
    }
  }

  private async interactWithTextContent() {
    const textContent = this.page.locator('[data-testid="text-content"]');
    await expect(textContent).toBeVisible();
    
    // Simulate reading (scroll through content)
    const contentHeight = await textContent.evaluate(el => el.scrollHeight);
    const viewportHeight = await textContent.evaluate(el => el.clientHeight);
    
    for (let scroll = 0; scroll < contentHeight; scroll += viewportHeight) {
      await textContent.evaluate((el, scrollTop) => el.scrollTop = scrollTop, scroll);
      await setTimeout(500); // Simulate reading time
    }
  }

  private async interactWithVideoContent() {
    const video = this.page.locator('[data-testid="video-player"] video');
    await expect(video).toBeVisible();
    
    // Play video
    await this.page.click('[data-testid="play-button"]');
    
    // Wait for video to start
    await video.evaluate(v => new Promise(resolve => v.addEventListener('playing', resolve, { once: true })));
    
    // Simulate watching for a few seconds
    await setTimeout(3000);
    
    // Pause video
    await this.page.click('[data-testid="pause-button"]');
  }

  private async interactWithInteractiveContent() {
    // Check for interactive elements
    const interactiveElements = await this.page.locator('[data-testid*="interactive-"]').count();
    expect(interactiveElements).toBeGreaterThan(0);
    
    // Interact with each element
    for (let i = 0; i < Math.min(interactiveElements, 5); i++) {
      const element = this.page.locator('[data-testid*="interactive-"]').nth(i);
      await element.click();
      await setTimeout(500);
    }
  }

  private async interactWithQuizContent() {
    await expect(this.page.locator('[data-testid="quiz-container"]')).toBeVisible();
    
    // Answer quiz questions
    const questions = await this.page.locator('[data-testid^="question-"]').count();
    
    for (let i = 0; i < questions; i++) {
      const question = this.page.locator(`[data-testid="question-${i}"]`);
      const answers = question.locator('[data-testid^="answer-"]');
      const answerCount = await answers.count();
      
      if (answerCount > 0) {
        // Select first answer (for testing purposes)
        await answers.first().click();
      }
    }
    
    // Submit quiz
    await this.page.click('[data-testid="submit-quiz"]');
    await expect(this.page.locator('[data-testid="quiz-results"]')).toBeVisible();
  }

  async trackProgress() {
    const progressIndicators = await this.page.locator('[data-testid*="progress"]').count();
    expect(progressIndicators).toBeGreaterThan(0);
    
    // Check progress percentage
    const progressText = await this.page.locator('[data-testid="progress-percentage"]').textContent();
    const progressMatch = progressText?.match(/(\d+)%/);
    
    if (progressMatch) {
      const progress = parseInt(progressMatch[1]);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    }
  }

  async generateQuiz(moduleId: string, options: { questionCount: number; difficulty: string }) {
    await this.page.goto(`/modules/${moduleId}/quiz/generate`);
    
    // Configure quiz options
    await this.page.fill('[data-testid="question-count"]', options.questionCount.toString());
    await this.page.selectOption('[data-testid="difficulty-select"]', options.difficulty);
    
    // Generate quiz
    const generateButton = this.page.locator('[data-testid="generate-quiz"]');
    await generateButton.click();
    
    // Wait for generation to complete (with timeout)
    await expect(this.page.locator('[data-testid="quiz-generated"]')).toBeVisible({ timeout: 30000 });
    
    // Verify quiz has correct number of questions
    const questionElements = await this.page.locator('[data-testid^="generated-question-"]').count();
    expect(questionElements).toBe(options.questionCount);
  }

  async takeAdaptiveQuiz() {
    await expect(this.page.locator('[data-testid="adaptive-quiz"]')).toBeVisible();
    
    let questionNumber = 1;
    let maxQuestions = 20; // Prevent infinite loops
    
    while (questionNumber <= maxQuestions) {
      const question = this.page.locator(`[data-testid="adaptive-question-${questionNumber}"]`);
      
      if (await question.isVisible()) {
        // Answer question
        const answers = question.locator('[data-testid^="adaptive-answer-"]');
        const answerCount = await answers.count();
        
        if (answerCount > 0) {
          // Select a random answer for testing
          const randomIndex = Math.floor(Math.random() * answerCount);
          await answers.nth(randomIndex).click();
          
          // Submit answer
          await this.page.click(`[data-testid="submit-answer-${questionNumber}"]`);
          
          // Wait for next question or completion
          await setTimeout(1000);
          
          // Check if quiz is complete
          if (await this.page.locator('[data-testid="adaptive-quiz-complete"]').isVisible()) {
            break;
          }
          
          questionNumber++;
        }
      } else {
        break;
      }
    }
    
    // Verify quiz completion
    await expect(this.page.locator('[data-testid="adaptive-quiz-results"]')).toBeVisible();
  }

  async viewAnalytics() {
    await this.page.goto('/dashboard/analytics');
    
    // Check analytics components
    await expect(this.page.locator('[data-testid="learning-analytics"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="progress-chart"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="performance-metrics"]')).toBeVisible();
    
    // Verify data visualization
    const chartElements = await this.page.locator('canvas, svg').count();
    expect(chartElements).toBeGreaterThan(0);
  }

  async accessRecommendations() {
    await this.page.goto('/dashboard/recommendations');
    
    await expect(this.page.locator('[data-testid="recommendations-panel"]')).toBeVisible();
    
    // Check for recommendation items
    const recommendations = await this.page.locator('[data-testid^="recommendation-"]').count();
    expect(recommendations).toBeGreaterThan(0);
  }

  async checkSystemHealth() {
    // Check for error boundaries or error messages
    const errorMessages = await this.page.locator('[data-testid*="error"], .error, [class*="error"]').count();
    expect(errorMessages).toBe(0);
    
    // Check for loading indicators (shouldn't be stuck loading)
    const loadingSpinners = await this.page.locator('[data-testid*="loading"], .loading, [class*="loading"]').count();
    
    // Allow some loading indicators but not excessive
    expect(loadingSpinners).toBeLessThan(5);
    
    // Check console errors
    const consoleErrors = await this.page.evaluate(() => {
      return (window as any).consoleErrors || [];
    });
    
    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter((error: any) => 
      !error.includes('favicon') && 
      !error.includes('analytics') &&
      !error.includes('third-party')
    );
    
    expect(criticalErrors).toHaveLength(0);
  }
}

// Test Suite: Student Learning Journey
test.describe('Complete Student Learning Journey', () => {
  let helper: EducationalWorkflowHelper;
  let student: StudentUser;

  test.beforeEach(async ({ page }) => {
    helper = new EducationalWorkflowHelper(page);
    student = {
      email: `student-${Date.now()}@test.edu`,
      username: `student_${Date.now()}`,
      password: 'SecurePass123!',
      profile: {
        fullName: 'Test Student',
        interests: ['psychology', 'philosophy', 'neuroscience'],
        learningStyle: 'visual'
      }
    };
    
    // Setup console error tracking
    page.on('console', msg => {
      if (msg.type() === 'error') {
        (page as any).consoleErrors = (page as any).consoleErrors || [];
        (page as any).consoleErrors.push(msg.text());
      }
    });
  });

  test('Complete student onboarding and first module completion', async ({ page }) => {
    // 1. Homepage and Registration
    await helper.navigateToHomepage();
    await helper.registerStudent(student);
    
    // 2. Login
    await helper.loginUser(student.email, student.password);
    
    // 3. Profile Setup
    await helper.completeProfileSetup(student);
    
    // 4. Course Enrollment
    await helper.enrollInCourse('jung-psychology-101');
    
    // 5. Module Access
    await helper.accessModule('introduction-to-analytical-psychology');
    
    // 6. Content Interaction
    await helper.interactWithContent('text');
    await helper.trackProgress();
    
    // 7. System Health Check
    await helper.checkSystemHealth();
  });

  test('Multimedia content learning workflow', async ({ page }) => {
    // Pre-setup: Login existing user
    await helper.loginUser(student.email, student.password);
    
    // Access multimedia-rich module
    await helper.accessModule('dream-analysis-methods');
    
    // Interact with different content types
    await helper.interactWithContent('video');
    await helper.interactWithContent('interactive');
    await helper.interactWithContent('text');
    
    // Track multimedia engagement progress
    await helper.trackProgress();
    
    // Check performance under multimedia load
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource').filter(r => 
        r.name.includes('.mp4') || r.name.includes('.webm') || r.name.includes('video')
      );
      
      return {
        pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
        videoResourcesLoaded: resources.length,
        totalTransferSize: resources.reduce((sum, r: any) => sum + (r.transferSize || 0), 0)
      };
    });
    
    expect(performanceMetrics.pageLoadTime).toBeLessThan(5000); // 5s for multimedia
    expect(performanceMetrics.videoResourcesLoaded).toBeGreaterThan(0);
  });

  test('Adaptive quiz generation and completion workflow', async ({ page }) => {
    await helper.loginUser(student.email, student.password);
    
    // Access module with quiz capabilities
    await helper.accessModule('psychological-types-theory');
    
    // Complete some content first
    await helper.interactWithContent('text');
    
    // Generate adaptive quiz
    await helper.generateQuiz('psychological-types-theory', {
      questionCount: 10,
      difficulty: 'medium'
    });
    
    // Take adaptive quiz
    await helper.takeAdaptiveQuiz();
    
    // Verify quiz completion and scoring
    const quizResults = await page.locator('[data-testid="quiz-score"]').textContent();
    expect(quizResults).toMatch(/Score: \d+/);
    
    // Check progress update
    await helper.trackProgress();
  });

  test('Learning analytics and recommendations workflow', async ({ page }) => {
    await helper.loginUser(student.email, student.password);
    
    // Complete multiple learning activities to generate data
    await helper.accessModule('collective-unconscious-concepts');
    await helper.interactWithContent('text');
    await helper.interactWithContent('quiz');
    
    await helper.accessModule('active-imagination-techniques');
    await helper.interactWithContent('interactive');
    await helper.trackProgress();
    
    // View analytics dashboard
    await helper.viewAnalytics();
    
    // Check recommendations
    await helper.accessRecommendations();
    
    // Verify personalization features
    const personalizationElements = await page.locator('[data-testid*="personalized"], [data-testid*="recommended"]').count();
    expect(personalizationElements).toBeGreaterThan(0);
  });
});

// Test Suite: Instructor Workflows
test.describe('Instructor Content Management Workflows', () => {
  let helper: EducationalWorkflowHelper;
  let instructor: InstructorUser;

  test.beforeEach(async ({ page }) => {
    helper = new EducationalWorkflowHelper(page);
    instructor = {
      email: `instructor-${Date.now()}@university.edu`,
      username: `instructor_${Date.now()}`,
      password: 'InstructorPass123!',
      credentials: {
        degree: 'Ph.D. in Psychology',
        institution: 'University of Test',
        specialty: 'Analytical Psychology'
      }
    };
  });

  test('Content creation and publication workflow', async ({ page }) => {
    // Login as instructor
    await helper.loginUser(instructor.email, instructor.password);
    
    // Navigate to content creation
    await page.goto('/admin/content/create');
    
    // Create new module
    await page.fill('[data-testid="module-title"]', 'Test Module: Shadow Work');
    await page.fill('[data-testid="module-description"]', 'Comprehensive guide to shadow work practices');
    
    // Add content sections
    await page.click('[data-testid="add-section"]');
    await page.fill('[data-testid="section-title-0"]', 'Introduction to Shadow');
    await page.fill('[data-testid="section-content-0"]', 'The shadow represents the hidden aspects of personality...');
    
    // Save draft
    await page.click('[data-testid="save-draft"]');
    await expect(page.locator('[data-testid="draft-saved"]')).toBeVisible();
    
    // Preview content
    await page.click('[data-testid="preview-content"]');
    await expect(page.locator('[data-testid="content-preview"]')).toBeVisible();
    
    // Publish module
    await page.click('[data-testid="publish-module"]');
    await expect(page.locator('[data-testid="publish-success"]')).toBeVisible();
  });

  test('Quiz creation and management workflow', async ({ page }) => {
    await helper.loginUser(instructor.email, instructor.password);
    
    // Navigate to quiz creator
    await page.goto('/admin/quiz/create');
    
    // Create quiz template
    await page.fill('[data-testid="quiz-title"]', 'Shadow Work Assessment');
    await page.selectOption('[data-testid="quiz-type"]', 'adaptive');
    
    // Add questions
    await page.click('[data-testid="add-question"]');
    await page.selectOption('[data-testid="question-type-0"]', 'multiple-choice');
    await page.fill('[data-testid="question-text-0"]', 'What is the shadow in analytical psychology?');
    
    // Add answer options
    await page.fill('[data-testid="answer-0-0"]', 'The unconscious aspect of personality');
    await page.fill('[data-testid="answer-0-1"]', 'A literal shadow');
    await page.click('[data-testid="correct-answer-0-0"]'); // Mark first as correct
    
    // Configure adaptive logic
    await page.fill('[data-testid="difficulty-weight"]', '0.7');
    await page.fill('[data-testid="discrimination-index"]', '0.5');
    
    // Save quiz template
    await page.click('[data-testid="save-quiz-template"]');
    await expect(page.locator('[data-testid="template-saved"]')).toBeVisible();
    
    // Test quiz generation
    await page.click('[data-testid="test-generation"]');
    await expect(page.locator('[data-testid="generated-quiz-preview"]')).toBeVisible({ timeout: 15000 });
  });

  test('Student analytics and progress monitoring', async ({ page }) => {
    await helper.loginUser(instructor.email, instructor.password);
    
    // Navigate to instructor dashboard
    await page.goto('/admin/dashboard');
    
    // View class analytics
    await expect(page.locator('[data-testid="class-analytics"]')).toBeVisible();
    
    // Check student progress overview
    const studentCount = await page.locator('[data-testid^="student-progress-"]').count();
    expect(studentCount).toBeGreaterThanOrEqual(0);
    
    // View detailed analytics for a student (if any exist)
    if (studentCount > 0) {
      await page.click('[data-testid^="student-progress-"]').first();
      await expect(page.locator('[data-testid="student-detail-analytics"]')).toBeVisible();
      
      // Check analytics components
      await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
    }
    
    // Export analytics report
    await page.click('[data-testid="export-analytics"]');
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/analytics.*\.(csv|xlsx|pdf)$/);
  });
});

// Test Suite: Cross-Browser Compatibility
test.describe('Cross-Browser Educational Workflows', () => {
  let helper: EducationalWorkflowHelper;

  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`Student workflow compatibility on ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Test specific to ${browserName}`);
      
      helper = new EducationalWorkflowHelper(page);
      
      const student: StudentUser = {
        email: `browser-test-${browserName}@test.edu`,
        username: `browser_test_${browserName}`,
        password: 'BrowserTest123!'
      };
      
      // Core workflow test
      await helper.navigateToHomepage();
      await helper.registerStudent(student);
      await helper.loginUser(student.email, student.password);
      await helper.enrollInCourse('jung-psychology-101');
      await helper.accessModule('introduction-to-analytical-psychology');
      await helper.interactWithContent('text');
      
      // Browser-specific performance checks
      const browserMetrics = await page.evaluate(() => ({
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null
      }));
      
      console.log(`Browser metrics for ${browserName}:`, browserMetrics);
      
      // Verify no browser-specific errors
      await helper.checkSystemHealth();
    });
  });
});

// Test Suite: Mobile Responsive Workflows
test.describe('Mobile Educational Experience', () => {
  let helper: EducationalWorkflowHelper;

  test('Student mobile learning workflow', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    helper = new EducationalWorkflowHelper(page);
    
    const mobileStudent: StudentUser = {
      email: `mobile-student@test.edu`,
      username: `mobile_student`,
      password: 'MobileTest123!'
    };
    
    // Mobile-optimized workflow
    await helper.navigateToHomepage();
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
    
    // Register on mobile
    await helper.registerStudent(mobileStudent);
    await helper.loginUser(mobileStudent.email, mobileStudent.password);
    
    // Mobile course browsing
    await page.goto('/courses');
    await expect(page.locator('[data-testid="mobile-course-list"]')).toBeVisible();
    
    // Enroll and access content on mobile
    await helper.enrollInCourse('jung-psychology-101');
    await helper.accessModule('introduction-to-analytical-psychology');
    
    // Test mobile-optimized content interaction
    await helper.interactWithContent('text');
    
    // Check mobile quiz interaction
    await helper.interactWithContent('quiz');
    
    // Verify mobile performance
    const mobileMetrics = await page.evaluate(() => ({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      touchSupport: 'ontouchstart' in window,
      orientation: screen.orientation ? screen.orientation.type : 'unknown'
    }));
    
    expect(mobileMetrics.touchSupport).toBe(true);
    expect(mobileMetrics.viewport.width).toBeLessThan(768); // Mobile breakpoint
  });
});

// Test Suite: Accessibility Workflows
test.describe('Educational Platform Accessibility', () => {
  let helper: EducationalWorkflowHelper;

  test('Keyboard navigation workflow', async ({ page }) => {
    helper = new EducationalWorkflowHelper(page);
    
    await helper.navigateToHomepage();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab'); // Focus first interactive element
    await page.keyboard.press('Enter'); // Activate element
    
    // Navigate to login via keyboard
    let tabCount = 0;
    while (tabCount < 20) { // Safety limit
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').getAttribute('data-testid');
      
      if (focusedElement === 'login-link') {
        await page.keyboard.press('Enter');
        break;
      }
      tabCount++;
    }
    
    // Verify login page accessibility
    await expect(page.locator('[data-testid="login-form"]')).toBeFocused();
    
    // Test form completion via keyboard
    await page.keyboard.type('accessibility@test.edu');
    await page.keyboard.press('Tab');
    await page.keyboard.type('AccessibilityTest123!');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Submit form
  });

  test('Screen reader compatibility', async ({ page }) => {
    helper = new EducationalWorkflowHelper(page);
    
    await helper.navigateToHomepage();
    
    // Check ARIA labels and roles
    const ariaElements = await page.locator('[aria-label], [aria-describedby], [role]').count();
    expect(ariaElements).toBeGreaterThan(0);
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map(h => h.evaluate(el => parseInt(el.tagName.slice(1))))
    );
    
    // Verify proper heading hierarchy (no skipping levels)
    let previousLevel = 0;
    for (const level of headingLevels) {
      if (previousLevel > 0) {
        expect(level - previousLevel).toBeLessThanOrEqual(1);
      }
      previousLevel = level;
    }
    
    // Check alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const altText = await img.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
    
    // Check form labels
    const inputs = await page.locator('input, textarea, select').all();
    for (const input of inputs) {
      const inputId = await input.getAttribute('id');
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        await expect(label).toBeVisible();
      }
    }
  });

  test('Color contrast and visual accessibility', async ({ page }) => {
    helper = new EducationalWorkflowHelper(page);
    
    await helper.navigateToHomepage();
    
    // Test high contrast mode compatibility
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('body')).toBeVisible();
    
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('body')).toBeVisible();
    
    // Check focus indicators
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    const focusStyles = await focusedElement.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow
      };
    });
    
    // Verify focus is visible (has outline or box-shadow)
    const hasFocusIndicator = focusStyles.outline !== 'none' || 
                             focusStyles.boxShadow !== 'none';
    expect(hasFocusIndicator).toBe(true);
  });
});