"use strict";
/**
 * Test Configuration and Utilities for Educational Automation Tests
 *
 * Provides shared configuration, mock factories, test helpers,
 * and utilities for all educational automation test suites.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.commonPatterns = exports.TestEnvironment = exports.MockServices = exports.DatabaseTestUtils = exports.PerformanceTestUtils = exports.TestUtils = exports.MockDataFactory = exports.TEST_CONFIG = void 0;
const globals_1 = require("@jest/globals");
// Global test configuration
exports.TEST_CONFIG = {
    timeouts: {
        short: 5000, // 5 seconds
        medium: 15000, // 15 seconds
        long: 60000, // 1 minute
        extended: 300000 // 5 minutes
    },
    retries: {
        api: 3,
        database: 2,
        integration: 2
    },
    concurrency: {
        low: 2,
        medium: 5,
        high: 10
    },
    mockData: {
        studentPrefix: 'test-student-',
        instructorPrefix: 'test-instructor-',
        coursePrefix: 'test-course-',
        contentPrefix: 'test-content-'
    },
    environments: {
        test: {
            baseUrl: 'http://localhost:3000',
            apiUrl: 'http://localhost:3001/api',
            databaseUrl: 'postgresql://test:test@localhost:5432/jaquedu_test'
        },
        integration: {
            baseUrl: 'https://staging.jaquedu.com',
            apiUrl: 'https://api-staging.jaquedu.com',
            databaseUrl: process.env.INTEGRATION_DB_URL
        }
    },
    features: {
        enableRealTimeTests: process.env.ENABLE_REALTIME_TESTS === 'true',
        enableBlockchainTests: process.env.ENABLE_BLOCKCHAIN_TESTS === 'true',
        enableMLTests: process.env.ENABLE_ML_TESTS === 'true',
        skipSlowTests: process.env.SKIP_SLOW_TESTS === 'true'
    }
};
exports.default = exports.TEST_CONFIG;
// Mock factories for creating test data
class MockDataFactory {
    static createStudent(overrides = {}) {
        return {
            id: `${exports.TEST_CONFIG.mockData.studentPrefix}${Math.random().toString(36).substring(7)}`,
            email: `student${Math.floor(Math.random() * 10000)}@example.com`,
            firstName: 'Test',
            lastName: 'Student',
            enrollmentDate: new Date(),
            learningProfile: {
                style: 'visual',
                pace: 'medium',
                difficulty: 'intermediate'
            },
            progress: {
                completedCourses: 0,
                totalHours: 0,
                averageGrade: 0
            },
            ...overrides
        };
    }
    static createInstructor(overrides = {}) {
        return {
            id: `${exports.TEST_CONFIG.mockData.instructorPrefix}${Math.random().toString(36).substring(7)}`,
            email: `instructor${Math.floor(Math.random() * 1000)}@example.com`,
            firstName: 'Test',
            lastName: 'Instructor',
            specialization: 'Jungian Psychology',
            experience: 5,
            credentials: ['PhD Psychology', 'Certified Analyst'],
            ...overrides
        };
    }
    static createCourse(overrides = {}) {
        return {
            id: `${exports.TEST_CONFIG.mockData.coursePrefix}${Math.random().toString(36).substring(7)}`,
            title: 'Test Course: Jungian Psychology',
            description: 'A comprehensive test course on analytical psychology',
            difficulty: 'intermediate',
            estimatedDuration: 40,
            modules: [],
            requirements: {
                minimumGrade: 70,
                completionTime: 60
            },
            ...overrides
        };
    }
    static createContent(type = 'video', overrides = {}) {
        return {
            id: `${exports.TEST_CONFIG.mockData.contentPrefix}${Math.random().toString(36).substring(7)}`,
            title: `Test ${type} Content`,
            type,
            topic: 'archetypes',
            difficulty: 0.5,
            duration: 30,
            tags: ['test', 'jung', type],
            metadata: {
                rating: 4.0,
                views: 100,
                effectiveness: 0.8
            },
            ...overrides
        };
    }
    static createQuiz(overrides = {}) {
        return {
            id: `quiz-${Math.random().toString(36).substring(7)}`,
            title: 'Test Quiz',
            questions: [
                {
                    id: 'q1',
                    question: 'What is the collective unconscious?',
                    type: 'multiple_choice',
                    options: ['A', 'B', 'C', 'D'],
                    correctAnswer: 'B',
                    points: 5
                }
            ],
            timeLimit: 30,
            passingScore: 70,
            ...overrides
        };
    }
    static createAssessment(overrides = {}) {
        return {
            id: `assessment-${Math.random().toString(36).substring(7)}`,
            type: 'quiz',
            studentId: this.createStudent().id,
            score: 85,
            maxScore: 100,
            timeSpent: 25,
            completedAt: new Date(),
            answers: {},
            ...overrides
        };
    }
    static createSession(overrides = {}) {
        return {
            id: `session-${Math.random().toString(36).substring(7)}`,
            title: 'Test Virtual Session',
            instructorId: this.createInstructor().id,
            scheduledStart: new Date(Date.now() + 86400000), // Tomorrow
            scheduledEnd: new Date(Date.now() + 90000000), // Tomorrow + 1 hour
            status: 'scheduled',
            participants: [],
            features: {
                chat: true,
                whiteboard: true,
                breakoutRooms: true,
                recording: false
            },
            ...overrides
        };
    }
    static createRecommendation(overrides = {}) {
        return {
            contentId: this.createContent().id,
            score: 0.8,
            reason: 'Based on your learning preferences',
            category: 'suggested',
            personalizationFactors: ['learning_style', 'progress'],
            metadata: {
                estimatedRelevance: 0.85,
                timeEstimate: 30
            },
            ...overrides
        };
    }
    static createCertificate(overrides = {}) {
        return {
            id: `cert-${Math.random().toString(36).substring(7)}`,
            recipientId: this.createStudent().id,
            courseId: this.createCourse().id,
            issuedDate: new Date(),
            status: 'issued',
            verificationHash: `hash-${Math.random().toString(36).substring(7)}`,
            digitalSignature: `sig-${Math.random().toString(36).substring(7)}`,
            metadata: {
                courseName: 'Test Course',
                grade: 87
            },
            ...overrides
        };
    }
}
exports.MockDataFactory = MockDataFactory;
// Test utilities and helpers
class TestUtils {
    static async waitFor(condition, timeout = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (await condition())
                return;
            await this.delay(100);
        }
        throw new Error(`Condition not met within ${timeout}ms`);
    }
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    static generateId(prefix = 'test') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
    static mockDate(date) {
        const mockDate = new Date(date);
        return globals_1.jest.spyOn(global, 'Date')
            .mockImplementation(() => mockDate);
    }
    static restoreDate(spy) {
        spy.mockRestore();
    }
    static createMockPromise(resolveValue, rejectValue, delay = 0) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (rejectValue)
                    reject(rejectValue);
                else
                    resolve(resolveValue);
            }, delay);
        });
    }
    static expectToBeWithinRange(actual, min, max) {
        expect(actual).toBeGreaterThanOrEqual(min);
        expect(actual).toBeLessThanOrEqual(max);
    }
    static expectArrayToContainObjectsWithProperty(array, property, value) {
        expect(array.every(item => item.hasOwnProperty(property))).toBe(true);
        if (value !== undefined) {
            expect(array.some(item => item[property] === value)).toBe(true);
        }
    }
    static expectValidEmail(email) {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
    static expectValidUUID(uuid) {
        expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    }
    static expectValidUrl(url) {
        expect(url).toMatch(/^https?:\/\/[^\s/$.?#].[^\s]*$/i);
    }
}
exports.TestUtils = TestUtils;
// Performance testing utilities
class PerformanceTestUtils {
    static async measureExecutionTime(fn) {
        const start = performance.now();
        const result = await fn();
        const executionTime = performance.now() - start;
        return { result, executionTime };
    }
    static async measureMemoryUsage(fn) {
        const initialMemory = process.memoryUsage().heapUsed;
        const result = await fn();
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryDelta = finalMemory - initialMemory;
        return { result, memoryDelta };
    }
    static expectPerformanceWithin(executionTime, maxTime, description = 'Operation') {
        expect(executionTime).toBeLessThan(maxTime);
        if (executionTime > maxTime * 0.8) {
            console.warn(`${description} took ${executionTime}ms, approaching limit of ${maxTime}ms`);
        }
    }
    static expectMemoryUsageWithin(memoryDelta, maxMemory, description = 'Operation') {
        expect(memoryDelta).toBeLessThan(maxMemory);
        if (memoryDelta > maxMemory * 0.8) {
            console.warn(`${description} used ${memoryDelta} bytes, approaching limit of ${maxMemory} bytes`);
        }
    }
}
exports.PerformanceTestUtils = PerformanceTestUtils;
// Database testing utilities
class DatabaseTestUtils {
    static addCleanupTask(task) {
        this.cleanupTasks.push(task);
    }
    static async runCleanup() {
        for (const task of this.cleanupTasks.reverse()) {
            try {
                await task();
            }
            catch (error) {
                console.warn('Cleanup task failed:', error);
            }
        }
        this.cleanupTasks = [];
    }
    static createMockDbConnection() {
        return {
            query: globals_1.jest.fn(),
            execute: globals_1.jest.fn(),
            transaction: globals_1.jest.fn(),
            close: globals_1.jest.fn()
        };
    }
}
exports.DatabaseTestUtils = DatabaseTestUtils;
DatabaseTestUtils.cleanupTasks = [];
// Mock service implementations
class MockServices {
    static createEmailService() {
        return {
            sendEmail: globals_1.jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
            sendBulkEmail: globals_1.jest.fn().mockResolvedValue({ sent: 0, failed: 0 }),
            scheduleEmail: globals_1.jest.fn().mockResolvedValue({ scheduledId: 'mock-scheduled-id' })
        };
    }
    static createNotificationService() {
        return {
            sendNotification: globals_1.jest.fn().mockResolvedValue(true),
            sendPushNotification: globals_1.jest.fn().mockResolvedValue(true),
            sendSMS: globals_1.jest.fn().mockResolvedValue(true),
            createTemplate: globals_1.jest.fn().mockResolvedValue('template-id')
        };
    }
    static createAnalyticsService() {
        return {
            trackEvent: globals_1.jest.fn().mockResolvedValue(true),
            trackConversion: globals_1.jest.fn().mockResolvedValue(true),
            updateProfile: globals_1.jest.fn().mockResolvedValue(true),
            generateReport: globals_1.jest.fn().mockResolvedValue({ data: 'mock-report' })
        };
    }
    static createAuthService() {
        return {
            authenticateUser: globals_1.jest.fn().mockResolvedValue({ user: MockDataFactory.createStudent() }),
            generateToken: globals_1.jest.fn().mockReturnValue('mock-jwt-token'),
            verifyToken: globals_1.jest.fn().mockResolvedValue({ userId: 'user123' }),
            registerUser: globals_1.jest.fn().mockResolvedValue({ user: MockDataFactory.createStudent() })
        };
    }
    static createStorageService() {
        return {
            uploadFile: globals_1.jest.fn().mockResolvedValue({ url: 'https://storage.example.com/file.pdf' }),
            deleteFile: globals_1.jest.fn().mockResolvedValue(true),
            generateSignedUrl: globals_1.jest.fn().mockResolvedValue('https://signed.url.com'),
            listFiles: globals_1.jest.fn().mockResolvedValue([])
        };
    }
}
exports.MockServices = MockServices;
// Test environment setup
class TestEnvironment {
    static async setup() {
        // Set up test environment variables
        process.env.NODE_ENV = 'test';
        process.env.LOG_LEVEL = 'warn';
        // Initialize test database
        if (exports.TEST_CONFIG.features.enableRealTimeTests) {
            // Setup real-time test infrastructure
            console.log('Setting up real-time test environment...');
        }
        // Setup mock services
        console.log('Test environment initialized');
    }
    static async teardown() {
        // Clean up test data
        await DatabaseTestUtils.runCleanup();
        // Clear all mocks
        globals_1.jest.clearAllMocks();
        globals_1.jest.resetAllMocks();
        globals_1.jest.restoreAllMocks();
        console.log('Test environment cleaned up');
    }
}
exports.TestEnvironment = TestEnvironment;
// Custom Jest matchers
expect.extend({
    toBeWithinTimeRange(received, start, end) {
        const pass = received >= start && received <= end;
        return {
            message: () => `expected ${received} to be within ${start} and ${end}`,
            pass
        };
    },
    toHaveValidStructure(received, expectedStructure) {
        const hasAllKeys = Object.keys(expectedStructure).every(key => key in received);
        return {
            message: () => `expected object to have structure matching ${JSON.stringify(expectedStructure)}`,
            pass: hasAllKeys
        };
    },
    toBeValidEducationalContent(received) {
        const requiredFields = ['id', 'title', 'type', 'difficulty', 'duration'];
        const hasRequiredFields = requiredFields.every(field => field in received);
        const validDifficulty = received.difficulty >= 0 && received.difficulty <= 1;
        const validDuration = received.duration > 0;
        const pass = hasRequiredFields && validDifficulty && validDuration;
        return {
            message: () => `expected object to be valid educational content`,
            pass
        };
    }
});
// Global test setup and teardown
beforeAll(async () => {
    await TestEnvironment.setup();
});
afterAll(async () => {
    await TestEnvironment.teardown();
});
// Export commonly used testing patterns
exports.commonPatterns = {
    async testWithRetry(testFn, maxRetries = 3) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                await testFn();
                return;
            }
            catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await TestUtils.delay(1000 * (i + 1)); // Exponential backoff
                }
            }
        }
        throw lastError;
    },
    async testConcurrency(testFn, count = 5) {
        const promises = Array.from({ length: count }, (_, i) => testFn(i));
        await Promise.all(promises);
    },
    expectValidPagination(result) {
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('pagination');
        expect(result.pagination).toHaveProperty('page');
        expect(result.pagination).toHaveProperty('limit');
        expect(result.pagination).toHaveProperty('total');
        expect(Array.isArray(result.data)).toBe(true);
    }
};
//# sourceMappingURL=test-config.js.map