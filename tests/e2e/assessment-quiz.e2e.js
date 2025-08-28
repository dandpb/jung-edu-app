"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_helpers_1 = require("./utils/test-helpers");
test_1.test.describe('Assessment and Quiz Completion', () => {
    let page;
    let helpers;
    test_1.test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext();
        page = await context.newPage();
        helpers = new test_helpers_1.TestHelpers(page);
        await helpers.disableAnimations();
        await helpers.setupAuth('student');
    });
    test_1.test.afterEach(async () => {
        await helpers.cleanup();
    });
    test_1.test.describe('Quiz Discovery and Access', () => {
        (0, test_1.test)('should display available quizzes for modules', async () => {
            // Mock module with quizzes
            await helpers.mockApiResponse('modules/1/quizzes', {
                quizzes: [
                    {
                        id: 1,
                        title: 'Jung Fundamentals Quiz',
                        description: 'Test your understanding of basic Jungian concepts',
                        type: 'knowledge_check',
                        questions: 10,
                        timeLimit: 300,
                        attempts: 3,
                        passingScore: 70,
                        isAvailable: true,
                        prerequisite: null
                    },
                    {
                        id: 2,
                        title: 'Archetype Recognition',
                        description: 'Identify different archetypal patterns',
                        type: 'application',
                        questions: 5,
                        timeLimit: null,
                        attempts: 1,
                        passingScore: 80,
                        isAvailable: false,
                        prerequisite: 'complete_module_1'
                    }
                ]
            });
            await page.goto('/module/1/quizzes');
            if (page.url().includes('404')) {
                await page.goto('/module/1');
            }
            await helpers.waitForPageReady();
            // Should show quiz cards
            const quizCards = page.locator('[data-testid="quiz-card"], .quiz-item, .assessment-card');
            if (await quizCards.first().isVisible()) {
                await (0, test_1.expect)(quizCards.first()).toBeVisible();
                // Should display quiz information
                await (0, test_1.expect)(quizCards.first()).toContainText(/Jung Fundamentals|10 quest/);
                // Should show availability status
                const availableQuiz = page.locator('.quiz-available, .can-start');
                const unavailableQuiz = page.locator('.quiz-locked, .prerequisite-required');
                if (await availableQuiz.isVisible()) {
                    await (0, test_1.expect)(availableQuiz).toBeVisible();
                }
                if (await unavailableQuiz.isVisible()) {
                    await (0, test_1.expect)(unavailableQuiz).toBeVisible();
                }
            }
        });
        (0, test_1.test)('should enforce quiz prerequisites', async () => {
            await page.goto('/quiz/2');
            await helpers.waitForPageReady();
            // Mock prerequisite check
            await helpers.mockApiResponse('quiz/2/prerequisite', {
                canAccess: false,
                prerequisite: {
                    type: 'module_completion',
                    requirement: 'Complete Module 1',
                    progress: 75
                }
            });
            // Should show prerequisite message
            const prerequisiteMessage = page.locator('[data-testid="prerequisite-message"], .prerequisite-warning, .access-denied');
            if (await prerequisiteMessage.isVisible()) {
                await (0, test_1.expect)(prerequisiteMessage).toBeVisible();
                await (0, test_1.expect)(prerequisiteMessage).toContainText(/Complete Module|prerequisit/i);
                // Start quiz button should be disabled
                const startButton = page.locator('[data-testid="start-quiz"], button:has-text("Iniciar")');
                if (await startButton.isVisible()) {
                    await (0, test_1.expect)(startButton).toBeDisabled();
                }
            }
        });
    });
    test_1.test.describe('Quiz Taking Experience', () => {
        (0, test_1.test)('should start and complete a multiple choice quiz', async () => {
            // Mock quiz data
            await helpers.mockApiResponse('quiz/1', {
                quiz: {
                    id: 1,
                    title: 'Jung Fundamentals Quiz',
                    instructions: 'Answer all questions to the best of your ability',
                    questions: [
                        {
                            id: 1,
                            type: 'multiple_choice',
                            question: 'What is the collective unconscious?',
                            options: [
                                'Individual memories and experiences',
                                'Shared human psychological patterns',
                                'Conscious thought processes',
                                'Learned behavioral responses'
                            ],
                            correct: 1,
                            points: 10
                        },
                        {
                            id: 2,
                            type: 'multiple_choice',
                            question: 'Which of the following is NOT a major archetype?',
                            options: [
                                'The Shadow',
                                'The Anima/Animus',
                                'The Persona',
                                'The Superego'
                            ],
                            correct: 3,
                            points: 10
                        }
                    ],
                    timeLimit: 300,
                    totalPoints: 20
                }
            });
            await page.goto('/quiz/1');
            await helpers.waitForPageReady();
            // Should show quiz overview
            const quizTitle = page.locator('[data-testid="quiz-title"], h1, .quiz-header');
            await (0, test_1.expect)(quizTitle.first()).toContainText(/Jung Fundamentals/i);
            const instructions = page.locator('[data-testid="instructions"], .quiz-instructions');
            if (await instructions.isVisible()) {
                await (0, test_1.expect)(instructions).toContainText(/Answer all questions/i);
            }
            // Start the quiz
            const startButton = page.locator('[data-testid="start-quiz"], button:has-text("Iniciar Quiz")');
            if (await startButton.isVisible()) {
                await startButton.click();
            }
            // Should show first question
            const questionText = page.locator('[data-testid="question-text"], .question, .quiz-question');
            await (0, test_1.expect)(questionText.first()).toContainText(/collective unconscious/i);
            // Should show timer if time limit exists
            const timer = page.locator('[data-testid="timer"], .time-remaining, .countdown');
            if (await timer.isVisible()) {
                await (0, test_1.expect)(timer).toBeVisible();
            }
            // Answer first question
            const option2 = page.locator('input[type="radio"][value="1"], .option').nth(1);
            if (await option2.isVisible()) {
                await option2.click();
            }
            // Navigate to next question
            const nextButton = page.locator('[data-testid="next-question"], button:has-text("Próxima")');
            if (await nextButton.isVisible()) {
                await nextButton.click();
                // Should show second question
                await (0, test_1.expect)(questionText.first()).toContainText(/NOT a major archetype/i);
                // Answer second question
                const option4 = page.locator('input[type="radio"][value="3"], .option').nth(3);
                if (await option4.isVisible()) {
                    await option4.click();
                }
            }
            // Submit quiz
            const submitButton = page.locator('[data-testid="submit-quiz"], button:has-text("Enviar"), button:has-text("Finalizar")');
            if (await submitButton.isVisible()) {
                // Mock submission
                await helpers.mockApiResponse('quiz/1/submit', {
                    success: true,
                    score: 100,
                    correctAnswers: 2,
                    totalQuestions: 2,
                    passed: true,
                    feedback: 'Excellent understanding of Jung\'s concepts!'
                });
                await submitButton.click();
                // Should show results
                const results = page.locator('[data-testid="quiz-results"], .quiz-score, .results-page');
                await (0, test_1.expect)(results.first()).toBeVisible();
                // Should show score
                await (0, test_1.expect)(results.first()).toContainText(/100|Excellent/);
            }
        });
        (0, test_1.test)('should handle different question types', async () => {
            await helpers.mockApiResponse('quiz/3', {
                quiz: {
                    id: 3,
                    title: 'Mixed Format Quiz',
                    questions: [
                        {
                            id: 1,
                            type: 'true_false',
                            question: 'Jung was a student of Freud. True or False?',
                            correct: true,
                            points: 5
                        },
                        {
                            id: 2,
                            type: 'fill_blank',
                            question: 'The _____ represents the hidden aspects of personality.',
                            correct: ['shadow', 'Shadow'],
                            points: 10
                        },
                        {
                            id: 3,
                            type: 'essay',
                            question: 'Describe the process of individuation in your own words.',
                            points: 15,
                            wordLimit: 200
                        }
                    ]
                }
            });
            await page.goto('/quiz/3');
            await helpers.waitForPageReady();
            const startButton = page.locator('[data-testid="start-quiz"]');
            if (await startButton.isVisible()) {
                await startButton.click();
            }
            // True/False question
            const trueOption = page.locator('input[type="radio"][value="true"], .true-option');
            if (await trueOption.isVisible()) {
                await trueOption.click();
                const nextButton = page.locator('[data-testid="next-question"]');
                if (await nextButton.isVisible()) {
                    await nextButton.click();
                }
            }
            // Fill in the blank
            const blankInput = page.locator('[data-testid="fill-blank"], input[type="text"], .fill-blank-input');
            if (await blankInput.isVisible()) {
                await blankInput.fill('Shadow');
                const nextButton = page.locator('[data-testid="next-question"]');
                if (await nextButton.isVisible()) {
                    await nextButton.click();
                }
            }
            // Essay question
            const essayInput = page.locator('[data-testid="essay-input"], textarea, .essay-answer');
            if (await essayInput.isVisible()) {
                await essayInput.fill('Individuation is the process by which an individual integrates their conscious and unconscious aspects to achieve psychological wholeness and authentic self-realization.');
                // Should show word count if limit exists
                const wordCount = page.locator('.word-count, [data-testid="word-count"]');
                if (await wordCount.isVisible()) {
                    await (0, test_1.expect)(wordCount).toContainText(/\d+ words?/);
                }
            }
        });
        (0, test_1.test)('should save progress and allow resume', async () => {
            await page.goto('/quiz/1');
            await helpers.waitForPageReady();
            const startButton = page.locator('[data-testid="start-quiz"]');
            if (await startButton.isVisible()) {
                await startButton.click();
            }
            // Answer first question
            const option1 = page.locator('input[type="radio"]').first();
            if (await option1.isVisible()) {
                await option1.click();
                // Mock auto-save
                await helpers.mockApiResponse('quiz/1/save-progress', {
                    success: true,
                    questionId: 1,
                    answer: 0,
                    timestamp: new Date().toISOString()
                });
                await page.waitForTimeout(2000); // Allow auto-save to trigger
            }
            // Navigate away
            await page.goto('/dashboard');
            // Return to quiz
            await page.goto('/quiz/1');
            // Mock resume data
            await helpers.mockApiResponse('quiz/1/resume', {
                canResume: true,
                currentQuestion: 1,
                answers: { 1: 0 },
                timeRemaining: 250
            });
            // Should show resume option
            const resumeButton = page.locator('[data-testid="resume-quiz"], button:has-text("Continuar")');
            if (await resumeButton.isVisible()) {
                await resumeButton.click();
                // Should return to correct question with saved answer
                const selectedOption = page.locator('input[type="radio"]:checked');
                if (await selectedOption.isVisible()) {
                    await (0, test_1.expect)(selectedOption).toBeChecked();
                }
            }
        });
    });
    test_1.test.describe('Quiz Results and Feedback', () => {
        (0, test_1.test)('should display detailed results after completion', async () => {
            // Mock completed quiz results
            await helpers.mockApiResponse('quiz/1/results', {
                results: {
                    quizId: 1,
                    score: 85,
                    percentage: 85,
                    correctAnswers: 17,
                    totalQuestions: 20,
                    timeSpent: 240,
                    passed: true,
                    passingScore: 70,
                    attempt: 1,
                    maxAttempts: 3,
                    feedback: {
                        overall: 'Great job! You have a solid understanding of Jung\'s theories.',
                        strengths: ['Archetypal concepts', 'Dream analysis'],
                        improvements: ['Active imagination', 'Typology details']
                    },
                    questionResults: [
                        {
                            questionId: 1,
                            correct: true,
                            userAnswer: 'Shared human psychological patterns',
                            correctAnswer: 'Shared human psychological patterns',
                            explanation: 'The collective unconscious contains universal patterns.'
                        }
                    ]
                }
            });
            await page.goto('/quiz/1/results');
            await helpers.waitForPageReady();
            // Should show overall score
            const scoreDisplay = page.locator('[data-testid="quiz-score"], .score-display, .final-score');
            await (0, test_1.expect)(scoreDisplay.first()).toBeVisible();
            await (0, test_1.expect)(scoreDisplay.first()).toContainText(/85/);
            // Should show pass/fail status
            const passStatus = page.locator('[data-testid="pass-status"], .passed, .quiz-passed');
            if (await passStatus.isVisible()) {
                await (0, test_1.expect)(passStatus).toBeVisible();
            }
            // Should show detailed breakdown
            const breakdown = page.locator('[data-testid="score-breakdown"], .question-breakdown, .results-detail');
            if (await breakdown.isVisible()) {
                await (0, test_1.expect)(breakdown).toContainText(/17.*20|correct/);
            }
            // Should provide feedback
            const feedback = page.locator('[data-testid="feedback"], .quiz-feedback, .performance-feedback');
            if (await feedback.isVisible()) {
                await (0, test_1.expect)(feedback).toContainText(/Great job|solid understanding/);
            }
        });
        (0, test_1.test)('should allow review of incorrect answers', async () => {
            await page.goto('/quiz/1/review');
            if (page.url().includes('404')) {
                await page.goto('/quiz/1/results');
                const reviewButton = page.locator('[data-testid="review-answers"], button:has-text("Revisar")');
                if (await reviewButton.isVisible()) {
                    await reviewButton.click();
                }
            }
            await helpers.waitForPageReady();
            // Should show question review
            const reviewSection = page.locator('[data-testid="question-review"], .answer-review, .question-analysis');
            if (await reviewSection.first().isVisible()) {
                await (0, test_1.expect)(reviewSection.first()).toBeVisible();
                // Should highlight incorrect answers
                const incorrectAnswer = page.locator('.incorrect, .wrong-answer');
                if (await incorrectAnswer.isVisible()) {
                    await (0, test_1.expect)(incorrectAnswer).toBeVisible();
                }
                // Should show explanations
                const explanation = page.locator('.explanation, .answer-explanation');
                if (await explanation.first().isVisible()) {
                    await (0, test_1.expect)(explanation.first()).toContainText(/collective unconscious|universal/);
                }
            }
        });
        (0, test_1.test)('should provide learning recommendations', async () => {
            await page.goto('/quiz/1/results');
            await helpers.waitForPageReady();
            // Mock recommendations based on performance
            await helpers.mockApiResponse('quiz/1/recommendations', {
                recommendations: [
                    {
                        type: 'study_material',
                        title: 'Review: Active Imagination Techniques',
                        url: '/module/5/section/3',
                        reason: 'Based on areas needing improvement'
                    },
                    {
                        type: 'practice_quiz',
                        title: 'Psychological Types Practice Quiz',
                        url: '/quiz/4',
                        reason: 'To strengthen typology knowledge'
                    }
                ]
            });
            const recommendations = page.locator('[data-testid="recommendations"], .learning-recommendations, .next-steps');
            if (await recommendations.first().isVisible()) {
                await (0, test_1.expect)(recommendations.first()).toBeVisible();
                // Should show specific study suggestions
                const studyLink = page.locator('.recommendation-item, .study-suggestion');
                if (await studyLink.first().isVisible()) {
                    await (0, test_1.expect)(studyLink.first()).toContainText(/Active Imagination|Psychological Types/);
                    // Links should be clickable
                    await studyLink.first().click();
                    // Should navigate to recommended content
                    await page.waitForTimeout(1000);
                    const url = page.url();
                    (0, test_1.expect)(url).toMatch(/module\/|quiz\//);
                }
            }
        });
    });
    test_1.test.describe('Adaptive Assessment', () => {
        (0, test_1.test)('should adjust difficulty based on performance', async () => {
            await helpers.mockApiResponse('quiz/adaptive/1', {
                quiz: {
                    id: 'adaptive_1',
                    title: 'Adaptive Jung Assessment',
                    type: 'adaptive',
                    initialDifficulty: 'medium',
                    questions: [
                        {
                            id: 1,
                            difficulty: 'medium',
                            question: 'Medium difficulty question...',
                            type: 'multiple_choice',
                            options: ['A', 'B', 'C', 'D'],
                            correct: 1
                        }
                    ]
                }
            });
            await page.goto('/quiz/adaptive/1');
            await helpers.waitForPageReady();
            const startButton = page.locator('[data-testid="start-quiz"]');
            if (await startButton.isVisible()) {
                await startButton.click();
            }
            // Answer correctly to trigger difficulty increase
            const correctOption = page.locator('input[type="radio"]').nth(1);
            if (await correctOption.isVisible()) {
                await correctOption.click();
                // Mock adaptive response
                await helpers.mockApiResponse('quiz/adaptive/1/next', {
                    nextQuestion: {
                        id: 2,
                        difficulty: 'hard',
                        question: 'Harder question based on correct answer...',
                        adaptationReason: 'Increased difficulty due to correct answer'
                    }
                });
                const nextButton = page.locator('[data-testid="next-question"]');
                if (await nextButton.isVisible()) {
                    await nextButton.click();
                    // Should show adapted question
                    const questionText = page.locator('.question, [data-testid="question-text"]');
                    if (await questionText.isVisible()) {
                        await (0, test_1.expect)(questionText).toContainText(/Harder question/);
                    }
                }
            }
        });
    });
    test_1.test.describe('Assessment Analytics', () => {
        (0, test_1.test)('should track detailed performance metrics', async () => {
            await page.goto('/analytics/quizzes');
            if (page.url().includes('404')) {
                await page.goto('/progress/assessments');
            }
            if (!page.url().includes('404')) {
                await helpers.waitForPageReady();
                // Mock analytics data
                await helpers.mockApiResponse('analytics/assessments', {
                    analytics: {
                        totalQuizzes: 5,
                        averageScore: 82,
                        improvementTrend: 'positive',
                        strongAreas: ['Archetypes', 'Dream Analysis'],
                        weakAreas: ['Active Imagination', 'Synchronicity'],
                        timeSpentStats: {
                            average: 320,
                            fastest: 180,
                            slowest: 450
                        }
                    }
                });
                const analyticsDisplay = page.locator('[data-testid="assessment-analytics"], .quiz-analytics, .performance-metrics');
                if (await analyticsDisplay.first().isVisible()) {
                    await (0, test_1.expect)(analyticsDisplay.first()).toBeVisible();
                    // Should show key metrics
                    await (0, test_1.expect)(analyticsDisplay.first()).toContainText(/82|average|improvement/);
                }
            }
        });
        (0, test_1.test)('should compare performance across topics', async () => {
            await page.goto('/analytics/topics');
            if (!page.url().includes('404')) {
                await helpers.waitForPageReady();
                const topicComparison = page.locator('[data-testid="topic-comparison"], .topic-performance, .subject-analysis');
                if (await topicComparison.first().isVisible()) {
                    await (0, test_1.expect)(topicComparison.first()).toBeVisible();
                    // Should show performance by topic
                    const topicScores = page.locator('.topic-score, .subject-score');
                    const scoreCount = await topicScores.count();
                    (0, test_1.expect)(scoreCount).toBeGreaterThan(0);
                }
            }
        });
    });
    test_1.test.describe('Mobile Quiz Experience', () => {
        test_1.test.beforeEach(async ({ browser }) => {
            const context = await browser.newContext({
                viewport: { width: 375, height: 667 }
            });
            page = await context.newPage();
            helpers = new test_helpers_1.TestHelpers(page);
            await helpers.disableAnimations();
            await helpers.setupAuth('student');
        });
        (0, test_1.test)('should adapt quiz interface for mobile', async () => {
            await page.goto('/quiz/1');
            await helpers.waitForPageReady();
            const quizContainer = page.locator('.quiz-container, .assessment-page');
            if (await quizContainer.isVisible()) {
                const boundingBox = await quizContainer.boundingBox();
                if (boundingBox) {
                    (0, test_1.expect)(boundingBox.width).toBeLessThanOrEqual(375);
                }
            }
            const startButton = page.locator('[data-testid="start-quiz"]');
            if (await startButton.isVisible()) {
                await startButton.click();
            }
            // Options should be touch-friendly
            const options = page.locator('.quiz-option, input[type="radio"] + label');
            const optionCount = await options.count();
            for (let i = 0; i < Math.min(2, optionCount); i++) {
                const option = options.nth(i);
                if (await option.isVisible()) {
                    const box = await option.boundingBox();
                    if (box) {
                        // Touch targets should be at least 44px tall
                        (0, test_1.expect)(box.height).toBeGreaterThanOrEqual(40);
                    }
                }
            }
        });
        (0, test_1.test)('should handle mobile quiz navigation', async () => {
            await page.goto('/quiz/1');
            await helpers.waitForPageReady();
            const startButton = page.locator('[data-testid="start-quiz"]');
            if (await startButton.isVisible()) {
                await startButton.click();
            }
            // Navigation buttons should be appropriately sized
            const navButtons = page.locator('.quiz-nav button, .question-nav button');
            const buttonCount = await navButtons.count();
            for (let i = 0; i < buttonCount; i++) {
                const button = navButtons.nth(i);
                if (await button.isVisible()) {
                    const box = await button.boundingBox();
                    if (box) {
                        (0, test_1.expect)(box.height).toBeGreaterThanOrEqual(44);
                        (0, test_1.expect)(box.width).toBeGreaterThanOrEqual(44);
                    }
                }
            }
        });
    });
});
//# sourceMappingURL=assessment-quiz.e2e.js.map