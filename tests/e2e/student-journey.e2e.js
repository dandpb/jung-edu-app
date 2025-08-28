"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Student Journey - Complete Learning Experience', () => {
    let page;
    test_1.test.beforeEach(async ({ browser }) => {
        // Create a new context for each test to ensure clean state
        const context = await browser.newContext();
        page = await context.newPage();
    });
    test_1.test.describe('User Registration and Onboarding', () => {
        (0, test_1.test)('should complete user registration flow', async () => {
            await page.goto('/register');
            // Fill registration form
            await page.fill('[data-testid="name-input"], [name="name"], input[placeholder*="nome"]', 'João Silva');
            await page.fill('[data-testid="email-input"], [name="email"], input[type="email"]', `student${Date.now()}@example.com`);
            await page.fill('[data-testid="password-input"], [name="password"], input[type="password"]', 'SecurePassword123!');
            await page.fill('[data-testid="confirm-password"], [name="confirmPassword"]', 'SecurePassword123!');
            // Accept terms and conditions if present
            const termsCheckbox = page.locator('[data-testid="terms-checkbox"], input[type="checkbox"]');
            if (await termsCheckbox.isVisible()) {
                await termsCheckbox.check();
            }
            // Submit registration
            await page.click('[data-testid="register-button"], [type="submit"], button:has-text("Registrar")');
            // Should redirect to dashboard or welcome page
            await (0, test_1.expect)(page).toHaveURL(/\/(dashboard|welcome|)/);
            // Verify welcome message or user profile
            const welcomeElement = page.locator('[data-testid="welcome-message"], h1:has-text("Bem-vindo"), .welcome');
            await (0, test_1.expect)(welcomeElement.first()).toBeVisible({ timeout: 10000 });
        });
        (0, test_1.test)('should handle registration validation errors', async () => {
            await page.goto('/register');
            // Try to register with invalid email
            await page.fill('[name="email"], input[type="email"]', 'invalid-email');
            await page.click('[type="submit"], button:has-text("Registrar")');
            // Should show validation error
            const errorMessage = page.locator('[data-testid="email-error"], .error, .invalid-feedback');
            await (0, test_1.expect)(errorMessage.first()).toBeVisible();
        });
    });
    test_1.test.describe('Login and Authentication', () => {
        (0, test_1.test)('should login with valid credentials', async () => {
            await page.goto('/login');
            await page.fill('[name="email"], input[type="email"]', 'student@example.com');
            await page.fill('[name="password"], input[type="password"]', 'password123');
            await page.click('[type="submit"], button:has-text("Login")');
            // Should redirect to dashboard
            await (0, test_1.expect)(page).toHaveURL(/\/(dashboard)?/);
            // Verify dashboard content
            const dashboardContent = page.locator('[data-testid="dashboard"], h1:has-text("Jung"), .dashboard-content');
            await (0, test_1.expect)(dashboardContent.first()).toBeVisible();
        });
        (0, test_1.test)('should handle login with invalid credentials', async () => {
            await page.goto('/login');
            await page.fill('[name="email"]', 'invalid@example.com');
            await page.fill('[name="password"]', 'wrongpassword');
            await page.click('[type="submit"]');
            // Should show error message
            const errorMessage = page.locator('.error, .alert-danger, [data-testid="login-error"]');
            await (0, test_1.expect)(errorMessage.first()).toBeVisible();
        });
    });
    test_1.test.describe('Course Navigation and Progress', () => {
        test_1.test.beforeEach(async () => {
            // Ensure user is logged in
            await page.goto('/');
            // Mock login state if needed
            await page.evaluate(() => {
                localStorage.setItem('auth_user', JSON.stringify({
                    id: 1,
                    name: 'Test Student',
                    email: 'student@example.com'
                }));
            });
        });
        (0, test_1.test)('should navigate through course modules', async () => {
            await page.goto('/dashboard');
            // Find and click on first module
            const firstModule = page.locator('[data-testid="module-card"], .module-card, .card:has(.module)').first();
            await (0, test_1.expect)(firstModule).toBeVisible();
            await firstModule.click();
            // Should navigate to module page
            await (0, test_1.expect)(page).toHaveURL(/\/module\/\d+/);
            // Verify module content is loaded
            const moduleContent = page.locator('[data-testid="module-content"], .module-content, .content');
            await (0, test_1.expect)(moduleContent).toBeVisible();
            // Check for navigation elements
            const nextButton = page.locator('[data-testid="next-button"], button:has-text("Próximo")');
            if (await nextButton.isVisible()) {
                await nextButton.click();
                // Verify progress tracking
                const progressBar = page.locator('[data-testid="progress-bar"], .progress-bar, .progress');
                await (0, test_1.expect)(progressBar).toBeVisible();
            }
        });
        (0, test_1.test)('should track quiz completion and scores', async () => {
            await page.goto('/dashboard');
            // Navigate to a module with quiz
            const moduleWithQuiz = page.locator('.module-card').first();
            await moduleWithQuiz.click();
            // Look for quiz section
            const quizSection = page.locator('[data-testid="quiz"], .quiz-section, .quiz');
            if (await quizSection.isVisible()) {
                // Start quiz
                const startQuizButton = page.locator('[data-testid="start-quiz"], button:has-text("Iniciar")');
                if (await startQuizButton.isVisible()) {
                    await startQuizButton.click();
                }
                // Answer quiz questions
                const questions = page.locator('.question, [data-testid="question"]');
                const questionCount = await questions.count();
                if (questionCount > 0) {
                    // Answer first question (select first option)
                    const firstOption = page.locator('input[type="radio"], .option').first();
                    if (await firstOption.isVisible()) {
                        await firstOption.click();
                    }
                    // Submit quiz
                    const submitButton = page.locator('[data-testid="submit-quiz"], button:has-text("Enviar")');
                    if (await submitButton.isVisible()) {
                        await submitButton.click();
                    }
                    // Verify results display
                    const quizResults = page.locator('[data-testid="quiz-results"], .quiz-results, .results');
                    await (0, test_1.expect)(quizResults).toBeVisible({ timeout: 5000 });
                }
            }
        });
        (0, test_1.test)('should save and resume progress', async () => {
            await page.goto('/dashboard');
            // Start a module
            const module = page.locator('.module-card').first();
            await module.click();
            // Interact with content to create progress
            const content = page.locator('.module-content');
            if (await content.isVisible()) {
                await content.scrollIntoViewIfNeeded();
                // Simulate reading/interaction time
                await page.waitForTimeout(2000);
            }
            // Navigate back to dashboard
            await page.goto('/dashboard');
            // Verify progress is saved and displayed
            const progressIndicator = page.locator('.progress-indicator, .completion-status, [data-testid="progress"]');
            // Progress should be visible on the dashboard
            if (await progressIndicator.first().isVisible()) {
                await (0, test_1.expect)(progressIndicator.first()).toContainText(/\d+%|\d+\/\d+/);
            }
        });
    });
    test_1.test.describe('User Profile and Settings', () => {
        test_1.test.beforeEach(async () => {
            await page.evaluate(() => {
                localStorage.setItem('auth_user', JSON.stringify({
                    id: 1,
                    name: 'Test Student',
                    email: 'student@example.com'
                }));
            });
        });
        (0, test_1.test)('should update user profile information', async () => {
            await page.goto('/profile');
            // If profile page doesn't exist, try settings or account
            if (page.url().includes('404') || !page.url().includes('profile')) {
                await page.goto('/settings');
            }
            if (page.url().includes('404')) {
                await page.goto('/account');
            }
            // Look for profile edit form
            const nameInput = page.locator('[name="name"], input[placeholder*="nome"]');
            if (await nameInput.isVisible()) {
                await nameInput.fill('João Silva Updated');
                const saveButton = page.locator('[data-testid="save-profile"], button:has-text("Salvar")');
                if (await saveButton.isVisible()) {
                    await saveButton.click();
                    // Verify success message
                    const successMessage = page.locator('.success, .alert-success');
                    await (0, test_1.expect)(successMessage.first()).toBeVisible({ timeout: 5000 });
                }
            }
        });
        (0, test_1.test)('should change password', async () => {
            await page.goto('/profile');
            // Look for password change form
            const currentPasswordInput = page.locator('[name="currentPassword"]');
            if (await currentPasswordInput.isVisible()) {
                await currentPasswordInput.fill('currentPassword123');
                await page.fill('[name="newPassword"]', 'newPassword123!');
                await page.fill('[name="confirmPassword"]', 'newPassword123!');
                const changePasswordButton = page.locator('button:has-text("Alterar Senha")');
                if (await changePasswordButton.isVisible()) {
                    await changePasswordButton.click();
                    // Verify success or error message
                    const message = page.locator('.alert, .message, .notification');
                    await (0, test_1.expect)(message.first()).toBeVisible({ timeout: 5000 });
                }
            }
        });
    });
    test_1.test.describe('Social and Collaborative Features', () => {
        (0, test_1.test)('should access discussion forums', async () => {
            await page.goto('/forum');
            if (!page.url().includes('404')) {
                // Verify forum content loads
                const forumContent = page.locator('[data-testid="forum"], .forum, .discussions');
                await (0, test_1.expect)(forumContent).toBeVisible();
                // Look for discussion topics
                const topics = page.locator('.topic, .discussion-item');
                const topicCount = await topics.count();
                if (topicCount > 0) {
                    // Click on first topic
                    await topics.first().click();
                    // Verify discussion thread loads
                    const thread = page.locator('.thread, .discussion-thread');
                    await (0, test_1.expect)(thread).toBeVisible();
                }
            }
        });
        (0, test_1.test)('should create and post in discussions', async () => {
            await page.goto('/forum');
            if (!page.url().includes('404')) {
                // Look for "new topic" or "new discussion" button
                const newTopicButton = page.locator('[data-testid="new-topic"], button:has-text("Nova"), button:has-text("Criar")');
                if (await newTopicButton.isVisible()) {
                    await newTopicButton.click();
                    // Fill in topic form
                    const titleInput = page.locator('[name="title"], [placeholder*="título"]');
                    if (await titleInput.isVisible()) {
                        await titleInput.fill('Discussão sobre Arquétipos');
                        const contentInput = page.locator('[name="content"], textarea');
                        if (await contentInput.isVisible()) {
                            await contentInput.fill('Gostaria de discutir os arquétipos de Jung...');
                            const submitButton = page.locator('button:has-text("Publicar")');
                            if (await submitButton.isVisible()) {
                                await submitButton.click();
                                // Verify topic was created
                                await (0, test_1.expect)(page).toHaveURL(/\/forum/);
                            }
                        }
                    }
                }
            }
        });
    });
    test_1.test.describe('Mobile Responsiveness', () => {
        test_1.test.beforeEach(async ({ browser }) => {
            // Create mobile context
            const context = await browser.newContext({
                ...browser.contexts()[0] || {},
                viewport: { width: 375, height: 667 } // iPhone SE dimensions
            });
            page = await context.newPage();
            await page.evaluate(() => {
                localStorage.setItem('auth_user', JSON.stringify({
                    id: 1,
                    name: 'Test Student',
                    email: 'student@example.com'
                }));
            });
        });
        (0, test_1.test)('should display mobile navigation menu', async () => {
            await page.goto('/dashboard');
            // Look for mobile menu button (hamburger)
            const menuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-button, .hamburger, button[aria-label*="menu"]');
            if (await menuButton.isVisible()) {
                await menuButton.click();
                // Verify mobile navigation is visible
                const mobileNav = page.locator('[data-testid="mobile-navigation"], .mobile-nav, .sidebar');
                await (0, test_1.expect)(mobileNav).toBeVisible();
            }
        });
        (0, test_1.test)('should adapt content layout for mobile', async () => {
            await page.goto('/dashboard');
            // Check that content is properly responsive
            const mainContent = page.locator('main, .main-content, .content');
            if (await mainContent.isVisible()) {
                const boundingBox = await mainContent.boundingBox();
                // Verify content fits within mobile viewport
                if (boundingBox) {
                    (0, test_1.expect)(boundingBox.width).toBeLessThanOrEqual(375);
                }
            }
            // Check for horizontal scrolling issues
            const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
            const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
            // Allow small tolerance for scrollbars
            (0, test_1.expect)(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 20);
        });
    });
    test_1.test.describe('Performance and Load Times', () => {
        (0, test_1.test)('should load dashboard within acceptable time', async () => {
            const startTime = Date.now();
            await page.goto('/dashboard');
            // Wait for main content to be visible
            const mainContent = page.locator('[data-testid="dashboard"], .dashboard, main');
            await (0, test_1.expect)(mainContent.first()).toBeVisible();
            const loadTime = Date.now() - startTime;
            // Dashboard should load within 5 seconds
            (0, test_1.expect)(loadTime).toBeLessThan(5000);
            // Log performance metrics
            console.log(`Dashboard load time: ${loadTime}ms`);
        });
        (0, test_1.test)('should handle slow network conditions', async ({ context }) => {
            // Simulate slow 3G network
            await context.route('**/*', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
                await route.continue();
            });
            await page.goto('/dashboard');
            // Verify loading states are shown
            const loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner');
            // Loading indicator should appear and then disappear
            if (await loadingIndicator.isVisible({ timeout: 1000 })) {
                await (0, test_1.expect)(loadingIndicator).toBeHidden({ timeout: 10000 });
            }
            // Content should eventually load
            const content = page.locator('.dashboard, main');
            await (0, test_1.expect)(content.first()).toBeVisible({ timeout: 15000 });
        });
    });
});
//# sourceMappingURL=student-journey.e2e.js.map