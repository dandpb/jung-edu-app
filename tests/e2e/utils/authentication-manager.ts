/**
 * Authentication Manager for E2E Tests
 * 
 * Handles authentication state setup including:
 * - User login and session management
 * - Authentication state persistence
 * - Multi-user test scenarios
 * - Role-based access control testing
 */

import { Browser, BrowserContext, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface TestConfig {
  baseURL: string;
  auth: {
    testUserEmail: string;
    testUserPassword: string;
    adminEmail: string;
    adminPassword: string;
  };
}

interface AuthState {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

export class AuthenticationManager {
  private browser: Browser;
  private config: TestConfig;

  constructor(browser: Browser, config: TestConfig) {
    this.browser = browser;
    this.config = config;
  }

  /**
   * Create authenticated user state
   */
  async createUserAuthState(): Promise<void> {
    console.log('🔐 Creating user authentication state...');

    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      await this.performLogin(
        page,
        this.config.auth.testUserEmail,
        this.config.auth.testUserPassword,
        'user'
      );

      // Save the authentication state
      await context.storageState({ path: './tests/e2e/auth/user-auth.json' });
      
      console.log('✅ User authentication state saved');
    } catch (error) {
      console.error('❌ Failed to create user auth state:', error);
      throw error;
    } finally {
      await context.close();
    }
  }

  /**
   * Create authenticated admin state
   */
  async createAdminAuthState(): Promise<void> {
    console.log('🔐 Creating admin authentication state...');

    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      await this.performLogin(
        page,
        this.config.auth.adminEmail,
        this.config.auth.adminPassword,
        'admin'
      );

      // Save the authentication state
      await context.storageState({ path: './tests/e2e/auth/admin-auth.json' });
      
      console.log('✅ Admin authentication state saved');
    } catch (error) {
      console.error('❌ Failed to create admin auth state:', error);
      throw error;
    } finally {
      await context.close();
    }
  }

  /**
   * Perform login process
   */
  private async performLogin(page: Page, email: string, password: string, role: 'user' | 'admin'): Promise<void> {
    // Navigate to login page
    await page.goto(`${this.config.baseURL}/login`);
    
    // Wait for login form to be visible
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    
    // Submit form
    await page.click('button[type="submit"], input[type="submit"]');
    
    // Wait for successful login (redirect or success indicator)
    try {
      // Try multiple selectors that might indicate successful login
      await Promise.race([
        page.waitForURL(`${this.config.baseURL}/dashboard`, { timeout: 15000 }),
        page.waitForURL(`${this.config.baseURL}/admin`, { timeout: 15000 }),
        page.waitForSelector('[data-testid="user-menu"], [data-testid="dashboard"]', { timeout: 15000 }),
        page.waitForSelector('.user-authenticated, .dashboard-container', { timeout: 15000 }),
      ]);

      // Additional verification for admin users
      if (role === 'admin') {
        try {
          // Try to access admin area to verify admin privileges
          await page.goto(`${this.config.baseURL}/admin`);
          await page.waitForSelector('[data-testid="admin-dashboard"], .admin-container', { timeout: 10000 });
        } catch (error) {
          console.warn('⚠️  Could not verify admin access, but login appears successful');
        }
      }

      // Wait a bit for any additional auth-related JavaScript to execute
      await page.waitForTimeout(2000);

      console.log(`✅ Successfully logged in as ${role}: ${email}`);
    } catch (error) {
      console.error(`❌ Login verification failed for ${email}:`, error);
      
      // Check for error messages on the page
      const errorMessages = await page.locator('.error, .alert-danger, [data-testid="error"]').allTextContents();
      if (errorMessages.length > 0) {
        console.error('Error messages found:', errorMessages);
      }
      
      throw new Error(`Login failed for ${email}: ${error.message}`);
    }
  }

  /**
   * Create custom authentication state for specific test scenarios
   */
  async createCustomAuthState(
    email: string,
    password: string,
    statePath: string,
    additionalSetup?: (page: Page) => Promise<void>
  ): Promise<void> {
    console.log(`🔐 Creating custom authentication state for ${email}...`);

    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      await this.performLogin(page, email, password, 'user');

      // Perform additional setup if provided
      if (additionalSetup) {
        await additionalSetup(page);
      }

      // Save the authentication state
      await context.storageState({ path: statePath });
      
      console.log(`✅ Custom authentication state saved to ${statePath}`);
    } catch (error) {
      console.error(`❌ Failed to create custom auth state for ${email}:`, error);
      throw error;
    } finally {
      await context.close();
    }
  }

  /**
   * Verify authentication state is valid
   */
  async verifyAuthState(statePath: string): Promise<boolean> {
    console.log(`🔍 Verifying authentication state: ${statePath}`);

    if (!fs.existsSync(statePath)) {
      console.log(`❌ Auth state file does not exist: ${statePath}`);
      return false;
    }

    try {
      const context = await this.browser.newContext({ storageState: statePath });
      const page = await context.newPage();

      // Navigate to a protected page
      await page.goto(`${this.config.baseURL}/dashboard`);
      
      // Check if we're still authenticated
      const isAuthenticated = await Promise.race([
        page.waitForSelector('[data-testid="user-menu"], [data-testid="dashboard"]', { timeout: 5000 })
          .then(() => true),
        page.waitForURL(`${this.config.baseURL}/login`, { timeout: 5000 })
          .then(() => false),
        page.waitForTimeout(5000).then(() => false),
      ]);

      await context.close();

      if (isAuthenticated) {
        console.log(`✅ Authentication state is valid: ${statePath}`);
        return true;
      } else {
        console.log(`❌ Authentication state is invalid: ${statePath}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error verifying auth state: ${error.message}`);
      return false;
    }
  }

  /**
   * Clean up authentication states
   */
  async cleanupAuthStates(): Promise<void> {
    console.log('🧹 Cleaning up authentication states...');

    const authFiles = [
      './tests/e2e/auth/user-auth.json',
      './tests/e2e/auth/admin-auth.json',
    ];

    for (const file of authFiles) {
      try {
        if (fs.existsSync(file)) {
          await fs.promises.unlink(file);
          console.log(`🗑️  Removed auth state: ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to remove auth state ${file}:`, error.message);
      }
    }
  }

  /**
   * Create multiple user sessions for concurrent testing
   */
  async createMultiUserStates(users: Array<{
    email: string;
    password: string;
    role: string;
    statePath: string;
  }>): Promise<void> {
    console.log(`🔐 Creating ${users.length} user authentication states...`);

    for (const user of users) {
      const context = await this.browser.newContext();
      const page = await context.newPage();

      try {
        await this.performLogin(page, user.email, user.password, user.role as any);
        await context.storageState({ path: user.statePath });
        console.log(`✅ Created auth state for ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to create auth state for ${user.email}:`, error);
      } finally {
        await context.close();
      }
    }
  }

  /**
   * Test login/logout flow
   */
  async testAuthFlow(page: Page, email: string, password: string): Promise<{
    loginSuccessful: boolean;
    logoutSuccessful: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Test login
      await this.performLogin(page, email, password, 'user');
      const loginSuccessful = true;

      // Test logout
      try {
        await page.click('[data-testid="user-menu"], .user-menu');
        await page.click('[data-testid="logout"], a[href="/logout"], button:has-text("Logout")');
        
        // Wait for redirect to login page
        await page.waitForURL(`${this.config.baseURL}/login`, { timeout: 10000 });
        const logoutSuccessful = true;

        return { loginSuccessful, logoutSuccessful, errors };
      } catch (logoutError) {
        errors.push(`Logout failed: ${logoutError.message}`);
        return { loginSuccessful, logoutSuccessful: false, errors };
      }
    } catch (loginError) {
      errors.push(`Login failed: ${loginError.message}`);
      return { loginSuccessful: false, logoutSuccessful: false, errors };
    }
  }

  /**
   * Set up session storage for tests
   */
  async setupSessionStorage(page: Page, data: Record<string, string>): Promise<void> {
    await page.evaluate((storageData) => {
      for (const [key, value] of Object.entries(storageData)) {
        sessionStorage.setItem(key, value);
      }
    }, data);
  }

  /**
   * Set up local storage for tests
   */
  async setupLocalStorage(page: Page, data: Record<string, string>): Promise<void> {
    await page.evaluate((storageData) => {
      for (const [key, value] of Object.entries(storageData)) {
        localStorage.setItem(key, value);
      }
    }, data);
  }

  /**
   * Get authentication state from storage
   */
  async getAuthState(statePath: string): Promise<AuthState | null> {
    try {
      const stateData = await fs.promises.readFile(statePath, 'utf8');
      return JSON.parse(stateData);
    } catch (error) {
      console.error(`Failed to read auth state from ${statePath}:`, error);
      return null;
    }
  }
}