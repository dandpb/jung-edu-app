module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>/backend'],
  setupFiles: ['<rootDir>/src/jest-setup.js'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts', 'jest-extended/all'],
  testTimeout: 60000, // Increased to 60000ms to handle slow tests and cleanup operations
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/backend/**/*.test.{js,jsx,ts,tsx}',
    '!<rootDir>/src/**/__tests__/mocks/**',
    '!<rootDir>/src/**/*integration*.test.{js,jsx,ts,tsx}',
    '!<rootDir>/src/**/*endToEnd*.test.{js,jsx,ts,tsx}',
    '!<rootDir>/src/**/*e2e*.test.{js,jsx,ts,tsx}',
    '!<rootDir>/src/__tests__/integration/**'
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': '<rootDir>/node_modules/react-scripts/config/jest/babelTransform.js',
    '^.+\\.css$': '<rootDir>/node_modules/react-scripts/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)': '<rootDir>/node_modules/react-scripts/config/jest/fileTransform.js'
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\](?!(axios|react-markdown|remark-gfm|unified|remark|mdast|micromark|unist|vfile|bail|is-plain-obj|trough|devlop|hast|property-information|space-separated-tokens|comma-separated-tokens|estree|character-entities|mdast-util-|remark-parse|remark-stringify|rehype|hastscript|parse-entities|decode-named-character-reference|character-reference-invalid|is-decimal|is-hexadecimal|is-alphanumerical|is-alphabetical|trim-lines|longest-streak|markdown-table|zwitch|ccount|escape-string-regexp|markdown-extensions|fault|format)[/\\\\]).+\\.(js|jsx|mjs|cjs|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  modulePaths: [],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy'
  },
  moduleFileExtensions: [
    'web.js',
    'js',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'json',
    'web.jsx',
    'jsx',
    'node'
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  resetMocks: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/mocks/',
    '<rootDir>/src/__tests__/integration/'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/services/**/*.ts': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/components/**/*.tsx': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/utils/**/*.ts': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'clover',
    'json',
    'json-summary',
    'html'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/react-app-env.d.ts',
    '!src/__tests__/mocks/**',
    '!src/**/*.example.ts',
    '!src/**/*.demo.ts',
    '!src/**/example-usage.ts',
    '!src/test-*.ts',
    '!src/**/*integration*.test.{js,jsx,ts,tsx}',
    '!src/**/*endToEnd*.test.{js,jsx,ts,tsx}',
    '!src/**/*e2e*.test.{js,jsx,ts,tsx}',
    '!src/__tests__/integration/**'
  ]
};