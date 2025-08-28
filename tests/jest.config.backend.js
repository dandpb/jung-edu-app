module.exports = {
  preset: null,
  rootDir: '../',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/backend/**/*.test.{js,jsx,ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/automation/educational/',
    '/tests/automation/performance/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.ts'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'] }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|axios))'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@backend/(.*)$': '<rootDir>/backend/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  collectCoverageFrom: [
    'backend/**/*.{js,jsx,ts,tsx}',
    'tests/api/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  testTimeout: 30000
};