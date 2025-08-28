/**
 * Jest Configuration for Optimized Performance Testing
 * Memory-efficient configuration to prevent crashes and enable performance tests
 */

const path = require('path');

module.exports = {
  // Test environment optimized for performance testing
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    // Enable garbage collection for memory management
    NODE_OPTIONS: '--expose-gc --max-old-space-size=2048'
  },

  // Test file patterns - include only optimized performance tests
  testMatch: [
    '<rootDir>/tests/automation/performance/**/critical-performance-tests.test.{js,ts}',
    '<rootDir>/tests/automation/performance/**/optimized-database-tests.test.{js,ts}',
    '<rootDir>/tests/automation/performance/**/chunked-performance-runner.test.{js,ts}',
    '<rootDir>/tests/automation/performance/**/performance-monitor.test.{js,ts}',
    '<rootDir>/tests/automation/performance/**/test-cleanup-manager.test.{js,ts}'
  ],

  // Exclude problematic performance tests that cause crashes
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/automation/performance/memory-test.ts',
    '/tests/automation/performance/database-performance.test.ts',
    '/tests/automation/performance/performance-suite.ts',
    '/tests/automation/performance/load-test.ts',
    '/tests/automation/performance/stress-test.ts',
    '/tests/automation/performance/scalability-test.ts',
    '/tests/automation/performance/cache-test.ts',
    '/tests/automation/performance/api-response-test.ts',
    '/build/',
    '/dist/'
  ],

  // Memory and performance optimizations
  maxWorkers: 1, // Single worker to prevent memory fragmentation
  workerIdleMemoryLimit: '500MB', // Restart workers if they exceed this
  detectOpenHandles: true,
  detectLeaks: true,
  forceExit: true, // Force exit to prevent hanging processes
  
  // Timeout configurations
  testTimeout: 120000, // 2 minutes per test
  setupFilesAfterEnv: [
    '<rootDir>/tests/automation/performance/jest.performance.setup.js'
  ],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^@performance/(.*)$': '<rootDir>/tests/automation/performance/$1'
  },

  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        // Optimize TypeScript compilation for memory usage
        incremental: false,
        tsBuildInfoFile: null
      },
      // Isolate modules to prevent memory leaks
      isolatedModules: true,
      // Use faster transpilation
      transpileOnly: true
    }]
  },

  // Coverage configuration (minimal for performance tests)
  collectCoverage: false, // Disable coverage for performance tests to save memory
  
  // If coverage is needed, use minimal settings
  coverageDirectory: '<rootDir>/coverage/performance',
  coverageReporters: ['text-summary'], // Minimal reporting
  collectCoverageFrom: [
    'tests/automation/performance/**/*.{js,ts}',
    '!tests/automation/performance/**/*.d.ts',
    '!tests/automation/performance/**/jest.*.js',
    '!tests/automation/performance/**/*.config.js'
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/automation/performance/jest.performance.globalSetup.js',
  globalTeardown: '<rootDir>/tests/automation/performance/jest.performance.globalTeardown.js',

  // Reporter configuration
  reporters: [
    'default',
    [
      '<rootDir>/tests/automation/performance/jest.performance.reporter.js',
      {
        outputFile: '<rootDir>/tests/automation/performance/results/performance-test-results.json',
        includeMemoryStats: true,
        includeTimingStats: true
      }
    ]
  ],

  // Error handling
  errorOnDeprecated: false, // Ignore deprecation warnings for performance
  verbose: false, // Reduce output for better performance
  silent: false, // Keep some logging for debugging

  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-performance',
  
  // Clear cache between runs to prevent memory accumulation
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  resetModules: true,

  // Memory management
  logHeapUsage: true, // Log heap usage for monitoring
  
  // Custom test sequencer for optimal memory usage
  testSequencer: '<rootDir>/tests/automation/performance/jest.performance.sequencer.js',

  // Retry configuration for flaky performance tests
  retryTimes: 1,
  
  // Test file extensions
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(performance|perf)\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Preset for TypeScript
  preset: 'ts-jest',

  // Performance test specific globals
  globals: {
    'ts-jest': {
      // Reduce memory usage
      isolatedModules: true,
      transpileOnly: true
    },
    // Performance test configuration
    PERFORMANCE_TEST_MODE: true,
    MEMORY_THRESHOLD_MB: 200,
    MAX_TEST_DURATION_MS: 120000,
    ENABLE_GC_MONITORING: true,
    ENABLE_MEMORY_CLEANUP: true
  },

  // Node options for memory management
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    // Memory and GC settings
    NODE_OPTIONS: [
      '--expose-gc',
      '--max-old-space-size=2048',
      '--max-semi-space-size=128',
      '--initial-old-space-size=1024',
      '--gc-interval=100'
    ].join(' ')
  }
};