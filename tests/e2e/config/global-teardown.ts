/**
 * Global E2E Test Teardown
 * 
 * This file handles:
 * - Test database cleanup
 * - Temporary file removal
 * - Test result archiving
 * - Environment cleanup
 */

import { FullConfig } from '@playwright/test';
import { TEST_CONFIG } from '../../../playwright.config.enhanced';
import { DatabaseManager } from '../utils/database-manager';
import { ReportManager } from '../utils/report-manager';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test environment cleanup...');
  
  try {
    // Step 1: Clean up test database
    await cleanupTestDatabase();
    
    // Step 2: Archive test results
    await archiveTestResults();
    
    // Step 3: Clean up temporary files
    await cleanupTemporaryFiles();
    
    // Step 4: Generate final report
    await generateFinalReport();
    
    console.log('✅ E2E test environment cleanup complete');
    
  } catch (error) {
    console.error('❌ E2E test environment cleanup failed:', error);
    // Don't throw here - we don't want cleanup failures to fail the test run
  }
}

/**
 * Clean up the test database
 */
async function cleanupTestDatabase(): Promise<void> {
  console.log('🗂️  Cleaning up test database...');
  
  try {
    const dbManager = new DatabaseManager(TEST_CONFIG.database);
    await dbManager.cleanupTestDatabase();
    console.log('✅ Test database cleanup complete');
  } catch (error) {
    console.warn('⚠️  Database cleanup failed:', error.message);
  }
}

/**
 * Archive test results for future analysis
 */
async function archiveTestResults(): Promise<void> {
  console.log('📦 Archiving test results...');
  
  try {
    const reportManager = new ReportManager();
    await reportManager.archiveResults();
    console.log('✅ Test results archived');
  } catch (error) {
    console.warn('⚠️  Test result archiving failed:', error.message);
  }
}

/**
 * Clean up temporary files and directories
 */
async function cleanupTemporaryFiles(): Promise<void> {
  console.log('🗑️  Cleaning up temporary files...');
  
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Clean up temporary authentication states
    const authFiles = [
      './tests/e2e/auth/user-auth.json',
      './tests/e2e/auth/admin-auth.json',
    ];
    
    for (const file of authFiles) {
      try {
        await fs.unlink(file);
      } catch (error) {
        // File might not exist, that's okay
      }
    }
    
    // Clean up setup metadata
    try {
      await fs.unlink('./tests/e2e/setup-metadata.json');
    } catch (error) {
      // File might not exist, that's okay
    }
    
    // Clean up old screenshots and videos (keep last 10 runs)
    await cleanupOldArtifacts('./tests/e2e/screenshots', 10);
    await cleanupOldArtifacts('./tests/e2e/videos', 10);
    
    console.log('✅ Temporary file cleanup complete');
  } catch (error) {
    console.warn('⚠️  Temporary file cleanup failed:', error.message);
  }
}

/**
 * Generate a final summary report
 */
async function generateFinalReport(): Promise<void> {
  console.log('📊 Generating final test report...');
  
  try {
    const reportManager = new ReportManager();
    await reportManager.generateSummaryReport();
    console.log('✅ Final test report generated');
  } catch (error) {
    console.warn('⚠️  Final report generation failed:', error.message);
  }
}

/**
 * Clean up old artifacts, keeping only the most recent ones
 */
async function cleanupOldArtifacts(directory: string, keepCount: number): Promise<void> {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Check if directory exists
    try {
      await fs.access(directory);
    } catch {
      return; // Directory doesn't exist, nothing to clean
    }
    
    const files = await fs.readdir(directory);
    if (files.length <= keepCount) {
      return; // Not enough files to clean up
    }
    
    // Get file stats and sort by modification time
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        return { path: filePath, mtime: stats.mtime };
      })
    );
    
    // Sort by modification time (newest first)
    fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    // Delete old files (keep only the newest ones)
    const filesToDelete = fileStats.slice(keepCount);
    await Promise.all(
      filesToDelete.map(({ path }) => fs.unlink(path))
    );
    
    if (filesToDelete.length > 0) {
      console.log(`🗑️  Cleaned up ${filesToDelete.length} old files from ${directory}`);
    }
  } catch (error) {
    console.warn(`⚠️  Failed to clean up old artifacts in ${directory}:`, error.message);
  }
}

export default globalTeardown;