import { Page, expect } from '@playwright/test';
import { BasePage } from '../utils/test-helpers';

export class QuizPage extends BasePage {
  constructor(page: Page) {
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
  async navigateToQuiz(quizId: number): Promise<void> {
    await this.page.goto(`/quiz/${quizId}`);
    await this.waitForPageLoad();
  }

  async startQuiz(): Promise<void> {
    if (await this.startButton.isVisible()) {
      await this.clickElement(this.startButton);
    }
  }

  async answerMultipleChoice(optionIndex: number): Promise<void> {
    const option = this.questionOptions.nth(optionIndex);
    if (await option.isVisible()) {
      await this.clickElement(option);
    }
  }

  async answerTrueFalse(isTrue: boolean): Promise<void> {
    const value = isTrue ? 'true' : 'false';
    const option = this.page.locator(`input[type="radio"][value="${value}"], .${value}-option`);
    if (await option.isVisible()) {
      await this.clickElement(option);
    }
  }

  async answerFillBlank(answer: string): Promise<void> {
    if (await this.fillBlankInput.isVisible()) {
      await this.fillInput(this.fillBlankInput, answer);
    }
  }

  async answerEssay(answer: string): Promise<void> {
    if (await this.essayInput.isVisible()) {
      await this.fillInput(this.essayInput, answer);
    }
  }

  async nextQuestion(): Promise<void> {
    if (await this.nextButton.isVisible()) {
      await this.clickElement(this.nextButton);
    }
  }

  async previousQuestion(): Promise<void> {
    if (await this.previousButton.isVisible()) {
      await this.clickElement(this.previousButton);
    }
  }

  async submitQuiz(): Promise<void> {
    if (await this.submitButton.isVisible()) {
      await this.clickElement(this.submitButton);
    }
  }

  async resumeQuiz(): Promise<void> {
    if (await this.resumeButton.isVisible()) {
      await this.clickElement(this.resumeButton);
    }
  }

  async reviewAnswers(): Promise<void> {
    if (await this.reviewButton.isVisible()) {
      await this.clickElement(this.reviewButton);
    }
  }

  async completeMultipleChoiceQuiz(answers: number[]): Promise<void> {
    await this.startQuiz();
    
    for (let i = 0; i < answers.length; i++) {
      await this.answerMultipleChoice(answers[i]);
      
      if (i < answers.length - 1) {
        await this.nextQuestion();
      } else {
        await this.submitQuiz();
      }
    }
  }

  async completeMixedQuiz(answers: {
    type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay';
    answer: number | boolean | string;
  }[]): Promise<void> {
    await this.startQuiz();
    
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      
      switch (answer.type) {
        case 'multiple_choice':
          await this.answerMultipleChoice(answer.answer as number);
          break;
        case 'true_false':
          await this.answerTrueFalse(answer.answer as boolean);
          break;
        case 'fill_blank':
        case 'essay':
          await this.fillInput(
            answer.type === 'essay' ? this.essayInput : this.fillBlankInput,
            answer.answer as string
          );
          break;
      }
      
      if (i < answers.length - 1) {
        await this.nextQuestion();
      } else {
        await this.submitQuiz();
      }
    }
  }

  // Assertions
  async expectQuizLoaded(expectedTitle?: string): Promise<void> {
    await expect(this.quizTitle.first()).toBeVisible();
    
    if (expectedTitle) {
      await expect(this.quizTitle.first()).toContainText(expectedTitle);
    }
  }

  async expectQuizStarted(): Promise<void> {
    await expect(this.questionText.first()).toBeVisible();
  }

  async expectTimerVisible(): Promise<void> {
    if (await this.timer.isVisible()) {
      await expect(this.timer).toBeVisible();
    }
  }

  async expectQuestionVisible(questionText?: string): Promise<void> {
    await expect(this.questionText.first()).toBeVisible();
    
    if (questionText) {
      await expect(this.questionText.first()).toContainText(questionText);
    }
  }

