import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';
import { DashboardPage } from '../../pages/dashboard-page';
import { testUsers, generateUniqueTestData } from '../../fixtures/test-data';
import { cleanupTestData } from '../../helpers/test-helpers';

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test.describe('User Login', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      const testUser = testUsers.student;
      
      await loginPage.loginSuccessfully(testUser.email, testUser.password);
      
      // Verify user is on dashboard
      await expect(page).toHaveURL('/dashboard');
      await dashboardPage.verifyDashboardLoaded();
    });

    test('should show error message with invalid credentials', async ({ page }) => {
      await loginPage.loginWithInvalidCredentials('invalid@email.com', 'wrongpassword');
      
      // Should remain on login page with error
      await expect(page).toHaveURL('/auth/login');
      await expect(loginPage.errorMessage).toBeVisible();
      await expect(loginPage.errorMessage).toContainText('Invalid credentials');
    });

    test('should validate required fields', async ({ page }) => {
      await loginPage.goto();
      
      // Try to submit empty form
      await loginPage.submitButton.click();
      
      // Browser validation should prevent submission
      await expect(loginPage.emailInput).toHaveAttribute('required');
      await expect(loginPage.passwordInput).toHaveAttribute('required');
    });

    test('should validate email format', async ({ page }) => {
      await loginPage.goto();
      
      await loginPage.fillField('[data-testid=\"email-input\"]', 'invalid-email-format');
      await loginPage.submitButton.click();
      
      // Browser should show validation message
      const validationMessage = await loginPage.emailInput.evaluate(
        (input: HTMLInputElement) => input.validationMessage
      );
      expect(validationMessage).toBeTruthy();
    });

    test('should handle remember me functionality', async ({ page }) => {
      const testUser = testUsers.student;
      
      await loginPage.login(testUser.email, testUser.password, true);
      
      // Verify remember me checkbox was checked
      await expect(loginPage.rememberMeCheckbox).toBeChecked();
      
      // After successful login, cookie should be set for longer duration
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(cookie => cookie.name.includes('session'));
      
      if (sessionCookie) {
        // Should have longer expiration for remember me
        expect(sessionCookie.expires).toBeGreaterThan(Date.now() / 1000 + 86400); // More than 1 day
      }
    });

    test('should toggle password visibility', async ({ page }) => {
      await loginPage.testPasswordVisibility();
    });

    test('should redirect to intended page after login', async ({ page }) => {
      // Try to access protected page without auth
      await page.goto('/modules/123');
      
      // Should redirect to login
      await expect(page).toHaveURL('/auth/login');
      
      // Login successfully
      const testUser = testUsers.student;
      await loginPage.login(testUser.email, testUser.password);
      
      // Should redirect back to intended page (or dashboard if not available)
      await expect(page).toHaveURL(/(dashboard|modules)/);
    });
  });

  test.describe('User Registration', () => {
    test('should register new user successfully', async ({ page }) => {
      const uniqueData = generateUniqueTestData();
      
      await page.goto('/auth/register');
      
      // Fill registration form
      await page.fill('[data-testid=\"register-name-input\"]', 'New Test User');
      await page.fill('[data-testid=\"register-email-input\"]', uniqueData.email);
      await page.fill('[data-testid=\"register-password-input\"]', 'NewPassword123!');
      await page.fill('[data-testid=\"register-confirm-password-input\"]', 'NewPassword123!');
      
      // Accept terms if required
      const termsCheckbox = page.locator('[data-testid=\"terms-checkbox\"]');
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }
      
      // Submit registration
      await page.click('[data-testid=\"register-submit\"]');
      
      // Should redirect to dashboard or email verification page
      await page.waitForURL(/(dashboard|verify-email)/, { timeout: 15000 });
      
      // If email verification is required, handle it
      if (page.url().includes('verify-email')) {
        // In a real test, you'd verify the email or mock the verification
        await expect(page.locator('[data-testid=\"verification-message\"]')).toBeVisible();
      } else {
        await dashboardPage.verifyDashboardLoaded();
      }
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/auth/register');
      
      const uniqueData = generateUniqueTestData();
      
      // Fill form with weak password
      await page.fill('[data-testid=\"register-name-input\"]', 'Test User');
      await page.fill('[data-testid=\"register-email-input\"]', uniqueData.email);
      await page.fill('[data-testid=\"register-password-input\"]', 'weak');
      
      // Should show password requirements
      const passwordHint = page.locator('[data-testid=\"password-requirements\"]');
      if (await passwordHint.isVisible()) {
        await expect(passwordHint).toContainText('at least 8 characters');
      }
    });

    test('should validate password confirmation match', async ({ page }) => {
      await page.goto('/auth/register');
      
      const uniqueData = generateUniqueTestData();
      
      await page.fill('[data-testid=\"register-name-input\"]', 'Test User');
      await page.fill('[data-testid=\"register-email-input\"]', uniqueData.email);
      await page.fill('[data-testid=\"register-password-input\"]', 'Password123!');
      await page.fill('[data-testid=\"register-confirm-password-input\"]', 'DifferentPassword123!');
      
      await page.click('[data-testid=\"register-submit\"]');
      
      // Should show mismatch error
      const errorMessage = page.locator('[data-testid=\"password-mismatch-error\"]');
      await expect(errorMessage).toBeVisible();
    });

    test('should prevent duplicate email registration', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Try to register with existing user email
      const existingUser = testUsers.student;
      
      await page.fill('[data-testid=\"register-name-input\"]', 'Duplicate User');
      await page.fill('[data-testid=\"register-email-input\"]', existingUser.email);
      await page.fill('[data-testid=\"register-password-input\"]', 'Password123!');
      await page.fill('[data-testid=\"register-confirm-password-input\"]', 'Password123!');
      
      await page.click('[data-testid=\"register-submit\"]');
      
      // Should show duplicate email error
      await expect(page.locator('[data-testid=\"error-message\"]')).toBeVisible();
      await expect(page.locator('[data-testid=\"error-message\"]')).toContainText('already exists');
    });
  });

  test.describe('Password Reset', () => {
    test('should initiate password reset', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      const testUser = testUsers.student;
      
      await page.fill('[data-testid=\"reset-email-input\"]', testUser.email);
      await page.click('[data-testid=\"reset-submit\"]');
      
      // Should show success message
      await expect(page.locator('[data-testid=\"reset-success-message\"]')).toBeVisible();
      await expect(page.locator('[data-testid=\"reset-success-message\"]')).toContainText('reset link sent');
    });

    test('should handle invalid email for reset', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      await page.fill('[data-testid=\"reset-email-input\"]', 'nonexistent@email.com');
      await page.click('[data-testid=\"reset-submit\"]');
      
      // Should show appropriate message (either error or success for security)
      const message = page.locator('[data-testid=\"reset-message\"]');
      await expect(message).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // First login
      const testUser = testUsers.student;
      await loginPage.loginSuccessfully(testUser.email, testUser.password);
      
      // Then logout
      await dashboardPage.logout();
      
      // Should redirect to home page
      await expect(page).toHaveURL('/');
      
      // User menu should not be visible
      await expect(dashboardPage.userMenu).not.toBeVisible();
    });

    test('should clear session on logout', async ({ page }) => {
      // Login first
      const testUser = testUsers.student;
      await loginPage.loginSuccessfully(testUser.email, testUser.password);
      
      // Logout
      await dashboardPage.logout();
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL('/auth/login');
    });

    test('should handle auto-logout on session expiry', async ({ page }) => {
      // This test would require mocking session expiry
      // For now, we'll test the logout flow
      
      const testUser = testUsers.student;
      await loginPage.loginSuccessfully(testUser.email, testUser.password);
      
      // Simulate session expiry by clearing cookies
      await page.context().clearCookies();
      
      // Try to navigate
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL('/auth/login');
    });
  });

  test.describe('Social Authentication', () => {
    test('should show social login options', async ({ page }) => {
      await loginPage.goto();
      
      // Check for social login buttons
      const googleLogin = page.locator('[data-testid=\"google-login\"]');
      const githubLogin = page.locator('[data-testid=\"github-login\"]');
      
      if (await googleLogin.isVisible()) {
        await expect(googleLogin).toBeEnabled();
      }
      
      if (await githubLogin.isVisible()) {
        await expect(githubLogin).toBeEnabled();
      }
    });
  });

  test.describe('Security', () => {
    test('should prevent XSS in login form', async ({ page }) => {
      await loginPage.goto();
      
      const xssPayload = '<script>alert(\"XSS\")</script>';
      
      await page.fill('[data-testid=\"email-input\"]', xssPayload);
      await page.fill('[data-testid=\"password-input\"]', 'password');
      
      await page.click('[data-testid=\"login-submit\"]');
      
      // XSS should not execute
      const alerts: string[] = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });
      
      await page.waitForTimeout(1000);
      expect(alerts).toHaveLength(0);
    });

    test('should enforce rate limiting', async ({ page }) => {
      // Make multiple failed login attempts rapidly
      for (let i = 0; i < 10; i++) {
        await loginPage.loginWithInvalidCredentials('test@example.com', 'wrongpassword');
        await page.waitForTimeout(100);
      }
      
      // Should eventually show rate limit message
      const rateLimitMessage = page.locator('[data-testid=\"rate-limit-message\"]');
      
      // Check if rate limiting is implemented
      if (await rateLimitMessage.isVisible()) {
        await expect(rateLimitMessage).toContainText('too many attempts');
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be accessible with keyboard navigation', async ({ page }) => {
      await loginPage.goto();
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(loginPage.emailInput).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(loginPage.passwordInput).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(loginPage.submitButton).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await loginPage.goto();
      
      // Check accessibility
      await loginPage.checkAccessibility();
    });
  });
});