const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  testMatch: [
    '<rootDir>/src/**/*integration*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*endToEnd*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*e2e*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/integration/**/*.{js,jsx,ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/mocks/'
  ],
  // Don't collect coverage for integration tests by default
  collectCoverage: false,
  // Optimized timeout for integration tests
  testTimeout: 15000,
  // Clear the collectCoverageFrom to avoid excluding integration tests
  collectCoverageFrom: undefined,
  // Ensure we have the proper preset for React Scripts
  preset: undefined,
  // Override globals to ensure SKIP_INTEGRATION is not set
  globals: {
    'process.env.SKIP_INTEGRATION': undefined
  },
  // Optimized setup for integration tests
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  // Optimized test environment settings
  maxWorkers: 2,
  detectOpenHandles: false,
  forceExit: true,
  // Use base config transforms for compatibility
  transform: baseConfig.transform,
  // Cache configuration for faster runs
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-integration'
};

// Performance optimizations for CI
if (process.env.CI) {
  module.exports.maxWorkers = 1;
  module.exports.testTimeout = 20000;
}

// Additional optimizations for integration tests
if (process.env.NODE_ENV === 'test') {
  // Suppress console output in CI
  if (process.env.CI) {
    module.exports.silent = true;
  }

  // Test environment optimizations
  module.exports.verbose = false;
}