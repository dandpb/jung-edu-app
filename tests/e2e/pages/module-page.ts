import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { testSelectors, testConfig } from '../fixtures/test-data';

/**
 * Module page object model for viewing educational content
 */
export class ModulePage extends BasePage {
  readonly moduleContent: Locator;
  readonly moduleTitle: Locator;
  readonly moduleDescription: Locator;
  readonly moduleProgress: Locator;
  readonly nextButton: Locator;
  readonly prevButton: Locator;
  readonly bookmarkButton: Locator;
  readonly takeNotesButton: Locator;
  readonly startQuizButton: Locator;
  readonly moduleNavigation: Locator;
  readonly breadcrumbs: Locator;
  readonly tableOfContents: Locator;
  readonly videoPlayer: Locator;

  constructor(page: Page) {
    super(page);
    this.moduleContent = page.locator(testSelectors.moduleContent);
    this.moduleTitle = page.locator('[data-testid=\"module-title\"]');
    this.moduleDescription = page.locator('[data-testid=\"module-description\"]');
    this.moduleProgress = page.locator('[data-testid=\"module-progress\"]');
    this.nextButton = page.locator(testSelectors.nextButton);
    this.prevButton = page.locator(testSelectors.prevButton);
    this.bookmarkButton = page.locator('[data-testid=\"bookmark-button\"]');
    this.takeNotesButton = page.locator('[data-testid=\"take-notes-button\"]');
    this.startQuizButton = page.locator('[data-testid=\"start-quiz-button\"]');
    this.moduleNavigation = page.locator('[data-testid=\"module-navigation\"]');
    this.breadcrumbs = page.locator('[data-testid=\"breadcrumbs\"]');
    this.tableOfContents = page.locator('[data-testid=\"table-of-contents\"]');
    this.videoPlayer = page.locator('[data-testid=\"video-player\"]');
  }

  /**
   * Navigate to specific module
   */
  async goto(moduleId: string) {
    await this.page.goto(`/module/${moduleId}`);
    await this.waitForPageLoad();
    // Give time for the module to load with test data
    await this.page.waitForTimeout(1000);
    await expect(this.moduleContent).toBeVisible();
  }

  /**
   * Verify module page loaded correctly
   */
  async verifyModuleLoaded(expectedTitle?: string) {
    await expect(this.moduleContent).toBeVisible();
    await expect(this.moduleTitle).toBeVisible();
    
    if (expectedTitle) {
      await expect(this.moduleTitle).toContainText(expectedTitle);
    }
    
    // Verify navigation elements
    await expect(this.moduleNavigation).toBeVisible();
    await expect(this.breadcrumbs).toBeVisible();
  }

  /**
   * Get module title
   */
  async getTitle(): Promise<string> {
    return await this.moduleTitle.textContent() || '';
  }

