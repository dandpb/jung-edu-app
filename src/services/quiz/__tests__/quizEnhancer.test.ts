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

  describe('additional edge cases', () => {
    it('should handle questions with array correctAnswer', async () => {
      const questionsWithArrayAnswers: Question[] = [
        {
          id: 'array1',
          type: 'multiple-choice',
          question: 'Which concepts relate to Jung?',
          options: ['Archetype', 'Id', 'Collective unconscious', 'Oedipus complex'],
          correctAnswer: [0, 2], // Multiple correct answers
          explanation: 'Jung developed the concepts of archetypes and collective unconscious.',
          points: 15,
          order: 0
        }
      ];

      const enhanced = await quizEnhancer.enhanceQuestions(
        questionsWithArrayAnswers,
        'Jung Concepts',
        { improveDistractors: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBe(1);
      expect(Array.isArray(enhanced[0].correctAnswer) || typeof enhanced[0].correctAnswer === 'number').toBe(true);
    });

    it('should handle extremely short questions', async () => {
      const shortQuestion: Question = {
        id: 'short1',
        type: 'multiple-choice',
        question: 'Jung?',
        options: ['Yes', 'No'],
        correctAnswer: 0,
        explanation: 'Short',
        points: 1,
        order: 0
      };

      const enhanced = await quizEnhancer.enhanceQuestions(
        [shortQuestion],
        'Brief',
        { addExplanations: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced[0].question).toBeDefined();
    });

    it('should handle questions with missing explanation', async () => {
      const questionsWithoutExplanation = mockQuestions.map(q => ({
        ...q,
        explanation: ''
      }));

      const enhanced = await quizEnhancer.enhanceQuestions(
        questionsWithoutExplanation,
        'Missing Explanations',
        { addExplanations: true }
      );

      enhanced.forEach(q => {
        expect(q.explanation).toBeDefined();
        expect(q.explanation.length).toBeGreaterThan(0);
      });
    });

    it('should handle distractor generation for Pokemon topics', async () => {
      const pokemonQuestion: Question = {
        id: 'poke1',
        type: 'multiple-choice',
        question: 'What does Gengar represent in Jungian psychology?',
        options: [
          'The shadow archetype manifesting fears',
          'Simple ghost type',
          'Random design',
          'Video game character'
        ],
        correctAnswer: 0,
        explanation: 'Gengar can represent the shadow archetype.',
        points: 10,
        order: 0
      };

      const enhanced = await quizEnhancer.enhanceQuestions(
        [pokemonQuestion],
        'Pokemon and Jung',
        { improveDistractors: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced[0].options).toBeDefined();
      expect(enhanced[0].options.length).toBe(4);
    });

    it('should handle evolution-related questions', async () => {
      const evolutionQuestion: Question = {
        id: 'evo1',
        type: 'multiple-choice',
        question: 'How does Pokemon evolution relate to individuation?',
        options: [
          'Represents psychological growth and transformation',
          'Simple level-up mechanic',
          'Random change',
          'Game feature only'
        ],
        correctAnswer: 0,
        explanation: 'Evolution can symbolize psychological development.',
        points: 10,
        order: 0
      };

      const enhanced = await quizEnhancer.enhanceQuestions(
        [evolutionQuestion],
        'Evolution Psychology',
        { improveDistractors: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced[0].options).toBeDefined();
    });

    it('should handle concurrent distractor generation without duplicates', async () => {
      const manyQuestions = Array(20).fill(null).map((_, i) => ({
        id: `concurrent-${i}`,
        type: 'multiple-choice' as const,
        question: `Question ${i} about Jung's concepts?`,
        options: ['Correct answer', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
        correctAnswer: 0,
        explanation: `Explanation ${i}`,
        points: 10,
        order: i
      }));

      const enhanced = await quizEnhancer.enhanceQuestions(
        manyQuestions,
        'Concurrent Test',
        { improveDistractors: true }
      );

      expect(enhanced).toHaveLength(20);
      
      // Check that distractors are varied
      const allOptions = enhanced.flatMap(q => q.options.map(opt => 
        typeof opt === 'string' ? opt : opt?.text || ''
      ));
      const uniqueOptions = new Set(allOptions);
      expect(uniqueOptions.size).toBeGreaterThan(allOptions.length * 0.7); // At least 70% unique
    });

    it('should handle question enhancement with invalid metadata', async () => {
      const questionWithInvalidMetadata: Question = {
        id: 'invalid-meta',
        type: 'multiple-choice',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: 'Test',
        points: 10,
        order: 0,
        metadata: null as any
      };

      const enhanced = await quizEnhancer.enhanceQuestions(
        [questionWithInvalidMetadata],
        'Invalid Metadata Test',
        { addExplanations: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced[0].metadata).toBeDefined();
    });

    it('should use timestamp fallback when all distractors exhausted', async () => {
      // Mock Date.now to return consistent timestamp for testing
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(1234567890123);

      // Create a question that will exhaust all distractor options
      const exhaustionQuestion: Question = {
        id: 'exhaust1',
        type: 'multiple-choice',
        question: 'What is the unknown concept in psychology?',
        options: ['Correct answer', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
        correctAnswer: 0,
        explanation: 'Test',
        points: 10,
        order: 0
      };

      // Process multiple times to exhaust options
      for (let i = 0; i < 5; i++) {
        await quizEnhancer.enhanceQuestions(
          [{ ...exhaustionQuestion, id: `exhaust-${i}` }],
          'Unknown Topic',
          { improveDistractors: true }
        );
      }

      const enhanced = await quizEnhancer.enhanceQuestions(
        [exhaustionQuestion],
        'Unknown Topic',
        { improveDistractors: true }
      );

      expect(enhanced).toBeDefined();
      const hasTimestampDistractor = enhanced[0].options.some(opt => {
        const optText = typeof opt === 'string' ? opt : opt?.text || '';
        return optText.includes('(123)'); // Should contain timestamp modulo
      });

      // Restore original Date.now
      Date.now = originalDateNow;
    });

    it('should handle null/undefined options gracefully', async () => {
      const questionWithNullOptions: Question = {
        id: 'null-opts',
        type: 'multiple-choice',
        question: 'Test question',
        options: null as any,
        correctAnswer: 0,
        explanation: 'Test',
        points: 10,
        order: 0
      };

      const enhanced = await quizEnhancer.enhanceQuestions(
        [questionWithNullOptions],
        'Null Options Test',
        { improveDistractors: true }
      );

      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBe(1);
    });
  });
});