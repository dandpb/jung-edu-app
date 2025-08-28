/**
 * Comprehensive tests for llm/example-usage.ts
 * Tests LLM orchestrator examples, module generation, and integration patterns
 */

import { ModuleGenerationOrchestrator, GenerationOptions } from '../orchestrator';
import { QuizGenerator } from '../generators/quiz-generator';
import { MockLLMProvider } from '../providers/mock';

// Mock dependencies
jest.mock('../orchestrator');
jest.mock('../generators/quiz-generator'); 
jest.mock('../providers/mock');
jest.mock('fs/promises');

// Import the example usage after mocking
let exampleUsage: any;

const mockModuleGenerationOrchestrator = ModuleGenerationOrchestrator as jest.MockedClass<typeof ModuleGenerationOrchestrator>;
const mockQuizGenerator = QuizGenerator as jest.MockedClass<typeof QuizGenerator>;
const mockMockLLMProvider = MockLLMProvider as jest.MockedClass<typeof MockLLMProvider>;

// Mock data for module generation
const mockModuleResult = {
  module: {
    id: 'module-shadow-123',
    title: 'The Shadow Archetype in Jungian Psychology',
    description: 'Comprehensive exploration of Jung\'s shadow concept',
    objectives: [
      'Understand the concept of the Shadow in Jungian psychology',
      'Identify personal shadow aspects through self-reflection',
      'Learn techniques for shadow integration',
      'Explore the collective shadow in society'
    ],
    estimatedTime: 60,
    difficulty: 'intermediate',
    metadata: {
      jungianConcepts: ['shadow', 'projection', 'integration', 'persona']
    }
  },
  content: {
    sections: [
      {
        id: 'intro',
        title: 'Introduction to the Shadow',
        content: 'The shadow represents the parts of our personality...',
        order: 1
      },
      {
        id: 'projection',
        title: 'Shadow Projection Mechanisms',
        content: 'Shadow projection occurs when we attribute...',
        order: 2
      },
      {
        id: 'integration',
        title: 'Integration Techniques',
        content: 'Integration of the shadow involves...',
        order: 3
      }
    ]
  },
  quiz: {
    id: 'quiz-shadow-123',
    title: 'Shadow Psychology Assessment',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the shadow in Jungian psychology?',
        options: [
          { id: 'q1-a', text: 'Conscious personality', isCorrect: false },
          { id: 'q1-b', text: 'Unconscious aspects', isCorrect: true },
          { id: 'q1-c', text: 'Dreams and symbols', isCorrect: false },
          { id: 'q1-d', text: 'Collective memory', isCorrect: false }
        ],
        correctAnswer: 1,
        points: 10
      }
    ],
    passingScore: 70,
    timeLimit: 20
  },
  videos: [
    {
      id: 'video-1',
      title: 'Understanding Shadow Psychology',
      duration: '15 min',
      url: 'https://youtube.com/watch?v=shadow1',
      description: 'Introduction to shadow concepts'
    },
    {
      id: 'video-2', 
      title: 'Shadow Projection in Daily Life',
      duration: '12 min',
      url: 'https://youtube.com/watch?v=shadow2',
      description: 'Practical examples of shadow projection'
    }
  ],
  bibliography: [
    {
      id: 'ref1',
      type: 'book',
      title: 'Meeting the Shadow',
      authors: ['Connie Zweig', 'Jeremiah Abrams'],
      year: 1991,
      publisher: 'Jeremy P. Tarcher',
      doi: null
    },
    {
      id: 'ref2',
      type: 'article',
      title: 'Shadow Work in Modern Psychology',
      authors: ['Dr. Jane Smith'],
      year: 2020,
      journal: 'Journal of Analytical Psychology',
      doi: '10.1111/1467-9450.12345'
    }
  ]
};

