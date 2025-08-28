module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/tests/example.test.ts'
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.ts']
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/tests/services/**/*.test.{js,ts,tsx}',
        '<rootDir>/tests/api/**/*.test.{js,ts,tsx}',
        '<rootDir>/tests/workflow/**/*.test.{js,ts,tsx}',
        '<rootDir>/tests/config/**/*.test.{js,ts,tsx}',
        '<rootDir>/tests/monitoring/**/*.test.{js,ts,tsx}',
        '<rootDir>/tests/recovery/**/*.test.{js,ts,tsx}'
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons']
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^~/(.*)$': '<rootDir>/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.ts'],
      testTimeout: 30000,
      maxWorkers: 2,
      detectOpenHandles: true,
      transform: {
        '^.+\.tsx?$': ['ts-jest', {
          tsconfig: {
            esModuleInterop: true,
            allowSyntheticDefaultImports: true
          }
        }]
      }
    }
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/automation/performance/memory-test.ts',
    '/tests/automation/performance/database-performance.test.ts',
    '/tests/automation/performance/performance-suite.ts',
    '/tests/automation/performance/load-test.ts',
    '/tests/automation/performance/stress-test.ts',
    '/tests/automation/performance/scalability-test.ts',
    '/tests/automation/performance/cache-test.ts',
    '/tests/automation/performance/api-response-test.ts',
    '/tests/automation/educational/virtual-classroom.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/index.{js,ts}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};