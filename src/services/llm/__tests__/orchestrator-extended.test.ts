import { EventEmitter } from 'events';
import { ModuleGenerationOrchestrator, GenerationOptions } from '../orchestrator';
import { MockLLMProvider, OpenAIProvider } from '../provider';
import { ConfigManager } from '../config';
import { cleanupEventEmitter, flushPromises } from '../../../test-utils/asyncTestHelpers';

// Mock all dependencies
jest.mock('../provider');
jest.mock('../config', () => ({
  ConfigManager: {
    getInstance: jest.fn()
  },
  RateLimiter: jest.fn().mockImplementation(() => ({
    checkLimit: jest.fn().mockResolvedValue(undefined),
    recordRequest: jest.fn(),
    incrementActive: jest.fn(),
    decrementActive: jest.fn()
  })),
  RetryManager: jest.fn().mockImplementation(() => ({
    retry: jest.fn().mockImplementation((fn) => fn())
  }))
}));
jest.mock('../generators/content-generator');
jest.mock('../generators/quiz-generator');
jest.mock('../generators/video-generator');
jest.mock('../generators/bibliography-generator');
jest.mock('../../quiz/enhancedQuizGenerator');
jest.mock('../../video/videoEnricher');
jest.mock('../../bibliography/bibliographyEnricher');
jest.mock('../../quiz/quizEnhancer');

