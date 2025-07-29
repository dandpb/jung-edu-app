import { EventEmitter } from 'events';
import { ModuleGenerationOrchestrator, LLMOrchestrator, GenerationOptions, GenerationProgress } from '../orchestrator';
import { MockLLMProvider, OpenAIProvider } from '../provider';
import { ConfigManager } from '../config';
import { ContentGenerator } from '../generators/content-generator';
import { QuizGenerator } from '../generators/quiz-generator';
import { VideoGenerator } from '../generators/video-generator';
import { BibliographyGenerator } from '../generators/bibliography-generator';
import { MindMapGenerator } from '../generators/mindmap-generator';
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
jest.mock('../generators/mindmap-generator');
jest.mock('../../mindmap/mindMapGenerator');
jest.mock('../../quiz/enhancedQuizGenerator', () => ({
  EnhancedQuizGenerator: jest.fn().mockImplementation(() => ({
    generateQuiz: jest.fn().mockResolvedValue({
      quiz: {
        id: 'quiz-1',
        title: 'Archetypes Assessment',
        description: 'Test your knowledge',
        questions: [
          {
            id: 'q1',
            question: 'What is the shadow?',
            options: [
              { id: 'opt1', text: 'Hidden aspects', isCorrect: true },
              { id: 'opt2', text: 'Conscious ego', isCorrect: false }
            ],
            correctAnswer: 0,
            explanation: 'The shadow represents hidden aspects'
          }
        ]
      },
      stats: {
        totalQuestions: 1,
        difficultyDistribution: { easy: 0, medium: 1, hard: 0 }
      }
    })
  }))
}));
jest.mock('../../video/videoEnricher');
jest.mock('../../bibliography/bibliographyEnricher');
jest.mock('../../quiz/quizEnhancer');

