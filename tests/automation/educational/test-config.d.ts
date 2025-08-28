/**
 * Test Configuration and Utilities for Educational Automation Tests
 *
 * Provides shared configuration, mock factories, test helpers,
 * and utilities for all educational automation test suites.
 */
import { jest } from '@jest/globals';
export declare const TEST_CONFIG: {
    timeouts: {
        short: number;
        medium: number;
        long: number;
        extended: number;
    };
    retries: {
        api: number;
        database: number;
        integration: number;
    };
    concurrency: {
        low: number;
        medium: number;
        high: number;
    };
    mockData: {
        studentPrefix: string;
        instructorPrefix: string;
        coursePrefix: string;
        contentPrefix: string;
    };
    environments: {
        test: {
            baseUrl: string;
            apiUrl: string;
            databaseUrl: string;
        };
        integration: {
            baseUrl: string;
            apiUrl: string;
            databaseUrl: string | undefined;
        };
    };
    features: {
        enableRealTimeTests: boolean;
        enableBlockchainTests: boolean;
        enableMLTests: boolean;
        skipSlowTests: boolean;
    };
};
export declare class MockDataFactory {
    static createStudent(overrides?: Partial<any>): {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        enrollmentDate: Date;
        learningProfile: {
            style: string;
            pace: string;
            difficulty: string;
        };
        progress: {
            completedCourses: number;
            totalHours: number;
            averageGrade: number;
        };
    };
    static createInstructor(overrides?: Partial<any>): {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        specialization: string;
        experience: number;
        credentials: string[];
    };
    static createCourse(overrides?: Partial<any>): {
        id: string;
        title: string;
        description: string;
        difficulty: string;
        estimatedDuration: number;
        modules: never[];
        requirements: {
            minimumGrade: number;
            completionTime: number;
        };
    };
    static createContent(type?: string, overrides?: Partial<any>): {
        id: string;
        title: string;
        type: string;
        topic: string;
        difficulty: number;
        duration: number;
        tags: string[];
        metadata: {
            rating: number;
            views: number;
            effectiveness: number;
        };
    };
    static createQuiz(overrides?: Partial<any>): {
        id: string;
        title: string;
        questions: {
            id: string;
            question: string;
            type: string;
            options: string[];
            correctAnswer: string;
            points: number;
        }[];
        timeLimit: number;
        passingScore: number;
    };
    static createAssessment(overrides?: Partial<any>): {
        id: string;
        type: string;
        studentId: string;
        score: number;
        maxScore: number;
        timeSpent: number;
        completedAt: Date;
        answers: {};
    };
    static createSession(overrides?: Partial<any>): {
        id: string;
        title: string;
        instructorId: string;
        scheduledStart: Date;
        scheduledEnd: Date;
        status: string;
        participants: never[];
        features: {
            chat: boolean;
            whiteboard: boolean;
            breakoutRooms: boolean;
            recording: boolean;
        };
    };
    static createRecommendation(overrides?: Partial<any>): {
        contentId: string;
        score: number;
        reason: string;
        category: string;
        personalizationFactors: string[];
        metadata: {
            estimatedRelevance: number;
            timeEstimate: number;
        };
    };
    static createCertificate(overrides?: Partial<any>): {
        id: string;
        recipientId: string;
        courseId: string;
        issuedDate: Date;
        status: string;
        verificationHash: string;
        digitalSignature: string;
        metadata: {
            courseName: string;
            grade: number;
        };
    };
}
export declare class TestUtils {
    static waitFor(condition: () => boolean | Promise<boolean>, timeout?: number): Promise<void>;
    static delay(ms: number): Promise<void>;
    static generateId(prefix?: string): string;
    static mockDate(date: string | Date): jest.SpyInstance;
    static restoreDate(spy: jest.SpyInstance): void;
    static createMockPromise<T>(resolveValue?: T, rejectValue?: any, delay?: number): Promise<T>;
    static expectToBeWithinRange(actual: number, min: number, max: number): void;
    static expectArrayToContainObjectsWithProperty(array: any[], property: string, value?: any): void;
    static expectValidEmail(email: string): void;
    static expectValidUUID(uuid: string): void;
    static expectValidUrl(url: string): void;
}
export declare class PerformanceTestUtils {
    static measureExecutionTime<T>(fn: () => Promise<T> | T): Promise<{
        result: T;
        executionTime: number;
    }>;
    static measureMemoryUsage<T>(fn: () => Promise<T> | T): Promise<{
        result: T;
        memoryDelta: number;
    }>;
    static expectPerformanceWithin(executionTime: number, maxTime: number, description?: string): void;
    static expectMemoryUsageWithin(memoryDelta: number, maxMemory: number, description?: string): void;
}
export declare class DatabaseTestUtils {
    private static cleanupTasks;
    static addCleanupTask(task: () => Promise<void>): void;
    static runCleanup(): Promise<void>;
    static createMockDbConnection(): any;
}
export declare class MockServices {
    static createEmailService(): any;
    static createNotificationService(): any;
    static createAnalyticsService(): any;
    static createAuthService(): any;
    static createStorageService(): any;
}
export declare class TestEnvironment {
    static setup(): Promise<void>;
    static teardown(): Promise<void>;
}
export declare const commonPatterns: {
    testWithRetry(testFn: () => Promise<void>, maxRetries?: number): Promise<void>;
    testConcurrency(testFn: (id: number) => Promise<void>, count?: number): Promise<void>;
    expectValidPagination(result: any): void;
};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeWithinTimeRange(start: Date, end: Date): R;
            toHaveValidStructure(structure: any): R;
            toBeValidEducationalContent(): R;
        }
    }
}
export { TEST_CONFIG as default };
//# sourceMappingURL=test-config.d.ts.map