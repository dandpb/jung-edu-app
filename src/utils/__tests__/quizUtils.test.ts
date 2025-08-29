/**
 * Comprehensive test suite for quiz utility functions
 * Testing edge cases, boundary conditions, and performance
 */

import {
  randomizeQuestionOptions,
  randomizeAllQuestionOptions,
  ensureVariedCorrectAnswerPositions,
  getBalancedCorrectAnswerPosition,
  shuffleOptionsWithTracking
} from '../quizUtils';
import { Question } from '../../types';

// Test data generators for property-based testing
const generateQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'q1',
  text: 'Test question',
  type: 'multiple-choice',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctAnswer: 0,
  explanation: 'Test explanation',
  difficulty: 'medium',
  ...overrides
});

const generateQuestions = (count: number): Question[] => {
  return Array.from({ length: count }, (_, i) => 
    generateQuestion({ 
      id: `q${i + 1}`, 
      correctAnswer: i % 4 // Distribute correct answers across positions
    })
  );
};

describe('Quiz Utilities - Comprehensive Test Suite', () => {
  
  describe('randomizeQuestionOptions', () => {
    it('should randomize multiple-choice question options', () => {
      const question = generateQuestion();
      const randomized = randomizeQuestionOptions(question);
      
      expect(randomized.options).toHaveLength(4);
      expect(randomized.options).toEqual(expect.arrayContaining(question.options));
      expect(randomized.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(randomized.correctAnswer).toBeLessThan(4);
      
      // The correct option should still be at the new correct answer index
      const originalCorrectOption = question.options![question.correctAnswer as number];
      const newCorrectOption = randomized.options![randomized.correctAnswer as number];
      expect(newCorrectOption).toBe(originalCorrectOption);
    });

    it('should not modify non-multiple-choice questions', () => {
      const trueFalseQuestion = generateQuestion({
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 1
      });
      
      const result = randomizeQuestionOptions(trueFalseQuestion);
      expect(result).toEqual(trueFalseQuestion);
    });

    it('should handle questions without options', () => {
      const noOptionsQuestion = generateQuestion({ options: undefined });
      const result = randomizeQuestionOptions(noOptionsQuestion);
      expect(result).toEqual(noOptionsQuestion);
    });

    it('should handle questions with empty options array', () => {
      const emptyOptionsQuestion = generateQuestion({ options: [] });
      const result = randomizeQuestionOptions(emptyOptionsQuestion);
      expect(result).toEqual(emptyOptionsQuestion);
    });

    it('should handle single option correctly', () => {
      const singleOption = generateQuestion({
        options: ['Only option'],
        correctAnswer: 0
      });
      
      const result = randomizeQuestionOptions(singleOption);
      expect(result.options).toEqual(['Only option']);
      expect(result.correctAnswer).toBe(0);
    });

    it('should handle array-type correct answers', () => {
      const multiCorrect = generateQuestion({
        correctAnswer: [0, 2] // Multiple correct answers
      });
      
      const result = randomizeQuestionOptions(multiCorrect);
      expect(Array.isArray(result.correctAnswer)).toBe(true);
      expect(result.correctAnswer).toHaveLength(2);
    });

    // Property-based testing
    it('should maintain options count after randomization', () => {
      for (let i = 2; i <= 10; i++) {
        const options = Array.from({ length: i }, (_, idx) => `Option ${idx}`);
        const question = generateQuestion({ options, correctAnswer: 0 });
        
        const result = randomizeQuestionOptions(question);
        expect(result.options).toHaveLength(i);
      }
    });

    it('should randomize effectively (statistical test)', () => {
      const question = generateQuestion();
      const positions = new Set();
      
      // Run 100 randomizations to check distribution
      for (let i = 0; i < 100; i++) {
        const randomized = randomizeQuestionOptions(question);
        positions.add(randomized.correctAnswer);
      }
      
      // Should see multiple different positions (not always the same)
      expect(positions.size).toBeGreaterThan(1);
    });

    it('should handle extreme correctAnswer indices', () => {
      const question = generateQuestion({
        options: ['A', 'B', 'C', 'D', 'E'],
        correctAnswer: 4 // Last option
      });
      
      const result = randomizeQuestionOptions(question);
      expect(result.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(result.correctAnswer).toBeLessThan(5);
      
      // Original correct option should still be at the new position
      expect(result.options![result.correctAnswer as number]).toBe('E');
    });
  });

  describe('randomizeAllQuestionOptions', () => {
    it('should randomize all questions in array', () => {
      const questions = generateQuestions(5);
      const randomized = randomizeAllQuestionOptions(questions);
      
      expect(randomized).toHaveLength(5);
      randomized.forEach((q, index) => {
        expect(q.options).toHaveLength(4);
        expect(q.options).toEqual(expect.arrayContaining(questions[index].options!));
      });
    });

    it('should handle empty array', () => {
      const result = randomizeAllQuestionOptions([]);
      expect(result).toEqual([]);
    });

    it('should handle mixed question types', () => {
      const questions = [
        generateQuestion({ type: 'multiple-choice' }),
        generateQuestion({ type: 'true-false', options: ['True', 'False'] }),
        generateQuestion({ type: 'short-answer', options: undefined })
      ];
      
      const result = randomizeAllQuestionOptions(questions);
      expect(result).toHaveLength(3);
      
      // Multiple choice should be randomized, others unchanged
      expect(result[0].options).toEqual(expect.arrayContaining(questions[0].options!));
      expect(result[1]).toEqual(questions[1]); // True/false unchanged
      expect(result[2]).toEqual(questions[2]); // Short answer unchanged
    });

    it('should not mutate original array', () => {
      const questions = generateQuestions(3);
      const originalQuestions = JSON.parse(JSON.stringify(questions));
      
      randomizeAllQuestionOptions(questions);
      
      expect(questions).toEqual(originalQuestions);
    });
  });

  describe('ensureVariedCorrectAnswerPositions', () => {
    it('should vary correct answer positions', () => {
      // Create questions with same correct answer position
      const questions = Array.from({ length: 10 }, () => 
        generateQuestion({ correctAnswer: 0 })
      );
      
      const varied = ensureVariedCorrectAnswerPositions(questions);
      
      const positions = varied
        .filter(q => q.type === 'multiple-choice')
        .map(q => q.correctAnswer as number);
      
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBeGreaterThan(1);
    });

    it('should handle non-multiple-choice questions', () => {
      const questions = [
        generateQuestion({ type: 'true-false' }),
        generateQuestion({ type: 'short-answer' })
      ];
      
      const result = ensureVariedCorrectAnswerPositions(questions);
      expect(result).toEqual(questions);
    });

    it('should avoid consecutive same positions', () => {
      const questions = Array.from({ length: 6 }, () => 
        generateQuestion({ correctAnswer: 0 })
      );
      
      const varied = ensureVariedCorrectAnswerPositions(questions);
      
      // Check for patterns of 3+ consecutive same positions
      const positions = varied.map(q => q.correctAnswer as number);
      let consecutiveCount = 1;
      let maxConsecutive = 1;
      
      for (let i = 1; i < positions.length; i++) {
        if (positions[i] === positions[i - 1]) {
          consecutiveCount++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
        } else {
          consecutiveCount = 1;
        }
      }
      
      expect(maxConsecutive).toBeLessThanOrEqual(3); // Should limit consecutive patterns
    });

    it('should handle empty array', () => {
      const result = ensureVariedCorrectAnswerPositions([]);
      expect(result).toEqual([]);
    });
  });

  describe('getBalancedCorrectAnswerPosition', () => {
    it('should return position within valid range', () => {
      for (let i = 0; i < 20; i++) {
        const position = getBalancedCorrectAnswerPosition(i);
        expect(position).toBeGreaterThanOrEqual(0);
        expect(position).toBeLessThanOrEqual(3);
      }
    });

    it('should distribute positions evenly', () => {
      const positions = [];
      for (let i = 0; i < 16; i++) {
        positions.push(getBalancedCorrectAnswerPosition(i));
      }
      
      const distribution = [0, 1, 2, 3].map(pos => 
        positions.filter(p => p === pos).length
      );
      
      // Each position should appear 4 times in 16 questions
      distribution.forEach(count => {
        expect(count).toBe(4);
      });
    });

    it('should follow predictable pattern', () => {
      const firstPattern = [];
      const secondPattern = [];
      
      for (let i = 0; i < 4; i++) {
        firstPattern.push(getBalancedCorrectAnswerPosition(i));
        secondPattern.push(getBalancedCorrectAnswerPosition(i + 4));
      }
      
      // Patterns should be different but both contain all positions 0-3
      expect(new Set(firstPattern).size).toBe(4);
      expect(new Set(secondPattern).size).toBe(4);
    });
  });

  describe('shuffleOptionsWithTracking', () => {
    it('should shuffle options and track correct answer', () => {
      const options = ['A', 'B', 'C', 'D'];
      const correctIndex = 2;
      
      const result = shuffleOptionsWithTracking(options, correctIndex);
      
      expect(result.options).toHaveLength(4);
      expect(result.options).toEqual(expect.arrayContaining(options));
      expect(result.newCorrectIndex).toBeGreaterThanOrEqual(0);
      expect(result.newCorrectIndex).toBeLessThan(4);
      expect(result.options[result.newCorrectIndex]).toBe('C');
    });

    it('should handle single option', () => {
      const options = ['Only'];
      const result = shuffleOptionsWithTracking(options, 0);
      
      expect(result.options).toEqual(['Only']);
      expect(result.newCorrectIndex).toBe(0);
    });

    it('should handle empty options', () => {
      const result = shuffleOptionsWithTracking([], 0);
      
      expect(result.options).toEqual([]);
      expect(result.newCorrectIndex).toBe(-1); // findIndex returns -1 for not found
    });

    it('should not mutate original options', () => {
      const options = ['A', 'B', 'C', 'D'];
      const originalOptions = [...options];
      
      shuffleOptionsWithTracking(options, 0);
      
      expect(options).toEqual(originalOptions);
    });

    it('should be random (statistical test)', () => {
      const options = ['A', 'B', 'C', 'D'];
      const results = [];
      
      for (let i = 0; i < 100; i++) {
        const result = shuffleOptionsWithTracking(options, 0);
        results.push(result.newCorrectIndex);
      }
      
      const uniquePositions = new Set(results);
      expect(uniquePositions.size).toBeGreaterThan(1);
    });

    it('should handle edge case with invalid correctIndex', () => {
      const options = ['A', 'B'];
      const result = shuffleOptionsWithTracking(options, 5); // Invalid index
      
      expect(result.options).toHaveLength(2);
      expect(result.newCorrectIndex).toBe(-1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large question sets efficiently', () => {
      const largeQuestionSet = generateQuestions(1000);
      
      const start = performance.now();
      randomizeAllQuestionOptions(largeQuestionSet);
      const duration = performance.now() - start;
      
      // Should complete within reasonable time (1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle many option shuffles efficiently', () => {
      const manyOptions = Array.from({ length: 100 }, (_, i) => `Option ${i}`);
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        shuffleOptionsWithTracking(manyOptions, 0);
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed question objects', () => {
      const malformedQuestion = {
        id: 'test',
        text: 'Test'
        // Missing required properties
      } as Question;
      
      expect(() => randomizeQuestionOptions(malformedQuestion)).not.toThrow();
    });

    it('should handle null/undefined inputs gracefully', () => {
      expect(() => randomizeAllQuestionOptions(null as any)).toThrow();
      expect(() => ensureVariedCorrectAnswerPositions(undefined as any)).toThrow();
    });

    it('should handle options with duplicate values', () => {
      const duplicateOptions = generateQuestion({
        options: ['Same', 'Same', 'Different', 'Same'],
        correctAnswer: 0
      });
      
      const result = randomizeQuestionOptions(duplicateOptions);
      expect(result.options).toContain('Same');
      expect(result.options).toContain('Different');
    });

    it('should handle very large option arrays', () => {
      const manyOptions = Array.from({ length: 1000 }, (_, i) => `Option ${i}`);
      const question = generateQuestion({
        options: manyOptions,
        correctAnswer: 500
      });
      
      const result = randomizeQuestionOptions(question);
      expect(result.options).toHaveLength(1000);
      expect(result.options[result.correctAnswer as number]).toBe('Option 500');
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complete quiz randomization', () => {
      const questions = generateQuestions(20);
      
      // Apply all randomization functions
      let randomized = randomizeAllQuestionOptions(questions);
      randomized = ensureVariedCorrectAnswerPositions(randomized);
      
      expect(randomized).toHaveLength(20);
      
      // Verify all questions have valid structure
      randomized.forEach(q => {
        if (q.type === 'multiple-choice') {
          expect(q.options).toBeDefined();
          expect(q.correctAnswer).toBeDefined();
          expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
          expect(q.correctAnswer).toBeLessThan(q.options!.length);
        }
      });
    });

    it('should maintain quiz integrity through multiple randomizations', () => {
      const originalQuestions = generateQuestions(10);
      let questions = [...originalQuestions];
      
      // Apply randomization multiple times
      for (let i = 0; i < 5; i++) {
        questions = randomizeAllQuestionOptions(questions);
        questions = ensureVariedCorrectAnswerPositions(questions);
      }
      
      // Should still have same number of questions
      expect(questions).toHaveLength(10);
      
      // Each question should still have correct options
      questions.forEach((q, index) => {
        if (q.type === 'multiple-choice') {
          const original = originalQuestions[index];
          expect(q.options).toEqual(expect.arrayContaining(original.options!));
        }
      });
    });
  });
});