describe('ModuleGenerationOrchestrator', () => {
  let orchestrator: ModuleGenerationOrchestrator;
  let mockConfig: any;
  let mockProvider: jest.Mocked<MockLLMProvider>;
  let mockContentGenerator: jest.Mocked<ContentGenerator>;
  let mockQuizGenerator: jest.Mocked<QuizGenerator>;
  let mockVideoGenerator: jest.Mocked<VideoGenerator>;
  let mockBibliographyGenerator: jest.Mocked<BibliographyGenerator>;
  let mockMindMapGenerator: jest.Mocked<MindMapGenerator>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock config
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

    // Setup mock provider
    mockProvider = new MockLLMProvider() as jest.Mocked<MockLLMProvider>;
    (MockLLMProvider as jest.Mock).mockImplementation(() => mockProvider);
    (OpenAIProvider as jest.Mock).mockImplementation(() => mockProvider);

    // Setup mock generators
    mockContentGenerator = new ContentGenerator(mockProvider) as jest.Mocked<ContentGenerator>;
    mockQuizGenerator = new QuizGenerator(mockProvider) as jest.Mocked<QuizGenerator>;
    mockVideoGenerator = new VideoGenerator(mockProvider) as jest.Mocked<VideoGenerator>;
    mockBibliographyGenerator = new BibliographyGenerator(mockProvider) as jest.Mocked<BibliographyGenerator>;
    mockMindMapGenerator = new MindMapGenerator(mockProvider) as jest.Mocked<MindMapGenerator>;

    (ContentGenerator as jest.Mock).mockImplementation(() => mockContentGenerator);
    (QuizGenerator as jest.Mock).mockImplementation(() => mockQuizGenerator);
    (VideoGenerator as jest.Mock).mockImplementation(() => mockVideoGenerator);
    (BibliographyGenerator as jest.Mock).mockImplementation(() => mockBibliographyGenerator);
    (MindMapGenerator as jest.Mock).mockImplementation(() => mockMindMapGenerator);

    // Create orchestrator instance
    orchestrator = new ModuleGenerationOrchestrator(false); // Use mock services for tests
  });

  afterEach(async () => {
    // Clean up EventEmitter listeners to prevent memory leaks
    cleanupEventEmitter(orchestrator);
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Ensure all promises are resolved
    await flushPromises();
  });

  describe('Constructor', () => {
    it('should initialize with mock provider when useRealServices is false', () => {
      const testOrchestrator = new ModuleGenerationOrchestrator(false);
      expect(MockLLMProvider).toHaveBeenCalledWith(50);
      expect(testOrchestrator).toBeInstanceOf(EventEmitter);
      // Clean up
      cleanupEventEmitter(testOrchestrator);
    });

    it('should initialize with OpenAI provider when config has API key', () => {
      const testOrchestrator = new ModuleGenerationOrchestrator(true);
      expect(OpenAIProvider).toHaveBeenCalledWith('test-api-key', 'gpt-4');
      // Clean up
      cleanupEventEmitter(testOrchestrator);
    });

    it('should initialize with mock provider when no API key is available', () => {
      mockConfig.apiKey = null;
      const testOrchestrator = new ModuleGenerationOrchestrator(true);
      expect(MockLLMProvider).toHaveBeenCalled();
      // Clean up
      cleanupEventEmitter(testOrchestrator);
    });

    it('should initialize all generators', () => {
      expect(ContentGenerator).toHaveBeenCalledWith(mockProvider);
      expect(QuizGenerator).toHaveBeenCalledWith(mockProvider);
      expect(VideoGenerator).toHaveBeenCalledWith(mockProvider);
      expect(BibliographyGenerator).toHaveBeenCalledWith(mockProvider);
      expect(MindMapGenerator).toHaveBeenCalledWith(mockProvider);
    });
  });

  describe('generateModule', () => {
    const mockOptions: GenerationOptions = {
      topic: 'Jungian Archetypes',
      objectives: ['Understand archetypes', 'Apply in therapy'],
      targetAudience: 'Psychology students',
      duration: 60,
      difficulty: 'intermediate',
      includeVideos: true,
      includeBibliography: true,
      includeFilms: true,
      includeMindMap: true,
      quizQuestions: 10,
      videoCount: 5,
      bibliographyCount: 10,
      filmCount: 3,
      useRealServices: false
    };

    const mockContent = {
      introduction: 'Introduction to Jungian Archetypes',
      sections: [
        { title: 'The Shadow', content: 'Understanding the shadow archetype' },
        { title: 'The Self', content: 'The journey to self-realization' }
      ],
      summary: 'Summary of key concepts'
    };

    const mockQuiz = {
      id: 'quiz-1',
      title: 'Archetypes Assessment',
      description: 'Test your knowledge',
      questions: [
        {
          id: 'q1',
          question: 'What is the shadow?',
          options: [
            { id: 'opt1', text: 'Hidden aspects', isCorrect: true },
            { id: 'opt2', text: 'Conscious ego', isCorrect: false }
          ],
          correctAnswer: 0,
          explanation: 'The shadow represents hidden aspects'
        }
      ]
    };

    const mockVideos = [
      {
        id: 'video-1',
        title: 'Introduction to Archetypes',
        youtubeId: 'abc123',
        description: 'Overview of Jungian archetypes',
        duration: 15
      }
    ];

    const mockBibliography = [
      {
        id: 'bib-1',
        title: 'Man and His Symbols',
        author: 'Carl Jung',
        year: 1964,
        type: 'book'
      }
    ];

    const mockFilms = [
      {
        id: 'film-1',
        title: 'A Dangerous Method',
        year: 2011,
        relevance: 'Depicts Jung-Freud relationship'
      }
    ];

    const mockMindMap = {
      id: 'mindmap-1',
      nodes: [
        { id: 'root', label: 'Jungian Archetypes', type: 'root' },
        { id: 'shadow', label: 'Shadow', type: 'child' }
      ],
      edges: [{ from: 'root', to: 'shadow' }]
    };

    beforeEach(() => {
      mockContentGenerator.generateModuleContent.mockResolvedValue(mockContent);
      mockQuizGenerator.generateQuiz.mockResolvedValue({
        ...mockQuiz,
        timeLimit: 20,
        passingScore: 70
      } as any);
      mockVideoGenerator.generateVideos.mockResolvedValue(mockVideos);
      mockBibliographyGenerator.generateBibliography.mockResolvedValue(mockBibliography);
      mockBibliographyGenerator.generateFilmSuggestions = jest.fn().mockResolvedValue(mockFilms);
      mockMindMapGenerator.generateMindMap.mockResolvedValue(mockMindMap);
    });

    it('should generate a complete module with all components', async () => {
      const progressEvents: GenerationProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      const result = await orchestrator.generateModule(mockOptions);

      // Verify module structure
      expect(result.module).toBeDefined();
      expect(result.module.title).toBe('Jungian Archetypes');
      expect(result.module.difficulty).toBe('intermediate');
      expect(result.module.estimatedTime).toBe(60);

      // Verify content
      expect(result.content).toEqual(mockContent);

      // Verify all components were generated
      // The orchestrator adds extra properties to the quiz
      expect(result.quiz).toBeDefined();
      if (result.quiz) {
        expect(result.quiz).toMatchObject(mockQuiz);
        expect(result.quiz.timeLimit).toBeDefined();
      }
      expect(result.videos).toEqual(mockVideos);
      expect(result.bibliography).toEqual(mockBibliography);
      expect(result.films).toEqual(mockFilms);
      expect(result.mindMap).toEqual(mockMindMap);

      // Verify progress events
      expect(progressEvents).toContainEqual(
        expect.objectContaining({
          stage: 'initializing',
          progress: 0,
          message: 'Starting module generation...'
        })
      );
      expect(progressEvents).toContainEqual(
        expect.objectContaining({
          stage: 'complete',
          progress: 100,
          message: 'Module generation complete!'
        })
      );
    });

    it('should handle generation without optional components', async () => {
      const minimalOptions: GenerationOptions = {
        topic: 'Basic Psychology',
        objectives: ['Understand basics'],
        targetAudience: 'Beginners',
        duration: 30,
        difficulty: 'beginner',
        includeVideos: false,
        includeBibliography: false,
        includeFilms: false,
        includeMindMap: false,
        quizQuestions: 0,
        useRealServices: false
      };

      const result = await orchestrator.generateModule(minimalOptions);

      expect(result.module).toBeDefined();
      expect(result.quiz).toBeUndefined();
      expect(result.videos).toBeUndefined();
      expect(result.bibliography).toBeUndefined();
      expect(result.films).toBeUndefined();
      expect(result.mindMap).toBeUndefined();
    });

    it('should emit error progress on failure', async () => {
      const error = new Error('Generation failed');
      mockContentGenerator.generateModuleContent.mockRejectedValue(error);

      const progressEvents: GenerationProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      await expect(orchestrator.generateModule(mockOptions)).rejects.toThrow('Generation failed');

      expect(progressEvents).toContainEqual(
        expect.objectContaining({
          stage: 'error',
          progress: 0,
          message: 'Generation failed: Error: Generation failed'
        })
      );
    });

    it('should extract Jungian concepts from content', async () => {
      const contentWithConcepts = {
        ...mockContent,
        sections: [
          { title: 'Shadow', content: 'The shadow archetype represents...' },
          { title: 'Collective Unconscious', content: 'The collective unconscious contains...' },
          { title: 'Individuation Process', content: 'The individuation process involves...' }
        ]
      };

      mockContentGenerator.generateModuleContent.mockResolvedValue(contentWithConcepts);

      const result = await orchestrator.generateModule(mockOptions);

      const metadata = (result.module as any).metadata;
      expect(metadata.jungianConcepts).toContain('shadow');
      expect(metadata.jungianConcepts).toContain('collective unconscious');
      expect(metadata.jungianConcepts).toContain('individuation process');
    });
  });

  describe('extractYouTubeId', () => {
    it('should extract YouTube ID from various URL formats', () => {
      const testCases = [
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        { url: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        { url: 'invalid-url', expected: null },
        { url: '', expected: null },
        { url: null, expected: null },
        { url: undefined, expected: null }
      ];

      testCases.forEach(({ url, expected }) => {
        // Access private method through any type
        const result = (orchestrator as any).extractYouTubeId(url);
        expect(result).toBe(expected);
      });
    });
  });

  describe('analyzeDifficulty', () => {
    it('should analyze content difficulty correctly', async () => {
      const beginnerContent = 'This is a basic introduction to fundamental concepts. Simple overview for beginners.';
      const intermediateContent = 'Detailed exploration of practical application and implementation strategies.';
      const advancedContent = 'Complex theoretical analysis of specialized research in archetype theory and transcendent function.';

      expect(await orchestrator.analyzeDifficulty('Basic Concepts', beginnerContent)).toBe('beginner');
      expect(await orchestrator.analyzeDifficulty('Practical Jung', intermediateContent)).toBe('intermediate');
      expect(await orchestrator.analyzeDifficulty('Advanced Theory', advancedContent)).toBe('advanced');
    });

    it('should consider technical terms in difficulty analysis', async () => {
      const technicalContent = 'Discussion of archetype, individuation, collective unconscious, complex, and transcendent function.';
      expect(await orchestrator.analyzeDifficulty('Jungian Terms', technicalContent)).toBe('advanced');
    });
  });

  describe('checkProviderAvailability', () => {
    it('should return true when provider is available', async () => {
      mockProvider.isAvailable = jest.fn().mockResolvedValue(true);
      const result = await orchestrator.checkProviderAvailability();
      expect(result).toBe(true);
    });

    it('should return false when provider is not available', async () => {
      mockProvider.isAvailable = jest.fn().mockResolvedValue(false);
      const result = await orchestrator.checkProviderAvailability();
      expect(result).toBe(false);
    });

    it('should return false when provider throws error', async () => {
      mockProvider.isAvailable = jest.fn().mockRejectedValue(new Error('Provider error'));
      const result = await orchestrator.checkProviderAvailability();
      expect(result).toBe(false);
    });
  });

  describe('estimateTokenUsage', () => {
    it('should estimate token usage based on options', async () => {
      const options: GenerationOptions = {
        topic: 'Psychology',
        objectives: ['Learn'],
        targetAudience: 'Students',
        duration: 60,
        difficulty: 'intermediate',
        quizQuestions: 10,
        includeVideos: true,
        includeBibliography: true,
        includeMindMap: true
      };

      const estimate = await orchestrator.estimateTokenUsage(options);
      
      // Base content (5000) + quiz (10 * 300) + videos (1500) + bibliography (2000) + mindmap (2500)
      expect(estimate).toBe(5000 + 3000 + 1500 + 2000 + 2500);
    });

    it('should return base estimate for minimal options', async () => {
      const options: GenerationOptions = {
        topic: 'Basic',
        objectives: ['Simple'],
        targetAudience: 'All',
        duration: 30,
        difficulty: 'beginner'
      };

      const estimate = await orchestrator.estimateTokenUsage(options);
      expect(estimate).toBe(5000); // Base content only
    });
  });
});

