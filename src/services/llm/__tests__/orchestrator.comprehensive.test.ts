import { EventEmitter } from 'events';
import {
  ModuleGenerationOrchestrator,
  LLMOrchestrator,
  GenerationOptions,
  GenerationResult,
  GenerationProgress,
} from '../orchestrator';
import { ILLMProvider } from '../types';
import { MockLLMProvider } from '../provider';
import { ConfigManager, RateLimiter } from '../config';
import { ContentGenerator } from '../generators/content-generator';
import { QuizGenerator } from '../generators/quiz-generator';
import { VideoGenerator } from '../generators/video-generator';
import { BibliographyGenerator } from '../generators/bibliography-generator';
import { EnhancedQuizGenerator } from '../../quiz/enhancedQuizGenerator';
import { VideoEnricher } from '../../video/videoEnricher';
import { BibliographyEnricher } from '../../bibliography/bibliographyEnricher';
import { QuizEnhancer } from '../../quiz/quizEnhancer';
import { Module, ModuleContent, Quiz, Video } from '../../../types/index';

// Mock all external dependencies
jest.mock('../config');
jest.mock('../generators/content-generator');
jest.mock('../generators/quiz-generator');
jest.mock('../generators/video-generator');
jest.mock('../generators/bibliography-generator');
jest.mock('../../quiz/enhancedQuizGenerator');
jest.mock('../../video/videoEnricher');
jest.mock('../../bibliography/bibliographyEnricher');
jest.mock('../../quiz/quizEnhancer');

