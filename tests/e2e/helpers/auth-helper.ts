import { Page, BrowserContext } from '@playwright/test';
import { TestUser, TestUserRole } from '../fixtures/test-users';
import { ApiHelper } from './api-helper';

/**
 * Authentication Helper
 * Manages user authentication, sessions, and auth-related utilities
 */
export class AuthHelper {
  private apiHelper: ApiHelper;

  constructor(private page: Page) {
    this.apiHelper = new ApiHelper();
  }

  // User credentials
  async getTestUser(role: TestUserRole = 'student'): Promise<TestUser> {
    const users = {
      admin: {
        id: 'admin-test-user',
        email: 'admin@test.jaquedu.com',
        password: 'AdminTest123!',
        role: 'admin' as TestUserRole,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true
      },
      teacher: {
        id: 'teacher-test-user',
        email: 'teacher@test.jaquedu.com',
        password: 'TeacherTest123!',
        role: 'teacher' as TestUserRole,
        firstName: 'Teacher',
        lastName: 'User',
        isActive: true
      },
      student: {
        id: 'student-test-user',
        email: 'student@test.jaquedu.com',
        password: 'StudentTest123!',
        role: 'student' as TestUserRole,
        firstName: 'Student',
        lastName: 'User',
        isActive: true
      }
    };

    return users[role];
  }

  async getAdminUser(): Promise<TestUser> {
    return await this.getTestUser('admin');
  }

  async getRegularUser(): Promise<TestUser> {
    return await this.getTestUser('student');
  }

  // Authentication actions
  async login(email: string, password: string): Promise<void> {
    await this.page.goto('/auth/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for redirect after successful login
    await this.page.waitForURL(/dashboard|admin/);
  }

  async loginAsUser(role: TestUserRole = 'student'): Promise<void> {
    const user = await this.getTestUser(role);
    await this.login(user.email, user.password);
  }

  async loginAsAdmin(): Promise<void> {
    await this.loginAsUser('admin');
  }

  async logout(): Promise<void> {
    // Try different logout methods depending on current page
    try {
      // Method 1: User menu logout
      await this.page.click('[data-testid="user-avatar"]');
      await this.page.click('[data-testid="logout-button"]');
    } catch {
      try {
        // Method 2: Direct logout button
        await this.page.click('[data-testid="logout-button"]');
      } catch {
        // Method 3: Navigate to logout endpoint
        await this.page.goto('/auth/logout');
      }
    }
    
    // Wait for redirect to login page
    await this.page.waitForURL(/login|auth/);
  }

  // Session management
  async saveAuthState(filePath: string): Promise<void> {
    const context = this.page.context();
    await context.storageState({ path: filePath });
  }

  async loadAuthState(filePath: string): Promise<void> {
    // This needs to be done at context level, typically in test setup
    console.log(`Auth state should be loaded from: ${filePath}`);
  }

  async clearAuthState(): Promise<void> {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  // Authentication status checks
  async isLoggedIn(): Promise<boolean> {
    try {
      // Check for user avatar or other authenticated elements
      await this.page.waitForSelector('[data-testid="user-avatar"]', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isLoggedOut(): Promise<boolean> {
    return !(await this.isLoggedIn());
  }

  async getCurrentUser(): Promise<any> {
    try {
      // Get user info from the page context or API
      const userInfo = await this.page.evaluate(() => {
        return (window as any).currentUser || null;
      });
      
      if (!userInfo) {
        // Fallback: make API call to get current user
        return await this.apiHelper.getCurrentUser();
      }
      
      return userInfo;
    } catch {
      return null;
    }
  }

  async getUserRole(): Promise<TestUserRole | null> {
    const user = await this.getCurrentUser();
    return user?.role || null;
  }

  async isAdmin(): Promise<boolean> {
    const role = await this.getUserRole();
    return role === 'admin';
  }

  async isTeacher(): Promise<boolean> {
    const role = await this.getUserRole();
    return role === 'teacher';
  }

  async isStudent(): Promise<boolean> {
    const role = await this.getUserRole();
    return role === 'student';
  }

  // Token management
  async getAuthToken(): Promise<string | null> {
    try {
      // Try to get token from localStorage
      const token = await this.page.evaluate(() => {
        return localStorage.getItem('auth_token') || 
               localStorage.getItem('access_token') ||
               sessionStorage.getItem('auth_token');
      });
      return token;
    } catch {
      return null;
    }
  }

  async setAuthToken(token: string): Promise<void> {
    await this.page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, token);
  }

  async removeAuthToken(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('auth_token');
    });
  }

  // Registration helpers
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    confirmPassword?: string;
  }): Promise<void> {
    await this.page.goto('/auth/register');
    
    await this.page.fill('[data-testid="first-name-input"]', userData.firstName);
    await this.page.fill('[data-testid="last-name-input"]', userData.lastName);
    await this.page.fill('[data-testid="email-input"]', userData.email);
    await this.page.fill('[data-testid="password-input"]', userData.password);
    
    if (userData.confirmPassword) {
      await this.page.fill('[data-testid="confirm-password-input"]', userData.confirmPassword);
    }
    
    await this.page.click('[data-testid="register-button"]');
    
    // Wait for successful registration
    await this.page.waitForSelector('[data-testid="registration-success"]', { timeout: 10000 });
  }

