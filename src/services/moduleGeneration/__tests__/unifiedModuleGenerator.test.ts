/**
 * Comprehensive test suite for UnifiedModuleGenerator
 * Tests all methods, edge cases, and error scenarios
 */

import { UnifiedModuleGenerator, ModuleGenerationConfig, GeneratedModule } from '../index';
import { LLMOrchestrator } from '../../llm/orchestrator';
import { ModuleGenerator } from '../../modules/moduleGenerator';
import { EnhancedQuizGenerator } from '../../quiz/enhancedQuizGenerator';
import { VideoEnricher } from '../../video/videoEnricher';
import { BibliographyEnricher } from '../../bibliography/bibliographyEnricher';
import { quizEnhancer } from '../../quiz/quizEnhancer';
import { OpenAIProvider } from '../../llm/provider';

// Mock all dependencies
jest.mock('../../llm/orchestrator');
jest.mock('../../modules/moduleGenerator');
jest.mock('../../quiz/enhancedQuizGenerator');
jest.mock('../../video/videoEnricher');
jest.mock('../../bibliography/bibliographyEnricher');
jest.mock('../../quiz/quizEnhancer');
jest.mock('../../llm/provider');

// Mock environment variable
const originalEnv = process.env;

describe('UnifiedModuleGenerator', () => {
  let generator: UnifiedModuleGenerator;
  let mockOrchestrator: jest.Mocked<LLMOrchestrator>;
  let mockModuleGenerator: jest.Mocked<ModuleGenerator>;
  let mockQuizGenerator: jest.Mocked<EnhancedQuizGenerator>;
  let mockVideoEnricher: jest.Mocked<VideoEnricher>;
  let mockBibliographyEnricher: jest.Mocked<BibliographyEnricher>;

  // Test data
  const mockModuleStructure = {
    id: 'test-module-1',
    title: 'Jung and the Collective Unconscious',
    content: {
      introduction: 'Introduction to Jung\'s concept of the collective unconscious',
      sections: [
        { title: 'Overview', content: 'The collective unconscious is a key concept...' },
        { title: 'Archetypes', content: 'Archetypes are universal patterns...' }
      ]
    }
  };


  const mockQuiz = {
    id: 'quiz-1',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the collective unconscious?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'The collective unconscious is...'
      }
    ]
  };

  const mockVideos = [
    {
      id: 'video-1',
      title: 'Introduction to Jung',
      youtubeId: 'abc123',
      duration: 600
    }
  ];

  const mockBibliography = [
    {
      title: 'Man and His Symbols',
      author: 'Carl Jung',
      year: 1964,
      type: 'book'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, REACT_APP_OPENAI_API_KEY: 'test-key' };

    // Setup mocks
    mockOrchestrator = {
      generateModule: jest.fn(),
      generateQuiz: jest.fn(),
      generateBibliography: jest.fn()
    } as any;

    mockModuleGenerator = {} as any;

    mockQuizGenerator = {} as any;

    mockVideoEnricher = {} as any;

    mockBibliographyEnricher = {
      searchBibliography: jest.fn()
    } as any;

    // Setup mock implementations
    (LLMOrchestrator as jest.MockedClass<typeof LLMOrchestrator>).mockImplementation(() => mockOrchestrator);
    (ModuleGenerator as jest.MockedClass<typeof ModuleGenerator>).mockImplementation(() => mockModuleGenerator);
    (EnhancedQuizGenerator as jest.MockedClass<typeof EnhancedQuizGenerator>).mockImplementation(() => mockQuizGenerator);
    (VideoEnricher as jest.MockedClass<typeof VideoEnricher>).mockImplementation(() => mockVideoEnricher);
    (BibliographyEnricher as jest.MockedClass<typeof BibliographyEnricher>).mockImplementation(() => mockBibliographyEnricher);

    (quizEnhancer.enhanceQuestions as jest.Mock) = jest.fn().mockResolvedValue(mockQuiz.questions);

    generator = new UnifiedModuleGenerator();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize all services correctly', () => {
      expect(LLMOrchestrator).toHaveBeenCalled();
      expect(ModuleGenerator).toHaveBeenCalled();
      expect(EnhancedQuizGenerator).toHaveBeenCalled();
      expect(VideoEnricher).toHaveBeenCalled();
      expect(BibliographyEnricher).toHaveBeenCalled();
    });

    it('should handle missing API key', () => {
      process.env = { ...originalEnv };
      delete process.env.REACT_APP_OPENAI_API_KEY;
      
      const generatorWithoutKey = new UnifiedModuleGenerator();
      expect(OpenAIProvider).toHaveBeenCalledWith('');
    });
  });

  describe('generateCompleteModule', () => {
    const basicConfig: ModuleGenerationConfig = {
      topic: 'Collective Unconscious',
      difficulty: 'intermediate',
      includeVideos: true,
      includeQuiz: true,
      includeBibliography: true
    };

    beforeEach(() => {
      mockOrchestrator.generateModule.mockResolvedValue(mockModuleStructure);
      mockOrchestrator.generateQuiz.mockResolvedValue(mockQuiz);
      mockOrchestrator.generateBibliography.mockResolvedValue(mockBibliography);
      mockBibliographyEnricher.searchBibliography.mockResolvedValue(mockBibliography);
    });

    it('should generate complete module with all components', async () => {
      const result = await generator.generateCompleteModule(basicConfig);

      expect(result).toBeDefined();
      expect(result.module).toEqual(mockModuleStructure);
      expect(result.quiz).toBeDefined();
      expect(result.bibliography).toEqual(mockBibliography);
      expect(result.metadata.componentsIncluded).toContain('module');
      expect(result.metadata.componentsIncluded).toContain('quiz');
      expect(result.metadata.componentsIncluded).toContain('bibliography');
    });

    it('should auto-detect difficulty when not provided', async () => {
      const configWithoutDifficulty = { ...basicConfig };
      delete configWithoutDifficulty.difficulty;

      const result = await generator.generateCompleteModule(configWithoutDifficulty);

      expect(result.metadata.difficulty).toBeDefined();
      expect(['beginner', 'intermediate', 'advanced']).toContain(result.metadata.difficulty);
    });

    it('should handle individual component generation failures gracefully', async () => {
      mockOrchestrator.generateQuiz.mockRejectedValue(new Error('Quiz generation failed'));

      const result = await generator.generateCompleteModule(basicConfig);

      expect(result.module).toEqual(mockModuleStructure);
      expect(result.quiz).toBeUndefined();
      expect(result.metadata.componentsIncluded).toContain('module');
      expect(result.metadata.componentsIncluded).not.toContain('quiz');
    });

    it('should respect component inclusion flags', async () => {
      const configWithoutSomeComponents = {
        ...basicConfig,
        includeVideos: false,
        includeQuiz: false
      };

      const result = await generator.generateCompleteModule(configWithoutSomeComponents);

      expect(result.videos).toEqual([]);
      expect(result.quiz).toBeUndefined();
      expect(mockOrchestrator.generateQuiz).not.toHaveBeenCalled();
    });

    it('should handle complete generation failure', async () => {
      mockOrchestrator.generateModule.mockRejectedValue(new Error('Module generation failed'));

      await expect(generator.generateCompleteModule(basicConfig)).rejects.toThrow('Module generation failed');
    });

    it('should use custom quiz question count', async () => {
      const configWithQuizCount = {
        ...basicConfig,
        quizQuestions: 15
      };

      await generator.generateCompleteModule(configWithQuizCount);

      expect(mockOrchestrator.generateQuiz).toHaveBeenCalledWith(
        expect.objectContaining({
          numberOfQuestions: 15
        })
      );
    });

    it('should enhance quiz questions when quiz is generated', async () => {
      await generator.generateCompleteModule(basicConfig);

      expect(quizEnhancer.enhanceQuestions).toHaveBeenCalledWith(
        mockQuiz.questions,
        basicConfig.topic
      );
    });
  });

  describe('generateCustomModule', () => {
    it('should generate module with specific components only', async () => {
      mockOrchestrator.generateModule.mockResolvedValue(mockModuleStructure);

      const result = await generator.generateCustomModule('Test Topic', {
        module: true,
        quiz: false,
        videos: false,
        bibliography: false
      });

      expect(result.module).toEqual(mockModuleStructure);
      expect(result.quiz).toBeUndefined();
      expect(result.videos).toEqual([]);
      expect(result.bibliography).toBeUndefined();
    });
  });

  describe('preset generation methods', () => {
    beforeEach(() => {
      mockOrchestrator.generateModule.mockResolvedValue(mockModuleStructure);
      mockOrchestrator.generateQuiz.mockResolvedValue(mockQuiz);
      mockOrchestrator.generateBibliography.mockResolvedValue(mockBibliography);
      mockBibliographyEnricher.searchBibliography.mockResolvedValue(mockBibliography);
    });

    describe('generateQuickModule', () => {
      it('should generate module with quick settings', async () => {
        const result = await generator.generateQuickModule('Quick Topic');

        expect(result).toBeDefined();
        expect(result.metadata.componentsIncluded).toContain('module');
        expect(result.metadata.componentsIncluded).toContain('quiz');
        expect(result.metadata.componentsIncluded).not.toContain('bibliography');
        
        expect(mockOrchestrator.generateQuiz).toHaveBeenCalledWith(
          expect.objectContaining({
            numberOfQuestions: 5
          })
        );
      });
    });

    describe('generateStudyModule', () => {
      it('should generate comprehensive study module', async () => {
        const result = await generator.generateStudyModule('Study Topic');

        expect(result).toBeDefined();
        expect(result.metadata.componentsIncluded).toContain('module');
        expect(result.metadata.componentsIncluded).toContain('quiz');
        expect(result.metadata.componentsIncluded).toContain('bibliography');
        
        expect(mockOrchestrator.generateQuiz).toHaveBeenCalledWith(
          expect.objectContaining({
            numberOfQuestions: 15
          })
        );
      });
    });

    describe('generateResearchModule', () => {
      it('should generate research-focused module', async () => {
        const result = await generator.generateResearchModule('Research Topic');

        expect(result).toBeDefined();
        expect(result.metadata.difficulty).toBe('advanced');
        expect(result.metadata.componentsIncluded).toContain('module');
        expect(result.metadata.componentsIncluded).toContain('bibliography');
        expect(result.metadata.componentsIncluded).not.toContain('quiz');
        expect(result.videos).toEqual([]);
      });
    });
  });

  describe('private method testing through public interface', () => {
    describe('difficulty analysis', () => {
      it('should detect beginner content', async () => {
        const beginnerModule = {
          ...mockModuleStructure,
          content: {
            introduction: 'This is a basic introduction to fundamental concepts',
            sections: [{ title: 'Simple Overview', content: 'Basic understanding' }]
          }
        };

        mockOrchestrator.generateModule.mockResolvedValue(beginnerModule);

        const result = await generator.generateCompleteModule({
          topic: 'Basic Topic'
        });

        expect(result.metadata.difficulty).toBe('beginner');
      });

      it('should detect advanced content', async () => {
        const advancedModule = {
          ...mockModuleStructure,
          content: {
            introduction: 'This is a complex analysis requiring specialized knowledge',
            sections: [
              { title: 'Advanced Research', content: 'Expert-level content' },
              { title: 'Complex Theory', content: 'Specialized advanced concepts' }
            ]
          }
        };

        mockOrchestrator.generateModule.mockResolvedValue(advancedModule);

        const result = await generator.generateCompleteModule({
          topic: 'Advanced Topic'
        });

        expect(result.metadata.difficulty).toBe('advanced');
      });
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle null quiz response', async () => {
      mockOrchestrator.generateModule.mockResolvedValue(mockModuleStructure);
      mockOrchestrator.generateQuiz.mockResolvedValue(null as any);

      const result = await generator.generateCompleteModule({
        topic: 'Test Topic',
        includeQuiz: true
      });

      expect(result.quiz).toBeUndefined();
      expect(quizEnhancer.enhanceQuestions).not.toHaveBeenCalled();
    });

    it('should handle empty module sections', async () => {
      const emptyModule = {
        ...mockModuleStructure,
        content: {
          introduction: '',
          sections: []
        }
      };

      mockOrchestrator.generateModule.mockResolvedValue(emptyModule);

      const result = await generator.generateCompleteModule({
        topic: 'Empty Topic'
      });

      expect(result.module).toEqual(emptyModule);
      expect(result.metadata.difficulty).toBe('beginner');
    });

    it('should handle very long topic names', async () => {
      const longTopic = 'A'.repeat(500);
      mockOrchestrator.generateModule.mockResolvedValue(mockModuleStructure);

      const result = await generator.generateCompleteModule({
        topic: longTopic
      });

      expect(result).toBeDefined();
      expect(result.metadata.topic).toBe(longTopic);
    });

    it('should handle special characters in topic', async () => {
      const specialTopic = 'Jung & "Complex" <Theory> 特殊字符';
      mockOrchestrator.generateModule.mockResolvedValue(mockModuleStructure);

      const result = await generator.generateCompleteModule({
        topic: specialTopic
      });

      expect(result).toBeDefined();
      expect(result.metadata.topic).toBe(specialTopic);
    });
  });

  describe('integration scenarios', () => {
    it('should handle partial success scenario', async () => {
      mockOrchestrator.generateModule.mockResolvedValue(mockModuleStructure);
      mockOrchestrator.generateQuiz.mockResolvedValue(mockQuiz);
      mockOrchestrator.generateBibliography.mockRejectedValue(new Error('Bibliography service down'));
      mockBibliographyEnricher.searchBibliography.mockRejectedValue(new Error('Enricher failed'));

      const result = await generator.generateCompleteModule({
        topic: 'Partial Success Topic',
        includeVideos: true,
        includeQuiz: true,
        includeBibliography: true
      });

      expect(result.module).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.bibliography).toBeUndefined();
      expect(result.metadata.componentsIncluded).toContain('module');
      expect(result.metadata.componentsIncluded).toContain('quiz');
      expect(result.metadata.componentsIncluded).not.toContain('bibliography');
    });

    it('should handle concurrent component generation', async () => {
      // Simulate delays to test concurrent execution
      mockOrchestrator.generateModule.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockModuleStructure), 10))
      );
      mockOrchestrator.generateQuiz.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockQuiz), 15))
      );

      const startTime = Date.now();
      const result = await generator.generateCompleteModule({
        topic: 'Concurrent Test',
        includeVideos: true,
        includeQuiz: true,
        includeBibliography: true
      });
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.module).toBeDefined();
      expect(result.quiz).toBeDefined();
      
      // Should complete faster than sequential execution would
      // Allow some variance in timing for CI environments
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('metadata generation', () => {
    it('should include all metadata fields', async () => {
      mockOrchestrator.generateModule.mockResolvedValue(mockModuleStructure);

      const result = await generator.generateCompleteModule({
        topic: 'Metadata Test',
        difficulty: 'advanced'
      });

      expect(result.metadata).toMatchObject({
        difficulty: 'advanced',
        topic: 'Metadata Test',
        componentsIncluded: expect.any(Array)
      });
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
      expect(result.metadata.componentsIncluded).toContain('module');
    });
  });
});

describe('UnifiedModuleGenerator - Singleton', () => {
  it('should export singleton instance', async () => {
    const { moduleGenerator } = await import('../index');
    expect(moduleGenerator).toBeInstanceOf(UnifiedModuleGenerator);
  });
});