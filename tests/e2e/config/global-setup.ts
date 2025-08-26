/**
 * Global E2E Test Setup
 * 
 * This file handles:
 * - Test database preparation
 * - Seed data insertion
 * - Authentication state setup
 * - Environment validation
 */

import { chromium, FullConfig } from '@playwright/test';
import { TEST_CONFIG } from '../../../playwright.config.enhanced';
import { DatabaseManager } from '../utils/database-manager';
import { TestDataSeeder } from '../utils/test-data-seeder';
import { AuthenticationManager } from '../utils/authentication-manager';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test environment setup...');
  
  try {
    // Step 1: Validate test environment
    await validateTestEnvironment();
    
    // Step 2: Setup test database
    const dbManager = new DatabaseManager(TEST_CONFIG.database);
    await dbManager.setupTestDatabase();
    
    // Step 3: Seed test data
    const seeder = new TestDataSeeder(TEST_CONFIG);
    await seeder.seedTestData();
    
    // Step 4: Setup authentication states
    await setupAuthenticationStates();
    
    // Step 5: Verify application health
    await verifyApplicationHealth();
    
    console.log('✅ E2E test environment setup complete');
    
    // Store setup metadata for tests
    const setupMetadata = {
      timestamp: new Date().toISOString(),
      baseURL: TEST_CONFIG.baseURL,
      databaseUrl: TEST_CONFIG.database.url,
      testDataSeeded: true,
      authStatesCreated: true,
    };
    
    // Save setup metadata
    await require('fs').promises.writeFile(
      './tests/e2e/setup-metadata.json',
      JSON.stringify(setupMetadata, null, 2)
    );
    
  } catch (error) {
    console.error('❌ E2E test environment setup failed:', error);
    throw error;
  }
}

/**
 * Validate that the test environment is properly configured
 */
async function validateTestEnvironment(): Promise<void> {
  console.log('🔍 Validating test environment...');
  
  // Check required environment variables
  const requiredEnvVars = [
    'NODE_ENV',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Ensure we're running in test mode
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  NODE_ENV is not set to "test". Setting it now...');
    process.env.NODE_ENV = 'test';
  }
  
  // Create necessary directories
  const fs = require('fs').promises;
  const dirs = [
    './tests/e2e/auth',
    './tests/e2e/fixtures',
    './tests/e2e/reports',
    './tests/e2e/test-results',
    './tests/e2e/screenshots',
    './tests/e2e/videos',
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
  
  console.log('✅ Test environment validation complete');
}

/**
 * Setup authentication states for different user types
 */
async function setupAuthenticationStates(): Promise<void> {
  console.log('🔐 Setting up authentication states...');
  
  const browser = await chromium.launch();
  const authManager = new AuthenticationManager(browser, TEST_CONFIG);
  
  try {
    // Create authenticated user state
    await authManager.createUserAuthState();
    
    // Create authenticated admin state
    await authManager.createAdminAuthState();
    
    console.log('✅ Authentication states created');
  } finally {
    await browser.close();
  }
}

/**
 * Verify that the application is running and healthy
 */
async function verifyApplicationHealth(): Promise<void> {
  console.log('🏥 Verifying application health...');
  
  const maxRetries = 10;
  const retryDelay = 3000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${TEST_CONFIG.baseURL}/health`);
      
      if (response.ok) {
        console.log('✅ Application is healthy and ready for testing');
        return;
      }
      
      console.log(`⏳ Health check failed (attempt ${i + 1}/${maxRetries}), retrying...`);
    } catch (error) {
      console.log(`⏳ Health check error (attempt ${i + 1}/${maxRetries}):`, error.message);
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw new Error('Application health check failed after maximum retries');
}

export default globalSetup;