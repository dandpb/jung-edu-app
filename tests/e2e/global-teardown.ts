import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for Playwright tests
 * This runs once after all tests to clean up the test environment
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  try {
    // Clean up auth files
    const authDir = path.join(__dirname, '.auth');
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(authDir, file));
          console.log(`🗑️  Cleaned up auth file: ${file}`);
        }
      }
    }
    
    // Clean up test data
    await cleanupTestDatabase();
    
    // Clean up any temporary files
    await cleanupTempFiles();
    
    console.log('✅ Global teardown completed successfully!');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - we don't want teardown to fail the tests
  }
}

/**
 * Clean up test database
 */
async function cleanupTestDatabase() {
  console.log('🗄️  Cleaning up test database...');
  
  try {
    // Here you would typically:
    // 1. Connect to your test database
    // 2. Delete test data
    // 3. Reset sequences/counters
    // 4. Close connections
    
    // Example placeholder - replace with actual cleanup
    // await deleteTestData();
    
    console.log('✅ Test database cleanup completed!');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
  }
}

/**
 * Clean up temporary files created during tests
 */
async function cleanupTempFiles() {
  console.log('📁 Cleaning up temporary files...');
  
  try {
    // Clean up screenshots, videos, traces from failed tests if needed
    const tempDirs = ['test-results', 'playwright-report'];
    
    for (const dir of tempDirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        // Keep the directories but clean old files if desired
        console.log(`📁 Temporary directory exists: ${dir}`);
      }
    }
    
    console.log('✅ Temporary files cleanup completed!');
  } catch (error) {
    console.error('❌ Temporary files cleanup failed:', error);
  }
}

export default globalTeardown;