  async registerRandomUser(): Promise<TestUser> {
    const faker = require('faker');
    const userData = {
      id: faker.datatype.uuid(),
      email: faker.internet.email(),
      password: 'TestPassword123!',
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      role: 'student' as TestUserRole,
      isActive: true
    };
    
    await this.register({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      confirmPassword: userData.password
    });
    
    return userData;
  }

  // Password reset helpers
  async requestPasswordReset(email: string): Promise<void> {
    await this.page.goto('/auth/forgot-password');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.click('[data-testid="send-reset-button"]');
    
    // Wait for confirmation
    await this.page.waitForSelector('[data-testid="reset-email-sent"]', { timeout: 10000 });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.page.goto(`/auth/reset-password?token=${token}`);
    await this.page.fill('[data-testid="new-password-input"]', newPassword);
    await this.page.fill('[data-testid="confirm-password-input"]', newPassword);
    await this.page.click('[data-testid="reset-password-button"]');
    
    // Wait for success
    await this.page.waitForSelector('[data-testid="password-reset-success"]', { timeout: 10000 });
  }

  // Account verification helpers
  async verifyEmail(token: string): Promise<void> {
    await this.page.goto(`/auth/verify-email?token=${token}`);
    await this.page.waitForSelector('[data-testid="email-verified"]', { timeout: 10000 });
  }

  // Session validation
  async validateSession(): Promise<boolean> {
    try {
      const response = await this.page.request.get('/api/auth/validate');
      return response.ok();
    } catch {
      return false;
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      const response = await this.page.request.post('/api/auth/refresh');
      if (response.ok()) {
        const data = await response.json();
        if (data.token) {
          await this.setAuthToken(data.token);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Multi-factor authentication (if implemented)
  async enableMFA(): Promise<string> {
    await this.page.goto('/profile/security');
    await this.page.click('[data-testid="enable-mfa-button"]');
    
    // Get the QR code or secret
    const secret = await this.page.textContent('[data-testid="mfa-secret"]');
    return secret || '';
  }

  async verifyMFA(code: string): Promise<void> {
    await this.page.fill('[data-testid="mfa-code-input"]', code);
    await this.page.click('[data-testid="verify-mfa-button"]');
    
    await this.page.waitForSelector('[data-testid="mfa-verified"]', { timeout: 10000 });
  }

  // Social authentication (if implemented)
  async loginWithGoogle(): Promise<void> {
    await this.page.goto('/auth/login');
    await this.page.click('[data-testid="google-login-button"]');
    
    // Handle OAuth popup/redirect
    await this.page.waitForURL(/dashboard/);
  }

  async loginWithGitHub(): Promise<void> {
    await this.page.goto('/auth/login');
    await this.page.click('[data-testid="github-login-button"]');
    
    // Handle OAuth popup/redirect
    await this.page.waitForURL(/dashboard/);
  }
}