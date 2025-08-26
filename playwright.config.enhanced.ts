import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * E2E Test Configuration for jaqEdu Educational Platform
 * 
 * This configuration provides:
 * - Multi-browser testing (Chrome, Firefox, Safari)
 * - Parallel execution with worker isolation
 * - Test environment isolation
 * - Database setup and cleanup
 * - Screenshot and video capture
 * - Test reporting and artifacts
 */

// Use existing test database URL or default to local
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 
  process.env.REACT_APP_SUPABASE_URL || 
  'https://test.supabase.co';

// Test environment configuration
const TEST_CONFIG = {
  // Base URL for the application under test
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
  
  // Test database configuration
  database: {
    url: TEST_DATABASE_URL,
    testSchema: 'e2e_tests',
    cleanupTimeout: 30000,
  },
  
  // Test data configuration
  testData: {
    seedDataPath: './tests/e2e/fixtures/seed-data.json',
    userFixtures: './tests/e2e/fixtures/users.json',
    moduleFixtures: './tests/e2e/fixtures/modules.json',
  },
  
  // Authentication configuration
  auth: {
    testUserEmail: 'e2e.test@jaqedu.com',
    testUserPassword: 'e2e-test-password-123',
    adminEmail: 'admin.e2e@jaqedu.com',
    adminPassword: 'admin-e2e-test-456',
  },
  
  // API endpoints for test setup
  api: {
    healthCheck: '/api/health',
    testReset: '/api/test/reset',
    testSeed: '/api/test/seed',
  },
};

export default defineConfig({
  // Test directory structure
  testDir: './tests/e2e',
  
  // Timeout configuration
  timeout: 60 * 1000,
  expect: { timeout: 15 * 1000 },
  
  // Test execution configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  
  // Test output and artifacts
  outputDir: './tests/e2e/test-results',
  
  // Global test configuration
  use: {
    // Base URL for all tests
    baseURL: TEST_CONFIG.baseURL,
    
    // Browser configuration
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 30 * 1000,
    navigationTimeout: 30 * 1000,
    
    // Additional context options
    contextOptions: {
      permissions: ['notifications', 'clipboard-read', 'clipboard-write'],
      locale: 'en-US',
      timezoneId: 'America/New_York',
    },
  },

  // Project configurations for different browsers/environments
  projects: [
    // Setup project - runs before all tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },

    // Cleanup project - runs after all tests
    {
      name: 'cleanup',
      testMatch: /.*\.cleanup\.ts/,
    },

    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'] 
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'] 
      },
      dependencies: ['setup'],
    },

    // Mobile devices (optional - can be enabled for mobile testing)
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
      testIgnore: /.*admin.*\.e2e\.ts/, // Skip admin tests on mobile
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
      testIgnore: /.*admin.*\.e2e\.ts/, // Skip admin tests on mobile
    },

    // Authentication states
    {
      name: 'authenticated-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/e2e/auth/user-auth.json',
      },
      dependencies: ['setup'],
      testMatch: /.*user.*\.e2e\.ts/,
    },

    {
      name: 'authenticated-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/e2e/auth/admin-auth.json',
      },
      dependencies: ['setup'],
      testMatch: /.*admin.*\.e2e\.ts/,
    },
  ],

  // Web server configuration (start the app for testing)
  webServer: {
    command: 'npm run start',
    url: TEST_CONFIG.baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Override environment variables for E2E testing
      NODE_ENV: 'test',
      REACT_APP_ENVIRONMENT: 'e2e-test',
      REACT_APP_SUPABASE_URL: TEST_CONFIG.database.url,
      SKIP_PREFLIGHT_CHECK: 'true',
    },
  },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/config/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/config/global-teardown.ts'),

  // Test metadata
  metadata: {
    'test-environment': process.env.NODE_ENV || 'test',
    'base-url': TEST_CONFIG.baseURL,
    'browser-count': 5,
    'parallel-workers': process.env.CI ? 2 : 4,
  },

  // Reporter configuration
  reporter: [
    // Console output during test execution
    ['list'],
    
    // HTML report for detailed analysis
    ['html', { 
      outputFolder: './tests/e2e/reports/html',
      open: process.env.CI ? 'never' : 'on-failure' 
    }],
    
    // JSON report for CI integration
    ['json', { 
      outputFile: './tests/e2e/reports/test-results.json' 
    }],
    
    // JUnit XML for CI systems
    ['junit', { 
      outputFile: './tests/e2e/reports/junit.xml' 
    }],
    
    // GitHub Actions integration (if running in CI)
    ...(process.env.GITHUB_ACTIONS ? [['github']] : []),
  ],
});

// Export test configuration for use in test files
export { TEST_CONFIG };