const mockAdaptiveQuestions = [
  {
    id: 'adaptive-q1',
    type: 'multiple-choice',
    question: 'How does the shadow manifest in relationships?',
    options: [
      { id: 'aq1-a', text: 'Through clear communication', isCorrect: false },
      { id: 'aq1-b', text: 'Through projection onto partners', isCorrect: true },
      { id: 'aq1-c', text: 'Through conscious choice', isCorrect: false },
      { id: 'aq1-d', text: 'Through logical analysis', isCorrect: false }
    ],
    correctAnswer: 1,
    points: 15,
    difficulty: 'intermediate'
  },
  {
    id: 'adaptive-q2',
    type: 'short-answer',
    question: 'Describe a technique for shadow integration',
    correctAnswer: -1,
    points: 20,
    expectedKeywords: ['awareness', 'acceptance', 'dialogue', 'integration'],
    difficulty: 'advanced'
  }
];

const mockPracticeQuestions = [
  {
    id: 'practice-q1',
    type: 'multiple-choice', 
    question: 'Introversion is characterized by:',
    options: [
      { id: 'pq1-a', text: 'Energy directed inward', isCorrect: true },
      { id: 'pq1-b', text: 'Energy directed outward', isCorrect: false },
      { id: 'pq1-c', text: 'Social anxiety', isCorrect: false },
      { id: 'pq1-d', text: 'Shyness', isCorrect: false }
    ],
    correctAnswer: 0,
    points: 10
  }
];