  async expectOptionsAvailable(expectedCount?: number): Promise<void> {
    await expect(this.questionOptions.first()).toBeVisible();
    
    if (expectedCount) {
      await expect(this.questionOptions).toHaveCount(expectedCount);
    }
  }

  async expectAnswerSelected(): Promise<void> {
    const selectedOption = this.page.locator('input[type="radio"]:checked');
    await expect(selectedOption).toBeVisible();
  }

  async expectResultsDisplayed(): Promise<void> {
    await expect(this.results.first()).toBeVisible();
  }

  async expectScore(expectedScore: number | string): Promise<void> {
    await expect(this.scoreDisplay.first()).toBeVisible();
    await expect(this.scoreDisplay.first()).toContainText(expectedScore.toString());
  }

  async expectPassStatus(shouldPass: boolean): Promise<void> {
    const status = this.passStatus.first();
    if (await status.isVisible()) {
      const statusText = shouldPass ? /passed|aprovado|sucesso/i : /failed|reprovado|falha/i;
      await expect(status).toContainText(statusText);
    }
  }

  async expectFeedback(feedbackText?: string): Promise<void> {
    if (await this.feedback.first().isVisible()) {
      await expect(this.feedback.first()).toBeVisible();
      
      if (feedbackText) {
        await expect(this.feedback.first()).toContainText(feedbackText);
      }
    }
  }

  async expectResumeOption(): Promise<void> {
    if (await this.resumeButton.isVisible()) {
      await expect(this.resumeButton).toBeVisible();
    }
  }

  async expectProgressIndicator(): Promise<void> {
    if (await this.progressIndicator.isVisible()) {
      await expect(this.progressIndicator).toBeVisible();
    }
  }

  async expectWordCountTracking(): Promise<void> {
    if (await this.wordCount.isVisible()) {
      await expect(this.wordCount).toContainText(/\d+ words?/);
    }
  }

  async expectRecommendations(): Promise<void> {
    if (await this.recommendationsSection.first().isVisible()) {
      await expect(this.recommendationsSection.first()).toBeVisible();
      
      const recommendations = this.page.locator('.recommendation-item, .study-suggestion');
      if (await recommendations.first().isVisible()) {
        await expect(recommendations.first()).toBeVisible();
      }
    }
  }

  async expectQuizReviewAvailable(): Promise<void> {
    const reviewSection = this.page.locator(
      '[data-testid="question-review"], .answer-review, .question-analysis'
    );
    
    if (await reviewSection.first().isVisible()) {
      await expect(reviewSection.first()).toBeVisible();
    }
  }

  async expectCorrectAnswerHighlighted(): Promise<void> {
    const correctAnswer = this.page.locator('.correct, .right-answer');
    if (await correctAnswer.isVisible()) {
      await expect(correctAnswer).toBeVisible();
    }
  }

  async expectIncorrectAnswerHighlighted(): Promise<void> {
    const incorrectAnswer = this.page.locator('.incorrect, .wrong-answer');
    if (await incorrectAnswer.isVisible()) {
      await expect(incorrectAnswer).toBeVisible();
    }
  }

  async expectExplanationVisible(): Promise<void> {
    const explanation = this.page.locator('.explanation, .answer-explanation');
    if (await explanation.first().isVisible()) {
      await expect(explanation.first()).toBeVisible();
    }
  }

  // Mobile-specific assertions
  async expectMobileQuizLayout(): Promise<void> {
    const quizContainer = this.page.locator('.quiz-container, .assessment-page');
    if (await quizContainer.isVisible()) {
      const boundingBox = await quizContainer.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }
    }
  }

  async expectTouchFriendlyOptions(): Promise<void> {
    const options = this.page.locator('.quiz-option, input[type="radio"] + label');
    const optionCount = await options.count();
    
    for (let i = 0; i < Math.min(2, optionCount); i++) {
      const option = options.nth(i);
      if (await option.isVisible()) {
        const box = await option.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  }
}
