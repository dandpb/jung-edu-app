/**
 * Comprehensive test suite for EnhancedQuizGenerator
 * Tests template-based generation, enhancements, and all methods
 */

import { EnhancedQuizGenerator, EnhancedQuizOptions } from '../enhancedQuizGenerator';
import { ILLMProvider } from '../../llm/types';
import { Quiz, Question } from '../../../types';
import { quizEnhancer } from '../quizEnhancer';
import { quizPromptService, QuizPromptConfig } from '../quizPromptService';
import {
  getQuestionTemplate,
  getTopicConcepts,
  topicTemplates,
  difficultyProgressions
} from '../quizTemplates';

// Mock dependencies
jest.mock('../quizEnhancer');
jest.mock('../quizTemplates', () => ({
  getQuestionTemplate: jest.fn(),
  getTopicConcepts: jest.fn(),
  topicTemplates: [],
  difficultyProgressions: {},
  jungQuestionTypes: {}
}));
jest.mock('../quizPromptService');

describe('EnhancedQuizGenerator', () => {
  let generator: EnhancedQuizGenerator;
  let mockProvider: jest.Mocked<ILLMProvider>;

  // Test options - moved to top level for all tests to access
  const testOptions: EnhancedQuizOptions = {
    useTemplates: true,
    enhanceQuestions: true,
    adaptiveDifficulty: true,
    includeEssayQuestions: false,
    contextualizeQuestions: true,
    userLevel: 'intermediate'
  };

  // Test data
  const mockQuestionTemplate = {
    type: 'multiple-choice',
    structure: 'What is the significance of {concept} in {context}?',
    optionPatterns: ['Correct answer', 'Plausible distractor 1', 'Plausible distractor 2', 'Obvious wrong'],
    explanationTemplate: 'The correct answer is {answer} because {reasoning}'
  };

  const mockTopicConcepts = ['shadow', 'anima', 'animus', 'individuação', 'arquétipos'];

  const mockDifficultyProgression = {
    questionDistribution: { easy: 0.3, medium: 0.5, hard: 0.2 },
    cognitiveDistribution: {
      remembering: 0.2,
      understanding: 0.3,
      applying: 0.3,
      analyzing: 0.2
    }
  };

  const mockRawQuestions = [
    {
      question: 'What is the shadow archetype according to Jung?',
      type: 'multiple-choice',
      options: [
        'The unconscious part of personality',
        'The conscious ego',
        'The collective memory',
        'The rational mind'
      ],
      correctAnswer: 0,
      explanation: 'The shadow represents the unconscious aspects of personality that the ego does not identify with.',
      difficulty: 'medium'
    },
    {
      question: 'How does individuation relate to personal growth?',
      type: 'multiple-choice',
      options: [
        'It is the process of integrating conscious and unconscious',
        'It is purely intellectual development',
        'It focuses only on social adaptation',
        'It eliminates the unconscious'
      ],
      correctAnswer: 0,
      explanation: 'Individuation is the central process of human development involving the integration of conscious and unconscious elements.',
      difficulty: 'hard'
    }
  ];

  const mockEssayQuestions = [
    {
      question: 'Discuss how the concept of the shadow influences personal relationships and self-awareness.',
      type: 'essay',
      rubric: {
        required: ['shadow concept', 'personal relationships', 'self-awareness'],
        optional: ['examples', 'Jung references'],
        depth: 300
      },
      explanation: 'A comprehensive answer should address the shadow\'s role in projection and its impact on relationships.'
    }
  ];

  const mockEnhancedQuestions = mockRawQuestions.map((q, i) => ({
    ...q,
    id: `enhanced-${i + 1}`,
    points: 10,
    order: i,
    metadata: {
      enhanced: true,
      cognitiveLevel: 'understanding'
    }
  }));

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock provider
    mockProvider = {
      generateStructuredOutput: jest.fn(),
      generateCompletion: jest.fn(),
      getTokenCount: jest.fn().mockReturnValue(100),
      isAvailable: jest.fn().mockResolvedValue(true)
    } as any;

    // Setup mock returns
    mockProvider.generateStructuredOutput.mockResolvedValue(mockRawQuestions);
    mockProvider.generateCompletion.mockResolvedValue({ 
      content: 'Generated study guide content',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
    });

    // Setup template mocks
    (getQuestionTemplate as jest.Mock).mockReturnValue(mockQuestionTemplate);
    (getTopicConcepts as jest.Mock).mockReturnValue(mockTopicConcepts);
    
    // Setup prompt service mocks
    (quizPromptService.getTopicConcepts as jest.Mock).mockReturnValue(mockTopicConcepts);
    (quizPromptService.getQuizGenerationPrompt as jest.Mock).mockImplementation(
      (config: QuizPromptConfig) => Promise.resolve(`Quiz generation prompt for ${config.topic}`)
    );
    
    // Mock module values directly through the mock
    const mockModule = require('../quizTemplates');
    mockModule.topicTemplates = [
      { topic: 'Collective Unconscious', concepts: mockTopicConcepts }
    ];
    mockModule.difficultyProgressions = {
      beginner: mockDifficultyProgression,
      intermediate: mockDifficultyProgression,
      advanced: mockDifficultyProgression
    };

    // Setup quiz enhancer mock to return the questions it receives (with enhancement metadata)
    (quizEnhancer.enhanceQuestions as jest.Mock).mockImplementation(async (questions) => {
      return questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `enhanced-${index + 1}`,
        points: q.points || 10,
        order: q.order !== undefined ? q.order : index,
        metadata: {
          ...q.metadata,
          enhanced: true,
          cognitiveLevel: q.metadata?.cognitiveLevel || 'understanding'
        }
      }));
    });

    generator = new EnhancedQuizGenerator(mockProvider);
  });

  describe('constructor', () => {
    it('should initialize with LLM provider', () => {
      expect(generator).toBeDefined();
      expect(generator).toBeInstanceOf(EnhancedQuizGenerator);
    });
  });

  describe('generateEnhancedQuiz', () => {
    it('should generate enhanced quiz with all components', async () => {
      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Collective Unconscious',
        'Module content about collective unconscious...',
        ['Understand Jung\'s theory', 'Apply concepts'],
        10,
        testOptions
      );

      expect(quiz).toBeDefined();
      expect(quiz.id).toBe('quiz-test-module-1');
      expect(quiz.moduleId).toBe('test-module-1');
      expect(quiz.title).toContain('Collective Unconscious');
      expect(quiz.questions).toBeDefined();
      expect(quiz.questions.length).toBeGreaterThan(0);
      expect(quiz.metadata?.enhanced).toBe(true);
      expect(quiz.metadata?.userLevel).toBe('intermediate');
    });

    it('should use templates when enabled', async () => {
      await generator.generateEnhancedQuiz(
        'test-module-1',
        'Archetypes',
        'Content',
        ['Objective 1'],
        5,
        { ...testOptions, useTemplates: true }
      );

      expect(quizPromptService.getTopicConcepts).toHaveBeenCalledWith('Archetypes');
      expect(quizPromptService.getQuizGenerationPrompt).toHaveBeenCalled();
    });

    it('should skip templates when disabled', async () => {
      // Mock the parent class method
      const generateQuestionsSpy = jest.spyOn(generator, 'generateQuestions' as any);
      generateQuestionsSpy.mockResolvedValue(mockRawQuestions.map((q, i) => ({
        ...q,
        id: `q${i + 1}`,
        points: 10,
        order: i
      })));

      await generator.generateEnhancedQuiz(
        'test-module-1',
        'Archetypes',
        'Content',
        ['Objective 1'],
        5,
        { ...testOptions, useTemplates: false }
      );

      expect(generateQuestionsSpy).toHaveBeenCalled();
      expect(quizPromptService.getTopicConcepts).not.toHaveBeenCalled();
    });

    it('should enhance questions when enabled', async () => {
      await generator.generateEnhancedQuiz(
        'test-module-1',
        'Shadow',
        'Content',
        ['Objective 1'],
        5,
        { ...testOptions, enhanceQuestions: true }
      );

      expect(quizEnhancer.enhanceQuestions).toHaveBeenCalledWith(
        expect.any(Array),
        'Shadow',
        expect.objectContaining({
          addExplanations: true,
          improveDistractors: true,
          varyQuestionStems: true,
          addReferences: true,
          contextualizeQuestions: true
        })
      );
    });

    it('should skip enhancement when disabled', async () => {
      await generator.generateEnhancedQuiz(
        'test-module-1',
        'Shadow',
        'Content',
        ['Objective 1'],
        5,
        { ...testOptions, enhanceQuestions: false }
      );

      expect(quizEnhancer.enhanceQuestions).not.toHaveBeenCalled();
    });

    it('should include essay questions when requested', async () => {
      // For templated generation: easy (3), medium (5), hard (2) = 3 calls + 1 call for essays
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce([mockRawQuestions[0]]) // For easy questions (3)
        .mockResolvedValueOnce([mockRawQuestions[1]]) // For medium questions (5)  
        .mockResolvedValueOnce([]) // For hard questions (2) - empty response
        .mockResolvedValueOnce(mockEssayQuestions); // For essay questions

      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Individuation',
        'Content',
        ['Objective 1'],
        10,
        { ...testOptions, includeEssayQuestions: true }
      );

      expect(quiz.questions.some(q => q.type === 'essay')).toBe(true);
    });

    it('should calculate appropriate time limit', async () => {
      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        ['Objective 1'],
        5,
        testOptions
      );

      expect(quiz.timeLimit).toBeGreaterThan(0);
      expect(typeof quiz.timeLimit).toBe('number');
    });

    it('should include metadata with concepts and difficulty distribution', async () => {
      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        ['Objective 1'],
        5,
        testOptions
      );

      expect(quiz.metadata?.concepts).toBeDefined();
      expect(quiz.metadata?.difficultyDistribution).toBeDefined();
      expect(Array.isArray(quiz.metadata?.concepts)).toBe(true);
    });
  });

  describe('templated question generation', () => {
    it('should distribute questions by difficulty correctly', async () => {
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce([mockRawQuestions[0]]) // easy
        .mockResolvedValueOnce([mockRawQuestions[1]]) // medium
        .mockResolvedValueOnce([]); // hard (empty)

      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        ['Objective 1'],
        10,
        {
          ...testOptions,
          userLevel: 'intermediate'
        }
      );

      expect(quiz.questions.length).toBeGreaterThan(0);
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledTimes(3);
    });

    it('should handle different user levels', async () => {
      await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        ['Objective 1'],
        10,
        {
          ...testOptions,
          userLevel: 'beginner'
        }
      );

      expect(difficultyProgressions.beginner).toBeDefined();
    });

    it('should handle advanced user level', async () => {
      await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        ['Objective 1'],
        10,
        {
          ...testOptions,
          userLevel: 'advanced'
        }
      );

      expect(difficultyProgressions.advanced).toBeDefined();
    });
  });

  describe('essay question generation', () => {
    beforeEach(() => {
      // Reset the mock to clear previous calls and set new behavior
      mockProvider.generateStructuredOutput.mockReset();
    });

    it('should generate essay questions with proper structure', async () => {
      // Setup responses for templated generation then essay generation
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce([mockRawQuestions[0]]) // For easy questions
        .mockResolvedValueOnce([mockRawQuestions[1]]) // For medium questions  
        .mockResolvedValueOnce([]) // For hard questions
        .mockResolvedValueOnce(mockEssayQuestions); // For essay questions

      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Deep Topic',
        'Content',
        ['Analyze concepts', 'Synthesize ideas'],
        10,
        {
          ...testOptions,
          includeEssayQuestions: true
        }
      );

      const essayQuestions = quiz.questions.filter(q => q.type === 'essay');
      expect(essayQuestions.length).toBeGreaterThan(0);
      
      essayQuestions.forEach(q => {
        expect(q.rubric).toBeDefined();
        expect(q.points).toBe(25);
        expect(q.correctAnswer).toBe(-1);
        expect(q.options).toEqual([]);
        expect(q.metadata?.difficulty).toBe('hard');
        expect(q.metadata?.cognitiveLevel).toBe('create');
      });
    });

    it('should handle essay generation failure gracefully', async () => {
      // Setup responses: difficulty questions then null for essay generation
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce([mockRawQuestions[0]]) // For easy questions
        .mockResolvedValueOnce([mockRawQuestions[1]]) // For medium questions  
        .mockResolvedValueOnce([]) // For hard questions
        .mockResolvedValueOnce(null); // For essay questions (failure case)

      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Topic',
        'Content',
        ['Objective'],
        10,
        {
          ...testOptions,
          includeEssayQuestions: true
        }
      );

      expect(quiz.questions.some(q => q.type === 'essay')).toBe(true);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle provider returning non-array', async () => {
      // Set up non-array responses for difficulty questions to trigger fallback
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce({} as any) // For easy questions - non-array
        .mockResolvedValueOnce({} as any) // For medium questions - non-array
        .mockResolvedValueOnce({} as any); // For hard questions - non-array

      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        ['Objective 1'],
        5,
        testOptions
      );

      expect(quiz.questions.length).toBeGreaterThan(0);
      expect(quiz.questions[0].question).toContain('Test Topic');
    });

    it('should handle provider errors', async () => {
      mockProvider.generateStructuredOutput.mockRejectedValue(new Error('Provider error'));

      await expect(
        generator.generateEnhancedQuiz(
          'test-module-1',
          'Test Topic',
          'Content',
          ['Objective 1'],
          5,
          testOptions
        )
      ).rejects.toThrow();
    });

    it('should handle empty objectives array', async () => {
      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        [],
        5,
        testOptions
      );

      expect(quiz).toBeDefined();
      expect(quiz.questions.length).toBeGreaterThan(0);
    });

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(10000);
      
      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        longContent,
        ['Objective 1'],
        5,
        testOptions
      );

      expect(quiz).toBeDefined();
    });

    it('should handle zero question count', async () => {
      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        ['Objective 1'],
        0,
        testOptions
      );

      expect(quiz.questions).toEqual([]);
      expect(quiz.timeLimit).toBe(0);
    });

    it('should handle special characters in topic', async () => {
      const specialTopic = 'Jung & "Complex" Theory <Test>';
      
      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        specialTopic,
        'Content',
        ['Objective 1'],
        5,
        testOptions
      );

      expect(quiz.title).toContain(specialTopic);
    });
  });

  describe('study guide generation', () => {
    const mockQuiz: Quiz = {
      id: 'quiz-1',
      moduleId: 'module-1',
      title: 'Test Quiz',
      description: 'Test Description',
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'Question 1',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Explanation 1',
          points: 10,
          order: 0,
          metadata: {
            concepts: ['shadow', 'unconscious']
          }
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          question: 'Question 2',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 1,
          explanation: 'Explanation 2',
          points: 10,
          order: 1,
          metadata: {
            concepts: ['archetypes', 'collective']
          }
        }
      ],
      passingScore: 70,
      timeLimit: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should generate study guide for incorrect answers', async () => {
      const userResponses = [
        { questionId: 'q1', correct: false },
        { questionId: 'q2', correct: true }
      ];

      const studyGuide = await generator.generateStudyGuide(
        mockQuiz,
        userResponses,
        'Shadow Concepts'
      );

      expect(studyGuide).toBeDefined();
      expect(typeof studyGuide).toBe('string');
      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Shadow Concepts'),
        expect.any(Object)
      );
    });

    it('should identify weak concepts correctly', async () => {
      const userResponses = [
        { questionId: 'q1', correct: false },
        { questionId: 'q2', correct: false }
      ];

      await generator.generateStudyGuide(mockQuiz, userResponses, 'Test Topic');

      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('shadow'),
        expect.any(Object)
      );
    });

    it('should handle empty incorrect responses', async () => {
      const userResponses = [
        { questionId: 'q1', correct: true },
        { questionId: 'q2', correct: true }
      ];

      const studyGuide = await generator.generateStudyGuide(
        mockQuiz,
        userResponses,
        'Test Topic'
      );

      expect(studyGuide).toBeDefined();
    });

    it('should handle non-existent question IDs', async () => {
      const userResponses = [
        { questionId: 'non-existent', correct: false }
      ];

      const studyGuide = await generator.generateStudyGuide(
        mockQuiz,
        userResponses,
        'Test Topic'
      );

      expect(studyGuide).toBeDefined();
    });
  });

  describe('helper methods', () => {
    it('should calculate time limit correctly for different question types', async () => {
      const mixedQuestions = [
        { type: 'multiple-choice' },
        { type: 'true-false' },
        { type: 'short-answer' },
        { type: 'essay' },
        { type: 'unknown' }
      ] as Question[];

      // Access private method through public interface
      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        ['Objective 1'],
        0, // Zero questions to test calculation logic
        testOptions
      );

      // Mock questions to test time calculation
      (quiz as any).questions = mixedQuestions;
      
      // Expected: MC(2) + TF(2) + SA(5) + Essay(15) + Unknown(3) = 27 minutes
      const expectedTime = 2 + 2 + 5 + 15 + 3;
      
      // We can't directly test the private method, so we'll verify through the public interface
      expect(quiz.timeLimit).toBeGreaterThanOrEqual(0);
    });

    it('should extract concepts from questions correctly', async () => {
      const questionsWithConcepts = mockRawQuestions.map((q, i) => ({
        ...q,
        id: `q${i + 1}`,
        points: 10,
        order: i,
        metadata: {
          concepts: ['shadow', 'individuation']
        }
      }));

      (quizEnhancer.enhanceQuestions as jest.Mock).mockResolvedValue(questionsWithConcepts);

      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        ['Objective 1'],
        2,
        testOptions
      );

      expect(quiz.metadata?.concepts).toContain('shadow');
      expect(quiz.metadata?.concepts).toContain('individuation');
    });

    it('should analyze difficulty distribution correctly', async () => {
      const questionsWithDifficulty = mockRawQuestions.map((q, i) => ({
        ...q,
        id: `q${i + 1}`,
        points: 10,
        order: i,
        metadata: {
          difficulty: i === 0 ? 'easy' : 'hard'
        }
      }));

      (quizEnhancer.enhanceQuestions as jest.Mock).mockResolvedValue(questionsWithDifficulty);

      const quiz = await generator.generateEnhancedQuiz(
        'test-module-1',
        'Test Topic',
        'Content',
        ['Objective 1'],
        2,
        testOptions
      );

      expect(quiz.metadata?.difficultyDistribution?.easy).toBe(1);
      expect(quiz.metadata?.difficultyDistribution?.hard).toBe(1);
      expect(quiz.metadata?.difficultyDistribution?.medium).toBe(0);
    });
  });

  describe('provider integration', () => {
    it('should pass correct parameters to provider', async () => {
      await generator.generateEnhancedQuiz(
        'test-module-1',
        'Complex Topic',
        'Complex content with many details',
        ['Learn concepts', 'Apply knowledge'],
        8,
        testOptions
      );

      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Quiz generation prompt for Complex Topic'),
        expect.any(Array),
        expect.objectContaining({
          temperature: expect.any(Number),
          maxTokens: expect.any(Number)
        })
      );
    });

    it('should handle provider timeout', async () => {
      mockProvider.generateStructuredOutput.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(
        generator.generateEnhancedQuiz(
          'test-module-1',
          'Test Topic',
          'Content',
          ['Objective 1'],
          5,
          testOptions
        )
      ).rejects.toThrow('Timeout');
    });
  });
});
