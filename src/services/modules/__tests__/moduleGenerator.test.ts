/**
 * Comprehensive Unit Tests for ModuleGenerator Service
 * Tests all methods, error scenarios, progress tracking, and resume functionality
 */

import { ModuleGenerator, GenerationOptions, GenerationStage, GenerationProgress } from '../moduleGenerator';
import { ModuleService } from '../moduleService';
import { ILLMProvider, LLMResponse } from '../../llm/types';
import { DifficultyLevel, ModuleStatus, EducationalModule } from '../../../schemas/module.schema';
import { MockLLMProvider } from '../../llm/provider';

// Mock dependencies
jest.mock('../moduleService');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

describe('ModuleGenerator', () => {
  let moduleGenerator: ModuleGenerator;
  let mockLLMProvider: jest.Mocked<ILLMProvider>;
  let mockProgressCallback: jest.Mock;
  
  // Mock data
  const mockModuleData = {
    id: 'mock-uuid-123',
    title: 'Mock Module Title',
    description: 'Mock module description',
    tags: ['psychology', 'jung'],
    difficultyLevel: DifficultyLevel.BEGINNER,
    timeEstimate: { hours: 1, minutes: 0, description: 'Approximately 1 hour including videos and exercises' },
    metadata: {
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
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

  const mockContent = {
    introduction: 'This is a mock introduction',
    sections: [
      {
        id: 'section1',
        title: 'Section 1',
        content: 'Section 1 content',
        order: 1,
        keyTerms: [{ term: 'term1', definition: 'definition1' }]
      }
    ],
    summary: 'Mock summary',
    keyTakeaways: ['Takeaway 1', 'Takeaway 2']
  };

  const mockQuiz = {
    id: 'quiz-1',
    title: 'Quiz Title',
    description: 'Quiz description',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is Jung known for?',
        points: 10,
        explanation: 'Jung developed analytical psychology'
      }
    ],
    passingScore: 70
  };

  const mockVideos = [
    {
      id: 'video1',
      title: 'Introduction to Jung',
      description: 'Basic introduction',
      url: 'https://youtube.com/watch?v=test',
      duration: { hours: 0, minutes: 15, seconds: 0 }
    }
  ];

  const mockBibliography = [
    {
      id: 'bib1',
      title: 'Man and His Symbols',
      authors: ['Carl Jung'],
      year: 1964,
      type: 'book',
      relevanceNote: 'Essential reading'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock LLM provider
    mockLLMProvider = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      getTokenCount: jest.fn((text: string) => Math.ceil(text.length / 4)),
      isAvailable: jest.fn().mockResolvedValue(true)
    };

    // Setup default mock responses
    mockLLMProvider.generateCompletion.mockResolvedValue({
      content: 'Mock generated content',
      usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 }
    });

    mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);

    mockProgressCallback = jest.fn();
    moduleGenerator = new ModuleGenerator(mockLLMProvider);
  });

  describe('Constructor', () => {
    it('should use provided LLM provider', () => {
      const generator = new ModuleGenerator(mockLLMProvider);
      expect(generator).toBeDefined();
    });

    it('should use MockLLMProvider when no provider is provided', () => {
      const generator = new ModuleGenerator();
      expect(generator).toBeDefined();
    });
  });

  describe('generateModule()', () => {
    const basicOptions: GenerationOptions = {
      topic: 'Carl Jung Personality Types',
      difficulty: DifficultyLevel.BEGINNER,
      duration: 60,
      language: 'en',
      onProgress: mockProgressCallback
    };

    beforeEach(() => {
      // Mock ModuleService methods
      (ModuleService.saveDraft as jest.Mock).mockResolvedValue(undefined);
      (ModuleService.createModule as jest.Mock).mockResolvedValue(mockModuleData);
      (ModuleService.deleteDraft as jest.Mock).mockResolvedValue(true);
    });

    it('should generate a complete module with all components', async () => {
      // Create a fresh callback for this test
      const progressSpy = jest.fn();
      
      // Override the options with a fresh callback
      const testOptions = {
        ...basicOptions,
        onProgress: progressSpy
      };
      
      // Setup mocks for all generation methods
      mockLLMProvider.generateCompletion
        .mockResolvedValueOnce({ content: 'Mock Title', usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }}) // title
        .mockResolvedValueOnce({ content: 'Mock Description', usage: { promptTokens: 15, completionTokens: 8, totalTokens: 23 }}) // description  
        .mockResolvedValueOnce({ content: 'tag1, tag2, tag3', usage: { promptTokens: 12, completionTokens: 6, totalTokens: 18 }}) // tags
        .mockResolvedValueOnce({ content: 'Learning objective 1\nLearning objective 2', usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 }}); // learning objectives

      // Setup structured output mocks
      mockLLMProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockContent) // content
        .mockResolvedValueOnce(mockQuiz) // quiz
        .mockResolvedValueOnce(mockVideos) // videos
        .mockResolvedValueOnce(mockBibliography) // bibliography
        .mockResolvedValueOnce([]); // film references

      const result = await moduleGenerator.generateModule(testOptions);

      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid-123');
      // Verify that progress callback was called (should be > 0 calls)
      expect(progressSpy).toHaveBeenCalled();
      // Verify that the module was created
      expect(ModuleService.createModule).toHaveBeenCalled();
      // Verify that draft deletion was attempted (may be called with undefined if creation failed)
      expect(ModuleService.deleteDraft).toHaveBeenCalled();
      
      // Verify all generation methods were called
      expect(mockLLMProvider.generateCompletion).toHaveBeenCalledTimes(4);
      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalledTimes(5);
    });

    it('should handle different difficulty levels', async () => {
      const advancedOptions = { ...basicOptions, difficulty: DifficultyLevel.ADVANCED };
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);

      await moduleGenerator.generateModule(advancedOptions);

      expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('advanced level learners'),
        expect.any(Object)
      );
    });

    it('should handle different languages', async () => {
      const spanishOptions = { ...basicOptions, language: 'es' };
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);
      
      // Mock all the generateCompletion calls
      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: 'Mock content',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
      });

      await moduleGenerator.generateModule(spanishOptions);

      // Check that generateStructuredOutput was called with the Spanish language code in the content prompt
      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Language: es'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should skip components when disabled in options', async () => {
      const limitedOptions = {
        ...basicOptions,
        includeVideos: false,
        includeQuiz: false,
        includeBibliography: false
      };
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);

      await moduleGenerator.generateModule(limitedOptions);

      expect(mockProgressCallback).not.toHaveBeenCalledWith(
        expect.objectContaining({ stage: GenerationStage.GENERATING_QUIZ })
      );
      expect(mockProgressCallback).not.toHaveBeenCalledWith(
        expect.objectContaining({ stage: GenerationStage.SOURCING_VIDEOS })
      );
      expect(mockProgressCallback).not.toHaveBeenCalledWith(
        expect.objectContaining({ stage: GenerationStage.ADDING_BIBLIOGRAPHY })
      );
    });

    it('should handle errors during generation', async () => {
      const error = new Error('LLM generation failed');
      mockLLMProvider.generateCompletion.mockRejectedValueOnce(error);

      const options: GenerationOptions = {
        topic: 'Test Topic',
        difficulty: DifficultyLevel.BEGINNER,
        onProgress: mockProgressCallback
      };

      await expect(moduleGenerator.generateModule(options)).rejects.toThrow('LLM generation failed');

      expect(mockProgressCallback).toHaveBeenCalledWith({
        stage: GenerationStage.ERROR,
        progress: 0,
        message: 'Generation failed: LLM generation failed',
        details: { error }
      });
    });

    it('should save drafts at each stage for recovery', async () => {
      mockLLMProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockContent)
        .mockResolvedValueOnce(mockQuiz)
        .mockResolvedValueOnce(mockVideos)
        .mockResolvedValueOnce(mockBibliography)
        .mockResolvedValueOnce([]);

      await moduleGenerator.generateModule(basicOptions);

      expect(ModuleService.saveDraft).toHaveBeenCalledTimes(5); // Base + content + quiz + videos + bibliography
    });
  });

  describe('generateTitle()', () => {
    it('should generate titles for different difficulty levels', async () => {
      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: 'Introduction to Jungian Psychology',
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 }
      });

      const beginnerOptions: GenerationOptions = {
        topic: 'Carl Jung',
        difficulty: DifficultyLevel.BEGINNER
      };

      // Access private method through reflection for testing
      const result = await (moduleGenerator as any).generateTitle(beginnerOptions);

      expect(result).toBe('Introduction to Jungian Psychology');
      expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('beginner level learners'),
        expect.objectContaining({ maxTokens: 50, temperature: 0.7 })
      );
    });

    it('should generate titles for advanced level', async () => {
      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: 'Advanced Concepts in Analytical Psychology',
        usage: { promptTokens: 25, completionTokens: 12, totalTokens: 37 }
      });

      const advancedOptions: GenerationOptions = {
        topic: 'Individuation Process',
        difficulty: DifficultyLevel.ADVANCED
      };

      const result = await (moduleGenerator as any).generateTitle(advancedOptions);

      expect(result).toBe('Advanced Concepts in Analytical Psychology');
      expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('advanced level learners'),
        expect.any(Object)
      );
    });
  });

  describe('generateContent()', () => {
    it('should generate structured content with proper schema', async () => {
      const expectedSchema = {
        introduction: 'string',
        sections: [{
          id: 'string',
          title: 'string',
          content: 'string',
          order: 'number',
          keyTerms: [{
            term: 'string',
            definition: 'string'
          }]
        }],
        summary: 'string',
        keyTakeaways: ['string']
      };

      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);

      const options: GenerationOptions = {
        topic: 'Shadow Work',
        difficulty: DifficultyLevel.INTERMEDIATE,
        duration: 90,
        language: 'en'
      };

      const result = await (moduleGenerator as any).generateContent(options);

      expect(result).toEqual(mockContent);
      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Shadow Work'),
        expectedSchema,
        expect.objectContaining({ maxTokens: 3000, temperature: 0.7 })
      );
    });

    it('should handle different durations in content generation', async () => {
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);

      const options: GenerationOptions = {
        topic: 'Archetypes',
        difficulty: DifficultyLevel.BEGINNER,
        duration: 120
      };

      await (moduleGenerator as any).generateContent(options);

      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('120 minutes'),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('generateQuiz()', () => {
    it('should generate quiz with proper validation', async () => {
      const expectedSchema = {
        id: 'string',
        title: 'string',
        description: 'string',
        questions: [{
          id: 'string',
          type: 'string',
          question: 'string',
          points: 'number',
          explanation: 'string'
        }],
        passingScore: 'number'
      };

      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockQuiz);

      const options: GenerationOptions = {
        topic: 'Collective Unconscious',
        difficulty: DifficultyLevel.INTERMEDIATE
      };

      const result = await (moduleGenerator as any).generateQuiz(options, mockContent);

      expect(result).toEqual(mockQuiz);
      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Collective Unconscious'),
        expectedSchema,
        expect.objectContaining({ maxTokens: 2000, temperature: 0.6 })
      );
    });

    it('should use content introduction in quiz generation', async () => {
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockQuiz);

      const options: GenerationOptions = {
        topic: 'Anima and Animus',
        difficulty: DifficultyLevel.ADVANCED
      };

      await (moduleGenerator as any).generateQuiz(options, mockContent);

      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining(mockContent.introduction),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('sourceVideos()', () => {
    it('should generate video recommendations with proper structure', async () => {
      const expectedVideoSchema = [{
        id: 'string',
        title: 'string',
        description: 'string',
        url: 'string',
        duration: {
          hours: 'number',
          minutes: 'number',
          seconds: 'number'
        }
      }];

      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockVideos);

      const options: GenerationOptions = {
        topic: 'Dream Analysis'
      };

      const result = await (moduleGenerator as any).sourceVideos(options);

      expect(result).toEqual(mockVideos);
      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Dream Analysis'),
        expectedVideoSchema,
        expect.objectContaining({ maxTokens: 1000, temperature: 0.7 })
      );
    });

    it('should return empty array if videos generation fails', async () => {
      mockLLMProvider.generateStructuredOutput.mockResolvedValue('invalid');

      const options: GenerationOptions = {
        topic: 'Synchronicity'
      };

      const result = await (moduleGenerator as any).sourceVideos(options);

      expect(result).toEqual([]);
    });
  });

  describe('generateBibliography()', () => {
    it('should generate bibliography with proper format validation', async () => {
      const expectedSchema = [{
        id: 'string',
        title: 'string',
        authors: ['string'],
        year: 'number',
        type: 'string',
        relevanceNote: 'string'
      }];

      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockBibliography);

      const options: GenerationOptions = {
        topic: 'Active Imagination'
      };

      const result = await (moduleGenerator as any).generateBibliography(options);

      expect(result).toEqual(mockBibliography);
      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Active Imagination'),
        expectedSchema,
        expect.objectContaining({ maxTokens: 1200, temperature: 0.6 })
      );
    });
  });

  describe('Progress Tracking', () => {
    it('should report progress at each stage', async () => {
      const progressStages = [
        GenerationStage.INITIALIZING,
        GenerationStage.GENERATING_CONTENT,
        GenerationStage.GENERATING_QUIZ,
        GenerationStage.SOURCING_VIDEOS,
        GenerationStage.ADDING_BIBLIOGRAPHY,
        GenerationStage.FINALIZING,
        GenerationStage.COMPLETED
      ];

      mockLLMProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockContent)
        .mockResolvedValueOnce(mockQuiz)
        .mockResolvedValueOnce(mockVideos)
        .mockResolvedValueOnce(mockBibliography)
        .mockResolvedValueOnce([]);

      (ModuleService.saveDraft as jest.Mock).mockResolvedValue(undefined);
      (ModuleService.createModule as jest.Mock).mockResolvedValue(mockModuleData);
      (ModuleService.deleteDraft as jest.Mock).mockResolvedValue(true);

      const options: GenerationOptions = {
        topic: 'Psychological Types',
        difficulty: DifficultyLevel.BEGINNER,
        onProgress: mockProgressCallback
      };

      await moduleGenerator.generateModule(options);

      progressStages.forEach(stage => {
        expect(mockProgressCallback).toHaveBeenCalledWith(
          expect.objectContaining({ stage })
        );
      });
    });

    it('should track progress percentages correctly', async () => {
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);
      (ModuleService.saveDraft as jest.Mock).mockResolvedValue(undefined);
      (ModuleService.createModule as jest.Mock).mockResolvedValue(mockModuleData);
      (ModuleService.deleteDraft as jest.Mock).mockResolvedValue(true);

      const options: GenerationOptions = {
        topic: 'Persona',
        difficulty: DifficultyLevel.BEGINNER,
        onProgress: mockProgressCallback,
        includeQuiz: false,
        includeVideos: false,
        includeBibliography: false
      };

      await moduleGenerator.generateModule(options);

      const progressCalls = mockProgressCallback.mock.calls;
      const progressValues = progressCalls.map(call => call[0].progress);

      expect(progressValues).toContain(0);  // INITIALIZING
      expect(progressValues).toContain(20); // GENERATING_CONTENT
      expect(progressValues).toContain(95); // FINALIZING
      expect(progressValues).toContain(100); // COMPLETED
    });
  });

  describe('Resume Functionality', () => {
    const mockDraft = {
      id: 'draft-123',
      title: 'Draft Module',
      content: mockContent,
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
      (ModuleService.getDrafts as jest.Mock).mockResolvedValue([mockDraft]);
      (ModuleService.createModule as jest.Mock).mockResolvedValue(mockModuleData);
      (ModuleService.deleteDraft as jest.Mock).mockResolvedValue(true);
    });

    it('should resume generation from existing draft', async () => {
      mockLLMProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockQuiz) // quiz
        .mockResolvedValueOnce(mockVideos) // videos
        .mockResolvedValueOnce(mockBibliography) // bibliography
        .mockResolvedValueOnce([]); // film references

      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: 'Mock learning objectives',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
      });

      const options: GenerationOptions = {
        topic: 'Complex Theory',
        difficulty: DifficultyLevel.INTERMEDIATE
      };

      const result = await moduleGenerator.resumeGeneration('draft-123', options);

      expect(result).toBeDefined();
      expect(ModuleService.getDrafts).toHaveBeenCalled();
      expect(ModuleService.deleteDraft).toHaveBeenCalledWith('draft-123');
    });

    it('should throw error if draft not found', async () => {
      (ModuleService.getDrafts as jest.Mock).mockResolvedValue([]);

      const options: GenerationOptions = {
        topic: 'Compensation',
        difficulty: DifficultyLevel.ADVANCED
      };

      await expect(moduleGenerator.resumeGeneration('nonexistent', options))
        .rejects.toThrow('Draft with ID nonexistent not found');
    });

    it('should resume from draft using resumeFromDraft method', async () => {
      const spy = jest.spyOn(moduleGenerator, 'resumeGeneration').mockResolvedValue(mockModuleData as EducationalModule);

      const options: GenerationOptions = {
        topic: 'Individuation',
        difficulty: DifficultyLevel.ADVANCED
      };

      const result = await moduleGenerator.resumeFromDraft('draft-123', options);

      expect(result).toBeDefined();
      expect(spy).toHaveBeenCalledWith('draft-123', options);
    });
  });

  describe('Error Handling', () => {
    it('should handle LLM provider errors gracefully', async () => {
      const error = new Error('API rate limit exceeded');
      mockLLMProvider.generateCompletion.mockRejectedValue(error);

      const options: GenerationOptions = {
        topic: 'Amplification',
        difficulty: DifficultyLevel.INTERMEDIATE,
        onProgress: mockProgressCallback
      };

      await expect(moduleGenerator.generateModule(options)).rejects.toThrow('API rate limit exceeded');

      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: GenerationStage.ERROR,
          message: 'Generation failed: API rate limit exceeded'
        })
      );
    });

    it('should handle ModuleService errors during save', async () => {
      const error = new Error('Storage quota exceeded');
      (ModuleService.saveDraft as jest.Mock).mockRejectedValue(error);

      const options: GenerationOptions = {
        topic: 'Transcendent Function',
        difficulty: DifficultyLevel.ADVANCED
      };

      await expect(moduleGenerator.generateModule(options)).rejects.toThrow('Storage quota exceeded');
    });

    it('should handle JSON parsing errors in structured output', async () => {
      mockLLMProvider.generateStructuredOutput.mockRejectedValue(new Error('Invalid JSON response'));

      const options: GenerationOptions = {
        topic: 'Psychological Functions',
        difficulty: DifficultyLevel.BEGINNER
      };

      await expect(moduleGenerator.generateModule(options)).rejects.toThrow('Invalid JSON response');
    });
  });

  describe('Private Methods', () => {
    it('should estimate time correctly for different durations', () => {
      const result60 = (moduleGenerator as any).estimateTime(60);
      expect(result60).toEqual({
        hours: 1,
        minutes: 0,
        description: 'Approximately 1 hour including videos and exercises'
      });

      const result90 = (moduleGenerator as any).estimateTime(90);
      expect(result90).toEqual({
        hours: 1,
        minutes: 30,
        description: 'Approximately 1 hour 30 minutes including videos and exercises'
      });

      const result30 = (moduleGenerator as any).estimateTime(30);
      expect(result30).toEqual({
        hours: 0,
        minutes: 30,
        description: 'Approximately 30 minutes including videos and exercises'
      });
    });

    it('should use default duration when none provided', () => {
      const result = (moduleGenerator as any).estimateTime();
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(0);
    });

    it('should generate learning objectives for non-beginner modules', async () => {
      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: 'Objective 1\nObjective 2\nObjective 3',
        usage: { promptTokens: 30, completionTokens: 15, totalTokens: 45 }
      });

      const mockModule = {
        title: 'Advanced Jung Concepts',
        difficultyLevel: DifficultyLevel.ADVANCED
      };

      const result = await (moduleGenerator as any).generateLearningObjectives(mockModule);

      expect(result).toEqual(['Objective 1', 'Objective 2', 'Objective 3']);
      expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('learning objectives'),
        expect.objectContaining({ maxTokens: 300, temperature: 0.6 })
      );
    });

    it('should return empty prerequisites for beginner modules', async () => {
      const mockModule = {
        title: 'Intro to Jung',
        difficultyLevel: DifficultyLevel.BEGINNER
      };

      const result = await (moduleGenerator as any).generatePrerequisites(mockModule);

      expect(result).toEqual([]);
      expect(mockLLMProvider.generateCompletion).not.toHaveBeenCalled();
    });

    it('should generate prerequisites for advanced modules', async () => {
      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: 'Prerequisite 1\nPrerequisite 2',
        usage: { promptTokens: 25, completionTokens: 10, totalTokens: 35 }
      });

      const mockModule = {
        title: 'Advanced Individuation',
        difficultyLevel: DifficultyLevel.ADVANCED
      };

      const result = await (moduleGenerator as any).generatePrerequisites(mockModule);

      expect(result).toEqual(['Prerequisite 1', 'Prerequisite 2']);
    });
  });

  describe('Integration with MockLLMProvider', () => {
    it('should work with MockLLMProvider when no real provider is available', async () => {
      const mockGenerator = new ModuleGenerator(); // Uses MockLLMProvider by default
      
      (ModuleService.saveDraft as jest.Mock).mockResolvedValue(undefined);
      (ModuleService.createModule as jest.Mock).mockResolvedValue(mockModuleData);
      (ModuleService.deleteDraft as jest.Mock).mockResolvedValue(true);

      const options: GenerationOptions = {
        topic: 'Dream Work',
        difficulty: DifficultyLevel.BEGINNER,
        onProgress: mockProgressCallback,
        includeQuiz: false,
        includeVideos: false,
        includeBibliography: false
      };

      const result = await mockGenerator.generateModule(options);

      expect(result).toBeDefined();
      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ stage: GenerationStage.COMPLETED })
      );
    }, 10000); // Increase timeout for this test
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty topic gracefully', async () => {
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);
      (ModuleService.saveDraft as jest.Mock).mockResolvedValue(undefined);
      (ModuleService.createModule as jest.Mock).mockResolvedValue(mockModuleData);

      const options: GenerationOptions = {
        topic: '',
        difficulty: DifficultyLevel.BEGINNER
      };

      const result = await moduleGenerator.generateModule(options);
      expect(result).toBeDefined();
    });

    it('should handle very long topics', async () => {
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);
      (ModuleService.saveDraft as jest.Mock).mockResolvedValue(undefined);
      (ModuleService.createModule as jest.Mock).mockResolvedValue(mockModuleData);

      const longTopic = 'A'.repeat(1000);
      const options: GenerationOptions = {
        topic: longTopic,
        difficulty: DifficultyLevel.INTERMEDIATE
      };

      const result = await moduleGenerator.generateModule(options);
      expect(result).toBeDefined();
    });

    it('should handle null/undefined values in options gracefully', async () => {
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);
      (ModuleService.saveDraft as jest.Mock).mockResolvedValue(undefined);
      (ModuleService.createModule as jest.Mock).mockResolvedValue(mockModuleData);

      const options: GenerationOptions = {
        topic: 'Test Topic',
        difficulty: DifficultyLevel.BEGINNER,
        description: undefined,
        tags: undefined,
        language: undefined
      };

      const result = await moduleGenerator.generateModule(options);
      expect(result).toBeDefined();
    });

    it('should handle concurrent generation attempts', async () => {
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockContent);
      (ModuleService.saveDraft as jest.Mock).mockResolvedValue(undefined);
      (ModuleService.createModule as jest.Mock).mockResolvedValue(mockModuleData);
      (ModuleService.deleteDraft as jest.Mock).mockResolvedValue(true);

      const options: GenerationOptions = {
        topic: 'Concurrent Test',
        difficulty: DifficultyLevel.BEGINNER
      };

      // Start multiple generations concurrently
      const promises = [
        moduleGenerator.generateModule(options),
        moduleGenerator.generateModule(options),
        moduleGenerator.generateModule(options)
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => expect(result).toBeDefined());
    });
  });
});