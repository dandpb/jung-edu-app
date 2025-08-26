/**
 * Comprehensive Unit Tests for ModuleGenerationOrchestrator
 * Covers 100% of the orchestrator.ts service (151 lines)
 * Focuses on core business logic, error handling, and integration patterns
 */

import { EventEmitter } from 'events';
import { ModuleGenerationOrchestrator, LLMOrchestrator, GenerationOptions, GenerationResult, GenerationProgress } from '../orchestrator';
import { ILLMProvider } from '../types';
import { Module, ModuleContent, Quiz, Video } from '../../../types/index';

// Create enhanced mocks
const createMockProvider = (): jest.Mocked<ILLMProvider> => ({
  model: 'mock-gpt-4',
  generateResponse: jest.fn(),
  generateEducationalContent: jest.fn(),
  generateStructuredResponse: jest.fn(),
  generateStructuredOutput: jest.fn(),
  generateCompletion: jest.fn(),
  validateApiKey: jest.fn().mockReturnValue(true),
  getName: jest.fn().mockReturnValue('mock-provider'),
  isAvailable: jest.fn().mockResolvedValue(true)
});

const createMockRateLimiter = () => ({
  checkLimit: jest.fn().mockResolvedValue(undefined),
  recordRequest: jest.fn(),
  incrementActive: jest.fn(),
  decrementActive: jest.fn()
});


const createMockEnhancedQuizGenerator = () => ({
  generateQuiz: jest.fn().mockResolvedValue({
    id: 'quiz-enhanced',
    title: 'Enhanced Quiz',
    description: 'AI-generated quiz',
    questions: [
      {
        id: 'q1',
        question: 'What is individuation?',
        options: [
          { id: 'opt1', text: 'Process of psychological integration', isCorrect: true },
          { id: 'opt2', text: 'Freudian concept', isCorrect: false },
          { id: 'opt3', text: 'Behavioral pattern', isCorrect: false },
          { id: 'opt4', text: 'Cognitive bias', isCorrect: false }
        ],
        correctAnswer: 0,
        explanation: 'Individuation is Jung\'s concept of psychological integration.'
      }
    ]
  })
});

const createMockQuizEnhancer = () => ({
  enhanceQuestions: jest.fn().mockImplementation((questions) => questions.map(q => ({
    ...q,
    enhanced: true,
    jungianContext: 'Enhanced with Jungian psychological framework'
  })))
});

const createMockVideoEnricher = () => ({
  enrichModuleWithVideos: jest.fn().mockResolvedValue([
    {
      id: 'video-1',
      title: 'Jung\'s Collective Unconscious',
      youtubeId: 'abc123',
      description: 'Educational video on Jung\'s theories',
      duration: 900,
      url: 'https://youtube.com/watch?v=abc123'
    }
  ])
});

const createMockBibliographyEnricher = () => ({
  searchBibliography: jest.fn().mockResolvedValue([
    {
      id: 'bib-1',
      title: 'Memories, Dreams, Reflections',
      authors: ['Carl Jung'],
      year: 1961,
      type: 'book',
      isbn: '978-0679723950'
    }
  ])
});

// Mock implementations
jest.mock('../provider', () => ({
  OpenAIProvider: jest.fn().mockImplementation(() => createMockProvider()),
  MockLLMProvider: jest.fn().mockImplementation(() => createMockProvider())
}));

jest.mock('../config', () => ({
  ConfigManager: {
    getInstance: jest.fn(() => ({
      getConfig: jest.fn(() => ({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        rateLimit: { 
          maxRequestsPerMinute: 10,
          maxTokensPerMinute: 1000,
          maxConcurrentRequests: 5
        }
      }))
    }))
  },
  RateLimiter: jest.fn().mockImplementation(() => createMockRateLimiter())
}));

