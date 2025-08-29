/**
 * Jest Configuration for Authentication Unit Tests
 * Optimized for maximum coverage and comprehensive testing
 */

const path = require('path');

module.exports = {
  displayName: 'Authentication Tests',
  testMatch: [
    '<rootDir>/tests/unit/contexts/AuthContext.test.tsx',
    '<rootDir>/tests/unit/services/auth/*.test.ts',
    '<rootDir>/tests/unit/auth/*.test.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/unit/auth/test-setup.js'
  ],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ]
    }]
  },
  collectCoverage: true,
  coverageDirectory: '<rootDir>/tests/unit/auth/coverage',
  collectCoverageFrom: [
    'src/contexts/AuthContext.tsx',
    'src/services/auth/**/*.ts',
    'src/types/auth.ts',
    '!src/services/auth/__tests__/**',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/contexts/AuthContext.tsx': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    'src/services/auth/authService.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    'src/services/auth/jwt.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/services/auth/crypto.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/services/auth/sessionManager.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  verbose: true,
  testTimeout: 10000,
  maxWorkers: '50%',
  // Cache configuration
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-auth',
  // Performance optimizations
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  // Error handling
  errorOnDeprecated: true,
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/tests/unit/auth/coverage/html-report',
        filename: 'auth-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Authentication Test Report',
        logoImgPath: undefined,
        inlineSource: false
      }
    ]
  ]
};