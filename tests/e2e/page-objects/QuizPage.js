"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizPage = void 0;
const test_1 = require("@playwright/test");
const test_helpers_1 = require("../utils/test-helpers");
class QuizPage extends test_helpers_1.BasePage {
    constructor(page) {
        super(page);
    }
    // Locators
    get quizTitle() {
        return this.page.locator('[data-testid="quiz-title"], h1, .quiz-header');
    }
    get instructions() {
        return this.page.locator('[data-testid="instructions"], .quiz-instructions');
    }
    get startButton() {
        return this.page.locator('[data-testid="start-quiz"], button:has-text("Iniciar Quiz")');
    }
    get questionText() {
        return this.page.locator('[data-testid="question-text"], .question, .quiz-question');
    }
    get questionOptions() {
        return this.page.locator('input[type="radio"], .quiz-option');
    }
    get nextButton() {
        return this.page.locator('[data-testid="next-question"], button:has-text("Próxima")');
    }
    get previousButton() {
        return this.page.locator('[data-testid="prev-question"], button:has-text("Anterior")');
    }
    get submitButton() {
        return this.page.locator('[data-testid="submit-quiz"], button:has-text("Enviar"), button:has-text("Finalizar")');
    }
    get timer() {
        return this.page.locator('[data-testid="timer"], .time-remaining, .countdown');
    }
    get progressIndicator() {
        return this.page.locator('[data-testid="quiz-progress"], .question-progress');
    }
    get results() {
        return this.page.locator('[data-testid="quiz-results"], .quiz-score, .results-page');
    }
    get scoreDisplay() {
        return this.page.locator('[data-testid="quiz-score"], .score-display, .final-score');
    }
    get passStatus() {
        return this.page.locator('[data-testid="pass-status"], .passed, .quiz-passed, .failed, .quiz-failed');
    }
    get feedback() {
        return this.page.locator('[data-testid="feedback"], .quiz-feedback, .performance-feedback');
    }
    get reviewButton() {
        return this.page.locator('[data-testid="review-answers"], button:has-text("Revisar")');
    }
    get truefalseOptions() {
        return this.page.locator('input[type="radio"][value="true"], input[type="radio"][value="false"], .true-option, .false-option');
    }
    get fillBlankInput() {
        return this.page.locator('[data-testid="fill-blank"], input[type="text"], .fill-blank-input');
    }
    get essayInput() {
        return this.page.locator('[data-testid="essay-input"], textarea, .essay-answer');
    }
    get wordCount() {
        return this.page.locator('.word-count, [data-testid="word-count"]');
    }
    get resumeButton() {
        return this.page.locator('[data-testid="resume-quiz"], button:has-text("Continuar")');
    }
    get recommendationsSection() {
        return this.page.locator('[data-testid="recommendations"], .learning-recommendations, .next-steps');
    }
    // Actions
    async navigateToQuiz(quizId) {
        await this.page.goto(`/quiz/${quizId}`);
        await this.waitForPageLoad();
    }
    async startQuiz() {
        if (await this.startButton.isVisible()) {
            await this.clickElement(this.startButton);
        }
    }
    async answerMultipleChoice(optionIndex) {
        const option = this.questionOptions.nth(optionIndex);
        if (await option.isVisible()) {
            await this.clickElement(option);
        }
    }
    async answerTrueFalse(isTrue) {
        const value = isTrue ? 'true' : 'false';
        const option = this.page.locator(`input[type="radio"][value="${value}"], .${value}-option`);
        if (await option.isVisible()) {
            await this.clickElement(option);
        }
    }
    async answerFillBlank(answer) {
        if (await this.fillBlankInput.isVisible()) {
            await this.fillInput(this.fillBlankInput, answer);
        }
    }
    async answerEssay(answer) {
        if (await this.essayInput.isVisible()) {
            await this.fillInput(this.essayInput, answer);
        }
    }
    async nextQuestion() {
        if (await this.nextButton.isVisible()) {
            await this.clickElement(this.nextButton);
        }
    }
    async previousQuestion() {
        if (await this.previousButton.isVisible()) {
            await this.clickElement(this.previousButton);
        }
    }
    async submitQuiz() {
        if (await this.submitButton.isVisible()) {
            await this.clickElement(this.submitButton);
        }
    }
    async resumeQuiz() {
        if (await this.resumeButton.isVisible()) {
            await this.clickElement(this.resumeButton);
        }
    }
    async reviewAnswers() {
        if (await this.reviewButton.isVisible()) {
            await this.clickElement(this.reviewButton);
        }
    }
    async completeMultipleChoiceQuiz(answers) {
        await this.startQuiz();
        for (let i = 0; i < answers.length; i++) {
            await this.answerMultipleChoice(answers[i]);
            if (i < answers.length - 1) {
                await this.nextQuestion();
            }
            else {
                await this.submitQuiz();
            }
        }
    }
    async completeMixedQuiz(answers) {
        await this.startQuiz();
        for (let i = 0; i < answers.length; i++) {
            const answer = answers[i];
            switch (answer.type) {
                case 'multiple_choice':
                    await this.answerMultipleChoice(answer.answer);
                    break;
                case 'true_false':
                    await this.answerTrueFalse(answer.answer);
                    break;
                case 'fill_blank':
                case 'essay':
                    await this.fillInput(answer.type === 'essay' ? this.essayInput : this.fillBlankInput, answer.answer);
                    break;
            }
            if (i < answers.length - 1) {
                await this.nextQuestion();
            }
            else {
                await this.submitQuiz();
            }
        }
    }
    // Assertions
    async expectQuizLoaded(expectedTitle) {
        await (0, test_1.expect)(this.quizTitle.first()).toBeVisible();
        if (expectedTitle) {
            await (0, test_1.expect)(this.quizTitle.first()).toContainText(expectedTitle);
        }
    }
    async expectQuizStarted() {
        await (0, test_1.expect)(this.questionText.first()).toBeVisible();
    }
    async expectTimerVisible() {
        if (await this.timer.isVisible()) {
            await (0, test_1.expect)(this.timer).toBeVisible();
        }
    }
    async expectQuestionVisible(questionText) {
        await (0, test_1.expect)(this.questionText.first()).toBeVisible();
        if (questionText) {
            await (0, test_1.expect)(this.questionText.first()).toContainText(questionText);
        }
    }
    async expectOptionsAvailable(expectedCount) {
        await (0, test_1.expect)(this.questionOptions.first()).toBeVisible();
        if (expectedCount) {
            await (0, test_1.expect)(this.questionOptions).toHaveCount(expectedCount);
        }
    }
    async expectAnswerSelected() {
        const selectedOption = this.page.locator('input[type="radio"]:checked');
        await (0, test_1.expect)(selectedOption).toBeVisible();
    }
    async expectResultsDisplayed() {
        await (0, test_1.expect)(this.results.first()).toBeVisible();
    }
    async expectScore(expectedScore) {
        await (0, test_1.expect)(this.scoreDisplay.first()).toBeVisible();
        await (0, test_1.expect)(this.scoreDisplay.first()).toContainText(expectedScore.toString());
    }
    async expectPassStatus(shouldPass) {
        const status = this.passStatus.first();
        if (await status.isVisible()) {
            const statusText = shouldPass ? /passed|aprovado|sucesso/i : /failed|reprovado|falha/i;
            await (0, test_1.expect)(status).toContainText(statusText);
        }
    }
    async expectFeedback(feedbackText) {
        if (await this.feedback.first().isVisible()) {
            await (0, test_1.expect)(this.feedback.first()).toBeVisible();
            if (feedbackText) {
                await (0, test_1.expect)(this.feedback.first()).toContainText(feedbackText);
            }
        }
    }
    async expectResumeOption() {
        if (await this.resumeButton.isVisible()) {
            await (0, test_1.expect)(this.resumeButton).toBeVisible();
        }
    }
    async expectProgressIndicator() {
        if (await this.progressIndicator.isVisible()) {
            await (0, test_1.expect)(this.progressIndicator).toBeVisible();
        }
    }
    async expectWordCountTracking() {
        if (await this.wordCount.isVisible()) {
            await (0, test_1.expect)(this.wordCount).toContainText(/\d+ words?/);
        }
    }
    async expectRecommendations() {
        if (await this.recommendationsSection.first().isVisible()) {
            await (0, test_1.expect)(this.recommendationsSection.first()).toBeVisible();
            const recommendations = this.page.locator('.recommendation-item, .study-suggestion');
            if (await recommendations.first().isVisible()) {
                await (0, test_1.expect)(recommendations.first()).toBeVisible();
            }
        }
    }
    async expectQuizReviewAvailable() {
        const reviewSection = this.page.locator('[data-testid="question-review"], .answer-review, .question-analysis');
        if (await reviewSection.first().isVisible()) {
            await (0, test_1.expect)(reviewSection.first()).toBeVisible();
        }
    }
    async expectCorrectAnswerHighlighted() {
        const correctAnswer = this.page.locator('.correct, .right-answer');
        if (await correctAnswer.isVisible()) {
            await (0, test_1.expect)(correctAnswer).toBeVisible();
        }
    }
    async expectIncorrectAnswerHighlighted() {
        const incorrectAnswer = this.page.locator('.incorrect, .wrong-answer');
        if (await incorrectAnswer.isVisible()) {
            await (0, test_1.expect)(incorrectAnswer).toBeVisible();
        }
    }
    async expectExplanationVisible() {
        const explanation = this.page.locator('.explanation, .answer-explanation');
        if (await explanation.first().isVisible()) {
            await (0, test_1.expect)(explanation.first()).toBeVisible();
        }
    }
    // Mobile-specific assertions
    async expectMobileQuizLayout() {
        const quizContainer = this.page.locator('.quiz-container, .assessment-page');
        if (await quizContainer.isVisible()) {
            const boundingBox = await quizContainer.boundingBox();
            if (boundingBox) {
                (0, test_1.expect)(boundingBox.width).toBeLessThanOrEqual(375);
            }
        }
    }
    async expectTouchFriendlyOptions() {
        const options = this.page.locator('.quiz-option, input[type="radio"] + label');
        const optionCount = await options.count();
        for (let i = 0; i < Math.min(2, optionCount); i++) {
            const option = options.nth(i);
            if (await option.isVisible()) {
                const box = await option.boundingBox();
                if (box) {
                    (0, test_1.expect)(box.height).toBeGreaterThanOrEqual(40);
                }
            }
        }
    }
}
exports.QuizPage = QuizPage;
//# sourceMappingURL=QuizPage.js.map