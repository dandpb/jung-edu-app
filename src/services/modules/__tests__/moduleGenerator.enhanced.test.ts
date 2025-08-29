/**
 * Enhanced comprehensive test suite for ModuleGenerator
 * Validates and extends existing 91% coverage to ensure robust testing
 */

import { ModuleGenerator, GenerationOptions, GenerationStage } from '../moduleGenerator';
import { ModuleService } from '../moduleService';
import { ILLMProvider } from '../../llm/types';
import { OpenAIProvider, MockLLMProvider } from '../../llm/provider';
import { EducationalModule, DifficultyLevel, ModuleStatus } from '../../../schemas/module.schema';

// Mock dependencies
jest.mock('../moduleService');
jest.mock('../../llm/provider');
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234'
}));

const mockModuleService = ModuleService as jest.Mocked<typeof ModuleService>;
const mockOpenAIProvider = OpenAIProvider as jest.MockedClass<typeof OpenAIProvider>;
const mockMockLLMProvider = MockLLMProvider as jest.MockedClass<typeof MockLLMProvider>;

describe('ModuleGenerator Enhanced Tests', () => {
  let mockLLMProvider: jest.Mocked<ILLMProvider>;
  let generator: ModuleGenerator;
  let progressCallback: jest.Mock;

  const basicOptions: GenerationOptions = {
    topic: 'Shadow Integration',
    difficulty: DifficultyLevel.INTERMEDIATE,
    duration: 90,
    tags: ['shadow', 'integration', 'psychology'],
    language: 'en'
  };

  const mockModule: EducationalModule = {
    id: 'mock-uuid-1234',
    title: 'Shadow Integration: Understanding the Dark Side',
    description: 'A comprehensive exploration of shadow integration',
    content: {
      introduction: 'Introduction to shadow work',
      sections: [{
        id: 'section-1',
        title: 'Understanding the Shadow',
        content: 'Content about shadow',
        order: 0
      }]
    },
    videos: [],
    quiz: {
      id: 'quiz-1',
      title: 'Shadow Quiz',
      questions: []
    },
    bibliography: [],
    filmReferences: [],
    tags: ['shadow', 'integration'],
    difficultyLevel: DifficultyLevel.INTERMEDIATE,
    timeEstimate: { hours: 1, minutes: 30 },
    metadata: {
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      version: '1.0.0',
      status: ModuleStatus.DRAFT,
      language: 'en',
      author: {
        id: 'ai-generator',
        name: 'AI Module Generator',
        role: 'content_creator'
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock LLM provider
    mockLLMProvider = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      isConfigured: jest.fn().mockReturnValue(true),
      validateConfig: jest.fn().mockResolvedValue({ isValid: true })
    };

    // Setup progress callback
    progressCallback = jest.fn();
    
    // Setup ModuleService mocks
    mockModuleService.saveDraft = jest.fn().mockResolvedValue(undefined);
    mockModuleService.createModule = jest.fn().mockResolvedValue(mockModule);
    mockModuleService.deleteDraft = jest.fn().mockResolvedValue(true);
    mockModuleService.getDrafts = jest.fn().mockResolvedValue([]);

    // Setup generator with mock provider
    generator = new ModuleGenerator(mockLLMProvider);
  });

  describe('Constructor and Provider Selection', () => {
    it('should use provided LLM provider', () => {
      const customGenerator = new ModuleGenerator(mockLLMProvider);
      expect(customGenerator).toBeDefined();
    });

    it('should default to MockLLMProvider when no provider given', () => {
      const defaultGenerator = new ModuleGenerator();
      expect(mockMockLLMProvider).toHaveBeenCalledWith(1000);
    });

    it('should handle provider initialization errors', () => {
      const errorProvider = {
        ...mockLLMProvider,
        isConfigured: jest.fn().mockReturnValue(false)
      };
      
      const errorGenerator = new ModuleGenerator(errorProvider);
      expect(errorGenerator).toBeDefined();
    });
  });

  describe('generateModule - Core Flow', () => {
    beforeEach(() => {
      // Mock LLM responses
      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: 'Generated content',
        usage: { totalTokens: 100 }
      });

      mockLLMProvider.generateStructuredOutput.mockResolvedValue({
        introduction: 'Test introduction',
        sections: [
          {
            id: 'section-1',
            title: 'Test Section',
            content: 'Section content',
            order: 0,
            keyTerms: [{ term: 'Shadow', definition: 'Hidden aspects of personality' }]
          }
        ],
        summary: 'Test summary',
        keyTakeaways: ['Key takeaway 1']
      });
    });

    it('should complete full generation flow with progress updates', async () => {
      const options = { ...basicOptions, onProgress: progressCallback };
      
      const result = await generator.generateModule(options);
      
      expect(result).toBeDefined();
      expect(result.title).toContain('Shadow');
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: GenerationStage.INITIALIZING,
          progress: 0,
          message: 'Starting module generation...'
        })
      );
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: GenerationStage.COMPLETED,
          progress: 100,
          message: 'Module generation completed!'
        })
      );
    });

    it('should generate module with default options when topic provided', async () => {
      const basicOptions: GenerationOptions = {
        topic: 'Anima and Animus',
        difficulty: DifficultyLevel.INTERMEDIATE,
        duration: 60,
        language: 'pt-BR'
      };
      
      const result = await generator.generateModule(basicOptions);
      
      expect(result.title).toBeDefined();
      expect(result.difficultyLevel).toBe(DifficultyLevel.INTERMEDIATE);
      expect(result.timeEstimate.hours).toBe(1);
      expect(result.metadata.language).toBe('pt-BR');
    });

    it('should generate module with custom options object', async () => {
      const customOptions: GenerationOptions = {
        topic: 'Collective Unconscious',
        difficulty: DifficultyLevel.ADVANCED,
        duration: 120,
        language: 'en',
        includeVideos: false,
        includeQuiz: false,
        includeBibliography: false
      };
      
      const result = await generator.generateModule(customOptions);
      
      expect(result.difficultyLevel).toBe(DifficultyLevel.ADVANCED);
      expect(result.timeEstimate.hours).toBe(2);
      expect(result.metadata.language).toBe('en');
    });

    it('should save draft at each generation step', async () => {
      await generator.generateModule(basicOptions);
      
      expect(mockModuleService.saveDraft).toHaveBeenCalledTimes(5); // Called at each stage
    });

    it('should clean up draft after successful generation', async () => {
      await generator.generateModule(basicOptions);
      
      expect(mockModuleService.deleteDraft).toHaveBeenCalledWith('mock-uuid-1234');
    });

    it('should handle generation errors with proper error reporting', async () => {
      mockLLMProvider.generateStructuredOutput.mockRejectedValue(new Error('LLM Error'));
      
      await expect(generator.generateModule(basicOptions)).rejects.toThrow('LLM Error');
      
      // Should have reported error stage
      expect(mockModuleService.saveDraft).toHaveBeenCalled();
    });
  });

  describe('Content Generation Methods', () => {
    beforeEach(() => {
      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: 'Generated content response',
        usage: { totalTokens: 50 }
      });
    });

    it('should generate appropriate titles for different topics', async () => {
      const testCases = [
        { topic: 'Shadow Work', expected: 'Shadow' },
        { topic: 'Anima Animus', expected: 'Anima' },
        { topic: 'Collective Unconscious', expected: 'Collective' }
      ];

      for (const testCase of testCases) {
        const result = await (generator as any).generateTitle({ 
          topic: testCase.topic, 
          difficulty: DifficultyLevel.BEGINNER 
        });
        
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should generate descriptions with appropriate length', async () => {
      const result = await (generator as any).generateDescription(basicOptions);
      
      expect(typeof result).toBe('string');
      expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Shadow Integration'),
        expect.objectContaining({ maxTokens: 150 })
      );
    });

    it('should generate relevant tags as array', async () => {
      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: 'shadow, integration, psychology, Jung, unconscious',
        usage: { totalTokens: 25 }
      });

      const result = await (generator as any).generateTags(basicOptions);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toBe('shadow');
    });

    it('should handle empty or malformed tag responses', async () => {
      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: '',
        usage: { totalTokens: 0 }
      });

      const result = await (generator as any).generateTags(basicOptions);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toBe('');
    });
  });

  describe('Structured Content Generation', () => {
    it('should generate structured content with proper schema', async () => {
      const mockStructuredContent = {
        introduction: 'Generated introduction',
        sections: [
          {
            id: 'section-1',
            title: 'Main Concepts',
            content: 'Detailed content',
            order: 0,
            keyTerms: [{ term: 'Shadow', definition: 'Hidden aspects' }]
          }
        ],
        summary: 'Generated summary',
        keyTakeaways: ['Takeaway 1', 'Takeaway 2']
      };

      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockStructuredContent);

      const result = await (generator as any).generateContent(basicOptions);
      
      expect(result).toEqual(mockStructuredContent);
      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Shadow Integration'),
        expect.any(Object),
        expect.objectContaining({ maxTokens: 3000, temperature: 0.7 })
      );
    });

    it('should generate quiz with appropriate question types', async () => {
      const mockQuizContent = {
        id: 'quiz-123',
        title: 'Shadow Integration Quiz',
        description: 'Test your understanding',
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            question: 'What is the shadow?',
            points: 10,
            explanation: 'The shadow represents...'
          }
        ],
        passingScore: 70
      };

      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockQuizContent);

      const mockContent = { introduction: 'Test intro' };
      const result = await (generator as any).generateQuiz(basicOptions, mockContent);
      
      expect(result).toEqual(mockQuizContent);
      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Shadow Integration'),
        expect.any(Object),
        expect.objectContaining({ maxTokens: 2000, temperature: 0.6 })
      );
    });

    it('should handle video sourcing with mock recommendations', async () => {
      const mockVideos = [
        {
          id: 'video-1',
          title: 'Understanding Shadow Work',
          description: 'Introduction to shadow psychology',
          url: 'https://example.com/video1',
          duration: { hours: 0, minutes: 15, seconds: 30 }
        }
      ];

      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockVideos);

      const result = await (generator as any).sourceVideos(basicOptions);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bibliography and Film References', () => {
    it('should generate academic bibliography', async () => {
      const mockBibliography = [
        {
          id: 'bib-1',
          title: 'The Archetypes and the Collective Unconscious',
          authors: ['Jung, C.G.'],
          year: 1959,
          type: 'book',
          relevanceNote: 'Foundational text on shadow psychology'
        }
      ];

      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockBibliography);

      const result = await (generator as any).generateBibliography(basicOptions);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('authors');
      expect(result[0]).toHaveProperty('year');
    });

    it('should generate relevant film references', async () => {
      const mockFilms = [
        {
          id: 'film-1',
          title: 'Black Swan',
          director: ['Darren Aronofsky'],
          year: 2010,
          relevance: 'Explores shadow integration through dance'
        }
      ];

      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockFilms);

      const result = await (generator as any).generateFilmReferences(basicOptions);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('title');
        expect(result[0]).toHaveProperty('relevance');
      }
    });
  });

  describe('Module Finalization', () => {
    it('should add learning objectives during finalization', async () => {
      const mockObjectives = [
        'Understand the concept of the shadow',
        'Recognize shadow projections',
        'Practice shadow integration techniques'
      ];

      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: mockObjectives.join('\n'),
        usage: { totalTokens: 75 }
      });

      const testModule = { ...mockModule, learningObjectives: undefined };
      
      // Add a small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await (generator as any).finalizeModule(testModule);
      
      expect(result.learningObjectives).toBeDefined();
      expect(Array.isArray(result.learningObjectives)).toBe(true);
      expect(result.metadata.status).toBe(ModuleStatus.REVIEW);
      expect(new Date(result.metadata.updatedAt).getTime()).toBeGreaterThan(new Date(testModule.metadata.updatedAt).getTime());
    });

    it('should generate prerequisites for advanced modules', async () => {
      const advancedModule = {
        ...mockModule,
        difficultyLevel: DifficultyLevel.ADVANCED,
        title: 'Advanced Shadow Work'
      };

      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: 'Basic shadow awareness\nIntroduction to Jung\nBasic dream work',
        usage: { totalTokens: 50 }
      });

      const result = await (generator as any).finalizeModule(advancedModule);
      
      expect(result.prerequisites).toBeDefined();
      expect(Array.isArray(result.prerequisites)).toBe(true);
      expect(result.prerequisites.length).toBeGreaterThan(0);
    });

    it('should skip prerequisites for beginner modules', async () => {
      const beginnerModule = {
        ...mockModule,
        difficultyLevel: DifficultyLevel.BEGINNER
      };

      const result = await (generator as any).finalizeModule(beginnerModule);
      
      expect(result.prerequisites).toEqual([]);
    });
  });

  describe('Time Estimation', () => {
    it('should calculate time estimates correctly', () => {
      const testCases = [
        { input: 60, expected: { hours: 1, minutes: 0 } },
        { input: 90, expected: { hours: 1, minutes: 30 } },
        { input: 120, expected: { hours: 2, minutes: 0 } },
        { input: 45, expected: { hours: 0, minutes: 45 } }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = (generator as any).estimateTime(input);
        expect(result.hours).toBe(expected.hours);
        expect(result.minutes).toBe(expected.minutes);
        expect(result.description).toBeDefined();
      });
    });

    it('should provide default estimate when no duration given', () => {
      const result = (generator as any).estimateTime();
      
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(0);
      expect(result.description).toContain('hour');
    });

    it('should format descriptions correctly for different durations', () => {
      const singleHour = (generator as any).estimateTime(60);
      expect(singleHour.description).toBe('Approximately 1 hour including videos and exercises');

      const multipleHours = (generator as any).estimateTime(150);
      expect(multipleHours.description).toBe('Approximately 2 hours 30 minutes including videos and exercises');

      const minutesOnly = (generator as any).estimateTime(45);
      expect(minutesOnly.description).toBe('Approximately 45 minutes including videos and exercises');
    });
  });

  describe('Resume Generation', () => {
    const mockDraft = {
      id: 'draft-123',
      title: 'Draft Module',
      content: { introduction: 'Draft intro', sections: [] }
    };

    beforeEach(() => {
      mockModuleService.getDrafts.mockResolvedValue([mockDraft]);
    });

    it('should resume generation from existing draft', async () => {
      const result = await generator.resumeGeneration('draft-123', basicOptions);
      
      expect(mockModuleService.getDrafts).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error when draft not found', async () => {
      mockModuleService.getDrafts.mockResolvedValue([]);
      
      await expect(generator.resumeGeneration('non-existent', basicOptions))
        .rejects.toThrow('Draft with ID non-existent not found');
    });

    it('should continue from where draft left off', async () => {
      const incompleteDraft = {
        id: 'draft-123',
        title: 'Incomplete Draft',
        content: undefined, // Missing content
        quiz: { id: 'quiz', title: 'Quiz', questions: [] },
        videos: [],
        bibliography: []
      };

      mockModuleService.getDrafts.mockResolvedValue([incompleteDraft]);
      
      // Should restart generation since content is missing
      const result = await generator.resumeGeneration('draft-123', basicOptions);
      expect(result).toBeDefined();
    });

    it('should use resumeFromDraft method', async () => {
      const result = await generator.resumeFromDraft('draft-123', basicOptions);
      
      expect(result).toBeDefined();
      expect(mockModuleService.getDrafts).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle LLM provider failures gracefully', async () => {
      mockLLMProvider.generateCompletion.mockRejectedValue(new Error('API Error'));
      
      await expect(generator.generateModule(basicOptions))
        .rejects.toThrow('API Error');
    });

    it('should handle module service failures', async () => {
      mockModuleService.createModule.mockRejectedValue(new Error('Storage Error'));
      
      await expect(generator.generateModule(basicOptions))
        .rejects.toThrow('Storage Error');
    });

    it('should handle progress callback errors', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback Error');
      });
      
      const options = { ...basicOptions, onProgress: errorCallback };
      
      // Should not crash the generation process
      const result = await generator.generateModule(options);
      expect(result).toBeDefined();
    });

    it('should handle empty or undefined options gracefully', async () => {
      const result = await generator.generateModule('Simple Topic');
      
      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
    });

    it('should handle malformed LLM responses', async () => {
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(null);
      
      await expect(generator.generateModule(basicOptions))
        .rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with all features enabled', async () => {
      const fullOptions: GenerationOptions = {
        topic: 'Complete Jung Module',
        difficulty: DifficultyLevel.INTERMEDIATE,
        duration: 120,
        tags: ['jung', 'psychology', 'complete'],
        language: 'en',
        includeVideos: true,
        includeQuiz: true,
        includeBibliography: true,
        onProgress: progressCallback
      };

      const result = await generator.generateModule(fullOptions);
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.videos).toBeDefined();
      expect(result.bibliography).toBeDefined();
      expect(result.filmReferences).toBeDefined();
      
      // Should have called progress callback multiple times
      expect(progressCallback).toHaveBeenCalledTimes(6); // One for each stage
    });

    it('should work with minimal options', async () => {
      const minimalOptions: GenerationOptions = {
        topic: 'Basic Jung',
        difficulty: DifficultyLevel.BEGINNER,
        includeVideos: false,
        includeQuiz: false,
        includeBibliography: false
      };

      const result = await generator.generateModule(minimalOptions);
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.videos).toEqual([]);
      expect(result.bibliography).toEqual([]);
      expect(result.filmReferences).toEqual([]);
    });
  });
});