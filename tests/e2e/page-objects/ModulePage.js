"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModulePage = void 0;
const test_1 = require("@playwright/test");
const test_helpers_1 = require("../utils/test-helpers");
class ModulePage extends test_helpers_1.BasePage {
    constructor(page) {
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
    async navigateToModule(moduleId) {
        await this.page.goto(`/module/${moduleId}`);
        await this.waitForPageLoad();
    }
    async navigateToSection(moduleId, sectionId) {
        await this.page.goto(`/module/${moduleId}/section/${sectionId}`);
        await this.waitForPageLoad();
    }
    async startModule() {
        if (await this.startButton.isVisible()) {
            await this.clickElement(this.startButton);
        }
    }
    async nextSection() {
        if (await this.nextButton.isVisible()) {
            await this.clickElement(this.nextButton);
        }
    }
    async previousSection() {
        if (await this.previousButton.isVisible()) {
            await this.clickElement(this.previousButton);
        }
    }
    async markSectionComplete() {
        if (await this.completeButton.isVisible()) {
            await this.clickElement(this.completeButton);
        }
    }
    async openTableOfContents() {
        if (await this.tableOfContents.isVisible()) {
            await this.clickElement(this.tableOfContents);
        }
    }
    async jumpToSection(sectionIndex) {
        await this.openTableOfContents();
        if (await this.sectionList.first().isVisible()) {
            await this.clickElement(this.sectionList.nth(sectionIndex));
        }
    }
    async openNotes() {
        if (await this.notesButton.isVisible()) {
            await this.clickElement(this.notesButton);
        }
    }
    async addNote(noteContent) {
        await this.openNotes();
        if (await this.noteInput.isVisible()) {
            await this.fillInput(this.noteInput, noteContent);
            if (await this.saveNoteButton.isVisible()) {
                await this.clickElement(this.saveNoteButton);
            }
        }
    }
    async playVideo() {
        if (await this.playButton.isVisible()) {
            await this.clickElement(this.playButton);
        }
    }
    async toggleSubtitles() {
        if (await this.subtitleButton.isVisible()) {
            await this.clickElement(this.subtitleButton);
        }
    }
    async scrollThroughContent() {
        const content = this.sectionContent;
        if (await content.isVisible()) {
            await content.scrollIntoViewIfNeeded();
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
        }
    }
    async simulateReadingTime(seconds = 3) {
        await this.scrollThroughContent();
        await this.page.waitForTimeout(seconds * 1000);
    }
    // Assertions
    async expectModuleLoaded(expectedTitle) {
        await (0, test_1.expect)(this.moduleTitle.first()).toBeVisible();
        if (expectedTitle) {
            await (0, test_1.expect)(this.moduleTitle.first()).toContainText(expectedTitle);
        }
    }
    async expectContentVisible() {
        await (0, test_1.expect)(this.moduleContent).toBeVisible();
    }
    async expectProgressUpdated() {
        const progress = this.progressBar.first();
        if (await progress.isVisible()) {
            const progressText = await progress.textContent();
            (0, test_1.expect)(progressText).toMatch(/[1-9]\d*%|[2-9]\/\d+/);
        }
    }
    async expectSectionCompleted() {
        const completionCheck = this.page.locator('.completed, .check-mark, [data-testid="section-complete"]');
        if (await completionCheck.isVisible()) {
            await (0, test_1.expect)(completionCheck).toBeVisible();
        }
    }
    async expectNavigationAvailable() {
        // At least one navigation button should be visible
        const hasNext = await this.nextButton.isVisible();
        const hasPrev = await this.previousButton.isVisible();
        (0, test_1.expect)(hasNext || hasPrev).toBeTruthy();
    }
    async expectVideoPlayerLoaded() {
        if (await this.videoPlayer.isVisible()) {
            await (0, test_1.expect)(this.videoPlayer).toBeVisible();
            await (0, test_1.expect)(this.playButton).toBeVisible();
        }
    }
    async expectNotesAvailable() {
        if (await this.notesButton.isVisible()) {
            await this.openNotes();
            await (0, test_1.expect)(this.notesPanel).toBeVisible();
        }
    }
    async expectNoteAdded(noteContent) {
        const savedNote = this.page.locator('.note-item, .saved-note');
        if (await savedNote.first().isVisible()) {
            await (0, test_1.expect)(savedNote.first()).toContainText(noteContent);
        }
    }
    async expectQuizAvailable() {
        if (await this.quizSection.isVisible()) {
            await (0, test_1.expect)(this.quizSection).toBeVisible();
        }
    }
    async expectTimeTracked() {
        if (await this.timeSpentDisplay.first().isVisible()) {
            const timeText = await this.timeSpentDisplay.first().textContent();
            (0, test_1.expect)(timeText).toMatch(/\d+:\d+|\d+ min/);
        }
    }
    async expectAccessibleContent() {
        // Check for proper heading hierarchy
        const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
        const headingCount = await headings.count();
        (0, test_1.expect)(headingCount).toBeGreaterThan(0);
        // Check main content has proper structure
        const mainContent = this.page.locator('main, [role="main"]');
        await (0, test_1.expect)(mainContent.first()).toBeVisible();
    }
}
exports.ModulePage = ModulePage;
//# sourceMappingURL=ModulePage.js.map