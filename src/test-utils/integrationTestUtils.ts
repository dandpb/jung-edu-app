/**
 * Integration Test Utilities
 * Optimized utilities for fixing common integration test issues
 *
 * Features:
 * - Fast mock API responses
 * - Efficient async handling
 * - Proper cleanup patterns
 * - Database/localStorage mocking
 * - Error handling and recovery
 */

/**
 * Fast mock promise resolution for tests
 */
export const fastResolve = <T>(value?: T): Promise<T> => Promise.resolve(value as T);

/**
 * Fast mock promise rejection for tests
 */
export const fastReject = (error: string | Error): Promise<never> =>
  Promise.reject(typeof error === 'string' ? new Error(error) : error);

/**
 * Optimized timeout for integration tests
 */
export const INTEGRATION_TEST_TIMEOUT = 10000;

/**
 * Fast API Mock Factory
 * Creates optimized mocks for external API calls
 */
export class FastAPIMockFactory {
  static createYouTubeServiceMock() {
    return {
      searchVideos: jest.fn().mockImplementation(async (query: string, options: any = {}) => {
        await fastResolve();
        return [
          {
            videoId: `mock-video-${Date.now()}`,
            title: `Mock Video for ${query}`,
            description: `Mock description for ${query}`,
            duration: 'PT10M30S',
            channelTitle: 'Mock Channel',
            publishedAt: new Date().toISOString(),
            viewCount: '1000',
            likeCount: '100',
            url: `https://youtube.com/watch?v=mock-video-${Date.now()}`
          }
        ];
      }),

      getVideoDetails: jest.fn().mockImplementation(async (videoId: string) => {
        await fastResolve();
        return {
          videoId,
          title: `Mock Video ${videoId}`,
          description: 'Mock description',
          duration: 'PT10M30S',
          publishedAt: new Date().toISOString(),
          statistics: {
            viewCount: '1000',
            likeCount: '100',
            commentCount: '10'
          }
        };
      })
    };
  }

  static createLLMProviderMock() {
    return {
      generateCompletion: jest.fn().mockImplementation(async (prompt: string, options: any = {}) => {
        await fastResolve();
        return `Mock completion for: ${prompt.substring(0, 50)}...`;
      }),

      generateStructuredOutput: jest.fn().mockImplementation(async (prompt: string, schema: any, options: any = {}) => {
        await fastResolve();
        return {
          mockStructured: true,
          prompt: prompt.substring(0, 30),
          timestamp: Date.now()
        };
      }),

      generateQuiz: jest.fn().mockImplementation(async (content: string, options: any = {}) => {
        await fastResolve();
        return {
          id: `mock-quiz-${Date.now()}`,
          title: 'Mock Quiz',
          questions: [
            {
              id: 'q1',
              type: 'multiple-choice',
              question: 'Mock question?',
              options: [
                { id: 'a', text: 'Option A', isCorrect: false },
                { id: 'b', text: 'Option B', isCorrect: true },
                { id: 'c', text: 'Option C', isCorrect: false }
              ],
              correctAnswer: 1
            }
          ]
        };
      })
    };
  }

  static createVideoEnricherMock() {
    return {
      enrichVideo: jest.fn().mockImplementation(async (video: any) => {
        await fastResolve();
        return {
          ...video,
          id: `enriched-${video.videoId || video.id}`,
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate',
            relatedConcepts: ['mock', 'concept'],
            estimatedDuration: 600
          }
        };
      }),

      enrichMultipleVideos: jest.fn().mockImplementation(async (videos: any[]) => {
        await fastResolve();
        return videos.map(video => ({
          ...video,
          id: `enriched-${video.videoId || video.id}`,
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate',
            relatedConcepts: ['mock', 'concept']
          }
        }));
      })
    };
  }
}

/**
 * Database/Storage Mock Manager
 * Provides consistent mocking for database and localStorage
 */
export class StorageMockManager {
  private static originalLocalStorage: any;
  private static originalSessionStorage: any;

  static setup() {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn((key: string) => null),
      setItem: jest.fn((key: string, value: string) => {}),
      removeItem: jest.fn((key: string) => {}),
      clear: jest.fn(() => {}),
      key: jest.fn((index: number) => null),
      length: 0
    };

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: jest.fn((key: string) => null),
      setItem: jest.fn((key: string, value: string) => {}),
      removeItem: jest.fn((key: string) => {}),
      clear: jest.fn(() => {}),
      key: jest.fn((index: number) => null),
      length: 0
    };

    if (typeof Storage !== 'undefined') {
      this.originalLocalStorage = global.localStorage;
      this.originalSessionStorage = global.sessionStorage;
    }

    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    Object.defineProperty(global, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true
    });

    return { localStorageMock, sessionStorageMock };
  }

  static cleanup() {
    if (this.originalLocalStorage) {
      Object.defineProperty(global, 'localStorage', {
        value: this.originalLocalStorage,
        writable: true
      });
    }

    if (this.originalSessionStorage) {
      Object.defineProperty(global, 'sessionStorage', {
        value: this.originalSessionStorage,
        writable: true
      });
    }
  }

  static reset() {
    if (global.localStorage) {
      (global.localStorage.clear as jest.Mock).mockClear();
      (global.localStorage.getItem as jest.Mock).mockClear();
      (global.localStorage.setItem as jest.Mock).mockClear();
      (global.localStorage.removeItem as jest.Mock).mockClear();
    }

    if (global.sessionStorage) {
      (global.sessionStorage.clear as jest.Mock).mockClear();
      (global.sessionStorage.getItem as jest.Mock).mockClear();
      (global.sessionStorage.setItem as jest.Mock).mockClear();
      (global.sessionStorage.removeItem as jest.Mock).mockClear();
    }
  }
}