describe('ModuleGenerationOrchestrator - Core Functionality', () => {
  let mockConfigManager: any;
  let mockRateLimiter: any;
  let mockContentGenerator: any;
  let mockQuizGenerator: any;
  let mockVideoGenerator: any;
  let mockBibliographyGenerator: any;

  const mockModuleContent: ModuleContent = {
    introduction: 'Introduction to Jungian archetypes and their significance in analytical psychology.',
    sections: [
      {
        id: 'section1',
        title: 'The Four Main Archetypes',
        content: 'Jung identified four main archetypes: the Self, the Shadow, the Anima/Animus, and the Persona.',
        order: 1,
        keyTerms: [
          { term: 'archetype', definition: 'Universal patterns or images derived from the collective unconscious' }
        ]
      }
    ],
    summary: 'Archetypes are fundamental structures of the psyche that shape human experience.',
    keyTakeaways: ['Archetypes are universal', 'They appear in dreams and myths', 'They influence personality']
  };

  const mockQuiz: Quiz = {
    id: 'quiz-test',
    title: 'Archetypal Theory Assessment',
    description: 'Test your understanding of Jungian archetypes',
    questions: [
      {
        id: 'q1',
        question: 'What is an archetype according to Jung?',
        type: 'multiple-choice',
        options: [
          { id: 'a', text: 'Universal pattern from collective unconscious', isCorrect: true },
          { id: 'b', text: 'Personal memory from childhood', isCorrect: false }
        ],
        correctAnswer: 0,
        explanation: 'Archetypes are universal patterns inherited from the collective unconscious.'
      }
    ],
    passingScore: 70,
    timeLimit: 600
  };

  const mockVideos: Video[] = [
    {
      id: 'vid1',
      title: 'Introduction to Jungian Archetypes',
      youtubeId: 'dQw4w9WgXcQ',
      description: 'Comprehensive overview of archetypal theory',
      duration: 25
    }
  ];

  const defaultOptions: GenerationOptions = {
    topic: 'Jungian Archetypes',
    objectives: ['Understand archetypal theory', 'Identify personal archetypes'],
    targetAudience: 'psychology students',
    duration: 60,
    difficulty: 'intermediate',
    includeVideos: true,
    includeBibliography: true,
    includeFilms: true,
    quizQuestions: 10,
    videoCount: 5,
    bibliographyCount: 8,
    filmCount: 3,
    useRealServices: false, // Use false for controlled testing
  };

  beforeAll(() => {
    // Global setup for mocks
    mockConfigManager = {
      getConfig: jest.fn().mockReturnValue({
        provider: 'mock',
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
        rateLimit: {
          maxRequestsPerMinute: 60,
          maxTokensPerMinute: 90000,
          maxConcurrentRequests: 5,
        }
      })
    };

    mockRateLimiter = {
      checkLimit: jest.fn().mockResolvedValue(undefined),
      recordRequest: jest.fn(),
      incrementActive: jest.fn(),
      decrementActive: jest.fn(),
    };

    (ConfigManager.getInstance as jest.Mock).mockReturnValue(mockConfigManager);
    // Ensure RateLimiter constructor doesn't throw and returns our mock
    (RateLimiter as jest.Mock).mockImplementation((config) => {
      // Don't throw any errors, just return the mock 
      return mockRateLimiter;
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset rate limiter mock to ensure fresh state
    mockRateLimiter.checkLimit.mockClear();
    mockRateLimiter.recordRequest.mockClear(); 
    mockRateLimiter.incrementActive.mockClear();
    mockRateLimiter.decrementActive.mockClear();
    mockRateLimiter.checkLimit.mockResolvedValue(undefined);
    
    // Setup mock generators with realistic responses
    mockContentGenerator = {
      generateModuleContent: jest.fn().mockResolvedValue(mockModuleContent),
    };

    mockQuizGenerator = {
      generateQuiz: jest.fn().mockResolvedValue(mockQuiz),
    };

    mockVideoGenerator = {
      generateVideos: jest.fn().mockResolvedValue(mockVideos),
    };

    mockBibliographyGenerator = {
      generateBibliography: jest.fn().mockResolvedValue([
        {
          id: 'bib1',
          title: 'Man and His Symbols',
          authors: ['Jung, C.G.'],
          year: 2016,
          type: 'book',
          publisher: 'Dell Publishing'
        }
      ]),
      generateFilmSuggestions: jest.fn().mockResolvedValue([
        {
          id: 'film1',
          title: 'The Psychology of Carl Jung',
          director: 'Documentary Director',
          year: 2020,
          relevance: 'Educational documentary on Jung\'s life and theories'
        }
      ])
    };

    // Setup constructor mocks
    (ContentGenerator as jest.Mock).mockReturnValue(mockContentGenerator);
    (QuizGenerator as jest.Mock).mockReturnValue(mockQuizGenerator);
    (VideoGenerator as jest.Mock).mockReturnValue(mockVideoGenerator);
    (BibliographyGenerator as jest.Mock).mockReturnValue(mockBibliographyGenerator);
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with MockLLMProvider when useRealServices is false', () => {
      const orchestrator = new ModuleGenerationOrchestrator(false);
      
      expect(ContentGenerator).toHaveBeenCalledWith(expect.any(MockLLMProvider));
      expect(QuizGenerator).toHaveBeenCalledWith(expect.any(MockLLMProvider));
      expect(VideoGenerator).toHaveBeenCalledWith(expect.any(MockLLMProvider));
      expect(BibliographyGenerator).toHaveBeenCalledWith(expect.any(MockLLMProvider));
      
      orchestrator.removeAllListeners();
    });

    it('should initialize with real services when useRealServices is true', () => {
      const orchestrator = new ModuleGenerationOrchestrator(true);
      
      expect(EnhancedQuizGenerator).toHaveBeenCalled();
      expect(VideoEnricher).toHaveBeenCalled();
      expect(BibliographyEnricher).toHaveBeenCalled();
      expect(QuizEnhancer).toHaveBeenCalled();
      
      orchestrator.removeAllListeners();
    });

    it('should inherit from EventEmitter', () => {
      const orchestrator = new ModuleGenerationOrchestrator(false);
      expect(orchestrator).toBeInstanceOf(EventEmitter);
      orchestrator.removeAllListeners();
    });
  });

  describe('Module Generation - Core Flow', () => {
    let orchestrator: ModuleGenerationOrchestrator;

    beforeEach(() => {
      orchestrator = new ModuleGenerationOrchestrator(false);
    });

    afterEach(() => {
      orchestrator.removeAllListeners();
    });

    it('should generate complete module with all components', async () => {
      const result = await orchestrator.generateModule(defaultOptions);

      // Verify structure
      expect(result).toHaveProperty('module');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('quiz');
      expect(result).toHaveProperty('videos');
      expect(result).toHaveProperty('bibliography');
      expect(result).toHaveProperty('films');

      // Verify module properties
      expect(result.module.id).toMatch(/^module-\d+$/);
      expect(result.module.title).toBe(defaultOptions.topic);
      expect(result.module.difficulty).toBe(defaultOptions.difficulty);
      expect(result.module.estimatedTime).toBe(defaultOptions.duration);
      
      // Verify generator calls
      expect(mockContentGenerator.generateModuleContent).toHaveBeenCalledWith(
        defaultOptions.topic,
        defaultOptions.objectives,
        defaultOptions.targetAudience,
        defaultOptions.duration
      );
    });

    it('should emit progress events during generation', async () => {
      const progressEvents: GenerationProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      await orchestrator.generateModule(defaultOptions);

      expect(progressEvents.length).toBeGreaterThanOrEqual(7);
      expect(progressEvents[0].stage).toBe('initializing');
      expect(progressEvents[1].stage).toBe('content');
      
      const finalEvent = progressEvents[progressEvents.length - 1];
      expect(finalEvent.stage).toBe('complete');
      expect(finalEvent.progress).toBe(100);
    });

    it('should skip optional components when disabled', async () => {
      const minimalOptions: GenerationOptions = {
        ...defaultOptions,
        includeVideos: false,
        includeBibliography: false,
        includeFilms: false,
        quizQuestions: 0,
      };

      const result = await orchestrator.generateModule(minimalOptions);

      expect(result.quiz).toBeUndefined();
      expect(result.videos).toBeUndefined();
      expect(result.bibliography).toBeUndefined();
      expect(result.films).toBeUndefined();

      // Should not call generators for disabled components
      expect(mockVideoGenerator.generateVideos).not.toHaveBeenCalled();
      expect(mockBibliographyGenerator.generateBibliography).not.toHaveBeenCalled();
      expect(mockBibliographyGenerator.generateFilmSuggestions).not.toHaveBeenCalled();
    });

    it('should handle errors and emit error progress', async () => {
      const error = new Error('Content generation failed');
      mockContentGenerator.generateModuleContent.mockRejectedValue(error);

      const progressEvents: GenerationProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      await expect(orchestrator.generateModule(defaultOptions)).rejects.toThrow('Content generation failed');

      const errorEvent = progressEvents.find(p => p.stage === 'error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent!.message).toContain('Content generation failed');
    });
  });

  describe('Content Generation Methods', () => {
    let orchestrator: ModuleGenerationOrchestrator;

    beforeEach(() => {
      orchestrator = new ModuleGenerationOrchestrator(false);
    });

    afterEach(() => {
      orchestrator.removeAllListeners();
    });

    it('should generate quiz with proper filtering', async () => {
      const quizWithInvalidQuestion = {
        ...mockQuiz,
        questions: [
          ...mockQuiz.questions,
          {
            id: 'invalid',
            question: 'Invalid question',
            type: 'multiple-choice' as const,
            options: [], // Empty options - should be filtered out
            correctAnswer: 0,
            explanation: 'Invalid'
          }
        ]
      };

      mockQuizGenerator.generateQuiz.mockResolvedValue(quizWithInvalidQuestion);

      const result = await orchestrator.generateModule(defaultOptions);

      // Should filter out questions with empty options
      expect(result.quiz?.questions).toHaveLength(1);
      expect(result.quiz?.questions[0].id).toBe('q1');
    });

    it('should extract YouTube IDs from video URLs', async () => {
      const videosWithUrls = [
        {
          id: 'vid1',
          title: 'Test Video 1',
          url: 'https://youtube.com/watch?v=abc123def45',
          description: 'Test description',
          duration: 10
        },
        {
          id: 'vid2',
          title: 'Test Video 2',
          url: 'https://youtu.be/xyz789uvw01',
          description: 'Test description',
          duration: 15
        }
      ];

      mockVideoGenerator.generateVideos.mockResolvedValue(videosWithUrls);

      const result = await orchestrator.generateModule(defaultOptions);

      expect(result.videos).toHaveLength(2);
      expect(result.videos![0].youtubeId).toBe('abc123def45');
      expect(result.videos![1].youtubeId).toBe('xyz789uvw01');
    });

    it('should filter out videos without valid YouTube IDs', async () => {
      const videosWithInvalidUrls = [
        {
          id: 'vid1',
          title: 'Valid Video',
          url: 'https://youtube.com/watch?v=validId1234',
          description: 'Valid description',
          duration: 10
        },
        {
          id: 'vid2',
          title: 'Invalid Video',
          url: 'https://example.com/invalid',
          description: 'Invalid description',
          duration: 15
        }
      ];

      mockVideoGenerator.generateVideos.mockResolvedValue(videosWithInvalidUrls);

      const result = await orchestrator.generateModule(defaultOptions);

      expect(result.videos).toHaveLength(1);
      expect(result.videos![0].youtubeId).toBe('validId1234');
    });
  });

  describe('Difficulty Analysis', () => {
    let orchestrator: ModuleGenerationOrchestrator;

    beforeEach(() => {
      orchestrator = new ModuleGenerationOrchestrator(false);
    });

    afterEach(() => {
      orchestrator.removeAllListeners();
    });

    it('should classify beginner content correctly', async () => {
      const beginnerContent = 'This is a basic introduction to fundamental concepts. We start with simple overview of beginning principles.';
      const result = await orchestrator.analyzeDifficulty('Test Topic', beginnerContent);
      expect(result).toBe('beginner');
    });

    it('should classify intermediate content correctly', async () => {
      const intermediateContent = 'This detailed exploration involves practical application of concepts. We develop implementation strategies and explore various approaches.';
      const result = await orchestrator.analyzeDifficulty('Test Topic', intermediateContent);
      expect(result).toBe('intermediate');
    });

    it('should classify advanced content correctly', async () => {
      const advancedContent = 'Complex theoretical analysis of specialized research in expert domains. Advanced archetype theory involves intricate individuation processes within the collective unconscious framework.';
      const result = await orchestrator.analyzeDifficulty('Test Topic', advancedContent);
      expect(result).toBe('advanced');
    });

    it('should consider technical Jungian terms in classification', async () => {
      const technicalContent = 'The archetype manifests through the individuation process, emerging from the collective unconscious via complex psychological dynamics and transcendent function.';
      const result = await orchestrator.analyzeDifficulty('Jung Theory', technicalContent);
      expect(result).toBe('advanced');
    });
  });

  describe('Utility Methods', () => {
    let orchestrator: ModuleGenerationOrchestrator;

    beforeEach(() => {
      orchestrator = new ModuleGenerationOrchestrator(false);
    });

    afterEach(() => {
      orchestrator.removeAllListeners();
    });

    it('should check provider availability', async () => {
      // Mock the provider's isAvailable method through the orchestrator's private provider
      jest.spyOn(MockLLMProvider.prototype, 'isAvailable').mockResolvedValue(true);

      const available = await orchestrator.checkProviderAvailability();
      expect(available).toBe(true);
    });

    it('should estimate token usage correctly', async () => {
      const estimate = await orchestrator.estimateTokenUsage(defaultOptions);

      const expectedTokens = 
        5000 + // base content
        (defaultOptions.quizQuestions! * 300) + // quiz
        1500 + // videos
        2000;  // bibliography

      expect(estimate).toBe(expectedTokens);
    });

    it('should estimate tokens for minimal options', async () => {
      const minimalOptions: GenerationOptions = {
        ...defaultOptions,
        includeVideos: false,
        includeBibliography: false,
        quizQuestions: 0,
      };

      const estimate = await orchestrator.estimateTokenUsage(minimalOptions);
      expect(estimate).toBe(5000); // Only base content
    });
  });

  describe('Rate Limiting Integration', () => {
    let orchestrator: ModuleGenerationOrchestrator;

    beforeEach(() => {
      // Clear all mocks and ensure fresh mock state
      jest.clearAllMocks();
      mockRateLimiter.checkLimit.mockClear();
      mockRateLimiter.recordRequest.mockClear();
      mockRateLimiter.incrementActive.mockClear();
      mockRateLimiter.decrementActive.mockClear();
      mockRateLimiter.checkLimit.mockResolvedValue(undefined);
      
      // Ensure the RateLimiter constructor is properly mocked BEFORE creating orchestrator
      (RateLimiter as jest.Mock).mockImplementation((config) => {
        return mockRateLimiter;
      });
      
      // Now create the orchestrator - it should use our mocked RateLimiter
      orchestrator = new ModuleGenerationOrchestrator(false);
    });

    afterEach(() => {
      orchestrator.removeAllListeners();
    });

    it('should call rate limiter methods during generation', async () => {
      await orchestrator.generateModule(defaultOptions);

      // Should call checkLimit for each major operation
      expect(mockRateLimiter.checkLimit).toHaveBeenCalled();
      expect(mockRateLimiter.incrementActive).toHaveBeenCalled();
      expect(mockRateLimiter.decrementActive).toHaveBeenCalled();
      expect(mockRateLimiter.recordRequest).toHaveBeenCalled();
    });

    it('should handle rate limit errors', async () => {
      // Reset and configure mock for error case
      mockRateLimiter.checkLimit.mockClear();
      mockRateLimiter.checkLimit.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      await expect(orchestrator.generateModule(defaultOptions)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Concept and Tag Extraction', () => {
    let orchestrator: ModuleGenerationOrchestrator;

    beforeEach(() => {
      orchestrator = new ModuleGenerationOrchestrator(false);
    });

    afterEach(() => {
      orchestrator.removeAllListeners();
    });

    it('should extract Jungian concepts from content', async () => {
      const contentWithConcepts = {
        ...mockModuleContent,
        introduction: 'The shadow archetype represents hidden aspects. The anima/animus complex influences relationships.',
        sections: [
          {
            ...mockModuleContent.sections[0],
            content: 'Collective unconscious patterns manifest through archetypal complexes. The individuation process integrates psychological types.'
          }
        ]
      };

      mockContentGenerator.generateModuleContent.mockResolvedValue(contentWithConcepts);

      const result = await orchestrator.generateModule(defaultOptions);

      const concepts = result.module.metadata?.jungianConcepts || [];
      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts.some(c => c.includes('shadow'))).toBe(true);
    });

    it('should extract tags from topic and objectives', async () => {
      const jungianOptions: GenerationOptions = {
        ...defaultOptions,
        topic: 'Shadow Work and Anima Integration',
        objectives: ['Understand collective unconscious', 'Explore archetypal patterns']
      };

      const result = await orchestrator.generateModule(jungianOptions);

      const tags = result.module.metadata?.tags || [];
      expect(tags).toContain('shadow');
      expect(tags).toContain('anima');
      expect(tags).toContain('collective unconscious');
      expect(tags).toContain('archetype');
    });
  });
});

describe('LLMOrchestrator - Simplified Interface', () => {
  let orchestrator: LLMOrchestrator;
  let generateModuleSpy: jest.SpyInstance;

  beforeAll(() => {
    // Setup global mocks
    const mockConfigManager = {
      getConfig: jest.fn().mockReturnValue({
        provider: 'mock',
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
        rateLimit: {
          maxRequestsPerMinute: 60,
          maxTokensPerMinute: 90000,
          maxConcurrentRequests: 5,
        }
      })
    };

    (ConfigManager.getInstance as jest.Mock).mockReturnValue(mockConfigManager);
  });

  beforeEach(() => {
    // Spy on the ModuleGenerationOrchestrator.generateModule method
    generateModuleSpy = jest.spyOn(ModuleGenerationOrchestrator.prototype, 'generateModule')
      .mockResolvedValue({
        module: {
          id: 'test-module',
          title: 'Test Topic',
          description: 'A comprehensive module on Test Topic in Jungian psychology',
          difficulty: 'intermediate',
          estimatedTime: 60,
          prerequisites: [],
          category: 'psychology'
        } as Module,
        content: {
          introduction: 'Test introduction',
          sections: []
        },
        quiz: {
          id: 'test-quiz',
          title: 'Test Quiz',
          description: 'Test quiz description',
          questions: []
        }
      });

    orchestrator = new LLMOrchestrator();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateModule', () => {
    it('should generate module with default options', async () => {
      const result = await orchestrator.generateModule({ topic: 'Test Topic' });

      expect(generateModuleSpy).toHaveBeenCalledWith({
        topic: 'Test Topic',
        objectives: ['Understand the fundamentals of Test Topic', 'Apply Test Topic concepts in practice'],
        targetAudience: 'general learners',
        duration: 60,
        difficulty: 'intermediate',
        includeVideos: false,
        includeBibliography: false,
        useRealServices: true
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('test-module');
      expect(result.title).toBe('Test Topic');
    });

    it('should pass through custom options', async () => {
      await orchestrator.generateModule({
        topic: 'Advanced Jung',
        targetAudience: 'graduate students',
        difficulty: 'advanced'
      });

      expect(generateModuleSpy).toHaveBeenCalledWith({
        topic: 'Advanced Jung',
        objectives: ['Understand the fundamentals of Advanced Jung', 'Apply Advanced Jung concepts in practice'],
        targetAudience: 'graduate students',
        duration: 60,
        difficulty: 'advanced',
        includeVideos: false,
        includeBibliography: false,
        useRealServices: true
      });
    });
  });

  describe('generateQuiz', () => {
    it('should generate quiz with specified parameters', async () => {
      const result = await orchestrator.generateQuiz({
        topic: 'Jung Archetypes',
        numberOfQuestions: 15,
        difficulty: 'advanced'
      });

      expect(generateModuleSpy).toHaveBeenCalledWith({
        topic: 'Jung Archetypes',
        objectives: ['Assess understanding of Jung Archetypes'],
        targetAudience: 'students',
        duration: 30,
        difficulty: 'advanced',
        quizQuestions: 15,
        useRealServices: true
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('test-quiz');
    });

    it('should use default difficulty when not specified', async () => {
      await orchestrator.generateQuiz({
        topic: 'Jung Theory',
        numberOfQuestions: 10
      });

      expect(generateModuleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          difficulty: 'intermediate'
        })
      );
    });
  });

  describe('generateBibliography', () => {
    beforeEach(() => {
      generateModuleSpy.mockResolvedValue({
        module: { id: 'test' } as Module,
        content: { introduction: 'test', sections: [] },
        bibliography: [
          {
            id: 'bib1',
            title: 'Test Bibliography',
            authors: ['Test Author'],
            year: 2023,
            type: 'book'
          }
        ]
      });
    });

    it('should generate bibliography with specified parameters', async () => {
      const result = await orchestrator.generateBibliography({
        topic: 'Jung Research',
        count: 15,
        yearRange: { start: 2000, end: 2023 }
      });

      expect(generateModuleSpy).toHaveBeenCalledWith({
        topic: 'Jung Research',
        objectives: ['Research Jung Research'],
        targetAudience: 'researchers',
        duration: 60,
        difficulty: 'advanced',
        includeBibliography: true,
        bibliographyCount: 15,
        useRealServices: true
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Bibliography');
    });

    it('should return empty array when no bibliography generated', async () => {
      generateModuleSpy.mockResolvedValue({
        module: { id: 'test' } as Module,
        content: { introduction: 'test', sections: [] },
        bibliography: undefined
      });

      const result = await orchestrator.generateBibliography({
        topic: 'Jung Theory'
      });

      expect(result).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle orchestrator errors', async () => {
      const error = new Error('Orchestrator failed');
      generateModuleSpy.mockRejectedValue(error);

      await expect(orchestrator.generateModule({ topic: 'Test' }))
        .rejects.toThrow('Orchestrator failed');
    });
  });
});