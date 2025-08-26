/**
 * Global Setup for E2E Tests
 * This file runs once before all test projects
 */

import { test as setup } from '@playwright/test';
import { TEST_CONFIG } from '../../playwright.config.enhanced';
import { DatabaseManager } from './utils/database-manager';
import { TestDataSeeder } from './utils/test-data-seeder';
import { AuthenticationManager } from './utils/authentication-manager';

// Setup project runs before all other tests
setup('global setup', async ({ browser }) => {
  console.log('🚀 Starting global E2E test setup...');

  // Step 1: Initialize database
  const dbManager = new DatabaseManager(TEST_CONFIG.database);
  await dbManager.setupTestDatabase();

  // Step 2: Seed test data
  const seeder = new TestDataSeeder(TEST_CONFIG);
  await seeder.seedTestData();

  // Step 3: Create authentication states
  const authManager = new AuthenticationManager(browser, TEST_CONFIG);
  
  // Create authenticated user state
  await authManager.createUserAuthState();
  
  // Create authenticated admin state  
  await authManager.createAdminAuthState();

  console.log('✅ Global E2E test setup completed');
});