  /**
   * Get module progress percentage
   */
  async getProgress(): Promise<number> {
    if (await this.moduleProgress.isVisible()) {
      const progressText = await this.moduleProgress.textContent();
      const match = progressText?.match(/(\\d+)%/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  /**
   * Navigate to next section/page
   */
  async goToNext() {
    await expect(this.nextButton).toBeEnabled();
    await this.nextButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to previous section/page
   */
  async goToPrevious() {
    await expect(this.prevButton).toBeEnabled();
    await this.prevButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Bookmark this module
   */
  async bookmark() {
    await this.bookmarkButton.click();
    
    // Wait for bookmark confirmation
    await this.waitForSuccessMessage();
    
    // Button should show bookmarked state
    await expect(this.bookmarkButton).toHaveAttribute('data-bookmarked', 'true');
  }

  /**
   * Remove bookmark
   */
  async removeBookmark() {
    await this.bookmarkButton.click();
    
    // Button should show unbookmarked state
    await expect(this.bookmarkButton).toHaveAttribute('data-bookmarked', 'false');
  }

  /**
   * Open notes interface
   */
  async openNotes() {
    await this.takeNotesButton.click();
    
    const notesPanel = this.page.locator('[data-testid=\"notes-panel\"]');
    await expect(notesPanel).toBeVisible();
  }

  /**
   * Start quiz for this module
   */
  async startQuiz() {
    await this.startQuizButton.click();
    
    // Should navigate to quiz page
    await this.page.waitForURL(/\/quiz\//, { timeout: testConfig.defaultTimeout });
    
    const quizContainer = this.page.locator(testSelectors.quizContainer);
    await expect(quizContainer).toBeVisible();
  }

  /**
   * Navigate using table of contents
   */
  async navigateToSection(sectionName: string) {
    await this.tableOfContents.click();
    
    const tocPanel = this.page.locator('[data-testid=\"toc-panel\"]');
    await expect(tocPanel).toBeVisible();
    
    const sectionLink = tocPanel.locator(`[data-testid=\"toc-section-${sectionName}\"]`);
    await sectionLink.click();
    
    await this.waitForPageLoad();
  }

  /**
   * Play video if present
   */
  async playVideo() {
    if (await this.videoPlayer.isVisible()) {
      const playButton = this.videoPlayer.locator('[data-testid=\"video-play-button\"]');
      await playButton.click();
      
      // Verify video is playing
      await expect(this.videoPlayer).toHaveAttribute('data-playing', 'true');
    }
  }

  /**
   * Pause video
   */
  async pauseVideo() {
    if (await this.videoPlayer.isVisible()) {
      const pauseButton = this.videoPlayer.locator('[data-testid=\"video-pause-button\"]');
      await pauseButton.click();
      
      // Verify video is paused
      await expect(this.videoPlayer).toHaveAttribute('data-playing', 'false');
    }
  }

  /**
   * Verify content loaded properly
   */
  async verifyContentLoaded() {
    // Check that main content is visible
    await expect(this.moduleContent).toBeVisible();
    
    // Check for any images that should load
    const images = this.page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Wait for images to load
      await this.page.waitForLoadState('networkidle');
      
      // Verify first image loaded successfully
      const firstImage = images.first();
      await expect(firstImage).toHaveAttribute('src');
    }
  }

  /**
   * Test module navigation functionality
   */
  async testNavigationFlow() {
    // Test next/previous buttons
    const initialUrl = this.page.url();
    
    if (await this.nextButton.isEnabled()) {
      await this.goToNext();
      expect(this.page.url()).not.toBe(initialUrl);
      
      if (await this.prevButton.isEnabled()) {
        await this.goToPrevious();
        expect(this.page.url()).toBe(initialUrl);
      }
    }
  }

  /**
   * Check for interactive elements
   */
  async verifyInteractiveElements() {
    // Check for interactive code blocks
    const codeBlocks = this.page.locator('[data-testid=\"interactive-code\"]');
    const codeCount = await codeBlocks.count();
    
    if (codeCount > 0) {
      const firstCodeBlock = codeBlocks.first();
      await expect(firstCodeBlock).toBeVisible();
      
      // Test run button if present
      const runButton = firstCodeBlock.locator('[data-testid=\"run-code\"]');
      if (await runButton.isVisible()) {
        await runButton.click();
        
        // Should show output
        const output = firstCodeBlock.locator('[data-testid=\"code-output\"]');
        await expect(output).toBeVisible();
      }
    }
    
    // Check for interactive quizzes within content
    const inlineQuizzes = this.page.locator('[data-testid=\"inline-quiz\"]');
    const quizCount = await inlineQuizzes.count();
    
    if (quizCount > 0) {
      const firstQuiz = inlineQuizzes.first();
      await expect(firstQuiz).toBeVisible();
    }
  }

  /**
   * Test accessibility features
   */
  async testAccessibility() {
    // Test keyboard navigation
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    
    // Test screen reader compatibility
    await this.checkAccessibility();
    
    // Test text size adjustment if available
    const textSizeControl = this.page.locator('[data-testid=\"text-size-control\"]');
    if (await textSizeControl.isVisible()) {
      await textSizeControl.click();
      
      const increaseButton = this.page.locator('[data-testid=\"increase-text-size\"]');
      await increaseButton.click();
      
      // Verify text size increased
      const content = this.moduleContent;
      const fontSize = await content.evaluate(el => window.getComputedStyle(el).fontSize);
      expect(parseInt(fontSize)).toBeGreaterThan(14);
    }
  }

  /**
   * Mark module as completed
   */
  async markCompleted() {
    const completeButton = this.page.locator('[data-testid=\"mark-complete-button\"]');
    
    if (await completeButton.isVisible()) {
      await completeButton.click();
      
      // Should show completion confirmation
      await this.waitForSuccessMessage();
      
      // Progress should be 100%
      const progress = await this.getProgress();
      expect(progress).toBe(100);
    }
  }
}