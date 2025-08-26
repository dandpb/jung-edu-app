/**
 * Jest configuration for unit tests
 */

module.exports = {
  displayName: 'Unit Tests',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/**/*.test.js',
    '<rootDir>/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../src/$1',
    '^@tests/(.*)$': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    '../../.claude/helpers/**/*.js',
    '../../src/services/prompts/**/*.ts',
    '../../test-*.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
  testTimeout: 10000,
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};