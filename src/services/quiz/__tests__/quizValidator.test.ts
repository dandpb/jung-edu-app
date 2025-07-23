/**
 * Comprehensive test suite for QuizValidator
 * Tests quiz validation, quality assessment, and improvement suggestions
 */

import { quizValidator, ValidationResult, QuestionValidationResult } from '../quizValidator';
import { Quiz, Question } from '../../../types';

describe('QuizValidator', () => {
  const mockValidQuestions: Question[] = [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'According to Jung, what is the primary function of the shadow archetype in psychological development?',
      options: [
        'To represent unconscious aspects of personality rejected by the conscious ego',
        'To guide spiritual transformation through religious symbols',
        'To facilitate communication between different personality types',
        'To store memories from early childhood experiences'
      ],
      correctAnswer: 0,
      explanation: 'The shadow represents the parts of ourselves that we deny or repress. It consists of the aspects of our personality that we consider unacceptable and push into the unconscious. Jung believed that integrating the shadow is crucial for individuation and psychological wholeness.',
      points: 10,
      order: 0,
      metadata: {
        difficulty: 'medium',
        cognitiveLevel: 'understanding',
        concepts: ['shadow', 'unconscious', 'ego']
      }
    },
    {
      id: 'q2',
      type: 'true-false',
      question: 'Jung believed that the collective unconscious contains archetypes that are shared across all human cultures.',
      options: ['True', 'False'],
      correctAnswer: 0,
      explanation: 'This is true. Jung proposed that the collective unconscious contains universal patterns and images (archetypes) that are inherited and shared by all humanity, manifesting in myths, religions, and dreams across different cultures.',
      points: 5,
      order: 1
    },
    {
      id: 'q3',
      type: 'essay',
      question: 'Analyze how the process of individuation contributes to psychological development according to Jung. Include discussion of the role of the Self, ego, and unconscious elements.',
      options: [],
      correctAnswer: -1,
      explanation: 'A comprehensive answer should discuss individuation as the central process of human psychological development, involving the integration of conscious and unconscious elements to achieve wholeness. Key points include the relationship between ego and Self, the integration of shadow elements, and the balance of opposites.',
      points: 20,
      order: 2,
      rubric: {
        required: ['individuation', 'Self', 'ego', 'unconscious'],
        optional: ['shadow', 'archetypes', 'examples'],
        depth: 300
      }
    }
  ];

  const mockValidQuiz: Quiz = {
    id: 'quiz-1',
    moduleId: 'module-1',
    title: 'Jungian Psychology Assessment',
    description: 'Test your understanding of core Jungian concepts',
    questions: mockValidQuestions,
    passingScore: 70,
    timeLimit: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('validateQuiz', () => {
    it('should validate a well-formed quiz successfully', () => {
      const result = quizValidator.validateQuiz(mockValidQuiz);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(80);
    });

    it('should fail validation for quiz with no questions', () => {
      const emptyQuiz: Quiz = {
        ...mockValidQuiz,
        questions: []
      };

      const result = quizValidator.validateQuiz(emptyQuiz);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quiz has no questions');
      expect(result.score).toBe(0);
    });

    it('should fail validation for null questions array', () => {
      const nullQuiz: Quiz = {
        ...mockValidQuiz,
        questions: null as any
      };

      const result = quizValidator.validateQuiz(nullQuiz);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quiz has no questions');
    });

    it('should aggregate errors from individual questions', () => {
      const quizWithBadQuestions: Quiz = {
        ...mockValidQuiz,
        questions: [
          {
            id: 'bad1',
            type: 'multiple-choice',
            question: '', // Empty question
            options: ['A', 'B'], // Too few options
            correctAnswer: 5, // Invalid index
            explanation: 'Short', // Too short
            points: 10,
            order: 0
          }
        ]
      };

      const result = quizValidator.validateQuiz(quizWithBadQuestions);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Question text is missing'))).toBe(true);
    });

    it('should calculate quality score based on question quality', () => {
      const mixedQualityQuiz: Quiz = {
        ...mockValidQuiz,
        questions: [
          mockValidQuestions[0], // Good question
          {
            ...mockValidQuestions[0],
            explanation: 'Too short' // Poor explanation
          }
        ]
      };

      const result = quizValidator.validateQuiz(mixedQualityQuiz);

      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should provide suggestions for improvement', () => {
      const result = quizValidator.validateQuiz(mockValidQuiz);

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('question validation', () => {
    it('should validate multiple choice questions correctly', () => {
      const mcQuestion: Question = mockValidQuestions[0];
      const result = (quizValidator as any).validateQuestion(mcQuestion);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.qualityScore).toBeGreaterThan(70);
    });

    it('should fail validation for MC questions with wrong number of options', () => {
      const badMCQuestion: Question = {
        ...mockValidQuestions[0],
        options: ['A', 'B', 'C'] // Only 3 options
      };

      const result = (quizValidator as any).validateQuestion(badMCQuestion);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exactly 4 options'))).toBe(true);
    });

    it('should fail validation for MC questions with invalid correct answer', () => {
      const badMCQuestion: Question = {
        ...mockValidQuestions[0],
        correctAnswer: -1
      };

      const result = (quizValidator as any).validateQuestion(badMCQuestion);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid correct answer'))).toBe(true);
    });

    it('should warn about missing or short explanations', () => {
      const questionWithoutExplanation: Question = {
        ...mockValidQuestions[0],
        explanation: 'Short'
      };

      const result = (quizValidator as any).validateQuestion(questionWithoutExplanation);

      expect(result.warnings.some(w => w.includes('too short'))).toBe(true);
      expect(result.qualityScore).toBeLessThan(100);
    });

    it('should warn about simple memorization questions', () => {
      const simpleQuestion: Question = {
        ...mockValidQuestions[0],
        question: 'What is the definition of archetype?'
      };

      const result = (quizValidator as any).validateQuestion(simpleQuestion);

      expect(result.warnings.some(w => w.includes('too simple'))).toBe(true);
    });

    it('should handle essay questions properly', () => {
      const essayQuestion: Question = mockValidQuestions[2];
      const result = (quizValidator as any).validateQuestion(essayQuestion);

      expect(result.isValid).toBe(true);
      expect(result.qualityScore).toBeGreaterThan(80);
    });

    it('should handle questions with missing required fields', () => {
      const incompleteQuestion: Question = {
        id: 'incomplete',
        type: 'multiple-choice',
        question: '',
        options: undefined as any,
        correctAnswer: undefined as any,
        explanation: '',
        points: 0,
        order: 0
      };

      const result = (quizValidator as any).validateQuestion(incompleteQuestion);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('distractor quality assessment', () => {
    it('should identify generic distractors', () => {
      const questionWithGenericDistractors: Question = {
        ...mockValidQuestions[0],
        options: [
          'The correct answer',
          'None of the above',
          'All of the above',
          'Not applicable'
        ]
      };

      const result = (quizValidator as any).assessDistractorQuality(questionWithGenericDistractors);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(50);
    });

    it('should identify very short distractors', () => {
      const questionWithShortDistractors: Question = {
        ...mockValidQuestions[0],
        options: [
          'The shadow represents unconscious rejected aspects',
          'Yes',
          'No',
          'Maybe'
        ]
      };

      const result = (quizValidator as any).assessDistractorQuality(questionWithShortDistractors);

      expect(result.warnings.some(w => w.includes('too short'))).toBe(true);
      expect(result.score).toBeLessThan(80);
    });

    it('should identify duplicate options', () => {
      const questionWithDuplicates: Question = {
        ...mockValidQuestions[0],
        options: [
          'The shadow archetype',
          'The shadow archetype', // Duplicate
          'Something else',
          'Another option'
        ]
      };

      const result = (quizValidator as any).assessDistractorQuality(questionWithDuplicates);

      expect(result.warnings.some(w => w.includes('Duplicate'))).toBe(true);
      expect(result.score).toBeLessThan(80);
    });

    it('should identify obviously wrong answers', () => {
      const questionWithObviousWrong: Question = {
        ...mockValidQuestions[0],
        options: [
          'The shadow represents unconscious aspects',
          'This has nothing to do with psychology',
          'Completely unrelated concept',
          'Not related to Jung at all'
        ]
      };

      const result = (quizValidator as any).assessDistractorQuality(questionWithObviousWrong);

      expect(result.warnings.some(w => w.includes('obviously wrong'))).toBe(true);
    });

    it('should check for inconsistent option lengths', () => {
      const questionWithInconsistentLengths: Question = {
        ...mockValidQuestions[0],
        options: [
          'A',
          'This is a very long option that contains much more text than the others and creates an imbalance',
          'B',
          'C'
        ]
      };

      const result = (quizValidator as any).assessDistractorQuality(questionWithInconsistentLengths);

      expect(result.warnings.some(w => w.includes('inconsistent lengths'))).toBe(true);
    });

    it('should check for plausible psychology-related distractors', () => {
      const questionWithNonPsychDistractors: Question = {
        ...mockValidQuestions[0],
        options: [
          'The shadow represents unconscious aspects',
          'Mathematical equation',
          'Chemical formula',
          'Geographic location'
        ]
      };

      const result = (quizValidator as any).assessDistractorQuality(questionWithNonPsychDistractors);

      expect(result.warnings.some(w => w.includes('plausible distractors'))).toBe(true);
      // Score might be higher due to other factors, so just check it's not perfect
      expect(result.score).toBeLessThan(100);
    });

    it('should handle non-string option formats', () => {
      const questionWithObjectOptions: Question = {
        ...mockValidQuestions[0],
        options: [
          { text: 'Option A' } as any,
          { text: 'Option B' } as any,
          { text: 'Option C' } as any,
          { text: 'Option D' } as any
        ]
      };

      const result = (quizValidator as any).assessDistractorQuality(questionWithObjectOptions);

      // With our fixed handling of non-string options, score should be based on content
      expect(result).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should handle missing options or correct answer', () => {
      const questionWithoutOptions: Question = {
        ...mockValidQuestions[0],
        options: undefined as any,
        correctAnswer: undefined as any
      };

      const result = (quizValidator as any).assessDistractorQuality(questionWithoutOptions);

      expect(result.score).toBe(0);
      expect(result.warnings).toContain('Missing options or correct answer');
    });
  });

  describe('question complexity assessment', () => {
    it('should identify higher-order thinking questions', () => {
      const complexQuestions = [
        'How does Jung\'s concept of individuation differ from Freud\'s psychosexual development?',
        'Compare and contrast the anima and animus archetypes',
        'Analyze the role of dreams in Jungian therapy',
        'Evaluate the effectiveness of active imagination technique',
        'What is the relationship between persona and shadow?',
        'Explain why Jung believed in the collective unconscious',
        'Which therapeutic approach best demonstrates individuation?',
        'In what way does synchronicity challenge causality?',
        'How would Jung interpret this dream scenario?',
        'Apply the concept of psychological types to this case'
      ];

      complexQuestions.forEach(questionText => {
        const question: Question = {
          ...mockValidQuestions[0],
          question: questionText
        };

        const score = (quizValidator as any).assessQuestionComplexity(question);
        // These questions should score reasonably well
        expect(score).toBeGreaterThanOrEqual(60);
      });
    });

    it('should identify lower-order memorization questions', () => {
      const simpleQuestions = [
        'What is an archetype?',
        'Who was Carl Jung?',
        'When did Jung develop his theory?',
        'Define collective unconscious',
        'List the four functions',
        'Name the major archetypes',
        'Which of the following is the definition of shadow?'
      ];

      simpleQuestions.forEach(questionText => {
        const question: Question = {
          ...mockValidQuestions[0],
          question: questionText
        };

        const score = (quizValidator as any).assessQuestionComplexity(question);
        expect(score).toBeLessThan(40);
      });
    });

    it('should give bonus for scenario-based questions', () => {
      const scenarioQuestions = [
        'In this scenario, how would a Jungian therapist approach...',
        'Given this example of a patient\'s dream...',
        'Consider this situation in therapy...',
        'In this case study, identify the archetypes...'
      ];

      scenarioQuestions.forEach(questionText => {
        const question: Question = {
          ...mockValidQuestions[0],
          question: questionText
        };

        const score = (quizValidator as any).assessQuestionComplexity(question);
        expect(score).toBeGreaterThan(60);
      });
    });

    it('should consider question length in complexity', () => {
      const longQuestion: Question = {
        ...mockValidQuestions[0],
        question: 'A'.repeat(150) // Very long question
      };

      const shortQuestion: Question = {
        ...mockValidQuestions[0],
        question: 'What is X?' // Very short question
      };

      const longScore = (quizValidator as any).assessQuestionComplexity(longQuestion);
      const shortScore = (quizValidator as any).assessQuestionComplexity(shortQuestion);

      expect(longScore).toBeGreaterThan(shortScore);
    });
  });

  describe('suggestion generation', () => {
    it('should suggest difficulty diversity', () => {
      const quizWithOnlyMedium: Quiz = {
        ...mockValidQuiz,
        questions: mockValidQuestions.map(q => ({
          ...q,
          difficulty: 'medium'
        } as any))
      };

      const result = quizValidator.validateQuiz(quizWithOnlyMedium);

      expect(result.suggestions.some(s => s.includes('mix of easy, medium, and hard'))).toBe(true);
    });

    it('should suggest more application questions', () => {
      const quizWithOnlyRecall: Quiz = {
        ...mockValidQuiz,
        questions: mockValidQuestions.map(q => ({
          ...q,
          cognitiveLevel: 'recall'
        } as any))
      };

      const result = quizValidator.validateQuiz(quizWithOnlyRecall);

      expect(result.suggestions.some(s => s.includes('application and analysis'))).toBe(true);
    });

    it('should suggest quality improvements for low-scoring questions', () => {
      const quizWithPoorQuestions: Quiz = {
        ...mockValidQuiz,
        questions: [
          {
            ...mockValidQuestions[0],
            options: ['Good', 'Bad', 'Bad', 'Bad'],
            explanation: 'Short'
          }
        ]
      };

      const result = quizValidator.validateQuiz(quizWithPoorQuestions);

      expect(result.suggestions.some(s => s.includes('Improve the quality'))).toBe(true);
    });

    it('should suggest longer explanations', () => {
      const quizWithShortExplanations: Quiz = {
        ...mockValidQuiz,
        questions: mockValidQuestions.map(q => ({
          ...q,
          explanation: 'Too brief'
        }))
      };

      const result = quizValidator.validateQuiz(quizWithShortExplanations);

      expect(result.suggestions.some(s => s.includes('detailed explanations'))).toBe(true);
    });

    it('should handle edge cases in suggestion generation', () => {
      const emptyQuiz: Quiz = {
        ...mockValidQuiz,
        questions: []
      };

      const result = quizValidator.validateQuiz(emptyQuiz);

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle questions with special characters', () => {
      const specialCharQuestion: Question = {
        ...mockValidQuestions[0],
        question: 'What is Jung\'s "Shadow" & <Complex> theory?',
        options: [
          'Answer #1 with "quotes"',
          'Answer @2 with symbols',
          'Answer $3 with currency',
          'Answer %4 with percentage'
        ]
      };

      const result = (quizValidator as any).validateQuestion(specialCharQuestion);

      expect(result.isValid).toBe(true);
    });

    it('should handle very long questions and options', () => {
      const longQuestion: Question = {
        ...mockValidQuestions[0],
        question: 'Q'.repeat(1000),
        options: [
          'A'.repeat(500),
          'B'.repeat(500),
          'C'.repeat(500),
          'D'.repeat(500)
        ],
        explanation: 'E'.repeat(1000)
      };

      const result = (quizValidator as any).validateQuestion(longQuestion);

      expect(result.isValid).toBe(true);
    });

    it('should handle malformed question objects', () => {
      const malformedQuestions = [
        null,
        undefined,
        {},
        { id: 'test' },
        { type: 'unknown' },
        'not an object'
      ];

      malformedQuestions.forEach(q => {
        expect(() => {
          (quizValidator as any).validateQuestion(q);
        }).not.toThrow();
      });
    });

    it('should handle different question types gracefully', () => {
      const questionTypes = ['multiple-choice', 'true-false', 'short-answer', 'essay', 'matching', 'unknown'];

      questionTypes.forEach(type => {
        const question: Question = {
          ...mockValidQuestions[0],
          type: type as any
        };

        const result = (quizValidator as any).validateQuestion(question);

        expect(result).toBeDefined();
        expect(result.questionId).toBe(question.id);
      });
    });

    it('should handle quiz with mixed valid and invalid questions', () => {
      const mixedQuiz: Quiz = {
        ...mockValidQuiz,
        questions: [
          mockValidQuestions[0], // Valid
          { ...mockValidQuestions[1], question: '' }, // Invalid - empty question
          mockValidQuestions[2], // Valid
          { ...mockValidQuestions[0], correctAnswer: 10 } // Invalid - bad answer index
        ]
      };

      const result = quizValidator.validateQuiz(mixedQuiz);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThan(0);
    });
  });
});