import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Global setup for Playwright tests
 * This runs once before all tests to prepare the test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  const { baseURL } = config.projects[0].use;
  
  // Ensure auth directory exists
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Wait for the app to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log(`⏳ Waiting for app to be ready at ${baseURL}...`);
    
    // Wait for the app to be accessible
    let retries = 30;
    while (retries > 0) {
      try {
        await page.goto(baseURL!);
        await page.waitForSelector('body', { timeout: 5000 });
        console.log('✅ App is ready!');
        break;
      } catch (error) {
        console.log(`⏳ App not ready yet, retrying... (${retries} attempts left)`);
        retries--;
        await page.waitForTimeout(2000);
        
        if (retries === 0) {
          throw new Error(`App failed to start at ${baseURL}`);
        }
      }
    }
    
    // Check if we're in test environment
    const isTestEnv = await page.evaluate(() => {
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1';
    });
    
    if (!isTestEnv) {
      console.warn('⚠️  Warning: Not running in test environment');
    }
    
    // Set up test database if needed
    await setupTestDatabase();
    
    console.log('✅ Global setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Set up test database with initial data
 */
async function setupTestDatabase() {
  console.log('🗄️  Setting up test database...');
  
  // Here you would typically:
  // 1. Connect to your test database
  // 2. Run migrations if needed
  // 3. Seed test data
  // 4. Create test user accounts
  
  // Example placeholder - replace with actual database setup
  try {
    // await seedTestData();
    console.log('✅ Test database setup completed!');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    // Don't throw here - let tests handle missing data gracefully
  }
}

export default globalSetup;
