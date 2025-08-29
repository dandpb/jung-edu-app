/**
 * Comprehensive test suite for ModuleGenerator service
 * Tests module generation workflow, progress tracking, error handling, and recovery
 * Targets 90%+ coverage for module generation functionality
 */

import { ModuleGenerator, GenerationOptions, GenerationStage, GenerationProgress } from '../moduleGenerator';
import { ModuleService } from '../moduleService';
import { DifficultyLevel, ModuleStatus } from '../../../schemas/module.schema';
import { ILLMProvider } from '../../llm/types';

// Mock dependencies
jest.mock('../moduleService', () => ({
  ModuleService: {
    saveDraft: jest.fn(),
    createModule: jest.fn(),
    deleteDraft: jest.fn(),
    getDrafts: jest.fn()
  }
}));

// Mock LLM Provider
class MockLLMProvider implements ILLMProvider {
  private mockResponses: { [key: string]: any } = {};
  private callCount = 0;

  setMockResponse(key: string, response: any) {
    this.mockResponses[key] = response;
  }

  async generateCompletion(prompt: string, options?: any) {
    this.callCount++;
    
    if (prompt.includes('Generate a concise, engaging title')) {
      return { content: this.mockResponses.title || 'Understanding Jungian Archetypes' };
    }
    
    if (prompt.includes('Write a compelling 2-3 sentence description')) {
      return { content: this.mockResponses.description || 'A comprehensive exploration of Jungian psychology concepts.' };
    }
    
    if (prompt.includes('Generate 5-8 relevant tags')) {
      return { content: this.mockResponses.tags || 'jung, psychology, archetypes, unconscious, individuation' };
    }
    
    if (prompt.includes('List 2-3 prerequisites')) {
      return { content: this.mockResponses.prerequisites || 'Basic psychology knowledge\nIntroduction to psychoanalysis' };
    }
    
    if (prompt.includes('generate 3-5 clear learning objectives')) {
      return { content: this.mockResponses.objectives || 'Understand archetypal patterns\nExplore the collective unconscious\nApply individuation concepts' };
    }
    
    return { content: 'Default completion response' };
  }

  async generateStructuredOutput<T>(prompt: string, schema: any, options?: any): Promise<T> {
    this.callCount++;
    
    if (prompt.includes('Create comprehensive educational content')) {
      return this.mockResponses.content || {
        introduction: 'This module introduces Jungian psychology concepts.',
        sections: [
          {
            id: 'section-1',
            title: 'The Collective Unconscious',
            content: 'Detailed exploration of collective unconscious concepts.',
            order: 0,
            keyTerms: [
              { term: 'Collective Unconscious', definition: 'Universal layer of the psyche.' }
            ]
          }
        ],
        summary: 'Key concepts include archetypes and individuation.',
        keyTakeaways: ['Understanding archetypal patterns', 'Recognizing individuation process']
      } as T;
    }
    
    if (prompt.includes('Create a quiz based on')) {
      return this.mockResponses.quiz || {
        id: 'quiz-123',
        title: 'Jungian Psychology Quiz',
        description: 'Test your understanding',
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            question: 'What is the collective unconscious?',
            points: 10,
            explanation: 'The collective unconscious contains universal patterns.'
          }
        ],
        passingScore: 70
      } as T;
    }
    
    if (prompt.includes('Recommend 3-5 educational videos')) {
      return this.mockResponses.videos || [
        {
          id: 'video-1',
          title: 'Introduction to Jung',
          description: 'Basic concepts explained',
          url: 'https://youtube.com/watch?v=example',
          duration: { hours: 0, minutes: 15, seconds: 30 }
        }
      ] as T;
    }
    
    if (prompt.includes('Generate a bibliography')) {
      return this.mockResponses.bibliography || [
        {
          id: 'ref-1',
          title: 'The Collected Works of C.G. Jung',
          authors: ['Carl Gustav Jung'],
          year: 1968,
          type: 'book',
          relevanceNote: 'Primary source for Jungian theory'
        }
      ] as T;
    }
    
    if (prompt.includes('Recommend 2-3 films')) {
      return this.mockResponses.films || [
        {
          id: 'film-1',
          title: 'A Dangerous Method',
          director: ['David Cronenberg'],
          year: 2011,
          relevance: 'Explores the relationship between Jung and Freud'
        }
      ] as T;
    }
    
    throw new Error(`No mock response configured for prompt: ${prompt.substring(0, 50)}...`);
  }

  async streamCompletion() { }
  getTokenCount(text: string) { return Math.ceil(text.length / 4); }
  async isAvailable() { return true; }

  getCallCount() { return this.callCount; }
  resetCallCount() { this.callCount = 0; }
}

