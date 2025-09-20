/**
 * Example Integration Test using Optimized Utilities
 * Demonstrates best practices for integration testing with performance optimizations
 */

import {
  FastAPIMockFactory,
  StorageMockManager,
  IntegrationErrorHandler,
  TestDataBuilder,
  IntegrationPerformanceMonitor,
  optimizedIntegrationTest,
  BatchTestExecutor,
  fastResolve,
  fastReject,
  INTEGRATION_TEST_TIMEOUT
} from '../../test-utils/integrationTestUtils';

// Mock external dependencies
jest.mock('../video/youtubeService');
jest.mock('../llm/providers/openai');
jest.mock('../video/videoEnricher');

// Set optimized timeout
jest.setTimeout(INTEGRATION_TEST_TIMEOUT);

describe('Optimized Integration Test Example', () => {
  let mockServices: any = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Setup optimized mocks
    mockServices = {
      youtubeService: FastAPIMockFactory.createYouTubeServiceMock(),
      llmProvider: FastAPIMockFactory.createLLMProviderMock(),
      videoEnricher: FastAPIMockFactory.createVideoEnricherMock()
    };

    // Setup storage mocks
    StorageMockManager.setup();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    StorageMockManager.cleanup();
    IntegrationPerformanceMonitor.clearMetrics();
  });

  describe('Fast API Integration', () => {
    optimizedIntegrationTest('should handle video search with fast mocks', async () => {
      const query = 'test query';
      const result = await mockServices.youtubeService.searchVideos(query);

      expect(result).toHaveLength(1);
      expect(result[0].title).toContain(query);
      expect(mockServices.youtubeService.searchVideos).toHaveBeenCalledWith(query);
    });

    optimizedIntegrationTest('should handle LLM generation with optimized responses', async () => {
      const prompt = 'Generate content about test topic';
      const result = await mockServices.llmProvider.generateCompletion(prompt);

      expect(result).toContain('Mock completion for:');
      expect(mockServices.llmProvider.generateCompletion).toHaveBeenCalledWith(prompt);
    });

    optimizedIntegrationTest('should enrich videos efficiently', async () => {
      const video = TestDataBuilder.createVideo({ title: 'Test Video' });
      const enriched = await mockServices.videoEnricher.enrichVideo(video);

      expect(enriched.metadata).toBeDefined();
      expect(enriched.metadata.educationalValue).toBe(0.8);
      expect(enriched.id).toContain('enriched-');
    });
  });

  describe('Error Handling and Recovery', () => {
    optimizedIntegrationTest('should handle API failures with retry', async () => {
      // Mock failure then success
      const failThenSucceed = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('Success');

      const result = await IntegrationErrorHandler.withRetry(failThenSucceed, 3, 10);
      expect(result).toBe('Success');
      expect(failThenSucceed).toHaveBeenCalledTimes(2);
    });

    optimizedIntegrationTest('should timeout gracefully', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 10000));

      await expect(
        IntegrationErrorHandler.withTimeout(slowOperation, 100)
      ).rejects.toThrow('Operation timed out after 100ms');
    });

    optimizedIntegrationTest('should handle storage errors gracefully', async () => {
      // Mock localStorage failure
      const localStorage = global.localStorage as any;
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        localStorage.setItem('test', 'value');
      }).toThrow('Storage quota exceeded');

      // Verify mock was called
      expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value');
    });
  });

  describe('Batch Processing', () => {
    optimizedIntegrationTest('should process operations in parallel batches', async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        () => fastResolve(`result-${i}`)
      );

      const results = await BatchTestExecutor.runParallel(operations, 3);

      expect(results).toHaveLength(10);
      expect(results[0]).toBe('result-0');
      expect(results[9]).toBe('result-9');
    });

    optimizedIntegrationTest('should process operations sequentially when needed', async () => {
      let counter = 0;
      const operations = Array.from({ length: 5 }, () =>
        async () => {
          counter++;
          return `result-${counter}`;
        }
      );

      const results = await BatchTestExecutor.runSequential(operations);

      expect(results).toEqual(['result-1', 'result-2', 'result-3', 'result-4', 'result-5']);
    });
  });

  describe('Performance Monitoring', () => {
    optimizedIntegrationTest('should measure async operation performance', async () => {
      const result = await IntegrationPerformanceMonitor.measureAsync(
        'test-operation',
        async () => {
          await fastResolve();
          return 'completed';
        }
      );

      expect(result).toBe('completed');
    });

    optimizedIntegrationTest('should measure sync operation performance', async () => {
      const result = IntegrationPerformanceMonitor.measureSync(
        'sync-operation',
        () => {
          return 'sync-completed';
        }
      );

      expect(result).toBe('sync-completed');
    });
  });

  describe('Data Builder Integration', () => {
    optimizedIntegrationTest('should create consistent test data', async () => {
      const module = TestDataBuilder.createModule({
        title: 'Custom Module',
        metadata: { difficulty: 'advanced' }
      });

      expect(module.title).toBe('Custom Module');
      expect(module.metadata.difficulty).toBe('advanced');
      expect(module.id).toContain('test-module-');
    });

    optimizedIntegrationTest('should create quiz data with proper structure', async () => {
      const quiz = TestDataBuilder.createQuiz({
        title: 'Custom Quiz'
      });

      expect(quiz.title).toBe('Custom Quiz');
      expect(quiz.questions).toHaveLength(1);
      expect(quiz.questions[0].type).toBe('multiple-choice');
    });

    optimizedIntegrationTest('should create video data with metadata', async () => {
      const video = TestDataBuilder.createVideo({
        title: 'Educational Video'
      });

      expect(video.title).toBe('Educational Video');
      expect(video.metadata.educationalValue).toBe(0.8);
      expect(video.url).toBe('https://youtube.com/watch?v=test');
    });
  });

  describe('Complex Integration Workflows', () => {
    optimizedIntegrationTest('should handle end-to-end module generation workflow', async () => {
      const config = TestDataBuilder.createModuleConfig({
        topic: 'Jungian Psychology',
        difficulty: 'intermediate'
      });

      // Simulate workflow steps
      const videos = await mockServices.youtubeService.searchVideos(config.topic);
      const enrichedVideos = await mockServices.videoEnricher.enrichMultipleVideos(videos);
      const quiz = await mockServices.llmProvider.generateQuiz('module content');
      const content = await mockServices.llmProvider.generateCompletion(`Create content about ${config.topic}`);

      const result = {
        module: TestDataBuilder.createModule({
          title: `Module: ${config.topic}`,
          content
        }),
        videos: enrichedVideos,
        quiz,
        metadata: {
          generatedAt: new Date(),
          topic: config.topic,
          difficulty: config.difficulty,
          componentsIncluded: ['module', 'videos', 'quiz']
        }
      };

      expect(result.module.title).toContain('Jungian Psychology');
      expect(result.videos).toHaveLength(1);
      expect(result.quiz.questions).toHaveLength(1);
      expect(result.metadata.componentsIncluded).toContain('module');
    });

    optimizedIntegrationTest('should handle workflow with error recovery', async () => {
      // Mock partial failure
      mockServices.youtubeService.searchVideos.mockRejectedValueOnce(
        new Error('API rate limit exceeded')
      );

      const result = await IntegrationErrorHandler.withRetry(async () => {
        const videos = await mockServices.youtubeService.searchVideos('test topic');
        return videos;
      }, 3, 10);

      expect(result).toHaveLength(1);
      expect(mockServices.youtubeService.searchVideos).toHaveBeenCalledTimes(2);
    });
  });

  describe('Storage Integration', () => {
    optimizedIntegrationTest('should handle localStorage operations', async () => {
      const localStorage = global.localStorage as any;

      localStorage.setItem('test-key', 'test-value');
      const value = localStorage.getItem('test-key');

      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
      expect(localStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    optimizedIntegrationTest('should handle sessionStorage operations', async () => {
      const sessionStorage = global.sessionStorage as any;

      sessionStorage.setItem('session-key', 'session-value');
      sessionStorage.removeItem('session-key');

      expect(sessionStorage.setItem).toHaveBeenCalledWith('session-key', 'session-value');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('session-key');
    });
  });
});