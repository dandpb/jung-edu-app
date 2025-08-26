import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Authentication setup for E2E tests
 * This file runs once before all tests to authenticate users
 * and save their authentication state for use in tests
 */

const authFile = path.join(__dirname, '.auth/user.json');
const adminAuthFile = path.join(__dirname, '.auth/admin.json');

// Test user credentials
const TEST_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL || 'test@jaqedu.com';
const TEST_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';

// Admin user credentials
const ADMIN_USER_EMAIL = process.env.E2E_ADMIN_USER_EMAIL || 'admin@jaqedu.com';
const ADMIN_USER_PASSWORD = process.env.E2E_ADMIN_USER_PASSWORD || 'AdminPassword123!';

/**
 * Setup regular user authentication
 */
setup('authenticate as user', async ({ page }) => {
  console.log('🔐 Setting up user authentication...');
  
  try {
    // Navigate to login page
    await page.goto('/auth/login');
    
    // Wait for login form to be visible
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
    
    // Fill in credentials
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    
    // Submit login form
    await page.click('[data-testid="login-submit"]');
    
    // Wait for successful login (redirect to dashboard)
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Verify we're logged in by checking for user-specific elements
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    console.log('✅ User authentication successful');
    
    // Save signed-in state
    await page.context().storageState({ path: authFile });
    
  } catch (error) {
    console.error('❌ User authentication failed:', error);
    
    // Try to register if login fails (user might not exist)
    await setupTestUser(page);
    
    // Retry login after registration
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('/dashboard', { timeout: 15000 });
    await page.context().storageState({ path: authFile });
  }
});

/**
 * Setup admin user authentication
 */
setup('authenticate as admin', async ({ page }) => {
  console.log('🔐 Setting up admin authentication...');
  
  try {
    // Navigate to admin login page
    await page.goto('/admin/login');
    
    // Wait for admin login form
    await page.waitForSelector('[data-testid="admin-login-form"]', { timeout: 10000 });
    
    // Fill in admin credentials
    await page.fill('[data-testid="admin-email-input"]', ADMIN_USER_EMAIL);
    await page.fill('[data-testid="admin-password-input"]', ADMIN_USER_PASSWORD);
    
    // Submit admin login
    await page.click('[data-testid="admin-login-submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 15000 });
    
    // Verify admin access
    await expect(page.locator('[data-testid="admin-navigation"]')).toBeVisible();
    
    console.log('✅ Admin authentication successful');
    
    // Save admin signed-in state
    await page.context().storageState({ path: adminAuthFile });
    
  } catch (error) {
    console.error('❌ Admin authentication failed:', error);
    
    // Try to create admin user if login fails
    await setupTestAdmin(page);
    
    // Retry admin login
    await page.goto('/admin/login');
    await page.fill('[data-testid="admin-email-input"]', ADMIN_USER_EMAIL);
    await page.fill('[data-testid="admin-password-input"]', ADMIN_USER_PASSWORD);
    await page.click('[data-testid="admin-login-submit"]');
    await page.waitForURL('/admin/dashboard', { timeout: 15000 });
    await page.context().storageState({ path: adminAuthFile });
  }
});

/**
 * Create a test user if it doesn't exist
 */
async function setupTestUser(page) {
  console.log('👤 Creating test user...');
  
  try {
    await page.goto('/auth/register');
    await page.waitForSelector('[data-testid="register-form"]');
    
    // Fill registration form
    await page.fill('[data-testid="register-name-input"]', 'E2E Test User');
    await page.fill('[data-testid="register-email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="register-password-input"]', TEST_USER_PASSWORD);
    await page.fill('[data-testid="register-confirm-password-input"]', TEST_USER_PASSWORD);
    
    // Submit registration
    await page.click('[data-testid="register-submit"]');
    
    // Wait for successful registration
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    console.log('✅ Test user created successfully');
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    throw error;
  }
}

/**
 * Create a test admin user if it doesn't exist
 */
async function setupTestAdmin(page) {
  console.log('👨‍💼 Creating test admin user...');
  
  try {
    // Navigate to admin creation endpoint or use existing admin setup
    // This would typically involve API calls or database seeding
    // For now, we'll assume admin user exists or needs manual setup
    
    console.log('⚠️  Admin user setup may require manual configuration');
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
}