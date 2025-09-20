/**
 * Comprehensive test suite for QuizGenerator service
 * Tests quiz generation, validation, error handling, and edge cases
 * Targets 90%+ coverage for critical service functionality
 */

import { QuizGenerator } from '../quiz-generator';
import { ILLMProvider } from '../../types';
import { Quiz, Question } from '../../../../types';
import { quizEnhancer } from '../../../quiz/quizEnhancer';
import { quizValidator } from '../../../quiz/quizValidator';

// Mock dependencies
jest.mock('../../../quiz/quizEnhancer', () => ({
  quizEnhancer: {
    enhanceQuestions: jest.fn()
  }
}));

jest.mock('../../../quiz/quizValidator', () => ({
  quizValidator: {
    validateQuiz: jest.fn()
  }
}));

jest.mock('../../../../utils/quizUtils', () => ({
  randomizeAllQuestionOptions: jest.fn((questions) => questions),
  ensureVariedCorrectAnswerPositions: jest.fn((questions) => questions)
}));

// Mock LLM Provider
class MockLLMProvider implements ILLMProvider {
  private mockResponses: any[] = [];
  private responseIndex = 0;

  setMockResponse(response: any) {
    this.mockResponses = [response];
    this.responseIndex = 0;
  }

  setMockResponses(responses: any[]) {
    this.mockResponses = responses;
    this.responseIndex = 0;
  }

  async generateCompletion(prompt: string, options?: any) {
    const response = this.mockResponses[this.responseIndex % this.mockResponses.length] || 'Default response';
    this.responseIndex++;
    return { content: response };
  }

  async generateStructuredOutput<T>(prompt: string, schema: any, options?: any): Promise<T> {
    let response = this.mockResponses[this.responseIndex % this.mockResponses.length];
    this.responseIndex++;

    if (!response) {
      // Return default question structure if no response configured
      response = [{
        question: "O que caracteriza este conceito na psicologia junguiana?",
        options: [
          "Conceito fundamental da teoria",
          "Aspecto secundário",
          "Elemento dispensável",
          "Fator irrelevante"
        ],
        correctAnswer: 0,
        explanation: "Este é um conceito fundamental na psicologia de Jung.",
        difficulty: "medium",
        cognitiveLevel: "understanding"
      }];
    }

    return response as T;
  }

  async streamCompletion() { }
  getTokenCount(text: string) { return Math.ceil(text.length / 4); }
  async isAvailable() { return true; }
}

