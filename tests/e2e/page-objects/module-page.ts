import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page Object Model for Module Page
 * Handles all interactions with individual modules
 */
export class ModulePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Dynamic URL based on module ID
  getUrl(moduleId: string): string {
    return `/modules/${moduleId}`;
  }

  // Header elements
  get moduleTitle(): Locator {
    return this.page.locator('[data-testid="module-title"]');
  }

  get moduleDescription(): Locator {
    return this.page.locator('[data-testid="module-description"]');
  }

  get moduleDifficulty(): Locator {
    return this.page.locator('[data-testid="module-difficulty"]');
  }

  get moduleDuration(): Locator {
    return this.page.locator('[data-testid="module-duration"]');
  }

  get moduleProgress(): Locator {
    return this.page.locator('[data-testid="module-progress"]');
  }

  get progressBar(): Locator {
    return this.page.locator('[data-testid="progress-bar"]');
  }

  // Navigation elements
  get backButton(): Locator {
    return this.page.locator('[data-testid="back-button"]');
  }

  get nextButton(): Locator {
    return this.page.locator('[data-testid="next-button"]');
  }

  get previousButton(): Locator {
    return this.page.locator('[data-testid="previous-button"]');
  }

  get moduleNavigation(): Locator {
    return this.page.locator('[data-testid="module-navigation"]');
  }

  get sectionList(): Locator {
    return this.page.locator('[data-testid="section-list"]');
  }

  // Content elements
  get mainContent(): Locator {
    return this.page.locator('[data-testid="main-content"]');
  }

  get contentSection(): Locator {
    return this.page.locator('[data-testid="content-section"]');
  }

  get markdownContent(): Locator {
    return this.page.locator('[data-testid="markdown-content"]');
  }

  get videoPlayer(): Locator {
    return this.page.locator('[data-testid="video-player"]');
  }

  get interactiveElements(): Locator {
    return this.page.locator('[data-testid="interactive-elements"]');
  }

  // Quiz elements
  get quizContainer(): Locator {
    return this.page.locator('[data-testid="quiz-container"]');
  }

  get quizQuestion(): Locator {
    return this.page.locator('[data-testid="quiz-question"]');
  }

  get quizOptions(): Locator {
    return this.page.locator('[data-testid="quiz-option"]');
  }

  get submitAnswerButton(): Locator {
    return this.page.locator('[data-testid="submit-answer-button"]');
  }

  get quizResult(): Locator {
    return this.page.locator('[data-testid="quiz-result"]');
  }

  get nextQuestionButton(): Locator {
    return this.page.locator('[data-testid="next-question-button"]');
  }

  // Action buttons
  get completeModuleButton(): Locator {
    return this.page.locator('[data-testid="complete-module-button"]');
  }

  get bookmarkButton(): Locator {
    return this.page.locator('[data-testid="bookmark-button"]');
  }

  get shareButton(): Locator {
    return this.page.locator('[data-testid="share-button"]');
  }

  get printButton(): Locator {
    return this.page.locator('[data-testid="print-button"]');
  }

  get downloadButton(): Locator {
    return this.page.locator('[data-testid="download-button"]');
  }

  // Notes elements
  get notesSection(): Locator {
    return this.page.locator('[data-testid="notes-section"]');
  }

  get notesTextarea(): Locator {
    return this.page.locator('[data-testid="notes-textarea"]');
  }

  get saveNotesButton(): Locator {
    return this.page.locator('[data-testid="save-notes-button"]');
  }

  get notesToggle(): Locator {
    return this.page.locator('[data-testid="notes-toggle"]');
  }

  // Page actions
  async navigateToModule(moduleId: string): Promise<void> {
    await this.goto(this.getUrl(moduleId));
    await this.waitForPageLoad();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
    await this.waitForPageLoad();
  }

  async goToNextSection(): Promise<void> {
    await this.nextButton.click();
    await this.waitForPageLoad();
  }

  async goToPreviousSection(): Promise<void> {
    await this.previousButton.click();
    await this.waitForPageLoad();
  }

  async completeModule(): Promise<void> {
    await this.completeModuleButton.click();
    await this.waitForPageLoad();
  }

  async toggleBookmark(): Promise<void> {
    await this.bookmarkButton.click();
  }

  async shareModule(): Promise<void> {
    await this.shareButton.click();
    await this.waitHelper.waitForElementToBeVisible('[data-testid="share-modal"]');
  }

  async printModule(): Promise<void> {
    await this.printButton.click();
    // Handle print dialog
  }

  async downloadModule(): Promise<void> {
    await this.downloadButton.click();
    // Handle file download
    await this.page.waitForEvent('download');
  }

  // Content navigation
  async navigateToSection(sectionIndex: number): Promise<void> {
    const sections = await this.sectionList.locator('[data-testid="section-item"]').all();
    if (sections[sectionIndex]) {
      await sections[sectionIndex].click();
      await this.waitForPageLoad();
    }
  }

  async navigateToSectionByTitle(title: string): Promise<void> {
    const section = this.page.locator(`[data-testid="section-item"]:has-text("${title}")`);
    await section.click();
    await this.waitForPageLoad();
  }

  async getSectionTitles(): Promise<string[]> {
    const sections = await this.sectionList.locator('[data-testid="section-item"]').all();
    const titles: string[] = [];
    for (const section of sections) {
      const title = await section.textContent();
      if (title) titles.push(title.trim());
    }
    return titles;
  }

  // Video interactions
  async playVideo(): Promise<void> {
    await this.videoPlayer.locator('[data-testid="play-button"]').click();
  }

  async pauseVideo(): Promise<void> {
    await this.videoPlayer.locator('[data-testid="pause-button"]').click();
  }

  async seekVideo(time: number): Promise<void> {
    const seekBar = this.videoPlayer.locator('[data-testid="seek-bar"]');
    await seekBar.click();
    // Implementation depends on video player component
  }

  async toggleFullscreen(): Promise<void> {
    await this.videoPlayer.locator('[data-testid="fullscreen-button"]').click();
  }

  // Quiz interactions
  async selectQuizOption(optionIndex: number): Promise<void> {
    const options = await this.quizOptions.all();
    if (options[optionIndex]) {
      await options[optionIndex].click();
    }
  }

  async selectQuizOptionByText(optionText: string): Promise<void> {
    const option = this.page.locator(`[data-testid="quiz-option"]:has-text("${optionText}")`);
    await option.click();
  }

  async submitQuizAnswer(): Promise<void> {
    await this.submitAnswerButton.click();
    await this.waitHelper.waitForElementToBeVisible('[data-testid="quiz-result"]');
  }

  async goToNextQuestion(): Promise<void> {
    await this.nextQuestionButton.click();
    await this.waitForPageLoad();
  }

  async getQuizQuestion(): Promise<string> {
    return await this.getElementText('[data-testid="quiz-question"]');
  }

  async getQuizResult(): Promise<string> {
    return await this.getElementText('[data-testid="quiz-result"]');
  }

  async isQuizAnswerCorrect(): Promise<boolean> {
    const result = await this.getQuizResult();
    return result.toLowerCase().includes('correct') || result.toLowerCase().includes('right');
  }

  // Notes functionality
  async toggleNotes(): Promise<void> {
    await this.notesToggle.click();
    await this.waitHelper.waitForElementToBeVisible('[data-testid="notes-section"]');
  }

  async addNote(note: string): Promise<void> {
    await this.notesTextarea.fill(note);
    await this.saveNotesButton.click();
  }

  async appendToNotes(note: string): Promise<void> {
    const currentNotes = await this.notesTextarea.inputValue();
    const newNotes = currentNotes ? `${currentNotes}\n${note}` : note;
    await this.notesTextarea.fill(newNotes);
    await this.saveNotesButton.click();
  }

  async getNotes(): Promise<string> {
    return await this.notesTextarea.inputValue();
  }

  async clearNotes(): Promise<void> {
    await this.notesTextarea.clear();
    await this.saveNotesButton.click();
  }

  // Progress tracking
  async getProgress(): Promise<string> {
    return await this.getElementText('[data-testid="module-progress"]');
  }

  async getProgressPercentage(): Promise<number> {
    const progressText = await this.getProgress();
    const match = progressText.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  // Validation helpers
  async isModuleLoaded(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="module-title"]');
  }

  async isVideoAvailable(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="video-player"]');
  }

  async isQuizAvailable(): Promise<boolean> {
    return await this.isElementVisible('[data-testid="quiz-container"]');
  }

  async isModuleCompleted(): Promise<boolean> {
    const progress = await this.getProgressPercentage();
    return progress === 100;
  }

  async isBookmarked(): Promise<boolean> {
    const bookmarkButton = this.bookmarkButton;
    const className = await bookmarkButton.getAttribute('class');
    return className?.includes('bookmarked') || false;
  }

  async getModuleTitle(): Promise<string> {
    return await this.getElementText('[data-testid="module-title"]');
  }

  async getModuleDescription(): Promise<string> {
    return await this.getElementText('[data-testid="module-description"]');
  }

  async getModuleDifficulty(): Promise<string> {
    return await this.getElementText('[data-testid="module-difficulty"]');
  }

  async getModuleDuration(): Promise<string> {
    return await this.getElementText('[data-testid="module-duration"]');
  }

  // Interactive elements
  get interactiveQuizzes(): Locator {
    return this.page.locator('[data-testid="interactive-quiz"]');
  }

  get codeEditor(): Locator {
    return this.page.locator('[data-testid="code-editor"]');
  }

  get simulationFrame(): Locator {
    return this.page.locator('[data-testid="simulation-frame"]');
  }

  async interactWithCodeEditor(code: string): Promise<void> {
    await this.codeEditor.fill(code);
    await this.page.locator('[data-testid="run-code-button"]').click();
  }

  async getCodeOutput(): Promise<string> {
    return await this.getElementText('[data-testid="code-output"]');
  }

  // Accessibility helpers
  async skipToMainContent(): Promise<void> {
    await this.page.locator('[data-testid="skip-to-content"]').click();
  }

  async increaseFontSize(): Promise<void> {
    await this.page.locator('[data-testid="increase-font-size"]').click();
  }

  async decreaseFontSize(): Promise<void> {
    await this.page.locator('[data-testid="decrease-font-size"]').click();
  }
}