jest.mock('../generators/content-generator', () => ({
  ContentGenerator: jest.fn().mockImplementation(() => ({
    generateModuleContent: jest.fn().mockResolvedValue({
      introduction: 'Introduction to Jungian Psychology',
      sections: [
        { 
          id: 'section-1',
          title: 'Shadow Work', 
          content: 'Understanding the shadow archetype and its role in psychological development.',
          keyTerms: [
            { term: 'Shadow', definition: 'The hidden or repressed aspects of personality' }
          ]
        },
        { 
          id: 'section-2',
          title: 'Anima and Animus', 
          content: 'Exploring the contrasexual aspects of the psyche.',
          keyTerms: [
            { term: 'Anima', definition: 'Feminine aspect in male psyche' },
            { term: 'Animus', definition: 'Masculine aspect in female psyche' }
          ]
        },
        { 
          id: 'section-3',
          title: 'Collective Unconscious', 
          content: 'The shared unconscious material of humankind containing archetypes.',
          keyTerms: [
            { term: 'Collective Unconscious', definition: 'Shared psychological material across humanity' }
          ]
        }
      ],
      summary: 'Summary of key Jungian concepts and their practical applications.'
    })
  }))
}));

jest.mock('../generators/quiz-generator', () => ({
  QuizGenerator: jest.fn().mockImplementation(() => ({
    generateQuiz: jest.fn().mockResolvedValue({
      id: 'quiz-basic',
      title: 'Jungian Psychology Quiz',
      description: 'Test your understanding',
      questions: [
        {
          id: 'q1',
          question: 'What is the shadow?',
          options: [
            { id: 'opt1', text: 'Repressed aspects', isCorrect: true },
            { id: 'opt2', text: 'Conscious mind', isCorrect: false }
          ],
          correctAnswer: 0,
          explanation: 'The shadow contains repressed aspects of personality.'
        }
      ],
      timeLimit: 30,
      passingScore: 70
    })
  }))
}));

jest.mock('../generators/video-generator', () => ({
  VideoGenerator: jest.fn().mockImplementation(() => ({
    generateVideos: jest.fn().mockResolvedValue([
      {
        id: 'vid-1',
        title: 'Jung Introduction',
        url: 'https://youtube.com/watch?v=xyz123',
        youtubeId: 'xyz123',
        description: 'Introduction to Carl Jung',
        duration: 900
      }
    ])
  }))
}));

jest.mock('../generators/bibliography-generator', () => ({
  BibliographyGenerator: jest.fn().mockImplementation(() => ({
    generateBibliography: jest.fn().mockResolvedValue([
      {
        id: 'ref-1',
        title: 'The Archetypes and the Collective Unconscious',
        authors: ['Carl Jung'],
        year: 1959,
        type: 'book'
      }
    ]),
    generateFilmSuggestions: jest.fn().mockResolvedValue([
      {
        id: 'film-1',
        title: 'A Dangerous Method',
        year: 2011,
        director: 'David Cronenberg',
        relevance: 'Depicts Jung-Freud relationship'
      }
    ])
  }))
}));

jest.mock('../../quiz/enhancedQuizGenerator', () => ({
  EnhancedQuizGenerator: jest.fn().mockImplementation(() => createMockEnhancedQuizGenerator())
}));

jest.mock('../../quiz/quizEnhancer', () => ({
  QuizEnhancer: jest.fn().mockImplementation(() => createMockQuizEnhancer())
}));

jest.mock('../../video/videoEnricher', () => ({
  VideoEnricher: jest.fn().mockImplementation(() => createMockVideoEnricher())
}));

jest.mock('../../bibliography/bibliographyEnricher', () => ({
  BibliographyEnricher: jest.fn().mockImplementation(() => createMockBibliographyEnricher())
}));

