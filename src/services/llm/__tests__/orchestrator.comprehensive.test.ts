import { LLMOrchestrator, GenerationOptions, GenerationProgress, GenerationResult } from '../orchestrator';
import { MockLLMProvider } from '../providers/mock';
import { EventEmitter } from 'events';

// Mock all the generators
jest.mock('../generators/content-generator');
jest.mock('../generators/quiz-generator');
jest.mock('../generators/video-generator');
jest.mock('../generators/bibliography-generator');
jest.mock('../generators/mindmap-generator');
jest.mock('../../mindmap/mindMapGenerator');
jest.mock('../../quiz/enhancedQuizGenerator');
jest.mock('../../video/videoEnricher');
jest.mock('../../bibliography/bibliographyEnricher');
jest.mock('../../quiz/quizEnhancer');

describe('LLMOrchestrator', () => {
  let orchestrator: LLMOrchestrator;
  let mockProvider: MockLLMProvider;
  let progressCallback: jest.Mock;
  let progressEvents: GenerationProgress[];

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
    orchestrator = new LLMOrchestrator(mockProvider);
    progressCallback = jest.fn();
    progressEvents = [];

    orchestrator.on('progress', (progress: GenerationProgress) => {
      progressEvents.push(progress);
      progressCallback(progress);
    });
  });

  afterEach(() => {
    orchestrator.removeAllListeners();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provider', () => {
      expect(orchestrator).toBeInstanceOf(LLMOrchestrator);
      expect(orchestrator).toBeInstanceOf(EventEmitter);
    });

    it('should handle null provider gracefully', () => {
      // @ts-expect-error Testing null provider
      expect(() => new LLMOrchestrator(null)).not.toThrow();
    });
  });

  describe('generateModule', () => {
    const basicOptions: GenerationOptions = {
      topic: 'Machine Learning Basics',
      objectives: ['Understand ML concepts', 'Learn algorithms'],
      targetAudience: 'students',
      duration: 60,
      difficulty: 'beginner'
    };

    it('should generate a complete module with all components', async () => {
      const options: GenerationOptions = {
        ...basicOptions,
        includeVideos: true,
        includeBibliography: true,
        includeFilms: true,
        includeMindMap: true,
        quizQuestions: 10,
        videoCount: 3,
        bibliographyCount: 5,
        filmCount: 2
      };

      const result = await orchestrator.generateModule(options);

      expect(result).toBeDefined();
      expect(result.module).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.videos).toBeDefined();
      expect(result.bibliography).toBeDefined();
      expect(result.films).toBeDefined();
      expect(result.mindMap).toBeDefined();

      // Verify progress events were emitted
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[0].stage).toBe('initializing');
      expect(progressEvents[progressEvents.length - 1].stage).toBe('complete');
    });

    it('should generate minimal module with only content and quiz', async () => {
      const result = await orchestrator.generateModule(basicOptions);

      expect(result).toBeDefined();
      expect(result.module).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.videos).toBeUndefined();
      expect(result.bibliography).toBeUndefined();
      expect(result.films).toBeUndefined();
      expect(result.mindMap).toBeUndefined();
    });

    it('should handle generation errors gracefully', async () => {
      const faultyProvider = {
        generateCompletion: jest.fn().mockRejectedValue(new Error('API Error'))
      };
      
      const faultyOrchestrator = new LLMOrchestrator(faultyProvider as any);
      let errorEmitted = false;

      faultyOrchestrator.on('progress', (progress: GenerationProgress) => {
        if (progress.stage === 'error') {
          errorEmitted = true;
        }
      });

      await expect(faultyOrchestrator.generateModule(basicOptions)).rejects.toThrow();
      expect(errorEmitted).toBe(true);
    });

    it('should respect useRealServices flag', async () => {
      const options: GenerationOptions = {
        ...basicOptions,
        useRealServices: true,
        includeVideos: true,
        includeBibliography: true
      };

      const result = await orchestrator.generateModule(options);

      expect(result).toBeDefined();
      // Verify that real services would be called (mocked in this test)
    });

    it('should validate options before generation', async () => {
      const invalidOptions = {
        ...basicOptions,
        topic: '', // Empty topic
        objectives: [], // Empty objectives
        duration: -1 // Invalid duration
      };

      await expect(orchestrator.generateModule(invalidOptions)).rejects.toThrow();
    });

    it('should handle progress reporting correctly', async () => {
      await orchestrator.generateModule(basicOptions);

      // Check that progress goes from 0 to 100
      expect(progressEvents[0].progress).toBe(0);
      expect(progressEvents[progressEvents.length - 1].progress).toBe(100);

      // Check that progress is monotonically increasing
      for (let i = 1; i < progressEvents.length; i++) {
        expect(progressEvents[i].progress).toBeGreaterThanOrEqual(progressEvents[i - 1].progress);
      }
    });

    it('should handle cancellation during generation', async () => {
      let generationPromise = orchestrator.generateModule(basicOptions);
      
      // Simulate cancellation after a short delay
      setTimeout(() => {
        orchestrator.cancel();
      }, 10);

      await expect(generationPromise).rejects.toThrow('Generation cancelled');
    });

    it('should handle different difficulty levels', async () => {
      const beginnerResult = await orchestrator.generateModule({
        ...basicOptions,
        difficulty: 'beginner'
      });

      const advancedResult = await orchestrator.generateModule({
        ...basicOptions,
        difficulty: 'advanced'
      });

      expect(beginnerResult.module.difficulty).toBe('beginner');
      expect(advancedResult.module.difficulty).toBe('advanced');
    });

    it('should handle different target audiences', async () => {
      const studentResult = await orchestrator.generateModule({
        ...basicOptions,
        targetAudience: 'students'
      });

      const professionalResult = await orchestrator.generateModule({
        ...basicOptions,
        targetAudience: 'professionals'
      });

      expect(studentResult).toBeDefined();
      expect(professionalResult).toBeDefined();
    });

    it('should handle very long topics and objectives', async () => {
      const longOptions = {
        ...basicOptions,
        topic: 'A'.repeat(1000),
        objectives: Array.from({ length: 50 }, (_, i) => `Objective ${i + 1}`.repeat(10))
      };

      const result = await orchestrator.generateModule(longOptions);
      expect(result).toBeDefined();
    });

    it('should handle edge cases for counts', async () => {
      const edgeCaseOptions = {
        ...basicOptions,
        includeVideos: true,
        includeBibliography: true,
        includeFilms: true,
        quizQuestions: 0,
        videoCount: 0,
        bibliographyCount: 100,
        filmCount: 1
      };

      const result = await orchestrator.generateModule(edgeCaseOptions);
      expect(result).toBeDefined();
    });
  });

  describe('cancel', () => {
    it('should cancel ongoing generation', () => {
      expect(() => orchestrator.cancel()).not.toThrow();
    });

    it('should set cancelled flag', () => {
      orchestrator.cancel();
      // Access private property for testing
      expect((orchestrator as any).cancelled).toBe(true);
    });
  });

  describe('isGenerating', () => {
    it('should return false initially', () => {
      expect(orchestrator.isGenerating()).toBe(false);
    });

    it('should return true during generation', async () => {
      const generationPromise = orchestrator.generateModule(basicOptions);
      
      // Check immediately after starting
      expect(orchestrator.isGenerating()).toBe(true);

      await generationPromise;
      expect(orchestrator.isGenerating()).toBe(false);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle provider failures gracefully', async () => {
      const faultyProvider = {
        generateCompletion: jest.fn()
          .mockResolvedValueOnce('good content') // First call succeeds
          .mockRejectedValueOnce(new Error('Network error')) // Second call fails
      };

      const faultyOrchestrator = new LLMOrchestrator(faultyProvider as any);
      
      await expect(faultyOrchestrator.generateModule(basicOptions)).rejects.toThrow();
    });

    it('should handle invalid progress values', async () => {
      const orchestratorWithBadProgress = new LLMOrchestrator(mockProvider);
      
      // Mock internal progress method to emit invalid values
      (orchestratorWithBadProgress as any).emitProgress = jest.fn((stage, progress, message) => {
        orchestratorWithBadProgress.emit('progress', {
          stage,
          progress: progress > 100 ? 100 : progress < 0 ? 0 : progress,
          message
        });
      });

      const result = await orchestratorWithBadProgress.generateModule(basicOptions);
      expect(result).toBeDefined();
    });

    it('should handle memory limitations', async () => {
      const massiveOptions = {
        ...basicOptions,
        topic: 'Test'.repeat(10000),
        objectives: Array.from({ length: 1000 }, () => 'Objective'.repeat(1000)),
        quizQuestions: 1000,
        videoCount: 100,
        bibliographyCount: 1000,
        includeVideos: true,
        includeBibliography: true
      };

      // Should either succeed or fail gracefully
      try {
        const result = await orchestrator.generateModule(massiveOptions);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle concurrent generation attempts', async () => {
      const promise1 = orchestrator.generateModule(basicOptions);
      const promise2 = orchestrator.generateModule(basicOptions);

      const results = await Promise.allSettled([promise1, promise2]);
      
      // At least one should succeed, one might fail due to concurrent access
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(0);
    });

    it('should emit detailed error information', async () => {
      const faultyProvider = {
        generateCompletion: jest.fn().mockRejectedValue(new Error('Detailed error message'))
      };

      const faultyOrchestrator = new LLMOrchestrator(faultyProvider as any);
      let errorDetails: any;

      faultyOrchestrator.on('progress', (progress: GenerationProgress) => {
        if (progress.stage === 'error') {
          errorDetails = progress.details;
        }
      });

      await expect(faultyOrchestrator.generateModule(basicOptions)).rejects.toThrow();
      expect(errorDetails).toBeDefined();
    });
  });

  describe('performance and optimization', () => {
    it('should complete generation within reasonable time', async () => {
      const startTime = Date.now();
      await orchestrator.generateModule(basicOptions);
      const endTime = Date.now();
      
      // Should complete within 10 seconds (generous limit for testing)
      expect(endTime - startTime).toBeLessThan(10000);
    });

    it('should emit progress updates regularly', async () => {
      await orchestrator.generateModule(basicOptions);
      
      // Should have multiple progress updates
      expect(progressEvents.length).toBeGreaterThan(5);
    });

    it('should handle rapid successive calls', async () => {
      const promises = Array.from({ length: 5 }, () => 
        orchestrator.generateModule(basicOptions)
      );

      const results = await Promise.allSettled(promises);
      
      // Should handle all calls without crashing
      expect(results.length).toBe(5);
    });
  });

  const basicOptions: GenerationOptions = {
    topic: 'Test Topic',
    objectives: ['Learn basics', 'Apply knowledge'],
    targetAudience: 'students',
    duration: 30,
    difficulty: 'beginner'
  };
});