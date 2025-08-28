/** @type {import('jest').Config} */
export default {
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // File patterns
  testMatch: [
    '<rootDir>/tests/automation/**/*.test.{js,ts}',
    '<rootDir>/tests/automation/**/*.spec.{js,ts}'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/automation/setup.ts'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/automation',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'clover'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}',
    '!src/types/**/*',
    '!src/**/__mocks__/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/coverage/automation/html-report',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Workflow Automation Test Results'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/coverage/automation',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }
    ]
  ],
  
  // Verbose output for TDD workflow
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Global test configuration
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json'
    }
  },
  
  // Test result processor
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Snapshot configuration
  updateSnapshot: false,
  
  // Maximum worker configuration for parallel execution
  maxWorkers: '50%',
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache/automation'
};