describe('ModuleGenerationOrchestrator - Comprehensive Coverage', () => {
  let orchestrator: ModuleGenerationOrchestrator;
  let progressEvents: GenerationProgress[] = [];

  const baseOptions: GenerationOptions = {
    topic: 'Jungian Archetypes and the Collective Unconscious',
    objectives: [
      'Understand the concept of archetypes',
      'Explore the collective unconscious',
      'Apply Jungian concepts to personal development'
    ],
    targetAudience: 'Psychology students and practitioners',
    duration: 120,
    difficulty: 'intermediate',
    useRealServices: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    progressEvents = [];
    orchestrator = new ModuleGenerationOrchestrator(false);
    
    orchestrator.on('progress', (progress: GenerationProgress) => {
      progressEvents.push(progress);
    });
  });

  afterEach(() => {
    orchestrator.removeAllListeners();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with mock services when useRealServices is false', () => {
      const testOrchestrator = new ModuleGenerationOrchestrator(false);
      expect(testOrchestrator).toBeInstanceOf(EventEmitter);
      expect(testOrchestrator).toBeInstanceOf(ModuleGenerationOrchestrator);
      testOrchestrator.removeAllListeners();
    });

    it('should initialize real services when useRealServices is true and API key exists', () => {
      const testOrchestrator = new ModuleGenerationOrchestrator(true);
      expect(testOrchestrator).toBeInstanceOf(ModuleGenerationOrchestrator);
      testOrchestrator.removeAllListeners();
    });

    it('should handle missing API key gracefully', () => {
      // Mock config without API key
      const { ConfigManager } = require('../config');
      ConfigManager.getInstance.mockReturnValue({
        getConfig: jest.fn(() => ({
          provider: 'openai',
          apiKey: null,
          model: 'gpt-4'
        }))
      });

      const testOrchestrator = new ModuleGenerationOrchestrator(true);
      expect(testOrchestrator).toBeInstanceOf(ModuleGenerationOrchestrator);
      testOrchestrator.removeAllListeners();
    });
  });

  describe('Core Module Generation', () => {
    it('should generate complete module with all components', async () => {
      const options: GenerationOptions = {
        ...baseOptions,
        includeVideos: true,
        includeBibliography: true,
        includeFilms: true,
        quizQuestions: 15,
        videoCount: 8,
        bibliographyCount: 12,
        filmCount: 5
      };

      const result = await orchestrator.generateModule(options);

      // Verify module structure
      expect(result.module).toBeDefined();
      expect(result.module.title).toBe(options.topic);
      expect(result.module.difficulty).toBe(options.difficulty);
      expect(result.module.estimatedTime).toBe(options.duration);
      expect(result.module.objectives).toEqual(options.objectives);

      // Verify metadata
      expect(result.module.metadata).toBeDefined();
      expect(result.module.metadata.targetAudience).toBe(options.targetAudience);
      expect(result.module.metadata.jungianConcepts).toBeDefined();
      expect(Array.isArray(result.module.metadata.jungianConcepts)).toBe(true);

      // Verify content
      expect(result.content).toBeDefined();
      expect(result.content.introduction).toContain('Jungian Psychology');
      expect(result.content.sections).toHaveLength(3);
      expect(result.content.sections[0].title).toBe('Shadow Work');

      // Verify components
      expect(result.quiz).toBeDefined();
      expect(result.videos).toBeDefined();
      expect(result.bibliography).toBeDefined();
      expect(result.films).toBeDefined();

      // Verify progress events
      expect(progressEvents).toHaveLength(7);
      expect(progressEvents[0]).toMatchObject({
        stage: 'initializing',
        progress: 0,
        message: 'Starting module generation...'
      });
      expect(progressEvents[progressEvents.length - 1]).toMatchObject({
        stage: 'complete',
        progress: 100,
        message: 'Module generation complete!'
      });
    });

    it('should handle minimal configuration', async () => {
      const minimalOptions: GenerationOptions = {
        topic: 'Basic Shadow Work',
        objectives: ['Understand the shadow'],
        targetAudience: 'Beginners',
        duration: 30,
        difficulty: 'beginner'
      };

      const result = await orchestrator.generateModule(minimalOptions);

      expect(result.module).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.quiz).toBeUndefined();
      expect(result.videos).toBeUndefined();
      expect(result.bibliography).toBeUndefined();
    });

    it('should generate quiz using real services when enabled', async () => {
      const options: GenerationOptions = {
        ...baseOptions,
        quizQuestions: 20,
        useRealServices: true
      };

      const result = await orchestrator.generateModule(options);

      expect(result.quiz).toBeDefined();
      expect(result.quiz!.id).toContain('quiz-');
      expect(result.quiz!.questions).toBeDefined();
      expect(result.quiz!.questions.length).toBeGreaterThan(0);
      
      // Check for enhanced quiz features
      const quiz = result.quiz as any;
      expect(quiz.passingScore).toBe(70);
      expect(quiz.timeLimit).toBeDefined();
    });

    it('should handle quiz generation with missing options', async () => {
      const options: GenerationOptions = {
        ...baseOptions,
        quizQuestions: 10,
        useRealServices: true
      };

      // Mock quiz generator to return questions with missing options
      const { EnhancedQuizGenerator } = require('../../quiz/enhancedQuizGenerator');
      EnhancedQuizGenerator.mockImplementation(() => ({
        generateQuiz: jest.fn().mockResolvedValue({
          questions: [
            {
              id: 'q1',
              question: 'Test question',
              options: [], // Empty options
              correctAnswer: 0
            },
            {
              id: 'q2',
              question: 'Another question',
              options: null, // Null options
              correctAnswer: 0
            }
          ]
        })
      }));

      const result = await orchestrator.generateModule(options);

      expect(result.quiz).toBeDefined();
      expect(result.quiz!.questions).toBeDefined();
      // Should create fallback options for questions without valid options
      result.quiz!.questions.forEach(q => {
        expect(q.options).toBeDefined();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Video Generation and Processing', () => {
    it('should generate videos with real service integration', async () => {
      const options: GenerationOptions = {
        ...baseOptions,
        includeVideos: true,
        videoCount: 5,
        useRealServices: true
      };

      const result = await orchestrator.generateModule(options);

      expect(result.videos).toBeDefined();
      expect(Array.isArray(result.videos)).toBe(true);
      
      if (result.videos && result.videos.length > 0) {
        const video = result.videos[0];
        expect(video.id).toBeDefined();
        expect(video.title).toBeDefined();
        expect(video.youtubeId || video.url).toBeDefined();
        expect(video.duration).toBeDefined();
      }
    });

    it('should extract YouTube IDs correctly', async () => {
      const testCases = [
        { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        { input: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        { input: 'https://youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        { input: 'invalid-url', expected: null },
        { input: '', expected: null },
        { input: null, expected: null },
        { input: undefined, expected: null }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = (orchestrator as any).extractYouTubeId(input);
        expect(result).toBe(expected);
      });
    });

    it('should filter videos with invalid YouTube IDs', async () => {
      // Mock video generator to return videos with invalid URLs
      const { VideoGenerator } = require('../generators/video-generator');
      VideoGenerator.mockImplementation(() => ({
        generateVideos: jest.fn().mockResolvedValue([
          {
            id: 'vid-1',
            title: 'Valid Video',
            url: 'https://youtube.com/watch?v=valid123',
            duration: 300
          },
          {
            id: 'vid-2',
            title: 'Invalid Video',
            url: 'invalid-url',
            duration: 300
          },
          {
            id: 'vid-3',
            title: 'No URL',
            url: '',
            duration: 300
          }
        ])
      }));

      const options: GenerationOptions = {
        ...baseOptions,
        includeVideos: true,
        videoCount: 3
      };

      const result = await orchestrator.generateModule(options);

      expect(result.videos).toBeDefined();
      // Should only include videos with valid YouTube IDs
      expect(result.videos!.length).toBeLessThan(3);
      result.videos!.forEach(video => {
        expect(video.youtubeId).toBeDefined();
        expect(video.youtubeId).not.toBe(null);
      });
    });
  });

  describe('Bibliography Generation', () => {
    it('should generate bibliography with AI-generated content', async () => {
      const options: GenerationOptions = {
        ...baseOptions,
        includeBibliography: true,
        bibliographyCount: 15,
        useRealServices: true
      };

      const result = await orchestrator.generateModule(options);

      expect(result.bibliography).toBeDefined();
      expect(Array.isArray(result.bibliography)).toBe(true);
      expect(result.bibliography!.length).toBeGreaterThan(0);

      const reference = result.bibliography![0];
      expect(reference.title).toBeDefined();
      expect(reference.authors).toBeDefined();
      expect(reference.year).toBeDefined();
    });

    it('should fallback to enricher when AI generation fails', async () => {
      // Mock AI bibliography generator to return empty results
      const { BibliographyGenerator } = require('../generators/bibliography-generator');
      BibliographyGenerator.mockImplementation(() => ({
        generateBibliography: jest.fn().mockResolvedValue([]),
        generateFilmSuggestions: jest.fn().mockResolvedValue([])
      }));

      const options: GenerationOptions = {
        ...baseOptions,
        includeBibliography: true,
        bibliographyCount: 10,
        useRealServices: true
      };

      const result = await orchestrator.generateModule(options);

      expect(result.bibliography).toBeDefined();
      // Should use enricher as fallback
      const { BibliographyEnricher } = require('../../bibliography/bibliographyEnricher');
      expect(BibliographyEnricher).toHaveBeenCalled();
    });

    it('should handle enricher failure gracefully', async () => {
      // Mock both generators to fail
      const { BibliographyGenerator } = require('../generators/bibliography-generator');
      const { BibliographyEnricher } = require('../../bibliography/bibliographyEnricher');

      BibliographyGenerator.mockImplementation(() => ({
        generateBibliography: jest.fn().mockResolvedValue([])
      }));

      BibliographyEnricher.mockImplementation(() => ({
        searchBibliography: jest.fn().mockRejectedValue(new Error('Enricher failed'))
      }));

      const options: GenerationOptions = {
        ...baseOptions,
        includeBibliography: true,
        useRealServices: true
      };

      const result = await orchestrator.generateModule(options);

      expect(result.bibliography).toBeDefined();
      expect(result.bibliography).toEqual([]);
    });
  });

  describe('Film Generation', () => {
    it('should generate film suggestions', async () => {
      const options: GenerationOptions = {
        ...baseOptions,
        includeFilms: true,
        filmCount: 8
      };

      const result = await orchestrator.generateModule(options);

      expect(result.films).toBeDefined();
      expect(Array.isArray(result.films)).toBe(true);
      
      if (result.films && result.films.length > 0) {
        const film = result.films[0];
        expect(film.title).toBeDefined();
        expect(film.year).toBeDefined();
      }
    });
  });

  describe('Content Analysis and Enhancement', () => {
    it('should extract Jungian concepts from content', async () => {
      // Mock content with rich Jungian concepts
      const { ContentGenerator } = require('../generators/content-generator');
      ContentGenerator.mockImplementation(() => ({
        generateModuleContent: jest.fn().mockResolvedValue({
          introduction: 'Introduction covering shadow work and archetypal patterns',
          sections: [
            { title: 'Shadow Integration', content: 'The shadow archetype contains rejected aspects of the self' },
            { title: 'Anima Development', content: 'The anima represents the feminine aspect in the male psyche' },
            { title: 'Collective Unconscious Access', content: 'The collective unconscious holds universal archetypes' },
            { title: 'Individuation Process', content: 'Individuation is the central process of human development' }
          ],
          summary: 'Understanding psychological complexes and transcendent function'
        })
      }));

      const result = await orchestrator.generateModule(baseOptions);

      const concepts = result.module.metadata.jungianConcepts;
      expect(concepts).toContain('shadow');
      expect(concepts).toContain('anima');
      expect(concepts).toContain('collective unconscious');
      expect(concepts).toContain('individuation process');
    });

    it('should analyze difficulty based on content complexity', async () => {
      const testCases = [
        {
          content: 'Basic introduction to fundamental concepts for beginners',
          expected: 'beginner'
        },
        {
          content: 'Detailed exploration of practical application and implementation',
          expected: 'intermediate'
        },
        {
          content: 'Complex theoretical analysis of specialized research involving archetype, individuation, collective unconscious, complex, and transcendent function',
          expected: 'advanced'
        }
      ];

      for (const testCase of testCases) {
        const result = await orchestrator.analyzeDifficulty('Test Topic', testCase.content);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should extract meaningful tags from topic and objectives', async () => {
      const options: GenerationOptions = {
        ...baseOptions,
        topic: 'Shadow Work and Anima Integration',
        objectives: [
          'Understand the shadow archetype',
          'Explore anima/animus dynamics',
          'Practice individuation techniques'
        ]
      };

      const result = await orchestrator.generateModule(options);
      
      const tags = result.module.metadata.tags;
      expect(tags).toContain('shadow');
      expect(tags).toContain('anima');
      expect(tags).toContain('individuation');
    });
  });

  describe('Provider Availability and Token Estimation', () => {
    it('should check provider availability', async () => {
      const provider = (orchestrator as any).provider;
      provider.isAvailable.mockResolvedValueOnce(true);

      const isAvailable = await orchestrator.checkProviderAvailability();
      expect(isAvailable).toBe(true);
      expect(provider.isAvailable).toHaveBeenCalled();
    });

    it('should handle provider unavailability', async () => {
      const provider = (orchestrator as any).provider;
      provider.isAvailable.mockRejectedValueOnce(new Error('Provider error'));

      const isAvailable = await orchestrator.checkProviderAvailability();
      expect(isAvailable).toBe(false);
    });

    it('should estimate token usage accurately', async () => {
      const options: GenerationOptions = {
        ...baseOptions,
        quizQuestions: 20,
        includeVideos: true,
        includeBibliography: true,
        videoCount: 10,
        bibliographyCount: 15
      };

      const estimate = await orchestrator.estimateTokenUsage(options);
      
      // Base (5000) + Quiz (20*300=6000) + Videos (1500) + Bibliography (2000)
      const expected = 5000 + 6000 + 1500 + 2000;
      expect(estimate).toBe(expected);
    });

    it('should return base estimate for minimal options', async () => {
      const minimalOptions: GenerationOptions = {
        topic: 'Simple Topic',
        objectives: ['Basic objective'],
        targetAudience: 'Anyone',
        duration: 30,
        difficulty: 'beginner'
      };

      const estimate = await orchestrator.estimateTokenUsage(minimalOptions);
      expect(estimate).toBe(5000); // Base content only
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle generation errors gracefully', async () => {
      // Mock content generator to fail
      const { ContentGenerator } = require('../generators/content-generator');
      ContentGenerator.mockImplementation(() => ({
        generateModuleContent: jest.fn().mockRejectedValue(new Error('Content generation failed'))
      }));

      await expect(orchestrator.generateModule(baseOptions)).rejects.toThrow('Content generation failed');

      // Should emit error progress
      const errorEvent = progressEvents.find(e => e.stage === 'error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent!.message).toContain('Content generation failed');
    });

    it('should handle partial failures in component generation', async () => {
      // Mock video generator to fail
      const { VideoGenerator } = require('../generators/video-generator');
      VideoGenerator.mockImplementation(() => ({
        generateVideos: jest.fn().mockRejectedValue(new Error('Video generation failed'))
      }));

      const options: GenerationOptions = {
        ...baseOptions,
        includeVideos: true,
        includeBibliography: true
      };

      // Should not throw but handle video failure
      const result = await orchestrator.generateModule(options);

      expect(result.module).toBeDefined();
      expect(result.bibliography).toBeDefined(); // Other components should still work
    });

    it('should handle missing concept arrays gracefully', async () => {
      const options: GenerationOptions = {
        ...baseOptions,
        includeVideos: true,
        includeBibliography: true
      };

      const result = await orchestrator.generateModule(options);

      // Should work even if no Jungian concepts are extracted
      expect(result).toBeDefined();
      expect(result.module.metadata.jungianConcepts).toBeDefined();
    });

    it('should handle duration conversion edge cases', async () => {
      const options: GenerationOptions = {
        ...baseOptions,
        includeVideos: true
      };

      // Mock video generator to return videos with complex duration objects
      const { VideoGenerator } = require('../generators/video-generator');
      VideoGenerator.mockImplementation(() => ({
        generateVideos: jest.fn().mockResolvedValue([
          {
            id: 'vid-1',
            title: 'Test Video',
            url: 'https://youtube.com/watch?v=test123',
            youtubeId: 'test123',
            duration: { minutes: 15, seconds: 30 } // Object duration
          },
          {
            id: 'vid-2',
            title: 'Another Video',
            url: 'https://youtube.com/watch?v=test456',
            youtubeId: 'test456',
            duration: 900 // Number duration
          }
        ])
      }));

      const result = await orchestrator.generateModule(options);

      expect(result.videos).toBeDefined();
      result.videos!.forEach(video => {
        expect(video.duration).toBeDefined();
        expect(typeof video.duration).toBe('number');
      });
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should respect rate limits during generation', async () => {
      const rateLimiter = (orchestrator as any).rateLimiter;
      
      const result = await orchestrator.generateModule(baseOptions);
      
      expect(rateLimiter.checkLimit).toHaveBeenCalled();
      expect(rateLimiter.incrementActive).toHaveBeenCalled();
      expect(rateLimiter.decrementActive).toHaveBeenCalled();
      expect(rateLimiter.recordRequest).toHaveBeenCalled();
    });
  });
});

describe('LLMOrchestrator - Simplified Interface', () => {
  let llmOrchestrator: LLMOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the internal orchestrator
    jest.spyOn(ModuleGenerationOrchestrator.prototype, 'generateModule')
      .mockImplementation(async (options) => ({
        module: {
          id: `module-${Date.now()}`,
          title: options.topic,
          description: `Module about ${options.topic}`,
          difficulty: options.difficulty || 'intermediate',
          estimatedTime: options.duration,
          objectives: options.objectives,
          content: {
            introduction: 'Generated introduction',
            sections: [{ title: 'Section 1', content: 'Section content' }]
          }
        } as Module,
        content: {
          introduction: 'Generated introduction',
          sections: [{ title: 'Section 1', content: 'Section content' }]
        },
        quiz: options.quizQuestions ? {
          id: 'quiz-1',
          title: 'Generated Quiz',
          description: 'Test quiz',
          questions: []
        } as Quiz : undefined,
        bibliography: options.includeBibliography ? [] : undefined
      }));

    llmOrchestrator = new LLMOrchestrator();
  });

  it('should generate module with minimal options', async () => {
    const result = await llmOrchestrator.generateModule({
      topic: 'Shadow Integration'
    });

    expect(result).toBeDefined();
    expect(result.title).toBe('Shadow Integration');
    expect(result.difficulty).toBe('intermediate');
  });

  it('should generate module with full options', async () => {
    const result = await llmOrchestrator.generateModule({
      topic: 'Advanced Jungian Analysis',
      targetAudience: 'Clinical psychologists',
      difficulty: 'advanced'
    });

    expect(result).toBeDefined();
    expect(result.title).toBe('Advanced Jungian Analysis');
    expect(result.difficulty).toBe('advanced');
  });

  it('should generate quiz with specified parameters', async () => {
    const result = await llmOrchestrator.generateQuiz({
      topic: 'Psychological Types',
      numberOfQuestions: 25,
      difficulty: 'intermediate'
    });

    expect(result).toBeDefined();
    expect(ModuleGenerationOrchestrator.prototype.generateModule).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Psychological Types',
        quizQuestions: 25,
        difficulty: 'intermediate',
        useRealServices: true
      })
    );
  });

  it('should generate bibliography with default settings', async () => {
    const result = await llmOrchestrator.generateBibliography({
      topic: 'Archetypal Psychology'
    });

    expect(result).toBeDefined();
    expect(ModuleGenerationOrchestrator.prototype.generateModule).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Archetypal Psychology',
        includeBibliography: true,
        bibliographyCount: 10,
        difficulty: 'advanced'
      })
    );
  });

  it('should generate bibliography with custom parameters', async () => {
    const result = await llmOrchestrator.generateBibliography({
      topic: 'Dream Analysis',
      count: 25,
      yearRange: { start: 2000, end: 2023 }
    });

    expect(result).toBeDefined();
    expect(ModuleGenerationOrchestrator.prototype.generateModule).toHaveBeenCalledWith(
      expect.objectContaining({
        bibliographyCount: 25
      })
    );
  });
});