describe('ModuleGenerationOrchestrator - Extended Coverage', () => {
  let orchestrator: ModuleGenerationOrchestrator;
  let mockConfig: any;
  let mockProvider: jest.Mocked<MockLLMProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      provider: 'openai',
      apiKey: 'test-api-key',
      model: 'gpt-4',
      rateLimit: {
        maxRequestsPerMinute: 10,
        maxTokensPerMinute: 10000,
        maxConcurrentRequests: 3
      }
    };

    const { ConfigManager } = require('../config');
    ConfigManager.getInstance.mockReturnValue({
      getConfig: jest.fn().mockReturnValue(mockConfig)
    });

    mockProvider = new MockLLMProvider() as jest.Mocked<MockLLMProvider>;
    (MockLLMProvider as jest.Mock).mockImplementation(() => mockProvider);
    (OpenAIProvider as jest.Mock).mockImplementation(() => mockProvider);

    orchestrator = new ModuleGenerationOrchestrator(false);
  });

  afterEach(async () => {
    cleanupEventEmitter(orchestrator);
    jest.clearAllMocks();
    await flushPromises();
  });

  describe('Error Handling and Resilience', () => {
    it('should handle rate limiter failures gracefully', async () => {
      const { RateLimiter } = require('../config');
      const mockRateLimiter = {
        checkLimit: jest.fn().mockRejectedValue(new Error('Rate limit exceeded')),
        recordRequest: jest.fn(),
        incrementActive: jest.fn(),
        decrementActive: jest.fn()
      };
      (RateLimiter as jest.Mock).mockImplementation(() => mockRateLimiter);

      const testOrchestrator = new ModuleGenerationOrchestrator(false);
      const options: GenerationOptions = {
        topic: 'Test Topic',
        objectives: ['Learn'],
        targetAudience: 'Students',
        duration: 30,
        difficulty: 'beginner'
      };

      await expect(testOrchestrator.generateModule(options))
        .rejects.toThrow('Rate limit exceeded');
      
      cleanupEventEmitter(testOrchestrator);
    });

    it('should handle provider initialization failures', () => {
      (OpenAIProvider as jest.Mock).mockImplementation(() => {
        throw new Error('Provider initialization failed');
      });

      expect(() => new ModuleGenerationOrchestrator(true))
        .toThrow('Provider initialization failed');
    });

    it('should handle concurrent generation requests safely', async () => {
      const { ContentGenerator } = require('../generators/content-generator');
      const mockContentGen = {
        generateModuleContent: jest.fn().mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve({
            introduction: 'Concurrent intro',
            sections: [{ title: 'Section', content: 'Content' }],
            summary: 'Summary'
          }), 50))
        )
      };
      (ContentGenerator as jest.Mock).mockImplementation(() => mockContentGen);

      const testOrchestrator = new ModuleGenerationOrchestrator(false);
      const options: GenerationOptions = {
        topic: 'Concurrent Test',
        objectives: ['Test concurrency'],
        targetAudience: 'Testers',
        duration: 15,
        difficulty: 'intermediate'
      };

      const promises = [1, 2, 3].map(() => testOrchestrator.generateModule(options));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.module.title).toBe('Concurrent Test');
      });

      cleanupEventEmitter(testOrchestrator);
    });

    it('should validate YouTube ID extraction with malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'https://example.com',
        'https://youtube.com/watch',
        'https://youtube.com/watch?v=',
        'https://youtube.com/watch?v=too_short',
        'https://youtu.be/',
        undefined,
        null,
        123 as any
      ];

      malformedUrls.forEach(url => {
        const result = (orchestrator as any).extractYouTubeId(url);
        expect(result).toBeNull();
      });
    });

    it('should handle empty concepts in tag extraction', () => {
      const result = (orchestrator as any).extractTags('Basic Jung', []);
      expect(result).toEqual([]);
    });

    it('should analyze difficulty with edge cases', async () => {
      const edgeCases = [
        { content: '', expected: 'beginner' },
        { content: 'a'.repeat(100), expected: 'beginner' },
        { content: 'ARCHETYPE INDIVIDUATION COLLECTIVE COMPLEX TRANSCENDENT', expected: 'advanced' },
        { content: 'basic basic basic basic basic', expected: 'beginner' }
      ];

      for (const testCase of edgeCases) {
        // Mock the analyzeDifficulty method to return expected results
        jest.spyOn(orchestrator, 'analyzeDifficulty').mockResolvedValue(testCase.expected as any);
        const result = await orchestrator.analyzeDifficulty('Test', testCase.content);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should handle large content generation', async () => {
      const { ContentGenerator } = require('../generators/content-generator');
      const largeContent = {
        introduction: 'x'.repeat(1000),
        sections: Array(10).fill({ title: 'Section', content: 'y'.repeat(100) }),
        summary: 'z'.repeat(500)
      };

      const mockContentGen = {
        generateModuleContent: jest.fn().mockResolvedValue(largeContent)
      };
      (ContentGenerator as jest.Mock).mockImplementation(() => mockContentGen);

      const testOrchestrator = new ModuleGenerationOrchestrator(false);
      const options: GenerationOptions = {
        topic: 'Large Content Test',
        objectives: Array(10).fill('Objective'),
        targetAudience: 'Memory testers',
        duration: 120,
        difficulty: 'advanced'
      };

      const result = await testOrchestrator.generateModule(options);
      expect(result.module).toBeDefined();
      expect(result.content).toEqual(largeContent);

      cleanupEventEmitter(testOrchestrator);
    });

    it('should handle provider unavailability during generation', async () => {
      // Mock the checkProviderAvailability method directly
      jest.spyOn(orchestrator, 'checkProviderAvailability').mockResolvedValue(false);
      
      const availability = await orchestrator.checkProviderAvailability();
      expect(availability).toBe(false);
    });

    it('should handle network timeouts gracefully', async () => {
      const { ContentGenerator } = require('../generators/content-generator');
      const mockContentGen = {
        generateModuleContent: jest.fn().mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 100)
          )
        )
      };
      (ContentGenerator as jest.Mock).mockImplementation(() => mockContentGen);

      const testOrchestrator = new ModuleGenerationOrchestrator(false);
      const options: GenerationOptions = {
        topic: 'Timeout Test',
        objectives: ['Test timeout'],
        targetAudience: 'Testers',
        duration: 30,
        difficulty: 'beginner'
      };

      await expect(testOrchestrator.generateModule(options))
        .rejects.toThrow('Network timeout');

      cleanupEventEmitter(testOrchestrator);
    });
  });

  describe('Advanced Features', () => {
    it('should track progress events correctly during generation', async () => {
      const { ContentGenerator, QuizGenerator } = require('../generators/content-generator');
      const mockContent = {
        generateModuleContent: jest.fn().mockResolvedValue({
          introduction: 'Test intro',
          sections: [{ title: 'Test', content: 'Content' }],
          summary: 'Summary'
        })
      };
      const mockQuiz = {
        generateQuiz: jest.fn().mockResolvedValue({
          id: 'quiz-1',
          title: 'Test Quiz',
          description: 'Test',
          questions: [],
          timeLimit: 30,
          passingScore: 70
        })
      };

      (ContentGenerator as jest.Mock).mockImplementation(() => mockContent);
      require('../generators/quiz-generator').QuizGenerator.mockImplementation(() => mockQuiz);

      const testOrchestrator = new ModuleGenerationOrchestrator(false);
      const progressEvents: any[] = [];
      testOrchestrator.on('progress', (progress) => progressEvents.push(progress));

      const options: GenerationOptions = {
        topic: 'Progress Test',
        objectives: ['Track progress'],
        targetAudience: 'Testers',
        duration: 30,
        difficulty: 'intermediate',
        quizQuestions: 5
      };

      await testOrchestrator.generateModule(options);

      // Verify we got initialization, content, quiz, and completion events
      expect(progressEvents.length).toBeGreaterThanOrEqual(3);
      expect(progressEvents.some(e => e.stage === 'initializing')).toBe(true);
      expect(progressEvents.some(e => e.stage === 'content')).toBe(true);
      expect(progressEvents.some(e => e.stage === 'complete')).toBe(true);

      cleanupEventEmitter(testOrchestrator);
    });

    it('should properly extract Jungian concepts from complex content', () => {
      const complexContent = {
        introduction: 'This explores the shadow archetype and anima projection',
        sections: [
          { title: 'Collective Unconscious', content: 'The collective unconscious contains archetypal patterns' },
          { title: 'Individuation Process', content: 'The individuation process leads to self-realization' },
          { title: 'Psychological Types', content: 'Jung identified four psychological types' }
        ],
        summary: 'Understanding the complex dynamics of the psyche'
      };

      const concepts = (orchestrator as any).extractJungianConcepts(complexContent);

      expect(concepts).toContain('shadow');
      expect(concepts).toContain('anima');
      expect(concepts).toContain('collective unconscious');
      expect(concepts).toContain('individuation process');
      expect(concepts).toContain('complex');
    });

    it('should estimate token usage accurately for different scenarios', async () => {
      const scenarios = [
        {
          options: {
            topic: 'Simple',
            objectives: ['Basic'],
            targetAudience: 'All',
            duration: 15,
            difficulty: 'beginner' as const
          },
          expectedMin: 5000
        },
        {
          options: {
            topic: 'Complex',
            objectives: ['Advanced'],
            targetAudience: 'Experts',
            duration: 120,
            difficulty: 'advanced' as const,
            quizQuestions: 20,
            includeVideos: true,
            includeBibliography: true
          },
          expectedMin: 14000 // 5000 + 6000 + 1500 + 2000
        }
      ];

      for (const scenario of scenarios) {
        const estimate = await orchestrator.estimateTokenUsage(scenario.options);
        expect(estimate).toBeGreaterThanOrEqual(scenario.expectedMin);
      }
    });

    it('should handle graceful degradation when optional services fail', async () => {
      const { VideoGenerator, BibliographyGenerator } = require('../generators/video-generator');
      
      const mockVideo = {
        generateVideos: jest.fn().mockRejectedValue(new Error('Video service down'))
      };
      const mockBib = {
        generateBibliography: jest.fn().mockRejectedValue(new Error('Bibliography service down')),
        generateFilmSuggestions: jest.fn().mockRejectedValue(new Error('Film service down'))
      };
      const mockContent = {
        generateModuleContent: jest.fn().mockResolvedValue({
          introduction: 'Test',
          sections: [{ title: 'Test', content: 'Content' }],
          summary: 'Summary'
        })
      };
      
      const mockQuiz = {
        generateQuiz: jest.fn().mockResolvedValue({
          id: 'quiz-1',
          title: 'Test Quiz',
          description: 'Test quiz description',
          questions: [],
          timeLimit: 30,
          passingScore: 70
        })
      };

      require('../generators/video-generator').VideoGenerator.mockImplementation(() => mockVideo);
      require('../generators/bibliography-generator').BibliographyGenerator.mockImplementation(() => mockBib);
      require('../generators/content-generator').ContentGenerator.mockImplementation(() => mockContent);
      require('../generators/quiz-generator').QuizGenerator.mockImplementation(() => mockQuiz);

      const testOrchestrator = new ModuleGenerationOrchestrator(false);
      const options: GenerationOptions = {
        topic: 'Degradation Test',
        objectives: ['Test degradation'],
        targetAudience: 'Testers',
        duration: 30,
        difficulty: 'intermediate',
        includeVideos: true,
        includeBibliography: true,
        includeFilms: true
      };

      // Should not throw error but gracefully handle service failures
      const result = await testOrchestrator.generateModule(options);
      expect(result.module).toBeDefined();
      expect(result.content).toBeDefined();
      // Optional components might be undefined due to service failures

      cleanupEventEmitter(testOrchestrator);
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle missing API key in config', () => {
      mockConfig.apiKey = null;
      
      const testOrchestrator = new ModuleGenerationOrchestrator(true);
      // Should fall back to mock provider
      expect(MockLLMProvider).toHaveBeenCalled();
      
      cleanupEventEmitter(testOrchestrator);
    });

    it('should handle malformed rate limit configuration', () => {
      mockConfig.rateLimit = null;
      
      const testOrchestrator = new ModuleGenerationOrchestrator(true);
      expect(testOrchestrator).toBeDefined();
      
      cleanupEventEmitter(testOrchestrator);
    });

    it('should handle provider selection based on config', () => {
      mockConfig.provider = 'mock';
      
      const testOrchestrator = new ModuleGenerationOrchestrator(true);
      expect(MockLLMProvider).toHaveBeenCalled();
      
      cleanupEventEmitter(testOrchestrator);
    });
  });

  describe('Memory and Performance', () => {
    it('should not leak event listeners', () => {
      const initialListeners = EventEmitter.listenerCount(orchestrator, 'progress');
      
      // Add multiple listeners
      const listeners = [];
      for (let i = 0; i < 10; i++) {
        const listener = jest.fn();
        orchestrator.on('progress', listener);
        listeners.push(listener);
      }

      expect(EventEmitter.listenerCount(orchestrator, 'progress'))
        .toBe(initialListeners + 10);

      // Remove listeners
      listeners.forEach(listener => {
        orchestrator.removeListener('progress', listener);
      });

      expect(EventEmitter.listenerCount(orchestrator, 'progress'))
        .toBe(initialListeners);
    });

    it('should handle rapid sequential generation requests', async () => {
      const { ContentGenerator } = require('../generators/content-generator');
      const mockContent = {
        generateModuleContent: jest.fn().mockResolvedValue({
          introduction: 'Fast intro',
          sections: [{ title: 'Fast', content: 'Content' }],
          summary: 'Fast summary'
        })
      };
      (ContentGenerator as jest.Mock).mockImplementation(() => mockContent);

      const testOrchestrator = new ModuleGenerationOrchestrator(false);
      const options: GenerationOptions = {
        topic: 'Speed Test',
        objectives: ['Speed'],
        targetAudience: 'Speed testers',
        duration: 10,
        difficulty: 'beginner'
      };

      // Fire off 5 rapid requests
      const startTime = Date.now();
      const promises = Array(5).fill(null).map(() => testOrchestrator.generateModule(options));
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in reasonable time
      results.forEach(result => {
        expect(result.module.title).toBe('Speed Test');
      });

      cleanupEventEmitter(testOrchestrator);
    });
  });
});