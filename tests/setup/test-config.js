"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load test environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env.test') });
const config = {
    // Test environment
    testEnvironment: 'node',
    // Root directory
    rootDir: path_1.default.join(__dirname, '../..'),
    // Test patterns
    testMatch: [
        '<rootDir>/tests/**/*.test.{ts,js}',
        '<rootDir>/src/**/__tests__/**/*.{ts,js}',
        '<rootDir>/src/**/*.{test,spec}.{ts,js}'
    ],
    // Setup files
    setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest-setup.ts'
    ],
    // Module resolution
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
        '^@factories/(.*)$': '<rootDir>/tests/factories/$1',
        '^@utils/(.*)$': '<rootDir>/tests/utils/$1'
    },
    // TypeScript support
    preset: 'ts-jest',
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
        '^.+\\.(js|jsx)$': 'babel-jest'
    },
    // File extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    // Coverage configuration
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx,js,jsx}',
        '!src/**/__tests__/**',
        '!src/**/node_modules/**',
        '!src/index.ts'
    ],
    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    // Test timeout
    testTimeout: 10000,
    // Ignore patterns
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/dist/',
        '<rootDir>/build/'
    ],
    // Watch options
    watchPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/coverage/',
        '<rootDir>/dist/'
    ],
    // Globals for TypeScript
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.json'
        }
    },
    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
    // Verbose output
    verbose: true,
    // Error handling
    errorOnDeprecated: true,
    // Max worker processes
    maxWorkers: '50%',
    // Test sequences
    testSequencer: '<rootDir>/tests/setup/test-sequencer.ts'
};
exports.default = config;
// Test environment configuration
exports.testConfig = {
    database: {
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || '5433'),
        database: process.env.TEST_DB_NAME || 'jaqedu_test',
        username: process.env.TEST_DB_USER || 'test_user',
        password: process.env.TEST_DB_PASS || 'test_pass'
    },
    redis: {
        host: process.env.TEST_REDIS_HOST || 'localhost',
        port: parseInt(process.env.TEST_REDIS_PORT || '6380'),
        db: parseInt(process.env.TEST_REDIS_DB || '1')
    },
    api: {
        baseUrl: process.env.TEST_API_URL || 'http://localhost:3001',
        timeout: 5000
    },
    websocket: {
        url: process.env.TEST_WS_URL || 'ws://localhost:3001',
        timeout: 3000
    },
    performance: {
        maxResponseTime: 500,
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        maxCpuUsage: 80
    }
};
//# sourceMappingURL=test-config.js.map