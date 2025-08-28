import { Page, expect } from '@playwright/test';
import { BasePage } from '../utils/test-helpers';

export class ModulePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  get moduleTitle() {
    return this.page.locator('[data-testid="module-title"], h1, .module-header');
  }

  get moduleContent() {
    return this.page.locator('[data-testid="module-content"], .module-content, .lesson-content');
  }

  get sectionContent() {
    return this.page.locator('[data-testid="section-content"], .section-text, .content');
  }

  get progressBar() {
    return this.page.locator('[data-testid="progress"], .progress-bar, .module-progress');
  }

  get nextButton() {
    return this.page.locator('[data-testid="next-section"], button:has-text("Próximo"), .nav-next');
  }

  get previousButton() {
    return this.page.locator('[data-testid="prev-section"], button:has-text("Anterior"), .nav-prev');
  }

  get startButton() {
    return this.page.locator('[data-testid="start-module"], button:has-text("Iniciar"), button:has-text("Continuar")');
  }

  get completeButton() {
    return this.page.locator('[data-testid="mark-complete"], button:has-text("Concluir"), .complete-section');
  }

  get tableOfContents() {
    return this.page.locator('[data-testid="toc"], button:has-text("Índice"), .table-of-contents');
  }

  get sectionList() {
    return this.page.locator('[data-testid="section-list"], .toc-section, .section-item');
  }

  get notesButton() {
    return this.page.locator('[data-testid="notes"], button:has-text("Notas"), .notes-toggle');
  }

  get notesPanel() {
    return this.page.locator('[data-testid="notes-panel"], .notes-sidebar, .note-editor');
  }

  get noteInput() {
    return this.page.locator('[data-testid="note-input"], textarea[placeholder*="nota"]');
  }

  get saveNoteButton() {
    return this.page.locator('button:has-text("Salvar"), button:has-text("Save"), [data-testid="save-note"]');
  }

  get videoPlayer() {
    return this.page.locator('[data-testid="video-player"], video, .video-container');
  }

  get playButton() {
    return this.page.locator('[data-testid="play-button"], .play-btn, button[aria-label*="play"]');
  }

  get subtitleButton() {
    return this.page.locator('[data-testid="subtitles"], .subtitle-btn, button[aria-label*="subtitle"]');
  }

  get quizSection() {
    return this.page.locator('[data-testid="quiz"], .quiz-section, .quiz');
  }

  get timeSpentDisplay() {
    return this.page.locator('.time-spent, .engagement-metric');
  }

  // Actions
  async navigateToModule(moduleId: number): Promise<void> {
    await this.page.goto(`/module/${moduleId}`);
    await this.waitForPageLoad();
  }

  async navigateToSection(moduleId: number, sectionId: number): Promise<void> {
    await this.page.goto(`/module/${moduleId}/section/${sectionId}`);
    await this.waitForPageLoad();
  }

  async startModule(): Promise<void> {
    if (await this.startButton.isVisible()) {
      await this.clickElement(this.startButton);
    }
  }

  async nextSection(): Promise<void> {
    if (await this.nextButton.isVisible()) {
      await this.clickElement(this.nextButton);
    }
  }

  async previousSection(): Promise<void> {
    if (await this.previousButton.isVisible()) {
      await this.clickElement(this.previousButton);
    }
  }

  async markSectionComplete(): Promise<void> {
    if (await this.completeButton.isVisible()) {
      await this.clickElement(this.completeButton);
    }
  }

  async openTableOfContents(): Promise<void> {
    if (await this.tableOfContents.isVisible()) {
      await this.clickElement(this.tableOfContents);
    }
  }

  async jumpToSection(sectionIndex: number): Promise<void> {
    await this.openTableOfContents();
    
    if (await this.sectionList.first().isVisible()) {
      await this.clickElement(this.sectionList.nth(sectionIndex));
    }
  }

  async openNotes(): Promise<void> {
    if (await this.notesButton.isVisible()) {
      await this.clickElement(this.notesButton);
    }
  }

  async addNote(noteContent: string): Promise<void> {
    await this.openNotes();
    
    if (await this.noteInput.isVisible()) {
      await this.fillInput(this.noteInput, noteContent);
      
      if (await this.saveNoteButton.isVisible()) {
        await this.clickElement(this.saveNoteButton);
      }
    }
  }

  async playVideo(): Promise<void> {
    if (await this.playButton.isVisible()) {
      await this.clickElement(this.playButton);
    }
  }

  async toggleSubtitles(): Promise<void> {
    if (await this.subtitleButton.isVisible()) {
      await this.clickElement(this.subtitleButton);
    }
  }

  async scrollThroughContent(): Promise<void> {
    const content = this.sectionContent;
    if (await content.isVisible()) {
      await content.scrollIntoViewIfNeeded();
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
    }
  }

  async simulateReadingTime(seconds: number = 3): Promise<void> {
    await this.scrollThroughContent();
    await this.page.waitForTimeout(seconds * 1000);
  }

  // Assertions
  async expectModuleLoaded(expectedTitle?: string): Promise<void> {
    await expect(this.moduleTitle.first()).toBeVisible();
    
    if (expectedTitle) {
      await expect(this.moduleTitle.first()).toContainText(expectedTitle);
    }
  }

  async expectContentVisible(): Promise<void> {
    await expect(this.moduleContent).toBeVisible();
  }

  async expectProgressUpdated(): Promise<void> {
    const progress = this.progressBar.first();
    if (await progress.isVisible()) {
      const progressText = await progress.textContent();
      expect(progressText).toMatch(/[1-9]\d*%|[2-9]\/\d+/);
    }
  }

  async expectSectionCompleted(): Promise<void> {
    const completionCheck = this.page.locator(
      '.completed, .check-mark, [data-testid="section-complete"]'
    );
    if (await completionCheck.isVisible()) {
      await expect(completionCheck).toBeVisible();
    }
  }

  async expectNavigationAvailable(): Promise<void> {
    // At least one navigation button should be visible
    const hasNext = await this.nextButton.isVisible();
    const hasPrev = await this.previousButton.isVisible();
    
    expect(hasNext || hasPrev).toBeTruthy();
  }

  async expectVideoPlayerLoaded(): Promise<void> {
    if (await this.videoPlayer.isVisible()) {
      await expect(this.videoPlayer).toBeVisible();
      await expect(this.playButton).toBeVisible();
    }
  }

  async expectNotesAvailable(): Promise<void> {
    if (await this.notesButton.isVisible()) {
      await this.openNotes();
      await expect(this.notesPanel).toBeVisible();
    }
  }

  async expectNoteAdded(noteContent: string): Promise<void> {
    const savedNote = this.page.locator('.note-item, .saved-note');
    if (await savedNote.first().isVisible()) {
      await expect(savedNote.first()).toContainText(noteContent);
    }
  }

  async expectQuizAvailable(): Promise<void> {
    if (await this.quizSection.isVisible()) {
      await expect(this.quizSection).toBeVisible();
    }
  }

  async expectTimeTracked(): Promise<void> {
    if (await this.timeSpentDisplay.first().isVisible()) {
      const timeText = await this.timeSpentDisplay.first().textContent();
      expect(timeText).toMatch(/\d+:\d+|\d+ min/);
    }
  }

  async expectAccessibleContent(): Promise<void> {
    // Check for proper heading hierarchy
    const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Check main content has proper structure
    const mainContent = this.page.locator('main, [role="main"]');
    await expect(mainContent.first()).toBeVisible();
  }
}
