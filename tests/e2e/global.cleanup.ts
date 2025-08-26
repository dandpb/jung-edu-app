/**
 * Global Cleanup for E2E Tests
 * This file runs once after all test projects complete
 */

import { test as cleanup } from '@playwright/test';
import { TEST_CONFIG } from '../../playwright.config.enhanced';
import { DatabaseManager } from './utils/database-manager';
import { AuthenticationManager } from './utils/authentication-manager';
import { ReportManager } from './utils/report-manager';

// Cleanup project runs after all other tests
cleanup('global cleanup', async ({ browser }) => {
  console.log('🧹 Starting global E2E test cleanup...');

  // Step 1: Clean up authentication states
  const authManager = new AuthenticationManager(browser, TEST_CONFIG);
  await authManager.cleanupAuthStates();

  // Step 2: Clean up test database
  const dbManager = new DatabaseManager(TEST_CONFIG.database);
  await dbManager.cleanupTestDatabase();

  // Step 3: Generate final reports
  const reportManager = new ReportManager();
  await reportManager.generateSummaryReport();
  await reportManager.archiveResults();

  // Step 4: Clean up old archives (keep last 10)
  await reportManager.cleanupOldArchives(10);

  console.log('✅ Global E2E test cleanup completed');
});