describe('LLMOrchestrator', () => {
  let llmOrchestrator: LLMOrchestrator;
  let mockModuleOrchestrator: jest.Mocked<ModuleGenerationOrchestrator>;

  beforeEach(() => {
    // Mock ConfigManager for this test suite as well
    const { ConfigManager } = require('../config');
    ConfigManager.getInstance.mockReturnValue({
      getConfig: jest.fn().mockReturnValue({
        provider: 'openai',
        apiKey: 'test-api-key',
        model: 'gpt-4',
        rateLimit: {
          maxRequestsPerMinute: 10,
          maxTokensPerMinute: 10000,
          maxConcurrentRequests: 3
        }
      })
    });
    
    // Mock the ModuleGenerationOrchestrator
    jest.spyOn(ModuleGenerationOrchestrator.prototype, 'generateModule').mockImplementation(async (options) => {
      return {
        module: {
          id: 'module-123',
          title: options.topic,
          description: `Module about ${options.topic}`,
          difficulty: options.difficulty || 'intermediate',
          estimatedTime: options.duration,
          content: {
            introduction: 'Introduction',
            sections: [],
            summary: 'Summary'
          }
        } as any,
        content: {
          introduction: 'Introduction',
          sections: [],
          summary: 'Summary'
        },
        quiz: options.quizQuestions ? {
          id: 'quiz-123',
          title: 'Quiz',
          description: 'Assessment',
          questions: []
        } : undefined,
        bibliography: options.includeBibliography ? [] : undefined
      };
    });

    llmOrchestrator = new LLMOrchestrator();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateModule', () => {
    it('should generate module with default options', async () => {
      const result = await llmOrchestrator.generateModule({
        topic: 'Shadow Work'
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('Shadow Work');
      expect(result.difficulty).toBe('intermediate');
    });

    it('should generate module with custom options', async () => {
      const result = await llmOrchestrator.generateModule({
        topic: 'Advanced Archetypes',
        targetAudience: 'Therapists',
        difficulty: 'advanced'
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('Advanced Archetypes');
      expect(result.difficulty).toBe('advanced');
    });
  });

  describe('generateQuiz', () => {
    it('should generate quiz with specified options', async () => {
      const result = await llmOrchestrator.generateQuiz({
        topic: 'Personality Types',
        numberOfQuestions: 20,
        difficulty: 'intermediate'
      });

      expect(result).toBeDefined();
      expect(ModuleGenerationOrchestrator.prototype.generateModule).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Personality Types',
          quizQuestions: 20,
          difficulty: 'intermediate'
        })
      );
    });
  });

  describe('generateBibliography', () => {
    it('should generate bibliography with default count', async () => {
      const result = await llmOrchestrator.generateBibliography({
        topic: 'Dream Analysis'
      });

      expect(result).toBeDefined();
      expect(ModuleGenerationOrchestrator.prototype.generateModule).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Dream Analysis',
          includeBibliography: true,
          bibliographyCount: 10,
          difficulty: 'advanced'
        })
      );
    });

    it('should generate bibliography with custom count', async () => {
      const result = await llmOrchestrator.generateBibliography({
        topic: 'Symbolism',
        count: 20
      });

      expect(result).toBeDefined();
      expect(ModuleGenerationOrchestrator.prototype.generateModule).toHaveBeenCalledWith(
        expect.objectContaining({
          bibliographyCount: 20
        })
      );
    });
  });
});