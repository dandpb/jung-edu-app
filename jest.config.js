module.exports = {
  roots: ['<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/react-app-env.d.ts',
    '!src/__tests__/mocks/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '!<rootDir>/src/**/__tests__/mocks/**'
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
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/components/**/*.tsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/utils/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
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
    '!src/test-*.ts'
  ]
};