import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...');
  
  // Clean up temporary files if needed
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // Generate test summary report
  const reportsDir = path.join(__dirname, 'reports');
  const testResultsFile = path.join(reportsDir, 'test-results.json');
  
  if (fs.existsSync(testResultsFile)) {
    try {
      const results = JSON.parse(fs.readFileSync(testResultsFile, 'utf-8'));
      const summary = {
        timestamp: new Date().toISOString(),
        total: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        projects: results.stats?.projects || {},
      };
      
      fs.writeFileSync(
        path.join(reportsDir, 'test-summary.json'),
        JSON.stringify(summary, null, 2)
      );
      
      console.log('Test Summary:');
      console.log(`Total: ${summary.total}`);
      console.log(`Passed: ${summary.passed}`);
      console.log(`Failed: ${summary.failed}`);
      console.log(`Skipped: ${summary.skipped}`);
      console.log(`Duration: ${summary.duration}ms`);
      
    } catch (error) {
      console.log('Could not generate test summary:', error.message);
    }
  }

  console.log('Global teardown completed.');
}

export default globalTeardown;