describe('LLM Example Usage - Comprehensive Tests', () => {
  let mockOrchestratorInstance: jest.Mocked<ModuleGenerationOrchestrator>;
  let mockQuizGeneratorInstance: jest.Mocked<QuizGenerator>;
  let mockProviderInstance: jest.Mocked<MockLLMProvider>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Setup ModuleGenerationOrchestrator mock
    mockOrchestratorInstance = {
      on: jest.fn(),
      checkProviderAvailability: jest.fn().mockResolvedValue(true),
      estimateTokenUsage: jest.fn().mockResolvedValue(15000),
      generateModule: jest.fn().mockResolvedValue(mockModuleResult)
    } as any;
    mockModuleGenerationOrchestrator.mockImplementation(() => mockOrchestratorInstance);

    // Setup QuizGenerator mock
    mockQuizGeneratorInstance = {
      generateAdaptiveQuestions: jest.fn().mockResolvedValue(mockAdaptiveQuestions),
      generatePracticeQuestions: jest.fn().mockResolvedValue(mockPracticeQuestions)
    } as any;
    mockQuizGenerator.mockImplementation(() => mockQuizGeneratorInstance);

    // Setup MockLLMProvider mock
    mockProviderInstance = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      generateEmbedding: jest.fn()
    } as any;
    mockMockLLMProvider.mockImplementation(() => mockProviderInstance);

    // Mock fs/promises
    const mockWriteFile = jest.fn().mockResolvedValue(undefined);
    jest.doMock('fs/promises', () => ({
      writeFile: mockWriteFile
    }));

    // Import the example usage after all mocks are set up
    exampleUsage = require('../example-usage');
  });

  describe('generateJungianModule', () => {
    it('should generate complete Jungian module', async () => {
      await exampleUsage.generateJungianModule();

      expect(mockModuleGenerationOrchestrator).toHaveBeenCalled();
      
      // Verify event listener setup
      expect(mockOrchestratorInstance.on).toHaveBeenCalledWith('progress', expect.any(Function));

      // Verify availability check
      expect(mockOrchestratorInstance.checkProviderAvailability).toHaveBeenCalled();
      
      // Verify token estimation
      expect(mockOrchestratorInstance.estimateTokenUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'The Shadow Archetype',
          objectives: expect.arrayContaining([
            'Understand the concept of the Shadow in Jungian psychology'
          ]),
          targetAudience: 'Psychology undergraduate students',
          duration: 60,
          difficulty: 'intermediate'
        })
      );

      // Verify module generation
      expect(mockOrchestratorInstance.generateModule).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'The Shadow Archetype',
          includeVideos: true,
          includeBibliography: true,
          quizQuestions: 15,
          videoCount: 5,
          bibliographyCount: 12
        })
      );

      // Verify console output
      expect(console.log).toHaveBeenCalledWith('Provider available:', true);
      expect(console.log).toHaveBeenCalledWith('Estimated tokens:', 15000);
      expect(console.log).toHaveBeenCalledWith('Starting module generation...');
      expect(console.log).toHaveBeenCalledWith('\n=== Generated Module ===');
      expect(console.log).toHaveBeenCalledWith('Title:', mockModuleResult.module.title);
    });

    it('should handle provider unavailability', async () => {
      mockOrchestratorInstance.checkProviderAvailability.mockResolvedValue(false);

      // Should still attempt to run but log unavailability
      await expect(exampleUsage.generateJungianModule()).resolves.not.toThrow();

      expect(console.log).toHaveBeenCalledWith('Provider available:', false);
    });

    it('should handle module generation errors', async () => {
      mockOrchestratorInstance.generateModule.mockRejectedValue(new Error('Generation failed'));

      await exampleUsage.generateJungianModule();

      expect(console.error).toHaveBeenCalledWith('Generation failed:', expect.any(Error));
    });

    it('should display quiz information when available', async () => {
      await exampleUsage.generateJungianModule();

      expect(console.log).toHaveBeenCalledWith('\n=== Quiz ===');
      expect(console.log).toHaveBeenCalledWith('Questions:', mockModuleResult.quiz.questions.length);
      expect(console.log).toHaveBeenCalledWith('Passing score:', 70, '%');
    });

    it('should display video information when available', async () => {
      await exampleUsage.generateJungianModule();

      expect(console.log).toHaveBeenCalledWith('\n=== Videos ===');
      expect(console.log).toHaveBeenCalledWith('Total videos:', mockModuleResult.videos.length);
      expect(console.log).toHaveBeenCalledWith('- Understanding Shadow Psychology (15 min min)');
      expect(console.log).toHaveBeenCalledWith('- Shadow Projection in Daily Life (12 min min)');
    });

    it('should display bibliography information when available', async () => {
      await exampleUsage.generateJungianModule();

      expect(console.log).toHaveBeenCalledWith('\n=== Bibliography ===');
      expect(console.log).toHaveBeenCalledWith('Total sources:', mockModuleResult.bibliography.length);
      expect(console.log).toHaveBeenCalledWith('By type:', { book: 1, article: 1 });
    });

    it('should handle missing quiz gracefully', async () => {
      const resultWithoutQuiz = { ...mockModuleResult, quiz: null };
      mockOrchestratorInstance.generateModule.mockResolvedValue(resultWithoutQuiz);

      await exampleUsage.generateJungianModule();

      // Should not display quiz section
      expect(console.log).not.toHaveBeenCalledWith('\n=== Quiz ===');
    });

    it('should handle missing videos gracefully', async () => {
      const resultWithoutVideos = { ...mockModuleResult, videos: null };
      mockOrchestratorInstance.generateModule.mockResolvedValue(resultWithoutVideos);

      await exampleUsage.generateJungianModule();

      // Should not display videos section
      expect(console.log).not.toHaveBeenCalledWith('\n=== Videos ===');
    });

    it('should handle missing bibliography gracefully', async () => {
      const resultWithoutBibliography = { ...mockModuleResult, bibliography: null };
      mockOrchestratorInstance.generateModule.mockResolvedValue(resultWithoutBibliography);

      await exampleUsage.generateJungianModule();

      // Should not display bibliography section
      expect(console.log).not.toHaveBeenCalledWith('\n=== Bibliography ===');
    });

    it('should save module to file', async () => {
      const fs = await import('fs/promises');
      
      await exampleUsage.generateJungianModule();

      expect(fs.writeFile).toHaveBeenCalledWith(
        'generated-module.json',
        JSON.stringify(mockModuleResult, null, 2)
      );
      expect(console.log).toHaveBeenCalledWith('\nModule saved to generated-module.json');
    });

    it('should handle progress events', async () => {
      const progressCallback = mockOrchestratorInstance.on.mock.calls
        .find(call => call[0] === 'progress')?.[1];
      
      if (progressCallback) {
        progressCallback({
          stage: 'content-generation',
          progress: 50,
          message: 'Generating content...'
        });

        expect(console.log).toHaveBeenCalledWith('[content-generation] 50% - Generating content...');
      }
    });
  });

  describe('generateAdaptiveQuiz', () => {
    it('should generate adaptive quiz questions', async () => {
      await exampleUsage.generateAdaptiveQuiz();

      expect(mockMockLLMProvider).toHaveBeenCalled();
      expect(mockQuizGenerator).toHaveBeenCalledWith(expect.any(Object));
      
      expect(mockQuizGeneratorInstance.generateAdaptiveQuestions).toHaveBeenCalledWith(
        'Individuation Process',
        [
          { correct: true, difficulty: 'easy' },
          { correct: true, difficulty: 'easy' },
          { correct: false, difficulty: 'medium' },
          { correct: true, difficulty: 'medium' }
        ],
        3
      );

      expect(console.log).toHaveBeenCalledWith('Generated adaptive questions:', mockAdaptiveQuestions);
    });

    it('should handle adaptive question generation errors', async () => {
      mockQuizGeneratorInstance.generateAdaptiveQuestions.mockRejectedValue(new Error('Adaptive generation failed'));

      // Should not throw, but may log error
      await expect(exampleUsage.generateAdaptiveQuiz()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('should use realistic previous responses', async () => {
      await exampleUsage.generateAdaptiveQuiz();

      const expectedResponses = [
        { correct: true, difficulty: 'easy' },
        { correct: true, difficulty: 'easy' },
        { correct: false, difficulty: 'medium' },
        { correct: true, difficulty: 'medium' }
      ];

      expect(mockQuizGeneratorInstance.generateAdaptiveQuestions).toHaveBeenCalledWith(
        'Individuation Process',
        expectedResponses,
        3
      );
    });
  });

  describe('generatePracticeQuestions', () => {
    it('should generate practice questions', async () => {
      await exampleUsage.generatePracticeQuestions();

      expect(mockMockLLMProvider).toHaveBeenCalled();
      expect(mockQuizGenerator).toHaveBeenCalledWith(expect.any(Object));
      
      expect(mockQuizGeneratorInstance.generatePracticeQuestions).toHaveBeenCalledWith(
        'Psychological Types',
        'Introversion vs Extraversion', 
        5
      );

      expect(console.log).toHaveBeenCalledWith('Practice questions generated:', mockPracticeQuestions.length);
    });

    it('should display practice questions with options', async () => {
      await exampleUsage.generatePracticeQuestions();

      expect(console.log).toHaveBeenCalledWith('\nQ1: Introversion is characterized by:');
      expect(console.log).toHaveBeenCalledWith('  A. Energy directed inward');
      expect(console.log).toHaveBeenCalledWith('  B. Energy directed outward');
      expect(console.log).toHaveBeenCalledWith('  C. Social anxiety');
      expect(console.log).toHaveBeenCalledWith('  D. Shyness');
    });

    it('should handle questions without options', async () => {
      const questionsWithoutOptions = [
        {
          id: 'q1',
          question: 'Define individuation',
          options: null
        }
      ];
      mockQuizGeneratorInstance.generatePracticeQuestions.mockResolvedValue(questionsWithoutOptions);

      await exampleUsage.generatePracticeQuestions();

      expect(console.log).toHaveBeenCalledWith('\nQ1: Define individuation');
      // Should not crash when options are null
    });

    it('should handle practice question generation errors', async () => {
      mockQuizGeneratorInstance.generatePracticeQuestions.mockRejectedValue(new Error('Practice generation failed'));

      await expect(exampleUsage.generatePracticeQuestions()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle empty practice questions', async () => {
      mockQuizGeneratorInstance.generatePracticeQuestions.mockResolvedValue([]);

      await exampleUsage.generatePracticeQuestions();

      expect(console.log).toHaveBeenCalledWith('Practice questions generated:', 0);
    });
  });

  describe('Main Execution Flow', () => {
    it('should execute all examples in sequence when run as main module', async () => {
      // Mock require.main to simulate being run as main module
      const originalMain = require.main;
      (require as any).main = { filename: '../example-usage.js' };

      try {
        // This would normally be triggered by the condition check in the actual file
        const consoleSpy = jest.spyOn(console, 'log');
        
        await exampleUsage.generateJungianModule();
        await exampleUsage.generateAdaptiveQuiz();
        await exampleUsage.generatePracticeQuestions();

        expect(consoleSpy).toHaveBeenCalledWith('Running LLM Service Examples...\n');
      } finally {
        (require as any).main = originalMain;
      }
    });

    it('should handle main execution errors gracefully', async () => {
      mockOrchestratorInstance.generateModule.mockRejectedValue(new Error('Main execution error'));

      // Should catch and handle errors in main execution
      await expect(exampleUsage.generateJungianModule()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Integration and Dependencies', () => {
    it('should properly initialize all service dependencies', async () => {
      await exampleUsage.generateJungianModule();

      // Verify orchestrator was created
      expect(mockModuleGenerationOrchestrator).toHaveBeenCalled();
      
      // Verify event listeners were set up
      expect(mockOrchestratorInstance.on).toHaveBeenCalledWith('progress', expect.any(Function));
    });

    it('should properly initialize quiz generator with provider', async () => {
      await exampleUsage.generateAdaptiveQuiz();

      expect(mockMockLLMProvider).toHaveBeenCalled();
      expect(mockQuizGenerator).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle service initialization failures', async () => {
      mockModuleGenerationOrchestrator.mockImplementation(() => {
        throw new Error('Orchestrator initialization failed');
      });

      // Should handle initialization errors gracefully
      await expect(exampleUsage.generateJungianModule()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle token estimation errors', async () => {
      mockOrchestratorInstance.estimateTokenUsage.mockRejectedValue(new Error('Token estimation failed'));

      // Should handle estimation errors gracefully
      await expect(exampleUsage.generateJungianModule()).resolves.not.toThrow();

      // Should continue with generation despite estimation error
      expect(mockOrchestratorInstance.generateModule).toHaveBeenCalled();
    });

    it('should handle file saving errors', async () => {
      const fs = await import('fs/promises');
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('File save failed'));

      // Should handle file save errors gracefully
      await expect(exampleUsage.generateJungianModule()).resolves.not.toThrow();

      // Should complete generation but handle save error
      expect(console.log).toHaveBeenCalledWith('Title:', mockModuleResult.module.title);
    });

    it('should handle malformed module results', async () => {
      const malformedResult = {
        module: null,
        content: { sections: [] },
        quiz: undefined,
        videos: [],
        bibliography: null
      };
      mockOrchestratorInstance.generateModule.mockResolvedValue(malformedResult);

      await exampleUsage.generateJungianModule();

      // Should handle null/undefined gracefully
      expect(console.log).toHaveBeenCalledWith('Title:', null);
    });

    it('should handle concurrent execution', async () => {
      const promises = [
        exampleUsage.generateJungianModule(),
        exampleUsage.generateAdaptiveQuiz(),
        exampleUsage.generatePracticeQuestions()
      ];

      await Promise.all(promises);

      // All should complete without interference
      expect(mockOrchestratorInstance.generateModule).toHaveBeenCalled();
      expect(mockQuizGeneratorInstance.generateAdaptiveQuestions).toHaveBeenCalled();
      expect(mockQuizGeneratorInstance.generatePracticeQuestions).toHaveBeenCalled();
    });

    it('should handle memory-intensive operations', async () => {
      // Simulate large module result
      const largeResult = {
        ...mockModuleResult,
        content: {
          sections: Array(100).fill(null).map((_, i) => ({
            id: `section-${i}`,
            title: `Section ${i}`,
            content: 'Large content...'.repeat(1000),
            order: i
          }))
        }
      };
      mockOrchestratorInstance.generateModule.mockResolvedValue(largeResult);

      await exampleUsage.generateJungianModule();

      expect(console.log).toHaveBeenCalledWith('Sections:', 100);
    });
  });

  describe('Performance and Optimization', () => {
    it('should complete generation within reasonable time', async () => {
      const startTime = Date.now();
      
      await exampleUsage.generateJungianModule();
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly in test environment
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle multiple simultaneous generations', async () => {
      const promises = Array(5).fill(null).map(() => exampleUsage.generateJungianModule());

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockOrchestratorInstance.generateModule).toHaveBeenCalledTimes(5);
    });

    it('should efficiently display large quiz collections', async () => {
      const largePracticeQuestions = Array(50).fill(mockPracticeQuestions[0]).map((q, i) => ({
        ...q,
        id: `practice-q${i}`,
        question: `Question ${i}: ${q.question}`
      }));
      mockQuizGeneratorInstance.generatePracticeQuestions.mockResolvedValue(largePracticeQuestions);

      await exampleUsage.generatePracticeQuestions();

      expect(console.log).toHaveBeenCalledWith('Practice questions generated:', 50);
    });
  });
});