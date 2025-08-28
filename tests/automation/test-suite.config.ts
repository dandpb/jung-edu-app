/**
 * Automated Test Suite Configuration
 * Central configuration for all automated tests
 */

export const TEST_CONFIG = {
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
        p50: 50,   // 50ms
        p95: 100,  // 100ms
        p99: 200   // 200ms
      }
    },
    workflow: {
      executionTime: {
        simple: 1000,      // 1 second
        moderate: 5000,    // 5 seconds
        complex: 30000     // 30 seconds
      },
      throughput: {
        target: 100,       // workflows/minute
        peak: 1000        // workflows/minute
      }
    },
    memory: {
      maxHeapUsed: 512,   // MB
      maxRss: 1024        // MB
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
export enum TestCategory {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  ACCESSIBILITY = 'accessibility'
}

// Test Priority
export enum TestPriority {
  CRITICAL = 'critical',   // Must pass for deployment
  HIGH = 'high',          // Should pass for deployment
  MEDIUM = 'medium',      // Good to pass
  LOW = 'low'            // Nice to pass
}

// Test Environment
export enum TestEnvironment {
  LOCAL = 'local',
  CI = 'ci',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

// Helper function to get current environment
export function getCurrentEnvironment(): TestEnvironment {
  if (process.env.CI) return TestEnvironment.CI;
  if (process.env.STAGING) return TestEnvironment.STAGING;
  if (process.env.PRODUCTION) return TestEnvironment.PRODUCTION;
  return TestEnvironment.LOCAL;
}

// Helper function to should skip test
export function shouldSkipTest(category: TestCategory, priority: TestPriority): boolean {
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
export { default as TestClient } from './utils/test-client';
export { default as DataFactory } from './factories/data-factory';
export { default as TestHelpers } from './utils/test-helpers';
export { default as MockServer } from './mocks/mock-server';