import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('Starting global setup...');
  
  // Create necessary directories
  const authDir = path.join(__dirname, 'auth');
  const reportsDir = path.join(__dirname, 'reports');
  const screenshotsDir = path.join(__dirname, 'screenshots');
  const visualBaselineDir = path.join(__dirname, 'visual-baselines');
  
  [authDir, reportsDir, screenshotsDir, visualBaselineDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Set up authentication for different user types
  const browser = await chromium.launch();
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';

  // Setup admin user authentication
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  
  try {
    console.log('Setting up admin authentication...');
    await adminPage.goto(`${baseURL}/admin/login`);
    
    // Try to create admin credentials if login form exists
    const loginForm = adminPage.locator('form');
    if (await loginForm.isVisible()) {
      // Fill in admin credentials (adjust selectors based on your actual login form)
      await adminPage.fill('[data-testid="email-input"], [name="email"], input[type="email"]', 'admin@jaquedu.com');
      await adminPage.fill('[data-testid="password-input"], [name="password"], input[type="password"]', 'admin123');
      await adminPage.click('[data-testid="login-button"], [type="submit"], button:has-text("Login")');
      
      // Wait for successful login
      await adminPage.waitForURL(/\/admin(?:\/dashboard)?/, { timeout: 10000 });
    }
    
    // Save authenticated state
    await adminContext.storageState({ path: path.join(authDir, 'admin-user.json') });
    console.log('Admin authentication saved.');
    
  } catch (error) {
    console.log('Admin setup failed, creating minimal auth state:', error.message);
    // Create minimal auth state for tests that don't require real authentication
    const minimalAuthState = {
      cookies: [],
      origins: [
        {
          origin: baseURL,
          localStorage: [
            {
              name: 'test-mode',
              value: 'true'
            }
          ]
        }
      ]
    };
    
    fs.writeFileSync(
      path.join(authDir, 'admin-user.json'),
      JSON.stringify(minimalAuthState, null, 2)
    );
  }
  
  await adminContext.close();

  // Setup regular user authentication
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  
  try {
    console.log('Setting up user authentication...');
    await userPage.goto(`${baseURL}/login`);
    
    const loginForm = userPage.locator('form');
    if (await loginForm.isVisible()) {
      await userPage.fill('[data-testid="email-input"], [name="email"], input[type="email"]', 'user@jaquedu.com');
      await userPage.fill('[data-testid="password-input"], [name="password"], input[type="password"]', 'user123');
      await userPage.click('[data-testid="login-button"], [type="submit"], button:has-text("Login")');
      
      await userPage.waitForURL(/\/(?:dashboard)?/, { timeout: 10000 });
    }
    
    await userContext.storageState({ path: path.join(authDir, 'regular-user.json') });
    console.log('User authentication saved.');
    
  } catch (error) {
    console.log('User setup failed, creating minimal auth state:', error.message);
    const minimalAuthState = {
      cookies: [],
      origins: [
        {
          origin: baseURL,
          localStorage: [
            {
              name: 'test-user-mode',
              value: 'true'
            }
          ]
        }
      ]
    };
    
    fs.writeFileSync(
      path.join(authDir, 'regular-user.json'),
      JSON.stringify(minimalAuthState, null, 2)
    );
  }
  
  await userContext.close();
  await browser.close();

  console.log('Global setup completed.');
}

export default globalSetup;