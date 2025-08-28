/**
 * Automated Test Suite Configuration
 * Central configuration for all automated tests
 */
export declare const TEST_CONFIG: {
    api: {
        baseUrl: string;
        timeout: number;
        retries: number;
        headers: {
            'Content-Type': string;
            Accept: string;
        };
    };
    users: {
        admin: {
            email: string;
            password: string;
            role: string;
        };
        instructor: {
            email: string;
            password: string;
            role: string;
        };
        student: {
            email: string;
            password: string;
            role: string;
        };
    };
    database: {
        test: {
            host: string;
            port: number;
            database: string;
            username: string;
            password: string;
        };
    };
    redis: {
        test: {
            host: string;
            port: number;
            db: number;
        };
    };
    performance: {
        api: {
            responseTime: {
                p50: number;
                p95: number;
                p99: number;
            };
        };
        workflow: {
            executionTime: {
                simple: number;
                moderate: number;
                complex: number;
            };
            throughput: {
                target: number;
                peak: number;
            };
        };
        memory: {
            maxHeapUsed: number;
            maxRss: number;
        };
    };
    testData: {
        courses: {
            id: string;
            name: string;
            code: string;
        }[];
        quizzes: {
            id: string;
            title: string;
            questions: number;
            passingScore: number;
        }[];
    };
    timeouts: {
        unit: number;
        integration: number;
        e2e: number;
        performance: number;
    };
    retry: {
        times: number;
        backoff: {
            initial: number;
            multiplier: number;
            max: number;
        };
    };
    coverage: {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    };
};
export declare enum TestCategory {
    UNIT = "unit",
    INTEGRATION = "integration",
    E2E = "e2e",
    PERFORMANCE = "performance",
    SECURITY = "security",
    ACCESSIBILITY = "accessibility"
}
export declare enum TestPriority {
    CRITICAL = "critical",// Must pass for deployment
    HIGH = "high",// Should pass for deployment
    MEDIUM = "medium",// Good to pass
    LOW = "low"
}
export declare enum TestEnvironment {
    LOCAL = "local",
    CI = "ci",
    STAGING = "staging",
    PRODUCTION = "production"
}
export declare function getCurrentEnvironment(): TestEnvironment;
export declare function shouldSkipTest(category: TestCategory, priority: TestPriority): boolean;
export { default as TestClient } from './utils/test-client';
export { default as DataFactory } from './factories/data-factory';
export { default as TestHelpers } from './utils/test-helpers';
export { default as MockServer } from './mocks/mock-server';
//# sourceMappingURL=test-suite.config.d.ts.map