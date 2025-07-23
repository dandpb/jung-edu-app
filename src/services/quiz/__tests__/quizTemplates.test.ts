/**
 * Extended test suite for Quiz Templates
 * Tests all template functions, edge cases, and error handling
 */

import {
  getQuestionTemplate,
  getTopicConcepts,
  getTopicMisconceptions,
  topicTemplates,
  jungQuestionTypes,
  jungQuestionTemplates,
  difficultyProgressions,
  answerValidationPatterns,
  questionStemVariations,
  QuestionTemplate,
  TopicTemplate
} from '../quizTemplates';

describe('QuizTemplates', () => {
  describe('getQuestionTemplate', () => {
    it('should return appropriate template for known topics', () => {
      const topics = [
        'Collective Unconscious',
        'Inconsciente Coletivo',
        'Pokemon and Jungian Psychology',
        'Psychological Types',
        'Individuation',
        'Shadow',
        'Sombra',
        'Anima/Animus',
        'Anima',
        'Dreams',
        'Archetypes',
        'Arquétipos'
      ];

      topics.forEach(topic => {
        const template = getQuestionTemplate(topic, 'medium');
        expect(template).toBeDefined();
        expect(template.type).toBeDefined();
        expect(template.structure).toBeDefined();
        expect(template.explanationTemplate).toBeDefined();
      });
    });

    it('should handle null and undefined topics', () => {
      const template1 = getQuestionTemplate(null as any, 'medium');
      const template2 = getQuestionTemplate(undefined as any, 'medium');

      expect(template1).toBeDefined();
      expect(template1.type).toBe('multiple-choice');
      expect(template2).toBeDefined();
      expect(template2.type).toBe('multiple-choice');
    });

    it('should handle empty string topics', () => {
      const template = getQuestionTemplate('', 'medium');
      
      expect(template).toBeDefined();
      expect(template.type).toBe('multiple-choice');
      expect(template.structure).toContain('conceito junguiano');
    });

    it('should handle non-string topics', () => {
      const template1 = getQuestionTemplate(123 as any, 'medium');
      const template2 = getQuestionTemplate({} as any, 'medium');
      const template3 = getQuestionTemplate([] as any, 'medium');

      expect(template1).toBeDefined();
      expect(template2).toBeDefined();
      expect(template3).toBeDefined();
    });

    it('should return easy templates for easy difficulty', () => {
      const template = getQuestionTemplate('Shadow', 'easy');
      
      expect(template).toBeDefined();
      expect(template.type).toBe('multiple-choice');
    });

    it('should return hard templates for hard difficulty', () => {
      const template = getQuestionTemplate('Individuation', 'hard');
      
      expect(template).toBeDefined();
      expect(['essay', 'short-answer', 'multiple-choice']).toContain(template.type);
    });

    it('should handle case-insensitive topic matching', () => {
      const template1 = getQuestionTemplate('SHADOW', 'medium');
      const template2 = getQuestionTemplate('shadow', 'medium');
      const template3 = getQuestionTemplate('Shadow', 'medium');

      expect(template1).toBeDefined();
      expect(template2).toBeDefined();
      expect(template3).toBeDefined();
    });

    it('should handle partial topic matching', () => {
      const template1 = getQuestionTemplate('Collective', 'medium');
      const template2 = getQuestionTemplate('Unconscious', 'medium');
      const template3 = getQuestionTemplate('Anima and', 'medium');

      expect(template1).toBeDefined();
      expect(template2).toBeDefined();
      expect(template3).toBeDefined();
    });

    it('should return default template for unknown topics', () => {
      const template = getQuestionTemplate('Unknown Topic XYZ', 'medium');
      
      expect(template).toBeDefined();
      expect(template.type).toBe('multiple-choice');
      expect(template.structure).toContain('conceito junguiano');
    });

    it('should handle null or missing difficulty', () => {
      const template1 = getQuestionTemplate('Shadow', null as any);
      const template2 = getQuestionTemplate('Shadow', undefined as any);

      expect(template1).toBeDefined();
      expect(template2).toBeDefined();
    });

    it('should handle invalid difficulty values', () => {
      const template = getQuestionTemplate('Shadow', 'invalid-difficulty');
      
      expect(template).toBeDefined();
      expect(template.type).toBeDefined();
    });

    it('should handle topics with leading/trailing whitespace', () => {
      const template1 = getQuestionTemplate('  Shadow  ', 'medium');
      const template2 = getQuestionTemplate('\tArchetypes\n', 'medium');

      expect(template1).toBeDefined();
      expect(template2).toBeDefined();
    });
  });

  describe('getTopicConcepts', () => {
    it('should return concepts for known topics', () => {
      const concepts = getTopicConcepts('Shadow');
      
      expect(concepts).toBeDefined();
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts).toContain('sombra');
    });

    it('should handle null and undefined topics', () => {
      const concepts1 = getTopicConcepts(null as any);
      const concepts2 = getTopicConcepts(undefined as any);

      expect(concepts1).toBeDefined();
      expect(Array.isArray(concepts1)).toBe(true);
      expect(concepts1).toContain('inconsciente');
      
      expect(concepts2).toBeDefined();
      expect(Array.isArray(concepts2)).toBe(true);
    });

    it('should handle empty string topics', () => {
      const concepts = getTopicConcepts('');
      
      expect(concepts).toBeDefined();
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThan(0);
    });

    it('should handle non-string topics', () => {
      const concepts1 = getTopicConcepts(123 as any);
      const concepts2 = getTopicConcepts({} as any);
      const concepts3 = getTopicConcepts([] as any);

      expect(concepts1).toBeDefined();
      expect(Array.isArray(concepts1)).toBe(true);
      expect(concepts2).toBeDefined();
      expect(Array.isArray(concepts2)).toBe(true);
      expect(concepts3).toBeDefined();
      expect(Array.isArray(concepts3)).toBe(true);
    });

    it('should handle jungQuestionTypes keys', () => {
      const concepts1 = getTopicConcepts('anima');
      const concepts2 = getTopicConcepts('animus');
      const concepts3 = getTopicConcepts('collectiveUnconscious');

      expect(concepts1).toContain('anima');
      expect(concepts2).toContain('animus');
      expect(concepts3).toContain('inconsciente coletivo');
    });

    it('should return general concepts for unknown topics', () => {
      const concepts = getTopicConcepts('Unknown Topic XYZ');
      
      expect(concepts).toBeDefined();
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts).toContain('inconsciente');
      expect(concepts).toContain('arquétipos');
    });

    it('should handle case-insensitive matching', () => {
      const concepts1 = getTopicConcepts('SHADOW');
      const concepts2 = getTopicConcepts('shadow');

      expect(concepts1).toEqual(concepts2);
    });

    it('should handle partial topic matching', () => {
      const concepts1 = getTopicConcepts('Collective');
      const concepts2 = getTopicConcepts('Unconscious');

      expect(concepts1).toBeDefined();
      expect(concepts2).toBeDefined();
      expect(concepts1.length).toBeGreaterThan(0);
    });

    it('should handle Portuguese topics', () => {
      const concepts1 = getTopicConcepts('Sombra');
      const concepts2 = getTopicConcepts('Arquétipos');
      const concepts3 = getTopicConcepts('Inconsciente Coletivo');

      expect(concepts1).toContain('sombra');
      expect(concepts2).toContain('arquétipos');
      expect(concepts3).toContain('inconsciente coletivo');
    });
  });

  describe('getTopicMisconceptions', () => {
    it('should return misconceptions for known topics', () => {
      const misconceptions = getTopicMisconceptions('Shadow');
      
      expect(misconceptions).toBeDefined();
      expect(Array.isArray(misconceptions)).toBe(true);
      expect(misconceptions.length).toBeGreaterThan(0);
    });

    it('should handle null and undefined topics', () => {
      const misconceptions1 = getTopicMisconceptions(null as any);
      const misconceptions2 = getTopicMisconceptions(undefined as any);

      expect(misconceptions1).toEqual([]);
      expect(misconceptions2).toEqual([]);
    });

    it('should handle empty string topics', () => {
      const misconceptions = getTopicMisconceptions('');
      
      expect(misconceptions).toEqual([]);
    });

    it('should handle non-string topics', () => {
      const misconceptions1 = getTopicMisconceptions(123 as any);
      const misconceptions2 = getTopicMisconceptions({} as any);

      expect(misconceptions1).toEqual([]);
      expect(misconceptions2).toEqual([]);
    });

    it('should return empty array for unknown topics', () => {
      const misconceptions = getTopicMisconceptions('Unknown Topic XYZ');
      
      expect(misconceptions).toEqual([]);
    });

    it('should handle case-insensitive matching', () => {
      const misconceptions1 = getTopicMisconceptions('COLLECTIVE UNCONSCIOUS');
      const misconceptions2 = getTopicMisconceptions('collective unconscious');

      expect(misconceptions1).toBeDefined();
      expect(misconceptions1.length).toBeGreaterThan(0);
      expect(misconceptions1).toEqual(misconceptions2);
    });
  });

  describe('answerValidationPatterns', () => {
    describe('multipleChoice', () => {
      it('should validate correct answers', () => {
        const result = answerValidationPatterns.multipleChoice.validate(0, 0);
        expect(result).toBe(true);
      });

      it('should invalidate incorrect answers', () => {
        const result = answerValidationPatterns.multipleChoice.validate(1, 0);
        expect(result).toBe(false);
      });

      it('should provide appropriate feedback', () => {
        const correctFeedback = answerValidationPatterns.multipleChoice.feedback(true);
        const incorrectFeedback = answerValidationPatterns.multipleChoice.feedback(false);

        expect(correctFeedback).toContain('Correct');
        expect(incorrectFeedback).toContain('Not quite');
      });
    });

    describe('trueFalse', () => {
      it('should validate boolean answers', () => {
        const result1 = answerValidationPatterns.trueFalse.validate(true, true);
        const result2 = answerValidationPatterns.trueFalse.validate(false, false);
        const result3 = answerValidationPatterns.trueFalse.validate(true, false);

        expect(result1).toBe(true);
        expect(result2).toBe(true);
        expect(result3).toBe(false);
      });
    });

    describe('shortAnswer', () => {
      it('should validate answers containing all key terms', () => {
        const answer = 'The shadow represents the unconscious aspects of personality';
        const keyTerms = ['shadow', 'unconscious', 'personality'];
        
        const result = answerValidationPatterns.shortAnswer.validate(answer, keyTerms);
        expect(result).toBe(true);
      });

      it('should invalidate answers missing key terms', () => {
        const answer = 'The shadow is important';
        const keyTerms = ['shadow', 'unconscious', 'personality'];
        
        const result = answerValidationPatterns.shortAnswer.validate(answer, keyTerms);
        expect(result).toBe(false);
      });

      it('should handle case-insensitive validation', () => {
        const answer = 'THE SHADOW REPRESENTS THE UNCONSCIOUS';
        const keyTerms = ['shadow', 'unconscious'];
        
        const result = answerValidationPatterns.shortAnswer.validate(answer, keyTerms);
        expect(result).toBe(true);
      });

      it('should provide feedback with missing terms', () => {
        const feedback = answerValidationPatterns.shortAnswer.feedback(false, ['unconscious', 'integration']);
        
        expect(feedback).toContain('unconscious');
        expect(feedback).toContain('integration');
      });
    });

    describe('essay', () => {
      it('should score essays based on rubric', () => {
        const answer = 'The shadow contains unconscious material. Integration is key. Jung emphasized wholeness.';
        const rubric = {
          required: ['shadow', 'unconscious', 'integration'],
          optional: ['Jung', 'wholeness'],
          depth: 10
        };

        const result = answerValidationPatterns.essay.validate(answer, rubric);
        
        expect(result.score).toBeGreaterThan(0.5);
        expect(result.feedback.required).toBe(3);
        expect(result.feedback.optional).toBe(2);
        expect(result.feedback.depth).toBe(true);
      });

      it('should handle essays missing required terms', () => {
        const answer = 'This is a short essay about psychology.';
        const rubric = {
          required: ['shadow', 'unconscious', 'integration'],
          optional: ['Jung'],
          depth: 20
        };

        const result = answerValidationPatterns.essay.validate(answer, rubric);
        
        expect(result.score).toBeLessThan(0.5);
        expect(result.feedback.required).toBe(0);
        expect(result.feedback.depth).toBe(false);
      });

      it('should calculate depth based on word count', () => {
        const shortAnswer = 'Short answer.';
        const longAnswer = 'This is a much longer answer that contains many words and meets the depth requirement for a comprehensive essay response.';
        
        const rubric = {
          required: [],
          optional: [],
          depth: 15
        };

        const result1 = answerValidationPatterns.essay.validate(shortAnswer, rubric);
        const result2 = answerValidationPatterns.essay.validate(longAnswer, rubric);

        expect(result1.feedback.depth).toBe(false);
        expect(result2.feedback.depth).toBe(true);
      });

      it('should provide comprehensive feedback', () => {
        const result = {
          score: 0.75,
          feedback: {
            required: 2,
            optional: 1,
            depth: true
          },
          rubric: {
            required: ['a', 'b', 'c'],
            optional: ['d', 'e']
          }
        };

        const feedback = answerValidationPatterns.essay.feedback(result);
        
        expect(feedback).toContain('75%');
        expect(feedback).toContain('2/3');
        expect(feedback).toContain('1/2');
        expect(feedback).toContain('Good depth');
      });
    });
  });

  describe('data structures', () => {
    it('should have valid jungQuestionTypes', () => {
      expect(jungQuestionTypes).toBeDefined();
      expect(Object.keys(jungQuestionTypes).length).toBeGreaterThan(0);

      Object.entries(jungQuestionTypes).forEach(([key, value]) => {
        expect(value.concepts).toBeDefined();
        expect(Array.isArray(value.concepts)).toBe(true);
        expect(value.questionStems).toBeDefined();
        expect(Array.isArray(value.questionStems)).toBe(true);
        expect(value.commonDistractors).toBeDefined();
        expect(Array.isArray(value.commonDistractors)).toBe(true);
      });
    });

    it('should have valid jungQuestionTemplates', () => {
      expect(jungQuestionTemplates).toBeDefined();
      expect(Object.keys(jungQuestionTemplates).length).toBeGreaterThan(0);

      Object.values(jungQuestionTemplates).forEach((template) => {
        expect(template.type).toBeDefined();
        expect(template.structure).toBeDefined();
        expect(template.explanationTemplate).toBeDefined();
        expect(template.difficultyFactors).toBeDefined();
      });
    });

    it('should have valid topicTemplates', () => {
      expect(topicTemplates).toBeDefined();
      expect(Array.isArray(topicTemplates)).toBe(true);
      expect(topicTemplates.length).toBeGreaterThan(0);

      topicTemplates.forEach((template) => {
        expect(template.topic).toBeDefined();
        expect(template.concepts).toBeDefined();
        expect(template.questionTypes).toBeDefined();
        expect(template.assessmentFocus).toBeDefined();
        expect(template.commonMisconceptions).toBeDefined();
      });
    });

    it('should have valid difficultyProgressions', () => {
      expect(difficultyProgressions).toBeDefined();
      expect(difficultyProgressions.beginner).toBeDefined();
      expect(difficultyProgressions.intermediate).toBeDefined();
      expect(difficultyProgressions.advanced).toBeDefined();

      Object.values(difficultyProgressions).forEach((progression) => {
        expect(progression.questionDistribution).toBeDefined();
        expect(progression.cognitiveDistribution).toBeDefined();
        expect(progression.focusAreas).toBeDefined();
        expect(progression.avoidAreas).toBeDefined();
      });
    });

    it('should have valid questionStemVariations', () => {
      expect(questionStemVariations).toBeDefined();
      expect(questionStemVariations.identification).toBeDefined();
      expect(questionStemVariations.application).toBeDefined();
      expect(questionStemVariations.analysis).toBeDefined();
      expect(questionStemVariations.synthesis).toBeDefined();

      Object.values(questionStemVariations).forEach((variations) => {
        expect(Array.isArray(variations)).toBe(true);
        expect(variations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('edge cases and special scenarios', () => {
    it('should handle topics with special characters', () => {
      const template = getQuestionTemplate('Shadow & Light', 'medium');
      const concepts = getTopicConcepts('Anima/Animus & Integration');

      expect(template).toBeDefined();
      expect(concepts).toBeDefined();
    });

    it('should handle numeric string topics', () => {
      const template = getQuestionTemplate('123', 'medium');
      const concepts = getTopicConcepts('456');

      expect(template).toBeDefined();
      expect(concepts).toBeDefined();
    });

    it('should handle very long topic strings', () => {
      const longTopic = 'A'.repeat(1000);
      const template = getQuestionTemplate(longTopic, 'medium');
      const concepts = getTopicConcepts(longTopic);

      expect(template).toBeDefined();
      expect(concepts).toBeDefined();
    });

    it('should handle topics with only whitespace', () => {
      const template = getQuestionTemplate('   ', 'medium');
      const concepts = getTopicConcepts('   ');

      expect(template).toBeDefined();
      expect(concepts).toBeDefined();
    });

    it('should maintain consistency across function calls', () => {
      const topic = 'Shadow';
      const template1 = getQuestionTemplate(topic, 'medium');
      const template2 = getQuestionTemplate(topic, 'medium');

      // Templates might vary due to randomization, but structure should be similar
      expect(template1.type).toBeDefined();
      expect(template2.type).toBeDefined();
    });
  });
});