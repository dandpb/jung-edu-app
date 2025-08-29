/**
 * Quiz Generation Error Handling Tests
 * Tests LLM API failures, malformed JSON responses, and validation errors
 */

import { jest } from '@jest/globals';
import { QuizGenerator } from '../../src/services/llm/generators/quiz-generator';
import { MockLLMProvider } from '../../src/services/llm/providers/mock';
import { ILLMProvider } from '../../src/services/llm/types';
import { Quiz, Question } from '../../src/types';

// Mock quiz enhancer and validator
jest.mock('../../src/services/quiz/quizEnhancer', () => ({
  quizEnhancer: {
    enhanceQuestions: jest.fn((questions) => Promise.resolve(questions))
  }
}));

jest.mock('../../src/services/quiz/quizValidator', () => ({
  quizValidator: {
    validateQuiz: jest.fn(() => ({
      score: 85,
      errors: [],
      warnings: []
    }))
  }
}));

jest.mock('../../src/utils/quizUtils', () => ({
  randomizeAllQuestionOptions: jest.fn((questions) => questions),
  ensureVariedCorrectAnswerPositions: jest.fn((questions) => questions)
}));

describe('Quiz Generation Error Handling', () => {
  let quizGenerator: QuizGenerator;
  let mockProvider: ILLMProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider = new MockLLMProvider();
    quizGenerator = new QuizGenerator(mockProvider);
  });

  describe('LLM API Failure Scenarios', () => {
    it('should handle complete API failures during quiz generation', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockRejectedValue(
        new Error('LLM API is unavailable')
      );

      await expect(
        quizGenerator.generateQuiz(
          'module-1',
          'Jungian Archetypes',
          'Content about archetypes...',
          ['Understand archetypes'],
          5
        )
      ).rejects.toThrow('LLM API is unavailable');
    });

    it('should handle timeout errors from LLM provider', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(
        quizGenerator.generateQuiz(
          'module-1',
          'Jungian Archetypes',
          'Content about archetypes...',
          ['Understand archetypes'],
          3
        )
      ).rejects.toThrow('Request timeout');
    });

    it('should handle rate limiting errors from LLM API', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockRejectedValue(
        new Error('Rate limit exceeded. Please try again later.')
      );

      await expect(
        quizGenerator.generateQuiz(
          'module-1',
          'Jungian Archetypes',
          'Content about archetypes...',
          ['Understand archetypes'],
          5
        )
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle authentication errors from LLM provider', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockRejectedValue(
        new Error('Invalid API key')
      );

      await expect(
        quizGenerator.generateQuiz(
          'module-1',
          'Jungian Archetypes',
          'Content about archetypes...',
          ['Understand archetypes'],
          5
        )
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle quota exceeded errors', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockRejectedValue(
        new Error('Monthly quota exceeded')
      );

      await expect(
        quizGenerator.generateQuiz(
          'module-1',
          'Jungian Archetypes',
          'Content about archetypes...',
          ['Understand archetypes'],
          5
        )
      ).rejects.toThrow('Monthly quota exceeded');
    });
  });

  describe('Malformed Response Handling', () => {
    it('should handle completely invalid JSON responses', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue(
        'This is not JSON at all!'
      );

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        2
      );

      // Should fall back to default questions
      expect(quiz.questions).toHaveLength(2);
      expect(quiz.questions[0].question).toContain('conceito-chave');
    });

    it('should handle null or undefined responses', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue(null);

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        3
      );

      expect(quiz.questions).toHaveLength(2); // Falls back to default
    });

    it('should handle responses wrapped in unexpected objects', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue({
        questions: [
          {
            question: 'Valid question 1?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            explanation: 'This is correct',
            difficulty: 'medium',
            cognitiveLevel: 'understanding'
          }
        ]
      });

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        1
      );

      expect(quiz.questions).toHaveLength(1);
      expect(quiz.questions[0].question).toBe('Valid question 1?');
    });

    it('should handle responses with missing required fields', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue([
        {
          question: 'Valid question?',
          options: ['Option A', 'Option B'], // Too few options
          correctAnswer: 0,
          explanation: 'This is correct'
          // Missing difficulty and cognitiveLevel
        }
      ]);

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        1
      );

      // Should use fallback question
      expect(quiz.questions).toHaveLength(2);
    });

    it('should handle responses with invalid option counts', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue([
        {
          question: 'Question with wrong options?',
          options: ['Only one option'], // Should be 4 options
          correctAnswer: 0,
          explanation: 'Explanation',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        }
      ]);

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        1
      );

      // Should fall back to default questions
      expect(quiz.questions).toHaveLength(2);
    });

    it('should handle responses with invalid correctAnswer indices', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue([
        {
          question: 'Question with invalid answer?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 5, // Invalid index (should be 0-3)
          explanation: 'Explanation',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        }
      ]);

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        1
      );

      // Should fall back to default questions
      expect(quiz.questions).toHaveLength(2);
    });
  });

  describe('Content Quality Validation Errors', () => {
    it('should handle questions with duplicate options', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue([
        {
          question: 'Question with duplicate options?',
          options: ['Same option', 'Same option', 'Different option', 'Another option'],
          correctAnswer: 2,
          explanation: 'Explanation',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        }
      ]);

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        1
      );

      // Should be handled by pre-validation and create fallback
      expect(quiz.questions).toHaveLength(2);
    });

    it('should handle questions with generic terms', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue([
        {
          question: 'Generic question?',
          options: [
            'Um conceito fundamental',
            'Um princípio humanista',
            'Um fenômeno social',
            'Uma teoria psicológica'
          ],
          correctAnswer: 0,
          explanation: 'Explanation',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        }
      ]);

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        1
      );

      // Should be handled by pre-validation
      expect(quiz.questions).toHaveLength(2);
    });

    it('should handle low quality quiz validation scores', async () => {
      const { quizValidator } = require('../../src/services/quiz/quizValidator');
      quizValidator.validateQuiz.mockReturnValue({
        score: 45, // Low quality score
        errors: ['Q1: Poor question quality', 'Q2: Inadequate distractors'],
        warnings: ['Q1: Duplicate options detected', 'Q2: Generic terms used']
      });

      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue([
        {
          question: 'Low quality question?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: 'Poor explanation',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        }
      ]);

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        1
      );

      // Should attempt to fix validation issues
      expect(quiz.questions).toHaveLength(1);
    });
  });

  describe('Question Regeneration Error Scenarios', () => {
    it('should handle failures during question regeneration', async () => {
      const { quizValidator } = require('../../src/services/quiz/quizValidator');
      quizValidator.validateQuiz.mockReturnValue({
        score: 45,
        errors: [],
        warnings: ['Q1: Duplicate option detected']
      });

      jest.spyOn(mockProvider, 'generateStructuredOutput')
        .mockResolvedValueOnce([
          {
            question: 'Original question?',
            options: ['Same', 'Same', 'Different', 'Another'],
            correctAnswer: 2,
            explanation: 'Explanation',
            difficulty: 'medium',
            cognitiveLevel: 'understanding'
          }
        ])
        .mockRejectedValueOnce(new Error('Regeneration failed'));

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        1
      );

      // Should fall back to original question or create fallback
      expect(quiz.questions).toHaveLength(1);
    });

    it('should handle regenerated questions that still have issues', async () => {
      const { quizValidator } = require('../../src/services/quiz/quizValidator');
      quizValidator.validateQuiz.mockReturnValue({
        score: 45,
        errors: [],
        warnings: ['Q1: Duplicate option detected']
      });

      jest.spyOn(mockProvider, 'generateStructuredOutput')
        .mockResolvedValueOnce([
          {
            question: 'Original question?',
            options: ['Same', 'Same', 'Different', 'Another'],
            correctAnswer: 2,
            explanation: 'Explanation',
            difficulty: 'medium',
            cognitiveLevel: 'understanding'
          }
        ])
        .mockResolvedValueOnce({
          question: 'Regenerated question?',
          options: ['Still', 'Still', 'Different', 'Options'], // Still has duplicates
          correctAnswer: 2,
          explanation: 'Better explanation',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        });

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content about archetypes...',
        ['Understand archetypes'],
        1
      );

      // Should use fallback question
      expect(quiz.questions).toHaveLength(1);
    });
  });

  describe('Adaptive Quiz Generation Error Scenarios', () => {
    it('should handle failures during adaptive question generation', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockRejectedValue(
        new Error('Adaptive generation failed')
      );

      await expect(
        quizGenerator.generateAdaptiveQuestions(
          'Jungian Archetypes',
          [{ correct: true, difficulty: 'medium' }],
          3
        )
      ).rejects.toThrow('Adaptive generation failed');
    });

    it('should handle invalid performance data for adaptive generation', async () => {
      await expect(
        quizGenerator.generateAdaptiveQuestions(
          'Jungian Archetypes',
          [], // Empty performance data
          3
        )
      ).rejects.toThrow(); // Should handle division by zero in correct rate calculation
    });

    it('should handle malformed adaptive question responses', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue(null);

      await expect(
        quizGenerator.generateAdaptiveQuestions(
          'Jungian Archetypes',
          [{ correct: true, difficulty: 'medium' }],
          3
        )
      ).rejects.toThrow();
    });
  });

  describe('Practice Question Generation Error Scenarios', () => {
    it('should handle failures during practice question generation', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockRejectedValue(
        new Error('Practice generation failed')
      );

      await expect(
        quizGenerator.generatePracticeQuestions(
          'Jungian Archetypes',
          'Shadow Archetype',
          5
        )
      ).rejects.toThrow('Practice generation failed');
    });

    it('should handle invalid topic or concept parameters', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue([
        {
          question: 'Practice question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Explanation'
        }
      ]);

      await expect(
        quizGenerator.generatePracticeQuestions(
          '', // Empty topic
          'Shadow Archetype',
          5
        )
      ).resolves.toBeDefined(); // Should handle gracefully
    });
  });

  describe('Memory and Resource Management Errors', () => {
    it('should handle out of memory errors during large quiz generation', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockRejectedValue(
        new Error('Out of memory')
      );

      await expect(
        quizGenerator.generateQuiz(
          'module-1',
          'Jungian Archetypes',
          'Very long content...'.repeat(10000), // Large content
          ['Objective 1', 'Objective 2'],
          50 // Large number of questions
        )
      ).rejects.toThrow('Out of memory');
    });

    it('should handle resource cleanup on generation failure', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockRejectedValue(
        new Error('Generation failed')
      );

      await expect(
        quizGenerator.generateQuiz(
          'module-1',
          'Jungian Archetypes',
          'Content...',
          ['Objective'],
          5
        )
      ).rejects.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Concurrent Generation Error Scenarios', () => {
    it('should handle multiple concurrent quiz generation requests', async () => {
      // Mock some to succeed and some to fail
      jest.spyOn(mockProvider, 'generateStructuredOutput')
        .mockResolvedValueOnce([
          {
            question: 'Success 1?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            explanation: 'Explanation',
            difficulty: 'medium',
            cognitiveLevel: 'understanding'
          }
        ])
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockResolvedValueOnce([
          {
            question: 'Success 2?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 1,
            explanation: 'Explanation',
            difficulty: 'medium',
            cognitiveLevel: 'understanding'
          }
        ]);

      const promises = [
        quizGenerator.generateQuiz('mod-1', 'Topic 1', 'Content 1', ['Obj 1'], 1),
        quizGenerator.generateQuiz('mod-2', 'Topic 2', 'Content 2', ['Obj 2'], 1),
        quizGenerator.generateQuiz('mod-3', 'Topic 3', 'Content 3', ['Obj 3'], 1)
      ];

      const results = await Promise.allSettled(promises);
      
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });

    it('should handle race conditions in quiz enhancement', async () => {
      const { quizEnhancer } = require('../../src/services/quiz/quizEnhancer');
      
      let enhanceCallCount = 0;
      quizEnhancer.enhanceQuestions.mockImplementation(() => {
        enhanceCallCount++;
        if (enhanceCallCount === 1) {
          return new Promise(resolve => setTimeout(resolve, 200));
        }
        return Promise.resolve([]);
      });

      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue([
        {
          question: 'Test question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Explanation',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        }
      ]);

      const promises = [
        quizGenerator.generateQuiz('mod-1', 'Topic', 'Content', ['Obj'], 1),
        quizGenerator.generateQuiz('mod-2', 'Topic', 'Content', ['Obj'], 1)
      ];

      const results = await Promise.allSettled(promises);
      
      // Both should complete despite race condition
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });
  });

  describe('Language and Localization Error Scenarios', () => {
    it('should handle unsupported language codes', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue([
        {
          question: 'Question in unknown language?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Explanation',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        }
      ]);

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content...',
        ['Objective'],
        1,
        'invalid-lang'
      );

      expect(quiz.questions).toHaveLength(1);
    });

    it('should handle mixed language responses', async () => {
      jest.spyOn(mockProvider, 'generateStructuredOutput').mockResolvedValue([
        {
          question: '¿Pregunta en español?',
          options: ['English option', 'Opção portuguesa', '日本語オプション', 'Français option'],
          correctAnswer: 0,
          explanation: 'Mixed language explanation',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        }
      ]);

      const quiz = await quizGenerator.generateQuiz(
        'module-1',
        'Jungian Archetypes',
        'Content...',
        ['Objective'],
        1,
        'pt-BR'
      );

      // Should still generate quiz despite language inconsistency
      expect(quiz.questions).toHaveLength(1);
    });
  });
});
