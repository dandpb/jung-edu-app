"use strict";
/**
 * Automated Test Suite Configuration
 * Central configuration for all automated tests
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockServer = exports.TestHelpers = exports.DataFactory = exports.TestClient = exports.TestEnvironment = exports.TestPriority = exports.TestCategory = exports.TEST_CONFIG = void 0;
exports.getCurrentEnvironment = getCurrentEnvironment;
exports.shouldSkipTest = shouldSkipTest;
exports.TEST_CONFIG = {
    // API Configuration
    api: {
        baseUrl: process.env.API_URL || 'http://localhost:3000',
        timeout: 30000,
        retries: 3,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    },
    // Test User Accounts
    users: {
        admin: {
            email: 'admin@jaquedu.test',
            password: 'AdminTest123!',
            role: 'admin'
        },
        instructor: {
            email: 'instructor@jaquedu.test',
            password: 'InstructorTest123!',
            role: 'instructor'
        },
        student: {
            email: 'student@jaquedu.test',
            password: 'StudentTest123!',
            role: 'student'
        }
    },
    // Database Configuration
    database: {
        test: {
            host: process.env.TEST_DB_HOST || 'localhost',
            port: parseInt(process.env.TEST_DB_PORT || '5433'),
            database: process.env.TEST_DB_NAME || 'jaquedu_test',
            username: process.env.TEST_DB_USER || 'postgres',
            password: process.env.TEST_DB_PASSWORD || 'password'
        }
    },
    // Redis Configuration
    redis: {
        test: {
            host: process.env.TEST_REDIS_HOST || 'localhost',
            port: parseInt(process.env.TEST_REDIS_PORT || '6380'),
            db: 1 // Use different DB for tests
        }
    },
    // Performance Thresholds
    performance: {
        api: {
            responseTime: {
                p50: 50, // 50ms
                p95: 100, // 100ms
                p99: 200 // 200ms
            }
        },
        workflow: {
            executionTime: {
                simple: 1000, // 1 second
                moderate: 5000, // 5 seconds
                complex: 30000 // 30 seconds
            },
            throughput: {
                target: 100, // workflows/minute
                peak: 1000 // workflows/minute
            }
        },
        memory: {
            maxHeapUsed: 512, // MB
            maxRss: 1024 // MB
        }
    },
    // Test Data
    testData: {
        courses: [
            {
                id: 'test-course-cs101',
                name: 'Introduction to Computer Science',
                code: 'CS101'
            },
            {
                id: 'test-course-math201',
                name: 'Calculus II',
                code: 'MATH201'
            }
        ],
        quizzes: [
            {
                id: 'test-quiz-1',
                title: 'Basic Programming Quiz',
                questions: 10,
                passingScore: 70
            }
        ]
    },
    // Timeouts
    timeouts: {
        unit: 5000,
        integration: 15000,
        e2e: 30000,
        performance: 60000
    },
    // Retry Configuration
    retry: {
        times: 3,
        backoff: {
            initial: 1000,
            multiplier: 2,
            max: 10000
        }
    },
    // Coverage Thresholds
    coverage: {
        branches: 80,
        functions: 80,
        lines: 85,
        statements: 85
    }
};
// Test Categories
var TestCategory;
(function (TestCategory) {
    TestCategory["UNIT"] = "unit";
    TestCategory["INTEGRATION"] = "integration";
    TestCategory["E2E"] = "e2e";
    TestCategory["PERFORMANCE"] = "performance";
    TestCategory["SECURITY"] = "security";
    TestCategory["ACCESSIBILITY"] = "accessibility";
})(TestCategory || (exports.TestCategory = TestCategory = {}));
// Test Priority
var TestPriority;
(function (TestPriority) {
    TestPriority["CRITICAL"] = "critical";
    TestPriority["HIGH"] = "high";
    TestPriority["MEDIUM"] = "medium";
    TestPriority["LOW"] = "low"; // Nice to pass
})(TestPriority || (exports.TestPriority = TestPriority = {}));
// Test Environment
var TestEnvironment;
(function (TestEnvironment) {
    TestEnvironment["LOCAL"] = "local";
    TestEnvironment["CI"] = "ci";
    TestEnvironment["STAGING"] = "staging";
    TestEnvironment["PRODUCTION"] = "production";
})(TestEnvironment || (exports.TestEnvironment = TestEnvironment = {}));
// Helper function to get current environment
function getCurrentEnvironment() {
    if (process.env.CI)
        return TestEnvironment.CI;
    if (process.env.STAGING)
        return TestEnvironment.STAGING;
    if (process.env.PRODUCTION)
        return TestEnvironment.PRODUCTION;
    return TestEnvironment.LOCAL;
}
// Helper function to should skip test
function shouldSkipTest(category, priority) {
    const env = getCurrentEnvironment();
    // In CI, run all critical and high priority tests
    if (env === TestEnvironment.CI) {
        return priority === TestPriority.LOW;
    }
    // In staging, run everything except low priority
    if (env === TestEnvironment.STAGING) {
        return priority === TestPriority.LOW && category === TestCategory.UNIT;
    }
    // In production, only run smoke tests
    if (env === TestEnvironment.PRODUCTION) {
        return priority !== TestPriority.CRITICAL;
    }
    // Local: run everything
    return false;
}
// Export test utilities
var test_client_1 = require("./utils/test-client");
Object.defineProperty(exports, "TestClient", { enumerable: true, get: function () { return __importDefault(test_client_1).default; } });
var data_factory_1 = require("./factories/data-factory");
Object.defineProperty(exports, "DataFactory", { enumerable: true, get: function () { return __importDefault(data_factory_1).default; } });
var test_helpers_1 = require("./utils/test-helpers");
Object.defineProperty(exports, "TestHelpers", { enumerable: true, get: function () { return __importDefault(test_helpers_1).default; } });
var mock_server_1 = require("./mocks/mock-server");
Object.defineProperty(exports, "MockServer", { enumerable: true, get: function () { return __importDefault(mock_server_1).default; } });
//# sourceMappingURL=test-suite.config.js.map