/**
 * Enhanced Error Handler for Integration Tests
 * Provides better error handling and recovery patterns
 */
export class IntegrationErrorHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 100
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Fast delay for tests
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10)));
      }
    }

    throw lastError!;
  }

  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 5000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  static createMockError(message: string, code?: string): Error {
    const error = new Error(message);
    if (code) {
      (error as any).code = code;
    }
    return error;
  }
}

/**
 * Test Data Builder for consistent test data
 */
export class TestDataBuilder {
  static createModuleConfig(overrides: any = {}) {
    return {
      topic: 'Test Topic',
      difficulty: 'intermediate',
      targetAudience: 'students',
      includeVideos: true,
      includeQuiz: true,
      includeBibliography: true,
      quizQuestions: 5,
      maxVideos: 3,
      ...overrides
    };
  }

  static createModule(overrides: any = {}) {
    return {
      id: `test-module-${Date.now()}`,
      title: 'Test Module',
      description: 'A test module for integration testing',
      content: 'Mock module content',
      metadata: {
        difficulty: 'intermediate',
        targetAudience: 'students',
        estimatedDuration: 60,
        language: 'en',
        tags: ['test', 'integration'],
        createdAt: new Date().toISOString(),
        ...overrides.metadata
      },
      ...overrides
    };
  }

  static createQuiz(overrides: any = {}) {
    return {
      id: `test-quiz-${Date.now()}`,
      title: 'Test Quiz',
      description: 'A test quiz for integration testing',
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'What is this test for?',
          options: [
            { id: 'a', text: 'Unit testing', isCorrect: false },
            { id: 'b', text: 'Integration testing', isCorrect: true },
            { id: 'c', text: 'E2E testing', isCorrect: false }
          ],
          correctAnswer: 1
        }
      ],
      metadata: {
        difficulty: 'intermediate',
        estimatedTime: 5,
        passingScore: 70
      },
      ...overrides
    };
  }

  static createVideo(overrides: any = {}) {
    return {
      id: `test-video-${Date.now()}`,
      videoId: `mock-video-${Date.now()}`,
      title: 'Test Video',
      description: 'A test video for integration testing',
      url: 'https://youtube.com/watch?v=test',
      duration: 'PT10M30S',
      channelTitle: 'Test Channel',
      publishedAt: new Date().toISOString(),
      viewCount: '1000',
      likeCount: '100',
      metadata: {
        educationalValue: 0.8,
        relevanceScore: 0.9,
        difficulty: 'intermediate'
      },
      ...overrides
    };
  }
}

/**
 * Performance Monitor for Integration Tests
 */
export class IntegrationPerformanceMonitor {
  private static metrics: Map<string, number> = new Map();

  static startTimer(name: string): void {
    this.metrics.set(name, performance.now());
  }

  static endTimer(name: string): number {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`);
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);
    return duration;
  }

  static async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await operation();
      const duration = this.endTimer(name);
      console.log(`🔍 ${name}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  static measureSync<T>(name: string, operation: () => T): T {
    this.startTimer(name);
    try {
      const result = operation();
      const duration = this.endTimer(name);
      console.log(`🔍 ${name}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Integration Test Setup Helper
 */
export class IntegrationTestSetup {
  static async setupOptimizedTest() {
    // Clear all timers
    jest.clearAllTimers();
    jest.clearAllMocks();

    // Setup storage mocks
    const storageMocks = StorageMockManager.setup();

    // Setup fast timers
    jest.useFakeTimers('modern');

    return {
      storageMocks,
      cleanup: () => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        StorageMockManager.reset();
      }
    };
  }

  static async teardownTest() {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    StorageMockManager.cleanup();
    IntegrationPerformanceMonitor.clearMetrics();
  }
}

/**
 * Optimized test wrapper for integration tests
 */
export function optimizedIntegrationTest(
  name: string,
  testFn: () => Promise<void>,
  timeout: number = INTEGRATION_TEST_TIMEOUT
) {
  return test(name, async () => {
    const setup = await IntegrationTestSetup.setupOptimizedTest();

    try {
      await testFn(); // Run test function directly without performance monitoring
    } finally {
      setup.cleanup();
    }
  }, timeout);
}

/**
 * Batch test executor for parallel integration tests
 */
export class BatchTestExecutor {
  static async runParallel<T>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 3
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }

    return results;
  }

  static async runSequential<T>(
    operations: Array<() => Promise<T>>
  ): Promise<T[]> {
    const results: T[] = [];

    for (const operation of operations) {
      results.push(await operation());
    }

    return results;
  }
}

// Constants are already exported individually above