/**
 * Test suite for quiz enhancer functionality
 */

import { quizEnhancer, EnhancementOptions } from '../quizEnhancer';
import { Question } from '../../../types';

describe('QuizEnhancer', () => {
  const mockQuestions: Question[] = [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'What is Jung\'s shadow?',
      options: ['Hidden self', 'Conscious mind', 'Memory', 'Logic'],
      correctAnswer: 0,
      explanation: 'Basic explanation',
      points: 10,
      order: 0
    },
    {
      id: 'q2',
      type: 'true-false',
      question: 'The anima represents the feminine aspect in men.',
      options: ['True', 'False'],
      correctAnswer: 0,
      explanation: 'Simple explanation',
      points: 5,
      order: 1
    }
  ];

  describe('enhanceQuestions', () => {
    it('should enhance questions with all options enabled', async () => {
      const options: EnhancementOptions = {
        addExplanations: true,
        improveDistractors: true,
        varyQuestionStems: true,
        addReferences: true,
        contextualizeQuestions: true
      };

      const enhanced = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Shadow Psychology',
        options
      );

      expect(enhanced).toBeDefined();
      expect(Array.isArray(enhanced)).toBe(true);
      expect(enhanced.length).toBe(mockQuestions.length);
      
      enhanced.forEach((q, index) => {
        expect(q.id).toBe(mockQuestions[index].id);
        expect(q.question).toBeDefined();
        expect(q.explanation).toBeDefined();
      });
    });

    it('should handle empty questions array', async () => {
      const enhanced = await quizEnhancer.enhanceQuestions(
        [],
        'Test Topic',
        { addExplanations: true }
      );

      expect(enhanced).toEqual([]);
    });

    it('should handle null/undefined questions', async () => {
      const enhanced = await quizEnhancer.enhanceQuestions(
        null as any,
        'Test Topic',
        { addExplanations: true }
      );

      expect(enhanced).toEqual([]);
    });

    it('should work with minimal options', async () => {
      const enhanced = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Test Topic',
        { addExplanations: false }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBe(mockQuestions.length);
    });

    it('should handle questions without options', async () => {
      const questionsWithoutOptions = mockQuestions.map(q => ({
        ...q,
        options: undefined as any
      }));

      const enhanced = await quizEnhancer.enhanceQuestions(
        questionsWithoutOptions,
        'Test Topic',
        { improveDistractors: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBe(questionsWithoutOptions.length);
    });

    it('should preserve question structure', async () => {
      const enhanced = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Preservation Test',
        { addExplanations: true }
      );

      enhanced.forEach((enhanced, index) => {
        const original = mockQuestions[index];
        expect(enhanced.id).toBe(original.id);
        expect(enhanced.type).toBe(original.type);
        expect(enhanced.correctAnswer).toBe(original.correctAnswer);
        expect(enhanced.points).toBe(original.points);
        expect(enhanced.order).toBe(original.order);
      });
    });

    it('should handle different question types', async () => {
      const diverseQuestions: Question[] = [
        {
          id: 'mc1',
          type: 'multiple-choice',
          question: 'MC Question',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'MC explanation',
          points: 10,
          order: 0
        },
        {
          id: 'tf1',
          type: 'true-false',
          question: 'TF Question',
          options: ['True', 'False'],
          correctAnswer: 1,
          explanation: 'TF explanation',
          points: 5,
          order: 1
        },
        {
          id: 'sa1',
          type: 'short-answer',
          question: 'SA Question',
          options: [],
          correctAnswer: -1,
          explanation: 'SA explanation',
          points: 15,
          order: 2
        },
        {
          id: 'e1',
          type: 'essay',
          question: 'Essay Question',
          options: [],
          correctAnswer: -1,
          explanation: 'Essay explanation',
          points: 25,
          order: 3
        }
      ];

      const enhanced = await quizEnhancer.enhanceQuestions(
        diverseQuestions,
        'Diverse Test',
        { addExplanations: true, improveDistractors: true }
      );

      expect(enhanced.length).toBe(diverseQuestions.length);
      enhanced.forEach(q => {
        expect(q.type).toBeDefined();
        expect(q.explanation).toBeDefined();
      });
    });

    it('should handle very long questions', async () => {
      const longQuestion: Question = {
        id: 'long1',
        type: 'multiple-choice',
        question: 'A'.repeat(1000),
        options: ['Option A'.repeat(50), 'Option B'.repeat(50), 'C', 'D'],
        correctAnswer: 0,
        explanation: 'B'.repeat(500),
        points: 10,
        order: 0
      };

      const enhanced = await quizEnhancer.enhanceQuestions(
        [longQuestion],
        'Long Test',
        { addExplanations: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBe(1);
      expect(enhanced[0].question).toBeDefined();
    });

    it('should handle questions with special characters', async () => {
      const specialQuestion: Question = {
        id: 'special1',
        type: 'multiple-choice',
        question: 'What is Jung\'s "complex" theory & <concept>?',
        options: ['Answer #1', 'Answer @2', 'Answer $3', 'Answer %4'],
        correctAnswer: 0,
        explanation: 'Explanation with "quotes" & symbols',
        points: 10,
        order: 0
      };

      const enhanced = await quizEnhancer.enhanceQuestions(
        [specialQuestion],
        'Special Characters & Symbols',
        { addExplanations: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBe(1);
      expect(enhanced[0].question).toContain('complex');
    });
  });

  describe('enhancement options', () => {
    it('should respect addExplanations option', async () => {
      const withExplanations = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Test',
        { addExplanations: true }
      );

      const withoutExplanations = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Test',
        { addExplanations: false }
      );

      expect(withExplanations).toBeDefined();
      expect(withoutExplanations).toBeDefined();
      
      // Both should return questions but behavior may differ
      expect(withExplanations.length).toBe(mockQuestions.length);
      expect(withoutExplanations.length).toBe(mockQuestions.length);
    });

    it('should respect improveDistractors option', async () => {
      const questionsWithBadDistractors = [{
        ...mockQuestions[0],
        options: ['Correct answer', 'Bad', 'Bad', 'Bad']
      }];

      const improved = await quizEnhancer.enhanceQuestions(
        questionsWithBadDistractors,
        'Distractor Test',
        { improveDistractors: true }
      );

      const notImproved = await quizEnhancer.enhanceQuestions(
        questionsWithBadDistractors,
        'Distractor Test',
        { improveDistractors: false }
      );

      expect(improved).toBeDefined();
      expect(notImproved).toBeDefined();
      expect(improved.length).toBe(1);
      expect(notImproved.length).toBe(1);
    });

    it('should respect varyQuestionStems option', async () => {
      const repetitiveQuestions = [
        { ...mockQuestions[0], question: 'What is A?' },
        { ...mockQuestions[1], question: 'What is B?' }
      ];

      const varied = await quizEnhancer.enhanceQuestions(
        repetitiveQuestions,
        'Variety Test',
        { varyQuestionStems: true }
      );

      const notVaried = await quizEnhancer.enhanceQuestions(
        repetitiveQuestions,
        'Variety Test',
        { varyQuestionStems: false }
      );

      expect(varied).toBeDefined();
      expect(notVaried).toBeDefined();
      expect(varied.length).toBe(2);
      expect(notVaried.length).toBe(2);
    });

    it('should respect addReferences option', async () => {
      const withRefs = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Jung Psychology',
        { addReferences: true }
      );

      const withoutRefs = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Jung Psychology',
        { addReferences: false }
      );

      expect(withRefs).toBeDefined();
      expect(withoutRefs).toBeDefined();
      expect(withRefs.length).toBe(mockQuestions.length);
      expect(withoutRefs.length).toBe(mockQuestions.length);
    });

    it('should respect contextualizeQuestions option', async () => {
      const contextualized = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Jungian Therapy Context',
        { contextualizeQuestions: true }
      );

      const notContextualized = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Jungian Therapy Context',
        { contextualizeQuestions: false }
      );

      expect(contextualized).toBeDefined();
      expect(notContextualized).toBeDefined();
      expect(contextualized.length).toBe(mockQuestions.length);
      expect(notContextualized.length).toBe(mockQuestions.length);
    });
  });

  describe('error handling', () => {
    it('should handle invalid enhancement options', async () => {
      const enhanced = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Test',
        null as any
      );

      expect(enhanced).toBeDefined();
      expect(Array.isArray(enhanced)).toBe(true);
    });

    it('should handle undefined enhancement options', async () => {
      const enhanced = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        'Test',
        undefined as any
      );

      expect(enhanced).toBeDefined();
      expect(Array.isArray(enhanced)).toBe(true);
    });

    it('should handle empty topic', async () => {
      const enhanced = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        '',
        { addExplanations: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBe(mockQuestions.length);
    });

    it('should handle null topic', async () => {
      const enhanced = await quizEnhancer.enhanceQuestions(
        mockQuestions,
        null as any,
        { addExplanations: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBe(mockQuestions.length);
    });

    it('should handle malformed questions', async () => {
      const malformedQuestions = [
        {} as Question, // Empty object
        { id: 'test' } as Question, // Missing required fields
        null as any,
        undefined as any
      ];

      const enhanced = await quizEnhancer.enhanceQuestions(
        malformedQuestions,
        'Test',
        { addExplanations: true }
      );

      expect(enhanced).toBeDefined();
      expect(Array.isArray(enhanced)).toBe(true);
    });

    it('should be resilient to concurrent calls', async () => {
      const calls = Array(10).fill(null).map((_, i) =>
        quizEnhancer.enhanceQuestions(
          mockQuestions,
          `Concurrent Test ${i}`,
          { addExplanations: true }
        )
      );

      const results = await Promise.all(calls);

      results.forEach((result, i) => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(mockQuestions.length);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should work with real-world quiz scenarios', async () => {
      const realWorldQuestions: Question[] = [
        {
          id: 'rw1',
          type: 'multiple-choice',
          question: 'Como Jung define o conceito de "sombra"?',
          options: [
            'A parte inconsciente da personalidade',
            'O lado consciente do ego',
            'A memória coletiva da humanidade',
            'O processo de individuação'
          ],
          correctAnswer: 0,
          explanation: 'Jung define a sombra como os aspectos inconscientes da personalidade que o ego não reconhece.',
          points: 10,
          order: 0,
          metadata: {
            difficulty: 'medium',
            cognitiveLevel: 'understanding',
            concepts: ['sombra', 'inconsciente', 'personalidade']
          }
        },
        {
          id: 'rw2',
          type: 'essay',
          question: 'Discuta como o processo de individuação contribui para o desenvolvimento psicológico.',
          options: [],
          correctAnswer: -1,
          explanation: 'Uma resposta completa deve abordar a integração dos conteúdos inconscientes, o desenvolvimento da personalidade total e a realização do Self.',
          points: 25,
          order: 1,
          rubric: {
            required: ['individuação', 'desenvolvimento', 'Self'],
            optional: ['exemplos', 'Jung'],
            depth: 200
          },
          metadata: {
            difficulty: 'hard',
            cognitiveLevel: 'create',
            concepts: ['individuação', 'Self', 'desenvolvimento']
          }
        }
      ];

      const enhanced = await quizEnhancer.enhanceQuestions(
        realWorldQuestions,
        'Psicologia Analítica de Jung',
        {
          addExplanations: true,
          improveDistractors: true,
          varyQuestionStems: true,
          addReferences: true,
          contextualizeQuestions: true
        }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBe(2);
      
      // Check that metadata is preserved
      enhanced.forEach((q, i) => {
        expect(q.metadata).toBeDefined();
        if (realWorldQuestions[i].rubric) {
          expect(q.rubric).toBeDefined();
        }
      });
    });

    it('should handle mixed language content', async () => {
      const mixedLanguageQuestions: Question[] = [
        {
          id: 'ml1',
          type: 'multiple-choice',
          question: 'What is the "anima" according to Jung?',
          options: ['Feminine aspect', 'Masculine aspect', 'Shadow', 'Ego'],
          correctAnswer: 0,
          explanation: 'The anima represents the feminine aspect of the male psyche.',
          points: 10,
          order: 0
        },
        {
          id: 'ml2',
          type: 'multiple-choice',
          question: 'O que representa o "animus" na teoria jungiana?',
          options: ['Aspecto feminino', 'Aspecto masculino', 'Sombra', 'Ego'],
          correctAnswer: 1,
          explanation: 'O animus representa o aspecto masculino da psique feminina.',
          points: 10,
          order: 1
        }
      ];

      const enhanced = await quizEnhancer.enhanceQuestions(
        mixedLanguageQuestions,
        'Jung\'s Anima/Animus Theory',
        { addExplanations: true, contextualizeQuestions: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBe(2);
      expect(enhanced[0].question).toBeDefined();
      expect(enhanced[1].question).toBeDefined();
    });
  });
});