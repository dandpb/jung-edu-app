/**
 * Jest Configuration for API Automation Tests
 * Optimized for API testing with proper timeouts and setup
 */

module.exports = {
  displayName: 'API Automation Tests',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/**/*.test.{js,ts}',
    '<rootDir>/**/*.spec.{js,ts}'
  ],
  
  // TypeScript support
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
  
  // Timeouts - API tests need longer timeouts
  testTimeout: 60000, // 60 seconds for complex API operations
  
  // Coverage configuration
  collectCoverage: false, // API tests don't need code coverage
  
  // Reporting
  verbose: true,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/reports',
        outputName: 'api-test-results.xml',
        suiteName: 'API Automation Tests'
      }
    ]
  ],
  
  // Parallel execution
  maxWorkers: 2, // Limit parallel execution to avoid overwhelming API
  
  // Test sequencing
  testSequencer: '<rootDir>/test-sequencer.js',
  
  // Environment variables
  testEnvironmentOptions: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080/api',
    WS_BASE_URL: process.env.WS_BASE_URL || 'ws://localhost:8080',
    TEST_TIMEOUT: process.env.TEST_TIMEOUT || '30000'
  },
  
  // Module name mapping for Node.js compatibility
  moduleNameMapping: {
    '^axios$': 'axios',
    '^ws$': 'ws',
    '^uuid$': 'uuid'
  },
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Error handling
  bail: false, // Continue running tests even if some fail
  
  // Custom test results processor
  testResultsProcessor: '<rootDir>/test-results-processor.js'
};
