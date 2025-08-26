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
  // Longer timeout for integration tests
  testTimeout: 30000,
  // Clear the collectCoverageFrom to avoid excluding integration tests
  collectCoverageFrom: undefined,
  // Ensure we have the proper preset for React Scripts
  preset: undefined,
  // Override globals to ensure SKIP_INTEGRATION is not set
  globals: {
    'process.env.SKIP_INTEGRATION': undefined
  },
  // Remove invalid setupFilesAfterEnvTimeout option
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts']
};