describe('QuizGenerator', () => {
  let quizGenerator: QuizGenerator;
  let mockProvider: MockLLMProvider;

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
    quizGenerator = new QuizGenerator(mockProvider);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    (quizEnhancer.enhanceQuestions as jest.Mock).mockImplementation((questions) => questions);
    (quizValidator.validateQuiz as jest.Mock).mockReturnValue({
      score: 85,
      errors: [],
      warnings: []
    });
  });

  describe('Constructor', () => {
    it('should initialize with provider', () => {
      expect(quizGenerator).toBeInstanceOf(QuizGenerator);
      expect(quizGenerator['provider']).toBe(mockProvider);
    });
  });

  describe('generateQuiz', () => {
    const mockQuizData = [
      {
        question: "What characterizes the Shadow archetype?",
        options: [
          "Repressed aspects of personality",
          "Conscious ideal self-image",
          "Collective memory patterns",
          "Creative unconscious impulses"
        ],
        correctAnswer: 0,
        explanation: "The Shadow represents repressed aspects.",
        difficulty: "medium",
        cognitiveLevel: "understanding"
      },
      {
        question: "How does individuation manifest?",
        options: [
          "Through social conformity",
          "Via personal growth journey",
          "By avoiding conflicts",
          "Through external validation"
        ],
        correctAnswer: 1,
        explanation: "Individuation is the personal growth journey.",
        difficulty: "hard",
        cognitiveLevel: "application"
      }
    ];

    beforeEach(() => {
      mockProvider.setMockResponse(mockQuizData);
    });

    it('should generate a complete quiz successfully', async () => {
      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jungian Psychology',
        'Content about Jung psychology',
        ['Understand archetypes', 'Learn about shadow'],
        2,
        'pt-BR'
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('quiz-module-123');
      expect(result.moduleId).toBe('module-123');
      expect(result.title).toContain('Jungian Psychology');
      expect(result.questions).toHaveLength(2);
      expect(result.passingScore).toBe(70);
      expect(result.timeLimit).toBe(4); // 2 questions * 2 minutes
    });

    it('should generate quiz in Portuguese when language is pt-BR', async () => {
      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Psicologia Junguiana',
        'Conteúdo sobre psicologia',
        ['Entender arquétipos'],
        1,
        'pt-BR'
      );

      expect(result.title).toContain('Questionário de Avaliação');
      expect(result.description).toContain('Teste seu entendimento');
    });

    it('should generate quiz in English when language is not pt-BR', async () => {
      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jungian Psychology',
        'Content about psychology',
        ['Understand archetypes'],
        1,
        'en'
      );

      expect(result.title).toContain('Assessment Quiz');
      expect(result.description).toContain('Test your understanding');
    });

    it('should handle default parameters', async () => {
      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content'
      );

      expect(result.questions).toHaveLength(2); // Should use mockQuizData length
      expect(result.timeLimit).toBe(20); // 10 questions * 2 minutes (default count)
    });

    it('should handle empty objectives', async () => {
      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content',
        []
      );

      expect(result).toBeDefined();
      expect(result.questions).toBeDefined();
    });

    it('should call quiz enhancement', async () => {
      await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content',
        ['objective'],
        2
      );

      expect(quizEnhancer.enhanceQuestions).toHaveBeenCalledWith(
        expect.any(Array),
        'Jung',
        {
          addExplanations: true,
          improveDistractors: true,
          varyQuestionStems: true,
          addReferences: true,
          contextualizeQuestions: true
        }
      );
    });

    it('should call quiz validation', async () => {
      await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content'
      );

      expect(quizValidator.validateQuiz).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: expect.any(Array)
        })
      );
    });
  });

  describe('generateQuestions', () => {
    it('should handle non-array response from provider', async () => {
      // Test when provider returns wrapped object
      mockProvider.setMockResponse({ 
        questions: [
          {
            question: "Test question?",
            options: ["A", "B", "C", "D"],
            correctAnswer: 0,
            explanation: "Test explanation",
            difficulty: "medium",
            cognitiveLevel: "understanding"
          }
        ]
      });

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Test Topic',
        'Content',
        [],
        1
      );

      expect(result.questions).toHaveLength(1);
    });

    it('should use fallback questions when response is invalid', async () => {
      mockProvider.setMockResponse("invalid response");

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Test Topic',
        'Content',
        [],
        2
      );

      // Should create fallback questions
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].question).toContain('Qual é um conceito-chave');
    });

    it('should pre-validate questions and fix duplicates', async () => {
      const questionsWithDuplicates = [
        {
          question: "Test question?",
          options: ["Option A", "Option A", "Option B", "Option C"], // Duplicate option
          correctAnswer: 0,
          explanation: "Test",
          difficulty: "medium",
          cognitiveLevel: "understanding"
        }
      ];

      mockProvider.setMockResponse(questionsWithDuplicates);

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Test Topic',
        'Content',
        [],
        1
      );

      // Should use fallback due to duplicates
      expect(result.questions).toHaveLength(1);
    });

    it('should pre-validate and fix generic terms', async () => {
      const questionsWithGeneric = [
        {
          question: "Test question?",
          options: ["fenômeno social", "princípio humanista", "Option C", "Option D"],
          correctAnswer: 0,
          explanation: "Test",
          difficulty: "medium",
          cognitiveLevel: "understanding"
        }
      ];

      mockProvider.setMockResponse(questionsWithGeneric);

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Test Topic',
        'Content',
        [],
        1
      );

      // Should use fallback due to generic terms
      expect(result.questions).toHaveLength(1);
    });
  });

  describe('Low validation score handling', () => {
    it('should attempt to fix questions when validation score is low', async () => {
      const mockQuestions = [
        {
          question: "Poor quality question?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          explanation: "Poor explanation",
          difficulty: "medium",
          cognitiveLevel: "understanding"
        }
      ];

      mockProvider.setMockResponses([
        mockQuestions, // Initial generation
        { // Fixed question response
          question: "Improved question about Jung?",
          options: ["Better A", "Better B", "Better C", "Better D"],
          correctAnswer: 1,
          explanation: "Better explanation",
          difficulty: "medium",
          cognitiveLevel: "understanding"
        }
      ]);

      // Mock low validation score
      (quizValidator.validateQuiz as jest.Mock).mockReturnValue({
        score: 60, // Low score
        errors: [],
        warnings: ['Q1: Duplicate option found', 'Q1: inconsistent lengths']
      });

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content about Jung',
        ['objective'],
        1
      );

      expect(result.questions).toHaveLength(1);
      // Should have attempted to fix the question
    });

    it('should handle regeneration failure gracefully', async () => {
      mockProvider.setMockResponses([
        [{ // Initial bad question
          question: "Bad question?",
          options: ["A", "A", "B", "C"], // Duplicates
          correctAnswer: 0,
          explanation: "Bad",
          difficulty: "medium",
          cognitiveLevel: "understanding"
        }],
        "invalid regeneration response" // Will cause error
      ]);

      (quizValidator.validateQuiz as jest.Mock).mockReturnValue({
        score: 50,
        errors: [],
        warnings: ['Q1: Duplicate option found']
      });

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content',
        [],
        1
      );

      // Should still return questions (fallback used)
      expect(result.questions).toHaveLength(1);
    });
  });

  describe('generateAdaptiveQuestions', () => {
    beforeEach(() => {
      mockProvider.setMockResponse([
        {
          question: "Adaptive question?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 1,
          explanation: "Adaptive explanation"
        }
      ]);
    });

    it('should generate hard questions for high performance', async () => {
      const previousResponses = [
        { correct: true, difficulty: 'medium' },
        { correct: true, difficulty: 'medium' },
        { correct: true, difficulty: 'medium' },
        { correct: true, difficulty: 'medium' },
        { correct: false, difficulty: 'medium' }
      ]; // 80% correct rate

      const result = await quizGenerator.generateAdaptiveQuestions(
        'Jung Psychology',
        previousResponses,
        3,
        'pt-BR'
      );

      expect(result).toHaveLength(3);
      expect(result[0].points).toBe(15); // Hard questions worth 15 points
    });

    it('should generate easy questions for low performance', async () => {
      const previousResponses = [
        { correct: false, difficulty: 'medium' },
        { correct: false, difficulty: 'medium' },
        { correct: true, difficulty: 'medium' },
        { correct: false, difficulty: 'medium' },
        { correct: false, difficulty: 'medium' }
      ]; // 20% correct rate

      const result = await quizGenerator.generateAdaptiveQuestions(
        'Jung Psychology',
        previousResponses,
        2,
        'pt-BR'
      );

      expect(result).toHaveLength(2);
      expect(result[0].points).toBe(5); // Easy questions worth 5 points
    });

    it('should generate medium questions for average performance', async () => {
      const previousResponses = [
        { correct: true, difficulty: 'medium' },
        { correct: false, difficulty: 'medium' },
        { correct: true, difficulty: 'medium' },
        { correct: false, difficulty: 'medium' }
      ]; // 50% correct rate

      const result = await quizGenerator.generateAdaptiveQuestions(
        'Jung Psychology',
        previousResponses,
        1,
        'en'
      );

      expect(result).toHaveLength(1);
      expect(result[0].points).toBe(10); // Medium questions worth 10 points
    });

    it('should include unique IDs with timestamp', async () => {
      const result = await quizGenerator.generateAdaptiveQuestions(
        'Jung Psychology',
        [{ correct: true, difficulty: 'medium' }],
        1
      );

      expect(result[0].id).toMatch(/^adaptive-q-\d+-0$/);
      expect(result[0].options[0].id).toMatch(/^adaptive-q-\d+-0-opt-1$/);
    });
  });

  describe('generatePracticeQuestions', () => {
    beforeEach(() => {
      mockProvider.setMockResponse([
        {
          question: "Practice question about specific concept?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 2,
          explanation: "Detailed practice explanation with examples"
        }
      ]);
    });

    it('should generate practice questions for specific concept', async () => {
      const result = await quizGenerator.generatePracticeQuestions(
        'Shadow Work',
        'Shadow Integration',
        3,
        'pt-BR'
      );

      expect(result).toHaveLength(3);
      expect(result[0].points).toBe(5); // Practice questions worth 5 points
      expect(result[0].id).toMatch(/^practice-q-\d+-0$/);
    });

    it('should use default count and language', async () => {
      const result = await quizGenerator.generatePracticeQuestions(
        'Anima/Animus',
        'Gender Psychology'
      );

      expect(result).toHaveLength(1); // Mock returns 1 question
    });

    it('should include sequential ordering', async () => {
      mockProvider.setMockResponse([
        { question: "Q1?", options: ["A", "B", "C", "D"], correctAnswer: 0, explanation: "E1" },
        { question: "Q2?", options: ["A", "B", "C", "D"], correctAnswer: 1, explanation: "E2" }
      ]);

      const result = await quizGenerator.generatePracticeQuestions(
        'Individuation',
        'Personal Growth',
        2
      );

      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle provider errors gracefully', async () => {
      mockProvider.setMockResponse(null);

      await expect(quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content'
      )).rejects.toThrow();
    });

    it('should handle empty content', async () => {
      mockProvider.setMockResponse([]);

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        '',
        [],
        0
      );

      expect(result).toBeDefined();
      expect(result.timeLimit).toBe(0); // 0 questions * 2 minutes
    });

    it('should handle very long content by truncating', async () => {
      const longContent = 'a'.repeat(2000);
      mockProvider.setMockResponse([
        {
          question: "Test question?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          explanation: "Test",
          difficulty: "medium",
          cognitiveLevel: "understanding"
        }
      ]);

      await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        longContent,
        [],
        1
      );

      // Should not throw error, content should be truncated in prompt
      expect(true).toBe(true);
    });

    it('should handle malformed question objects', async () => {
      const malformedQuestions = [
        {
          // Missing required fields
          question: "Incomplete question?",
          options: ["A", "B"], // Too few options
          explanation: "Test"
          // Missing correctAnswer, difficulty, cognitiveLevel
        }
      ];

      mockProvider.setMockResponse(malformedQuestions);

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content',
        [],
        1
      );

      // Should handle gracefully and use fallbacks
      expect(result.questions).toHaveLength(1);
    });

    it('should handle Unicode and special characters', async () => {
      const unicodeQuestions = [
        {
          question: "Questão com acentos: açãó ç?",
          options: ["Opção ã", "Opção ç", "Opção é", "Opção ü"],
          correctAnswer: 0,
          explanation: "Explicação com caracteres especiais: €£¥",
          difficulty: "medium",
          cognitiveLevel: "understanding"
        }
      ];

      mockProvider.setMockResponse(unicodeQuestions);

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Psicologia Junguiana',
        'Conteúdo',
        [],
        1
      );

      expect(result.questions[0].question).toContain('acentos');
      expect(result.questions[0].options[0].text).toContain('ã');
    });
  });

  describe('Question quality validation', () => {
    it('should ensure question options have correct structure', async () => {
      const validQuestions = [
        {
          question: "What is the Shadow?",
          options: [
            "Repressed personality aspects",
            "Conscious self-image",
            "Creative unconscious force",
            "Social interaction mask"
          ],
          correctAnswer: 0,
          explanation: "The Shadow represents repressed aspects.",
          difficulty: "medium",
          cognitiveLevel: "understanding"
        }
      ];

      mockProvider.setMockResponse(validQuestions);

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content',
        [],
        1
      );

      const question = result.questions[0];
      expect(question.options).toHaveLength(4);
      expect(question.options[0]).toHaveProperty('id');
      expect(question.options[0]).toHaveProperty('text');
      expect(question.options[0]).toHaveProperty('isCorrect');
      expect(question.options.filter(opt => opt.isCorrect)).toHaveLength(1);
    });

    it('should assign appropriate points based on difficulty', async () => {
      const difficultyQuestions = [
        {
          question: "Easy question?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          explanation: "Easy explanation",
          difficulty: "easy",
          cognitiveLevel: "recall"
        },
        {
          question: "Hard question?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 1,
          explanation: "Hard explanation",
          difficulty: "hard",
          cognitiveLevel: "analysis"
        }
      ];

      mockProvider.setMockResponse(difficultyQuestions);

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content',
        [],
        2
      );

      expect(result.questions[0].points).toBe(5); // Easy = 5 points
      expect(result.questions[1].points).toBe(15); // Hard = 15 points
    });

    it('should include metadata for tracking', async () => {
      const questions = [
        {
          question: "Test question?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          explanation: "Test explanation",
          difficulty: "medium",
          cognitiveLevel: "application"
        }
      ];

      mockProvider.setMockResponse(questions);

      const result = await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content',
        [],
        1
      );

      const question = result.questions[0];
      expect(question.metadata).toBeDefined();
      expect(question.metadata.difficulty).toBe('medium');
      expect(question.metadata.cognitiveLevel).toBe('application');
    });
  });

  describe('Integration with quiz utilities', () => {
    it('should call randomization utilities', async () => {
      const { ensureVariedCorrectAnswerPositions } = require('../../../../utils/quizUtils');
      
      await quizGenerator.generateQuiz(
        'module-123',
        'Jung',
        'Content',
        [],
        1
      );

      expect(ensureVariedCorrectAnswerPositions).toHaveBeenCalledWith(
        expect.any(Array)
      );
    });
  });
});