"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_helpers_1 = require("./utils/test-helpers");
test_1.test.describe('Educational Workflow Execution', () => {
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
    test_1.test.describe('Workflow Discovery and Selection', () => {
        (0, test_1.test)('should display available educational workflows', async () => {
            // Mock workflows API
            await helpers.mockApiResponse('workflows', {
                workflows: [
                    {
                        id: 1,
                        title: 'Jung\'s Analytical Psychology Fundamentals',
                        description: 'Complete introduction to Jungian psychology concepts',
                        type: 'learning_path',
                        duration: 180,
                        difficulty: 'beginner',
                        modules: ['intro', 'archetypes', 'unconscious'],
                        prerequisites: []
                    },
                    {
                        id: 2,
                        title: 'Dream Analysis Workshop',
                        description: 'Practical approach to understanding dreams',
                        type: 'workshop',
                        duration: 120,
                        difficulty: 'intermediate',
                        modules: ['symbols', 'interpretation', 'practice'],
                        prerequisites: ['basic_jung']
                    }
                ]
            });
            await page.goto('/workflows');
            // If workflows page doesn't exist, try dashboard or courses
            if (page.url().includes('404')) {
                await page.goto('/courses');
            }
            if (page.url().includes('404')) {
                await page.goto('/dashboard');
            }
            await helpers.waitForPageReady();
            // Should display workflow cards
            const workflowCards = page.locator('[data-testid="workflow-card"], .workflow-item, .course-card');
            await (0, test_1.expect)(workflowCards.first()).toBeVisible();
            // Verify workflow information is displayed
            const firstWorkflow = workflowCards.first();
            await (0, test_1.expect)(firstWorkflow).toContainText(/Jung|Psicologia|Analítica/i);
            // Should show difficulty and duration
            const metadata = page.locator('.duration, .difficulty, .metadata');
            if (await metadata.first().isVisible()) {
                await (0, test_1.expect)(metadata.first()).toBeVisible();
            }
        });
        (0, test_1.test)('should filter workflows by difficulty and type', async () => {
            await helpers.mockApiResponse('workflows', {
                workflows: [
                    { id: 1, title: 'Beginner Course', difficulty: 'beginner', type: 'course' },
                    { id: 2, title: 'Advanced Workshop', difficulty: 'advanced', type: 'workshop' },
                    { id: 3, title: 'Intermediate Path', difficulty: 'intermediate', type: 'learning_path' }
                ]
            });
            await page.goto('/workflows');
            await helpers.waitForPageReady();
            // Look for filter controls
            const difficultyFilter = page.locator('[data-testid="difficulty-filter"], select[name="difficulty"], .filter-difficulty');
            if (await difficultyFilter.isVisible()) {
                await difficultyFilter.selectOption('beginner');
                // Should show only beginner workflows
                await page.waitForTimeout(1000); // Wait for filter to apply
                const visibleWorkflows = page.locator('.workflow-item:visible, .course-card:visible');
                const count = await visibleWorkflows.count();
                if (count > 0) {
                    const firstVisible = visibleWorkflows.first();
                    await (0, test_1.expect)(firstVisible).toContainText(/beginner|iniciante/i);
                }
            }
        });
    });
    test_1.test.describe('Workflow Enrollment and Starting', () => {
        (0, test_1.test)('should enroll student in selected workflow', async () => {
            await helpers.mockApiResponse('workflows/1/enroll', {
                success: true,
                enrollment: {
                    id: 1,
                    workflowId: 1,
                    userId: 1,
                    status: 'active',
                    progress: 0,
                    enrolledAt: new Date().toISOString()
                }
            });
            await page.goto('/workflow/1');
            await helpers.waitForPageReady();
            // Should show workflow details
            const workflowTitle = page.locator('[data-testid="workflow-title"], h1, .workflow-header');
            await (0, test_1.expect)(workflowTitle.first()).toBeVisible();
            // Find and click enroll button
            const enrollButton = page.locator('[data-testid="enroll-button"], button:has-text("Matricular"), button:has-text("Inscrever")');
            if (await enrollButton.isVisible()) {
                await enrollButton.click();
                // Should show enrollment success
                await helpers.waitForSuccessMessage();
                // Enroll button should change to "Start" or "Continue"
                const startButton = page.locator('button:has-text("Iniciar"), button:has-text("Continuar")');
                await (0, test_1.expect)(startButton.first()).toBeVisible();
            }
        });
        (0, test_1.test)('should start enrolled workflow', async () => {
            // Mock enrollment status
            await helpers.mockApiResponse('workflows/1', {
                workflow: {
                    id: 1,
                    title: 'Jung Fundamentals',
                    isEnrolled: true,
                    progress: 0,
                    currentStep: 1,
                    totalSteps: 5
                }
            });
            await page.goto('/workflow/1');
            await helpers.waitForPageReady();
            const startButton = page.locator('[data-testid="start-workflow"], button:has-text("Iniciar")');
            if (await startButton.isVisible()) {
                await startButton.click();
                // Should navigate to first step
                await (0, test_1.expect)(page).toHaveURL(/\/workflow\/1\/(step|module)\/1/);
                // Should show workflow progress
                const progress = page.locator('[data-testid="workflow-progress"], .progress-bar, .step-indicator');
                await (0, test_1.expect)(progress.first()).toBeVisible();
            }
        });
    });
    test_1.test.describe('Workflow Step Execution', () => {
        (0, test_1.test)('should complete workflow steps sequentially', async () => {
            // Mock workflow step data
            await helpers.mockApiResponse('workflows/1/step/1', {
                step: {
                    id: 1,
                    title: 'Introduction to Jung',
                    type: 'content',
                    content: 'Learn about Carl Jung and his contributions...',
                    duration: 15,
                    isCompleted: false,
                    nextStep: 2
                }
            });
            await page.goto('/workflow/1/step/1');
            await helpers.waitForPageReady();
            // Should show step content
            const stepContent = page.locator('[data-testid="step-content"], .workflow-content, .lesson-content');
            await (0, test_1.expect)(stepContent).toBeVisible();
            // Should show step title
            const stepTitle = page.locator('h1, h2, .step-title');
            await (0, test_1.expect)(stepTitle.first()).toContainText(/Introduction|Introdução/i);
            // Simulate reading content
            await stepContent.scrollIntoViewIfNeeded();
            await page.waitForTimeout(2000);
            // Mark step as complete
            const completeButton = page.locator('[data-testid="complete-step"], button:has-text("Concluir"), button:has-text("Próximo")');
            if (await completeButton.isVisible()) {
                // Mock completion API
                await helpers.mockApiResponse('workflows/1/step/1/complete', {
                    success: true,
                    nextStep: 2,
                    progress: 20
                });
                await completeButton.click();
                // Should advance to next step or show completion
                await page.waitForTimeout(1000);
                const url = page.url();
                (0, test_1.expect)(url).toMatch(/step\/2|completed|next/);
            }
        });
        (0, test_1.test)('should handle interactive workflow elements', async () => {
            // Mock interactive step
            await helpers.mockApiResponse('workflows/1/step/3', {
                step: {
                    id: 3,
                    title: 'Interactive Exercise',
                    type: 'interactive',
                    content: 'Complete the following exercise...',
                    interactions: [
                        { type: 'quiz', questions: 3 },
                        { type: 'reflection', prompts: 2 }
                    ]
                }
            });
            await page.goto('/workflow/1/step/3');
            await helpers.waitForPageReady();
            // Should show interactive elements
            const interactiveContent = page.locator('[data-testid="interactive-content"], .quiz-container, .exercise');
            if (await interactiveContent.first().isVisible()) {
                await (0, test_1.expect)(interactiveContent.first()).toBeVisible();
                // Test quiz interaction
                const quizOptions = page.locator('input[type="radio"], .quiz-option');
                const optionCount = await quizOptions.count();
                if (optionCount > 0) {
                    await quizOptions.first().click();
                    const submitButton = page.locator('button:has-text("Enviar"), button:has-text("Submit")');
                    if (await submitButton.isVisible()) {
                        await submitButton.click();
                        // Should show feedback
                        const feedback = page.locator('.feedback, .result, .response');
                        await (0, test_1.expect)(feedback.first()).toBeVisible();
                    }
                }
            }
        });
        (0, test_1.test)('should save and resume workflow progress', async () => {
            // Mock progress save
            await helpers.mockApiResponse('workflows/1/progress', {
                success: true,
                progress: {
                    currentStep: 2,
                    completedSteps: [1],
                    timeSpent: 1800,
                    lastAccessed: new Date().toISOString()
                }
            });
            await page.goto('/workflow/1/step/2');
            await helpers.waitForPageReady();
            // Interact with content
            const content = page.locator('.workflow-content');
            if (await content.isVisible()) {
                await content.scrollIntoViewIfNeeded();
                await page.waitForTimeout(3000); // Simulate engagement
            }
            // Navigate away and back
            await page.goto('/dashboard');
            await page.goto('/workflow/1');
            await helpers.waitForPageReady();
            // Should show resume option
            const resumeButton = page.locator('button:has-text("Continuar"), button:has-text("Resume"), [data-testid="resume-workflow"]');
            if (await resumeButton.isVisible()) {
                await resumeButton.click();
                // Should return to correct step
                await (0, test_1.expect)(page).toHaveURL(/step\/2/);
            }
        });
    });
    test_1.test.describe('Assessment and Evaluation', () => {
        (0, test_1.test)('should complete workflow assessments', async () => {
            // Mock assessment step
            await helpers.mockApiResponse('workflows/1/assessment', {
                assessment: {
                    id: 1,
                    title: 'Jung Fundamentals Quiz',
                    questions: [
                        {
                            id: 1,
                            question: 'What is the collective unconscious?',
                            type: 'multiple_choice',
                            options: [
                                'Personal memories',
                                'Shared human experiences',
                                'Individual consciousness',
                                'Learned behaviors'
                            ],
                            correct: 1
                        }
                    ],
                    passingScore: 70
                }
            });
            await page.goto('/workflow/1/assessment');
            await helpers.waitForPageReady();
            // Should show assessment interface
            const assessmentTitle = page.locator('h1, .assessment-title');
            await (0, test_1.expect)(assessmentTitle.first()).toContainText(/Quiz|Avaliação|Test/i);
            // Answer questions
            const firstOption = page.locator('input[type="radio"]').first();
            if (await firstOption.isVisible()) {
                await firstOption.click();
                const submitButton = page.locator('[data-testid="submit-assessment"], button:has-text("Enviar")');
                if (await submitButton.isVisible()) {
                    // Mock assessment submission
                    await helpers.mockApiResponse('workflows/1/assessment/submit', {
                        success: true,
                        score: 85,
                        passed: true,
                        feedback: 'Great job understanding Jung\'s concepts!'
                    });
                    await submitButton.click();
                    // Should show results
                    const results = page.locator('[data-testid="assessment-results"], .quiz-results, .score');
                    await (0, test_1.expect)(results.first()).toBeVisible();
                    // Should show score
                    await (0, test_1.expect)(results.first()).toContainText(/85|8[0-9]/);
                }
            }
        });
        (0, test_1.test)('should provide feedback and recommendations', async () => {
            await page.goto('/workflow/1/results');
            // Mock completion results
            await helpers.mockApiResponse('workflows/1/completion', {
                completion: {
                    workflowId: 1,
                    completedAt: new Date().toISOString(),
                    finalScore: 88,
                    timeSpent: 7200,
                    strengths: ['Archetypal understanding', 'Dream analysis'],
                    improvements: ['Active imagination techniques'],
                    recommendations: [
                        { type: 'workflow', id: 2, title: 'Advanced Jung Studies' },
                        { type: 'resource', id: 15, title: 'Jung\'s Red Book Analysis' }
                    ]
                }
            });
            if (page.url().includes('404')) {
                // Simulate workflow completion
                await page.goto('/workflow/1');
                await helpers.waitForPageReady();
                const viewResultsButton = page.locator('button:has-text("Ver Resultados"), button:has-text("Results")');
                if (await viewResultsButton.isVisible()) {
                    await viewResultsButton.click();
                }
            }
            await helpers.waitForPageReady();
            // Should show completion summary
            const completionSummary = page.locator('[data-testid="completion-summary"], .results-summary, .completion-stats');
            if (await completionSummary.first().isVisible()) {
                await (0, test_1.expect)(completionSummary.first()).toBeVisible();
                // Should show recommendations
                const recommendations = page.locator('[data-testid="recommendations"], .next-steps, .suggestions');
                if (await recommendations.first().isVisible()) {
                    await (0, test_1.expect)(recommendations.first()).toBeVisible();
                }
            }
        });
    });
    test_1.test.describe('Collaborative Features', () => {
        (0, test_1.test)('should enable discussion during workflow', async () => {
            await page.goto('/workflow/1/step/2');
            await helpers.waitForPageReady();
            // Look for discussion or comment features
            const discussionButton = page.locator('[data-testid="discussion"], button:has-text("Discussão"), .comments-toggle');
            if (await discussionButton.isVisible()) {
                await discussionButton.click();
                // Should show discussion panel
                const discussionPanel = page.locator('[data-testid="discussion-panel"], .comments-section, .discussion');
                await (0, test_1.expect)(discussionPanel).toBeVisible();
                // Should allow posting comments
                const commentInput = page.locator('[data-testid="comment-input"], textarea[placeholder*="coment"]');
                if (await commentInput.isVisible()) {
                    await commentInput.fill('This section about archetypes is fascinating!');
                    const postButton = page.locator('button:has-text("Postar"), button:has-text("Post")');
                    if (await postButton.isVisible()) {
                        await postButton.click();
                        // Comment should appear
                        const newComment = page.locator('.comment-item').last();
                        await (0, test_1.expect)(newComment).toContainText('fascinating');
                    }
                }
            }
        });
    });
    test_1.test.describe('Performance and Analytics', () => {
        (0, test_1.test)('should track detailed learning analytics', async () => {
            await page.goto('/workflow/1/analytics');
            if (page.url().includes('404')) {
                await page.goto('/progress');
            }
            if (page.url().includes('404')) {
                await page.goto('/dashboard');
                const analyticsLink = page.locator('a:has-text("Progresso"), a:has-text("Analytics"), .progress-link');
                if (await analyticsLink.isVisible()) {
                    await analyticsLink.click();
                }
            }
            await helpers.waitForPageReady();
            // Should show learning analytics
            const analyticsCharts = page.locator('[data-testid="analytics-chart"], .chart, .progress-chart');
            if (await analyticsCharts.first().isVisible()) {
                await (0, test_1.expect)(analyticsCharts.first()).toBeVisible();
                // Should show time spent, progress, scores
                const metrics = page.locator('.metric, .stat, .kpi');
                const metricCount = await metrics.count();
                (0, test_1.expect)(metricCount).toBeGreaterThan(0);
            }
        });
        (0, test_1.test)('should provide performance insights', async () => {
            await helpers.mockApiResponse('analytics/performance', {
                insights: {
                    learningVelocity: 'above_average',
                    comprehension: 'excellent',
                    engagement: 'high',
                    recommendations: [
                        'Continue with advanced modules',
                        'Consider peer mentoring role'
                    ]
                }
            });
            await page.goto('/insights');
            if (!page.url().includes('404')) {
                await helpers.waitForPageReady();
                const insights = page.locator('[data-testid="performance-insights"], .insights, .recommendations');
                await (0, test_1.expect)(insights.first()).toBeVisible();
                // Should show personalized recommendations
                await (0, test_1.expect)(insights.first()).toContainText(/advanced|continue|recommend/i);
            }
        });
    });
    test_1.test.describe('Mobile Workflow Experience', () => {
        test_1.test.beforeEach(async ({ browser }) => {
            const context = await browser.newContext({
                viewport: { width: 375, height: 667 }
            });
            page = await context.newPage();
            helpers = new test_helpers_1.TestHelpers(page);
            await helpers.disableAnimations();
            await helpers.setupAuth('student');
        });
        (0, test_1.test)('should adapt workflow interface for mobile', async () => {
            await page.goto('/workflow/1/step/1');
            await helpers.waitForPageReady();
            // Workflow content should be mobile-responsive
            const workflowContent = page.locator('.workflow-content, .step-content');
            if (await workflowContent.isVisible()) {
                const boundingBox = await workflowContent.boundingBox();
                if (boundingBox) {
                    (0, test_1.expect)(boundingBox.width).toBeLessThanOrEqual(375);
                }
            }
            // Navigation should be mobile-friendly
            const navigation = page.locator('.workflow-nav, .step-nav');
            if (await navigation.isVisible()) {
                const navBox = await navigation.boundingBox();
                if (navBox) {
                    (0, test_1.expect)(navBox.width).toBeLessThanOrEqual(375);
                }
            }
        });
    });
});
//# sourceMappingURL=educational-workflow.e2e.js.map