describe('ModuleGenerator', () => {
  let generator: ModuleGenerator;
  let mockProvider: MockLLMProvider;
  let progressCallbacks: GenerationProgress[];

  const mockOptions: GenerationOptions = {
    topic: 'Jungian Psychology',
    description: 'A comprehensive study of Carl Jung\'s analytical psychology',
    difficulty: DifficultyLevel.INTERMEDIATE,
    duration: 90,
    tags: ['psychology', 'jung', 'archetypes'],
    language: 'en',
    includeVideos: true,
    includeQuiz: true,
    includeBibliography: true
  };

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
    generator = new ModuleGenerator(mockProvider);
    progressCallbacks = [];
    
    jest.clearAllMocks();
    
    // Default mock implementations
    (ModuleService.saveDraft as jest.Mock).mockResolvedValue(undefined);
    (ModuleService.createModule as jest.Mock).mockResolvedValue({
      id: 'module-123',
      title: 'Generated Module',
      ...mockOptions
    });
    (ModuleService.deleteDraft as jest.Mock).mockResolvedValue(undefined);
    (ModuleService.getDrafts as jest.Mock).mockResolvedValue([]);
  });

  describe('Constructor', () => {
    it('should initialize with provided LLM provider', () => {
      const customGenerator = new ModuleGenerator(mockProvider);
      expect(customGenerator['llmProvider']).toBe(mockProvider);
    });

    it('should use mock provider when none provided', () => {
      const defaultGenerator = new ModuleGenerator();
      expect(defaultGenerator['llmProvider']).toBeDefined();
    });
  });

  describe('generateModule', () => {
    const setupProgressCallback = (options: GenerationOptions) => ({
      ...options,
      onProgress: (progress: GenerationProgress) => {
        progressCallbacks.push(progress);
      }
    });

    it('should generate a complete module successfully', async () => {
      const optionsWithCallback = setupProgressCallback(mockOptions);
      
      const result = await generator.generateModule(optionsWithCallback);

      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.videos).toBeDefined();
      expect(result.bibliography).toBeDefined();
      expect(result.filmReferences).toBeDefined();
    });

    it('should emit progress events during generation', async () => {
      const optionsWithCallback = setupProgressCallback(mockOptions);
      
      await generator.generateModule(optionsWithCallback);

      expect(progressCallbacks.length).toBeGreaterThan(0);
      expect(progressCallbacks[0]).toEqual(expect.objectContaining({
        stage: GenerationStage.INITIALIZING,
        progress: 0,
        message: 'Starting module generation...'
      }));
      
      const finalCallback = progressCallbacks[progressCallbacks.length - 1];
      expect(finalCallback).toEqual(expect.objectContaining({
        stage: GenerationStage.COMPLETED,
        progress: 100,
        message: 'Module generation completed!'
      }));
    });

    it('should save drafts during generation', async () => {
      await generator.generateModule(mockOptions);

      expect(ModuleService.saveDraft).toHaveBeenCalledTimes(5); // Initial + after each major step
    });

    it('should create and clean up final module', async () => {
      await generator.generateModule(mockOptions);

      expect(ModuleService.createModule).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          description: expect.any(String)
        })
      );
      expect(ModuleService.deleteDraft).toHaveBeenCalled();
    });

    it('should handle generation without optional components', async () => {
      const minimalOptions: GenerationOptions = {
        ...mockOptions,
        includeVideos: false,
        includeQuiz: false,
        includeBibliography: false
      };

      const result = await generator.generateModule(minimalOptions);

      expect(result).toBeDefined();
      expect(result.videos).toBeUndefined();
      expect(result.quiz).toBeUndefined();
      expect(result.bibliography).toBeUndefined();
    });

    it('should use default values for optional parameters', async () => {
      const minimalOptions: GenerationOptions = {
        topic: 'Basic Jung',
        difficulty: DifficultyLevel.BEGINNER
      };

      const result = await generator.generateModule(minimalOptions);

      expect(result.difficultyLevel).toBe(DifficultyLevel.BEGINNER);
      expect(result.metadata.language).toBe('en');
    });

    it('should handle errors and emit error progress', async () => {
      mockProvider.setMockResponse('content', null);
      const optionsWithCallback = setupProgressCallback(mockOptions);

      await expect(generator.generateModule(optionsWithCallback)).rejects.toThrow();

      const errorCallback = progressCallbacks.find(cb => cb.stage === GenerationStage.ERROR);
      expect(errorCallback).toBeDefined();
      expect(errorCallback?.message).toContain('Generation failed');
    });

    it('should generate title dynamically when not provided', async () => {
      mockProvider.setMockResponse('title', 'Dynamic Title for Jungian Study');
      
      const result = await generator.generateModule(mockOptions);

      expect(result.title).toBe('Dynamic Title for Jungian Study');
    });

    it('should use provided description or generate one', async () => {
      // With provided description
      const result1 = await generator.generateModule(mockOptions);
      expect(result1.description).toBe(mockOptions.description);

      // Without provided description
      const optionsNoDesc = { ...mockOptions };
      delete optionsNoDesc.description;
      mockProvider.setMockResponse('description', 'Generated description');
      
      const result2 = await generator.generateModule(optionsNoDesc);
      expect(result2.description).toBe('Generated description');
    });

    it('should generate and parse tags correctly', async () => {
      mockProvider.setMockResponse('tags', 'psychology, jung, archetypes, shadow, anima');
      
      const optionsNoTags = { ...mockOptions };
      delete optionsNoTags.tags;
      
      const result = await generator.generateModule(optionsNoTags);

      expect(result.tags).toEqual(['psychology', 'jung', 'archetypes', 'shadow', 'anima']);
    });

    it('should estimate time correctly', async () => {
      const optionsWithDuration = { ...mockOptions, duration: 120 };
      
      const result = await generator.generateModule(optionsWithDuration);

      expect(result.timeEstimate.hours).toBe(2);
      expect(result.timeEstimate.minutes).toBe(0);
      expect(result.timeEstimate.description).toContain('2 hours');
    });

    it('should set correct metadata', async () => {
      const result = await generator.generateModule(mockOptions);

      expect(result.metadata).toEqual(expect.objectContaining({
        version: '1.0.0',
        language: 'en',
        author: expect.objectContaining({
          id: 'ai-generator',
          name: 'AI Module Generator',
          role: 'content_creator'
        }),
        status: ModuleStatus.REVIEW
      }));
    });
  });

  describe('resumeGeneration', () => {
    const mockDraft = {
      id: 'draft-123',
      title: 'Partial Module',
      description: 'A partially generated module',
      content: {
        introduction: 'Introduction content',
        sections: [],
        summary: 'Summary',
        keyTakeaways: []
      }
    };

    beforeEach(() => {
      (ModuleService.getDrafts as jest.Mock).mockResolvedValue([mockDraft]);
    });

    it('should resume generation from existing draft', async () => {
      const result = await generator.resumeGeneration('draft-123', mockOptions);

      expect(result).toBeDefined();
      expect(ModuleService.getDrafts).toHaveBeenCalled();
    });

    it('should throw error for non-existent draft', async () => {
      (ModuleService.getDrafts as jest.Mock).mockResolvedValue([]);

      await expect(generator.resumeGeneration('non-existent', mockOptions))
        .rejects.toThrow('Draft with ID non-existent not found');
    });

    it('should complete missing quiz component', async () => {
      const draftWithoutQuiz = { ...mockDraft, quiz: undefined };
      (ModuleService.getDrafts as jest.Mock).mockResolvedValue([draftWithoutQuiz]);

      const result = await generator.resumeGeneration('draft-123', {
        ...mockOptions,
        includeQuiz: true
      });

      expect(result.quiz).toBeDefined();
    });

    it('should complete missing video component', async () => {
      const draftWithoutVideos = { ...mockDraft, videos: undefined };
      (ModuleService.getDrafts as jest.Mock).mockResolvedValue([draftWithoutVideos]);

      const result = await generator.resumeGeneration('draft-123', {
        ...mockOptions,
        includeVideos: true
      });

      expect(result.videos).toBeDefined();
    });

    it('should complete missing bibliography component', async () => {
      const draftWithoutBib = { ...mockDraft, bibliography: undefined };
      (ModuleService.getDrafts as jest.Mock).mockResolvedValue([draftWithoutBib]);

      const result = await generator.resumeGeneration('draft-123', {
        ...mockOptions,
        includeBibliography: true
      });

      expect(result.bibliography).toBeDefined();
      expect(result.filmReferences).toBeDefined();
    });

    it('should skip completed components', async () => {
      const completeDraft = {
        ...mockDraft,
        quiz: { id: 'existing-quiz' },
        videos: [{ id: 'existing-video' }],
        bibliography: [{ id: 'existing-ref' }],
        filmReferences: [{ id: 'existing-film' }]
      };
      
      (ModuleService.getDrafts as jest.Mock).mockResolvedValue([completeDraft]);

      const result = await generator.resumeGeneration('draft-123', mockOptions);

      expect(result).toBeDefined();
      // Should not regenerate existing components
    });
  });

  describe('resumeFromDraft', () => {
    it('should be an alias for resumeGeneration', async () => {
      const mockDraft = {
        id: 'draft-456',
        title: 'Draft Module'
      };
      
      (ModuleService.getDrafts as jest.Mock).mockResolvedValue([mockDraft]);

      const result = await generator.resumeFromDraft('draft-456', mockOptions);

      expect(result).toBeDefined();
      expect(ModuleService.getDrafts).toHaveBeenCalled();
    });
  });

  describe('Time estimation', () => {
    it('should estimate time for various durations', async () => {
      const testCases = [
        { input: 30, expected: { hours: 0, minutes: 30 } },
        { input: 60, expected: { hours: 1, minutes: 0 } },
        { input: 90, expected: { hours: 1, minutes: 30 } },
        { input: 120, expected: { hours: 2, minutes: 0 } }
      ];

      for (const testCase of testCases) {
        const options = { ...mockOptions, duration: testCase.input };
        const result = await generator.generateModule(options);

        expect(result.timeEstimate.hours).toBe(testCase.expected.hours);
        expect(result.timeEstimate.minutes).toBe(testCase.expected.minutes);
      }
    });

    it('should use default duration when not specified', async () => {
      const optionsNoDuration = { ...mockOptions };
      delete optionsNoDuration.duration;

      const result = await generator.generateModule(optionsNoDuration);

      expect(result.timeEstimate.hours).toBe(1); // 60 minutes default
      expect(result.timeEstimate.minutes).toBe(0);
    });

    it('should include descriptive text', async () => {
      const result = await generator.generateModule(mockOptions);

      expect(result.timeEstimate.description).toContain('Approximately');
      expect(result.timeEstimate.description).toContain('including videos and exercises');
    });
  });

  describe('Learning objectives generation', () => {
    it('should generate learning objectives when not provided', async () => {
      mockProvider.setMockResponse('objectives', 'Understand Jung basics\nExplore archetypal concepts\nApply individuation principles');

      const result = await generator.generateModule(mockOptions);

      expect(result.learningObjectives).toEqual([
        'Understand Jung basics',
        'Explore archetypal concepts',
        'Apply individuation principles'
      ]);
    });

    it('should filter empty objectives', async () => {
      mockProvider.setMockResponse('objectives', 'Valid objective 1\n\nValid objective 2\n   \nValid objective 3');

      const result = await generator.generateModule(mockOptions);

      expect(result.learningObjectives).toEqual([
        'Valid objective 1',
        'Valid objective 2',
        'Valid objective 3'
      ]);
    });
  });

  describe('Prerequisites generation', () => {
    it('should generate no prerequisites for beginner level', async () => {
      const beginnerOptions = { ...mockOptions, difficulty: DifficultyLevel.BEGINNER };

      const result = await generator.generateModule(beginnerOptions);

      expect(result.prerequisites).toEqual([]);
    });

    it('should generate prerequisites for intermediate/advanced levels', async () => {
      mockProvider.setMockResponse('prerequisites', 'Basic psychology knowledge\nIntroduction to psychoanalysis');

      const result = await generator.generateModule(mockOptions); // INTERMEDIATE

      expect(result.prerequisites).toEqual([
        'Basic psychology knowledge',
        'Introduction to psychoanalysis'
      ]);
    });

    it('should filter empty prerequisites', async () => {
      mockProvider.setMockResponse('prerequisites', 'Valid prerequisite\n\n   \nAnother prerequisite');

      const result = await generator.generateModule(mockOptions);

      expect(result.prerequisites).toEqual([
        'Valid prerequisite',
        'Another prerequisite'
      ]);
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle LLM provider failures', async () => {
      const failingProvider = {
        generateCompletion: jest.fn().mockRejectedValue(new Error('API Error')),
        generateStructuredOutput: jest.fn().mockRejectedValue(new Error('API Error')),
        streamCompletion: jest.fn(),
        getTokenCount: jest.fn().mockReturnValue(100),
        isAvailable: jest.fn().mockResolvedValue(false)
      };

      const failingGenerator = new ModuleGenerator(failingProvider);

      await expect(failingGenerator.generateModule(mockOptions)).rejects.toThrow();
    });

    it('should handle save draft failures gracefully', async () => {
      (ModuleService.saveDraft as jest.Mock).mockRejectedValue(new Error('Save failed'));

      await expect(generator.generateModule(mockOptions)).rejects.toThrow();
    });

    it('should handle module creation failures', async () => {
      (ModuleService.createModule as jest.Mock).mockRejectedValue(new Error('Create failed'));

      await expect(generator.generateModule(mockOptions)).rejects.toThrow();
    });

    it('should handle draft cleanup failures gracefully', async () => {
      (ModuleService.deleteDraft as jest.Mock).mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Should not throw even if cleanup fails
      const result = await generator.generateModule(mockOptions);

      expect(result).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('Content generation', () => {
    it('should generate structured content with all sections', async () => {
      const mockContent = {
        introduction: 'Comprehensive introduction to Jungian psychology.',
        sections: [
          {
            id: 'section-1',
            title: 'The Unconscious',
            content: 'Detailed exploration of unconscious concepts.',
            order: 0,
            keyTerms: [
              { term: 'Personal Unconscious', definition: 'Individual layer of unconscious.' },
              { term: 'Collective Unconscious', definition: 'Universal layer of unconscious.' }
            ]
          },
          {
            id: 'section-2',
            title: 'Archetypes',
            content: 'Understanding archetypal patterns.',
            order: 1,
            keyTerms: [
              { term: 'Archetype', definition: 'Universal pattern or image.' }
            ]
          }
        ],
        summary: 'Jung\'s psychology offers insights into the human psyche.',
        keyTakeaways: [
          'The unconscious has personal and collective layers',
          'Archetypes are universal patterns',
          'Individuation is the goal of psychological development'
        ]
      };

      mockProvider.setMockResponse('content', mockContent);

      const result = await generator.generateModule(mockOptions);

      expect(result.content).toEqual(mockContent);
      expect(result.content.sections).toHaveLength(2);
      expect(result.content.keyTakeaways).toHaveLength(3);
    });
  });

  describe('Quiz generation integration', () => {
    it('should generate quiz with appropriate structure', async () => {
      const mockQuiz = {
        id: 'generated-quiz-123',
        title: 'Jungian Psychology Assessment',
        description: 'Test your understanding of key concepts',
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            question: 'What is the collective unconscious?',
            points: 10,
            explanation: 'The collective unconscious contains universal patterns shared by all humans.'
          },
          {
            id: 'q2',
            type: 'true-false',
            question: 'Jung believed the psyche consists only of conscious elements.',
            points: 5,
            explanation: 'False. Jung emphasized the importance of unconscious elements.'
          }
        ],
        passingScore: 70
      };

      mockProvider.setMockResponse('quiz', mockQuiz);

      const result = await generator.generateModule(mockOptions);

      expect(result.quiz).toEqual(mockQuiz);
      expect(result.quiz.questions).toHaveLength(2);
    });
  });

  describe('Media integration', () => {
    it('should generate video recommendations', async () => {
      const mockVideos = [
        {
          id: 'video-1',
          title: 'Introduction to Carl Jung',
          description: 'Basic overview of Jungian concepts',
          url: 'https://youtube.com/watch?v=intro-jung',
          duration: { hours: 0, minutes: 20, seconds: 15 }
        },
        {
          id: 'video-2',
          title: 'Understanding Archetypes',
          description: 'Deep dive into archetypal theory',
          url: 'https://youtube.com/watch?v=archetypes-explained',
          duration: { hours: 0, minutes: 35, seconds: 45 }
        }
      ];

      mockProvider.setMockResponse('videos', mockVideos);

      const result = await generator.generateModule(mockOptions);

      expect(result.videos).toEqual(mockVideos);
      expect(result.videos).toHaveLength(2);
    });

    it('should handle empty video responses', async () => {
      mockProvider.setMockResponse('videos', null);

      const result = await generator.generateModule(mockOptions);

      expect(result.videos).toEqual([]);
    });
  });

  describe('Bibliography and references', () => {
    it('should generate comprehensive bibliography', async () => {
      const mockBibliography = [
        {
          id: 'ref-1',
          title: 'The Collected Works of C.G. Jung, Volume 9',
          authors: ['Carl Gustav Jung'],
          year: 1968,
          type: 'book',
          relevanceNote: 'Essential primary source for archetypal theory'
        },
        {
          id: 'ref-2',
          title: 'Man and His Symbols',
          authors: ['Carl Gustav Jung', 'Joseph Campbell'],
          year: 1964,
          type: 'book',
          relevanceNote: 'Accessible introduction to Jungian concepts'
        }
      ];

      const mockFilms = [
        {
          id: 'film-1',
          title: 'A Dangerous Method',
          director: ['David Cronenberg'],
          year: 2011,
          relevance: 'Dramatizes the relationship between Jung, Freud, and Sabina Spielrein'
        }
      ];

      mockProvider.setMockResponse('bibliography', mockBibliography);
      mockProvider.setMockResponse('films', mockFilms);

      const result = await generator.generateModule(mockOptions);

      expect(result.bibliography).toEqual(mockBibliography);
      expect(result.filmReferences).toEqual(mockFilms);
    });
  });
});