const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../tsconfig.json');
const testConfig = require('./setup/test-config.ts').default;

module.exports = {
  ...testConfig,
  
  // Additional Jest configuration
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.{ts,js}',
        '<rootDir>/src/**/__tests__/**/*.{ts,js}',
        '<rootDir>/src/**/*.{test,spec}.{ts,js}'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.{ts,js}'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest-setup.ts',
        '<rootDir>/tests/setup/database-setup.ts'
      ],
      testEnvironment: 'node',
      testTimeout: 30000
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.{ts,js}'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.ts'],
      testEnvironment: 'node',
      testTimeout: 60000,
      maxWorkers: 1 // Run performance tests sequentially
    }
  ],
  
  // Coverage configuration (override from base config)
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx,js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.spec.{ts,tsx,js,jsx}',
    '!src/**/node_modules/**',
    '!src/index.ts',
    '!src/**/*.config.{ts,js}',
    '!src/**/*.setup.{ts,js}'
  ],
  
  // Path mapping from tsconfig
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/'
    }),
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@factories/(.*)$': '<rootDir>/tests/factories/$1',
    '^@utils/(.*)$': '<rootDir>/tests/utils/$1'
  },
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml'
      }
    ],
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false
      }
    ]
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        isolatedModules: true
      }
    ],
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript'
        ]
      }
    ]
  },
  
  // Setup files
  setupFiles: [
    '<rootDir>/tests/setup/test-env.ts'
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',
  
  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Notification configuration
  notify: false,
  notifyMode: 'failure-change',
  
  // Bail configuration
  bail: false,
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Snapshot configuration
  updateSnapshot: false,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Test result processor
  testResultsProcessor: '<rootDir>/tests/utils/test-results-processor.js'
};
