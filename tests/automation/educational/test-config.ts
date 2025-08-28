/**
 * Test Configuration and Utilities for Educational Automation Tests
 * 
 * Provides shared configuration, mock factories, test helpers,
 * and utilities for all educational automation test suites.
 */

import { jest } from '@jest/globals';

// Global test configuration
export const TEST_CONFIG = {
  timeouts: {
    short: 5000,      // 5 seconds
    medium: 15000,    // 15 seconds
    long: 60000,      // 1 minute
    extended: 300000  // 5 minutes
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

// Mock factories for creating test data
export class MockDataFactory {
  static createStudent(overrides: Partial<any> = {}) {
    return {
      id: `${TEST_CONFIG.mockData.studentPrefix}${Math.random().toString(36).substring(7)}`,
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

  static createInstructor(overrides: Partial<any> = {}) {
    return {
      id: `${TEST_CONFIG.mockData.instructorPrefix}${Math.random().toString(36).substring(7)}`,
      email: `instructor${Math.floor(Math.random() * 1000)}@example.com`,
      firstName: 'Test',
      lastName: 'Instructor',
      specialization: 'Jungian Psychology',
      experience: 5,
      credentials: ['PhD Psychology', 'Certified Analyst'],
      ...overrides
    };
  }

  static createCourse(overrides: Partial<any> = {}) {
    return {
      id: `${TEST_CONFIG.mockData.coursePrefix}${Math.random().toString(36).substring(7)}`,
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

  static createContent(type: string = 'video', overrides: Partial<any> = {}) {
    return {
      id: `${TEST_CONFIG.mockData.contentPrefix}${Math.random().toString(36).substring(7)}`,
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

  static createQuiz(overrides: Partial<any> = {}) {
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

  static createAssessment(overrides: Partial<any> = {}) {
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

  static createSession(overrides: Partial<any> = {}) {
    return {
      id: `session-${Math.random().toString(36).substring(7)}`,
      title: 'Test Virtual Session',
      instructorId: this.createInstructor().id,
      scheduledStart: new Date(Date.now() + 86400000), // Tomorrow
      scheduledEnd: new Date(Date.now() + 90000000),   // Tomorrow + 1 hour
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

  static createRecommendation(overrides: Partial<any> = {}) {
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

  static createCertificate(overrides: Partial<any> = {}) {
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

// Test utilities and helpers
export class TestUtils {
  static async waitFor(condition: () => boolean | Promise<boolean>, timeout = 5000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return;
      await this.delay(100);
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateId(prefix = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  static mockDate(date: string | Date): jest.SpyInstance {
    const mockDate = new Date(date);
    return jest.spyOn(global, 'Date')
      .mockImplementation(() => mockDate as any);
  }

  static restoreDate(spy: jest.SpyInstance): void {
    spy.mockRestore();
  }

  static createMockPromise<T>(
    resolveValue?: T, 
    rejectValue?: any, 
    delay = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (rejectValue) reject(rejectValue);
        else resolve(resolveValue as T);
      }, delay);
    });
  }

  static expectToBeWithinRange(actual: number, min: number, max: number): void {
    expect(actual).toBeGreaterThanOrEqual(min);
    expect(actual).toBeLessThanOrEqual(max);
  }

  static expectArrayToContainObjectsWithProperty(
    array: any[], 
    property: string, 
    value?: any
  ): void {
    expect(array.every(item => item.hasOwnProperty(property))).toBe(true);
    if (value !== undefined) {
      expect(array.some(item => item[property] === value)).toBe(true);
    }
  }

  static expectValidEmail(email: string): void {
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }

  static expectValidUUID(uuid: string): void {
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  }

  static expectValidUrl(url: string): void {
    expect(url).toMatch(/^https?:\/\/[^\s/$.?#].[^\s]*$/i);
  }
}

// Performance testing utilities
export class PerformanceTestUtils {
  static async measureExecutionTime<T>(
    fn: () => Promise<T> | T
  ): Promise<{ result: T; executionTime: number }> {
    const start = performance.now();
    const result = await fn();
    const executionTime = performance.now() - start;
    return { result, executionTime };
  }

  static async measureMemoryUsage<T>(
    fn: () => Promise<T> | T
  ): Promise<{ result: T; memoryDelta: number }> {
    const initialMemory = process.memoryUsage().heapUsed;
    const result = await fn();
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDelta = finalMemory - initialMemory;
    return { result, memoryDelta };
  }

  static expectPerformanceWithin(
    executionTime: number, 
    maxTime: number, 
    description = 'Operation'
  ): void {
    expect(executionTime).toBeLessThan(maxTime);
    if (executionTime > maxTime * 0.8) {
      console.warn(`${description} took ${executionTime}ms, approaching limit of ${maxTime}ms`);
    }
  }

  static expectMemoryUsageWithin(
    memoryDelta: number, 
    maxMemory: number,
    description = 'Operation'
  ): void {
    expect(memoryDelta).toBeLessThan(maxMemory);
    if (memoryDelta > maxMemory * 0.8) {
      console.warn(`${description} used ${memoryDelta} bytes, approaching limit of ${maxMemory} bytes`);
    }
  }
}

// Database testing utilities
export class DatabaseTestUtils {
  private static cleanupTasks: Array<() => Promise<void>> = [];

  static addCleanupTask(task: () => Promise<void>): void {
    this.cleanupTasks.push(task);
  }

  static async runCleanup(): Promise<void> {
    for (const task of this.cleanupTasks.reverse()) {
      try {
        await task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    }
    this.cleanupTasks = [];
  }

  static createMockDbConnection(): any {
    return {
      query: jest.fn(),
      execute: jest.fn(),
      transaction: jest.fn(),
      close: jest.fn()
    };
  }
}

// Mock service implementations
export class MockServices {
  static createEmailService(): any {
    return {
      sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
      sendBulkEmail: jest.fn().mockResolvedValue({ sent: 0, failed: 0 }),
      scheduleEmail: jest.fn().mockResolvedValue({ scheduledId: 'mock-scheduled-id' })
    };
  }

  static createNotificationService(): any {
    return {
      sendNotification: jest.fn().mockResolvedValue(true),
      sendPushNotification: jest.fn().mockResolvedValue(true),
      sendSMS: jest.fn().mockResolvedValue(true),
      createTemplate: jest.fn().mockResolvedValue('template-id')
    };
  }

  static createAnalyticsService(): any {
    return {
      trackEvent: jest.fn().mockResolvedValue(true),
      trackConversion: jest.fn().mockResolvedValue(true),
      updateProfile: jest.fn().mockResolvedValue(true),
      generateReport: jest.fn().mockResolvedValue({ data: 'mock-report' })
    };
  }

  static createAuthService(): any {
    return {
      authenticateUser: jest.fn().mockResolvedValue({ user: MockDataFactory.createStudent() }),
      generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
      verifyToken: jest.fn().mockResolvedValue({ userId: 'user123' }),
      registerUser: jest.fn().mockResolvedValue({ user: MockDataFactory.createStudent() })
    };
  }

  static createStorageService(): any {
    return {
      uploadFile: jest.fn().mockResolvedValue({ url: 'https://storage.example.com/file.pdf' }),
      deleteFile: jest.fn().mockResolvedValue(true),
      generateSignedUrl: jest.fn().mockResolvedValue('https://signed.url.com'),
      listFiles: jest.fn().mockResolvedValue([])
    };
  }
}

// Test environment setup
export class TestEnvironment {
  static async setup(): Promise<void> {
    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'warn';
    
    // Initialize test database
    if (TEST_CONFIG.features.enableRealTimeTests) {
      // Setup real-time test infrastructure
      console.log('Setting up real-time test environment...');
    }
    
    // Setup mock services
    console.log('Test environment initialized');
  }

  static async teardown(): Promise<void> {
    // Clean up test data
    await DatabaseTestUtils.runCleanup();
    
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    
    console.log('Test environment cleaned up');
  }
}

// Custom Jest matchers
expect.extend({
  toBeWithinTimeRange(received: Date, start: Date, end: Date) {
    const pass = received >= start && received <= end;
    return {
      message: () => `expected ${received} to be within ${start} and ${end}`,
      pass
    };
  },

  toHaveValidStructure(received: any, expectedStructure: any) {
    const hasAllKeys = Object.keys(expectedStructure).every(key => 
      key in received
    );
    return {
      message: () => `expected object to have structure matching ${JSON.stringify(expectedStructure)}`,
      pass: hasAllKeys
    };
  },

  toBeValidEducationalContent(received: any) {
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
export const commonPatterns = {
  async testWithRetry(testFn: () => Promise<void>, maxRetries = 3): Promise<void> {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await testFn();
        return;
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await TestUtils.delay(1000 * (i + 1)); // Exponential backoff
        }
      }
    }
    throw lastError;
  },

  async testConcurrency(testFn: (id: number) => Promise<void>, count = 5): Promise<void> {
    const promises = Array.from({ length: count }, (_, i) => testFn(i));
    await Promise.all(promises);
  },

  expectValidPagination(result: any): void {
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
    expect(result.pagination).toHaveProperty('page');
    expect(result.pagination).toHaveProperty('limit');
    expect(result.pagination).toHaveProperty('total');
    expect(Array.isArray(result.data)).toBe(true);
  }
};

// Type declarations for custom matchers
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