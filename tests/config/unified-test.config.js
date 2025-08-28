"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.environments = exports.playwrightConfig = exports.jestConfig = exports.testConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../', envFile) });
// Environment-specific configurations
const environments = {
    local: {
        database: {
            host: process.env.TEST_DB_HOST || 'localhost',
            port: parseInt(process.env.TEST_DB_PORT || '5433'),
            database: process.env.TEST_DB_NAME || 'jaqedu_test',
            username: process.env.TEST_DB_USER || 'test_user',
            password: process.env.TEST_DB_PASS || 'test_pass',
            ssl: false
        },
        redis: {
            host: process.env.TEST_REDIS_HOST || 'localhost',
            port: parseInt(process.env.TEST_REDIS_PORT || '6380'),
            db: parseInt(process.env.TEST_REDIS_DB || '1')
        },
        api: {
            baseUrl: process.env.TEST_API_URL || 'http://localhost:3001',
            timeout: 10000,
            retries: 2
        },
        websocket: {
            url: process.env.TEST_WS_URL || 'ws://localhost:3001',
            timeout: 5000
        },
        monitoring: {
            enabled: false,
            metricsPort: 9090
        },
        security: {
            testApiKey: process.env.TEST_API_KEY || 'test-api-key',
            adminToken: process.env.TEST_ADMIN_TOKEN || 'test-admin-token'
        },
        performance: {
            maxResponseTime: 1000,
            maxMemoryUsage: 100 * 1024 * 1024, // 100MB
            maxCpuUsage: 80,
            loadTestConcurrency: 10
        },
        external: {
            openai: {
                apiKey: process.env.TEST_OPENAI_API_KEY || 'test-openai-key',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-3.5-turbo'
            },
            supabase: {
                url: process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
                anonKey: process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key',
                serviceKey: process.env.TEST_SUPABASE_SERVICE_KEY || 'test-service-key'
            },
            youtube: {
                apiKey: process.env.TEST_YOUTUBE_API_KEY || 'test-youtube-key'
            }
        }
    },
    ci: {
        database: {
            host: 'localhost',
            port: 5432,
            database: 'jaqedu_test_ci',
            username: 'postgres',
            password: 'postgres',
            ssl: false
        },
        redis: {
            host: 'localhost',
            port: 6379,
            db: 1
        },
        api: {
            baseUrl: 'http://localhost:3001',
            timeout: 30000,
            retries: 3
        },
        websocket: {
            url: 'ws://localhost:3001',
            timeout: 10000
        },
        monitoring: {
            enabled: true,
            metricsPort: 9090
        },
        security: {
            testApiKey: process.env.CI_TEST_API_KEY || 'ci-test-api-key',
            adminToken: process.env.CI_TEST_ADMIN_TOKEN || 'ci-test-admin-token'
        },
        performance: {
            maxResponseTime: 2000,
            maxMemoryUsage: 200 * 1024 * 1024, // 200MB
            maxCpuUsage: 90,
            loadTestConcurrency: 20
        },
        external: {
            openai: {
                apiKey: process.env.CI_OPENAI_API_KEY || 'mock-openai-key',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-3.5-turbo'
            },
            supabase: {
                url: process.env.CI_SUPABASE_URL || 'http://localhost:54321',
                anonKey: process.env.CI_SUPABASE_ANON_KEY || 'ci-anon-key',
                serviceKey: process.env.CI_SUPABASE_SERVICE_KEY || 'ci-service-key'
            },
            youtube: {
                apiKey: process.env.CI_YOUTUBE_API_KEY || 'mock-youtube-key'
            }
        }
    },
    staging: {
        database: {
            host: process.env.STAGING_DB_HOST || 'staging-db',
            port: parseInt(process.env.STAGING_DB_PORT || '5432'),
            database: process.env.STAGING_DB_NAME || 'jaqedu_staging',
            username: process.env.STAGING_DB_USER || 'staging_user',
            password: process.env.STAGING_DB_PASS || 'staging_pass',
            ssl: true
        },
        redis: {
            host: process.env.STAGING_REDIS_HOST || 'staging-redis',
            port: parseInt(process.env.STAGING_REDIS_PORT || '6379'),
            db: 0,
            password: process.env.STAGING_REDIS_PASS
        },
        api: {
            baseUrl: process.env.STAGING_API_URL || 'https://staging-api.jaqedu.com',
            timeout: 15000,
            retries: 3
        },
        websocket: {
            url: process.env.STAGING_WS_URL || 'wss://staging-api.jaqedu.com',
            timeout: 10000
        },
        monitoring: {
            enabled: true,
            metricsPort: 9090
        },
        security: {
            testApiKey: process.env.STAGING_TEST_API_KEY,
            adminToken: process.env.STAGING_TEST_ADMIN_TOKEN
        },
        performance: {
            maxResponseTime: 1500,
            maxMemoryUsage: 256 * 1024 * 1024, // 256MB
            maxCpuUsage: 85,
            loadTestConcurrency: 50
        },
        external: {
            openai: {
                apiKey: process.env.STAGING_OPENAI_API_KEY,
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-3.5-turbo'
            },
            supabase: {
                url: process.env.STAGING_SUPABASE_URL,
                anonKey: process.env.STAGING_SUPABASE_ANON_KEY,
                serviceKey: process.env.STAGING_SUPABASE_SERVICE_KEY
            },
            youtube: {
                apiKey: process.env.STAGING_YOUTUBE_API_KEY
            }
        }
    }
};
exports.environments = environments;
// Get current environment configuration
const currentEnv = process.env.TEST_ENV || 'local';
exports.testConfig = environments[currentEnv];
// Jest configuration
exports.jestConfig = {
    displayName: `jaqEdu Tests - ${currentEnv}`,
    rootDir: path_1.default.join(__dirname, '../..'),
    testEnvironment: 'jsdom',
    // Test patterns
    testMatch: [
        '<rootDir>/tests/**/*.test.{ts,js}',
        '<rootDir>/src/**/__tests__/**/*.{ts,js}',
        '<rootDir>/jung-edu-app/src/**/__tests__/**/*.{tsx,ts}'
    ],
    // Setup files
    setupFiles: [
        '<rootDir>/tests/setup/jest-setup.ts'
    ],
    setupFilesAfterEnv: [
        '<rootDir>/tests/setup/test-env.ts'
    ],
    // Module resolution
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@app/(.*)$': '<rootDir>/jung-edu-app/src/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
        '^@factories/(.*)$': '<rootDir>/tests/factories/$1',
        '^@utils/(.*)$': '<rootDir>/tests/utils/$1',
        '^@mocks/(.*)$': '<rootDir>/tests/mocks/$1'
    },
    // TypeScript and transformation
    preset: 'ts-jest',
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
        '^.+\\.(js|jsx)$': 'babel-jest'
    },
    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    // Transform ignore patterns
    transformIgnorePatterns: [
        'node_modules/(?!(axios|@supabase|react-markdown|remark-gfm)/)'
    ],
    // Coverage configuration
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json', 'clover'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        'jung-edu-app/src/**/*.{ts,tsx,js,jsx}',
        '!**/*.d.ts',
        '!**/*.stories.{ts,tsx,js,jsx}',
        '!**/__tests__/**',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!src/index.ts',
        '!jung-edu-app/src/index.tsx'
    ],
    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 85,
            lines: 85,
            statements: 85
        },
        './src/services/**/*.ts': {
            branches: 85,
            functions: 90,
            lines: 90,
            statements: 90
        },
        './jung-edu-app/src/components/**/*.tsx': {
            branches: 75,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    // Test execution configuration
    testTimeout: 15000,
    maxWorkers: currentEnv === 'ci' ? 2 : '50%',
    // Error handling
    errorOnDeprecated: true,
    bail: currentEnv === 'ci' ? 1 : false,
    // Test isolation
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true,
    // Globals
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.json',
            isolatedModules: true
        },
        TEST_ENV: currentEnv,
        TEST_CONFIG: exports.testConfig
    },
    // Test sequencing
    testSequencer: '<rootDir>/tests/setup/test-sequencer.ts'
};
// Playwright configuration
exports.playwrightConfig = {
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: currentEnv === 'ci' ? 2 : 0,
    workers: currentEnv === 'ci' ? 2 : undefined,
    // Reporter configuration
    reporter: [
        ['html', { outputFolder: 'tests/e2e/reports/html-report' }],
        ['json', { outputFile: 'tests/e2e/reports/test-results.json' }],
        ['junit', { outputFile: 'tests/e2e/reports/junit-results.xml' }],
        ['line']
    ],
    // Global test configuration
    use: {
        baseURL: exports.testConfig.api.baseUrl,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        actionTimeout: 10000,
        navigationTimeout: 30000
    },
    // Test timeout
    timeout: 30000,
    expect: {
        timeout: 10000,
        threshold: 0.2
    },
    // Output directory
    outputDir: 'tests/e2e/test-results/',
    // Web server configuration
    webServer: currentEnv === 'local' ? {
        command: 'npm start',
        cwd: './jung-edu-app',
        port: 3000,
        reuseExistingServer: true,
        timeout: 120000
    } : undefined
};
exports.default = exports.testConfig;
//# sourceMappingURL=unified-test.config.js.map