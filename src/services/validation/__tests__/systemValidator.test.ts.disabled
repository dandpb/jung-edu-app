/**
 * Test suite for System Validator
 * Tests module validation, content quality, structural integrity, and AI accuracy
 */

import { systemValidator } from '../systemValidator';
import { EducationalModule } from '../../../schemas/module.schema';

describe('SystemValidator', () => {
  const mockValidModule: EducationalModule = {
    id: 'test-module-1',
    title: 'Introduction to Jungian Psychology',
    description: 'A comprehensive introduction to Jung\'s psychological theories and their applications in modern psychology',
    topic: 'Jungian Psychology',
    difficulty: 'intermediate',
    difficultyLevel: 'intermediate',
    estimatedTime: 60,
    timeEstimate: { hours: 1, minutes: 0 },
    targetAudience: 'Psychology students and practitioners',
    objectives: [
      'Understand core Jungian concepts including archetypes and the collective unconscious',
      'Apply Jungian theory in therapeutic practice',
      'Analyze dreams using Jungian interpretation methods'
    ],
    content: {
      introduction: 'Welcome to this comprehensive exploration of Jungian Psychology. Carl Jung\'s theories have profoundly influenced our understanding of the human psyche.',
      sections: [
        { 
          title: 'The Shadow Archetype', 
          content: 'The shadow archetype represents the hidden or repressed aspects of the personality. Jung believed that confronting and integrating the shadow is crucial for psychological development and individuation.' 
        },
        { 
          title: 'The Collective Unconscious', 
          content: 'The collective unconscious contains universal patterns and images inherited by all humanity. These archetypes manifest in myths, dreams, and cultural symbols across different societies.' 
        },
        {
          title: 'The Process of Individuation',
          content: 'Individuation is the central process of human psychological development, involving the integration of conscious and unconscious elements to achieve psychological wholeness.'
        }
      ],
      summary: 'This module has explored key Jungian concepts including the shadow, collective unconscious, and individuation. Understanding these principles provides valuable insights into human psychology and personal development.'
    },
    quiz: {
      id: 'quiz-1',
      moduleId: 'test-module-1',
      title: 'Jungian Psychology Assessment',
      description: 'Test your understanding of core Jungian concepts',
      questions: [
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
          explanation: 'The shadow represents the parts of ourselves that we deny or repress. Jung believed that integrating the shadow is crucial for individuation and psychological wholeness.',
          points: 10,
          order: 0
        },
        {
          id: 'q2',
          type: 'true-false',
          question: 'Jung believed that the collective unconscious contains archetypes that are shared across all human cultures.',
          options: ['True', 'False'],
          correctAnswer: 0,
          explanation: 'This is true. Jung proposed that the collective unconscious contains universal patterns and images (archetypes) that are inherited and shared by all humanity.',
          points: 5,
          order: 1
        }
      ],
      passingScore: 70,
      timeLimit: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    bibliography: [
      {
        id: 'bib-1',
        title: 'Man and His Symbols',
        author: 'Carl Jung',
        year: '1964',
        type: 'book',
        relevance: 'Essential introduction to Jungian concepts'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    videos: [],
    metadata: {
      author: 'Test Author',
      version: '1.0',
      language: 'pt-BR',
      tags: ['psychology', 'jung', 'education']
    }
  };

  describe('validateSystem', () => {
    it('should successfully validate a well-formed module', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);

      expect(result).toBeDefined();
      expect(result.summary.passed).toBe(true);
      expect(result.summary.score).toBeGreaterThan(80);
      expect(result.summary.grade).toMatch(/[A-B]/);
      expect(result.summary.validModules).toBe(1);
      expect(result.summary.invalidModules).toBe(0);
    });

    it('should return detailed module validation results', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);

      expect(result.moduleResults).toHaveLength(1);
      expect(result.moduleResults[0].moduleId).toBe('test-module-1');
      expect(result.moduleResults[0].passed).toBe(true);
      expect(result.moduleResults[0].contentQuality).toBeDefined();
      expect(result.moduleResults[0].structuralIntegrity).toBeDefined();
      expect(result.moduleResults[0].aiAccuracy).toBeDefined();
      expect(result.moduleResults[0].userExperience).toBeDefined();
    });

    it('should validate content quality', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(contentQuality.score).toBeGreaterThan(70);
      expect(contentQuality.clarity).toBeGreaterThan(70);
      expect(contentQuality.accuracy).toBeGreaterThan(70);
      expect(contentQuality.depth).toBeGreaterThan(70);
      expect(contentQuality.relevance).toBeGreaterThan(70);
      expect(contentQuality.jungianAlignment).toBeGreaterThan(80);
    });

    it('should validate structural integrity', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);
      const structural = result.moduleResults[0].structuralIntegrity;

      expect(structural.score).toBeGreaterThan(80);
      expect(structural.hasAllComponents).toBe(true);
      expect(structural.contentStructure).toBe(true);
      expect(structural.quizValidity).toBe(true);
      expect(structural.bibliographyQuality).toBe(true);
    });

    it('should handle empty module array', async () => {
      const result = await systemValidator.validateSystem([]);

      expect(result.summary.passed).toBe(false);
      expect(result.summary.score).toBe(0);
      expect(result.summary.grade).toBe('F');
      expect(result.summary.totalModules).toBe(0);
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
    });

    it('should handle module with missing required fields', async () => {
      const incompleteModule = {
        id: 'incomplete-1',
        title: 'Incomplete Module',
        // Missing required fields
      } as any;

      const result = await systemValidator.validateSystem([incompleteModule]);

      expect(result.summary.passed).toBe(false);
      expect(result.summary.invalidModules).toBe(1);
      expect(result.moduleResults[0].passed).toBe(false);
      expect(result.moduleResults[0].errors.length).toBeGreaterThan(0);
    });

    it('should detect poor content quality', async () => {
      const poorModule = {
        ...mockValidModule,
        content: {
          introduction: 'Short intro.',
          sections: [
            { title: 'Section', content: 'Very brief content.' }
          ],
          summary: 'End.'
        }
      };

      const result = await systemValidator.validateSystem([poorModule]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(contentQuality.score).toBeLessThan(50);
      expect(contentQuality.clarity).toBeLessThan(50);
      expect(contentQuality.depth).toBeLessThan(50);
    });

    it('should validate quiz quality', async () => {
      const moduleWithPoorQuiz = {
        ...mockValidModule,
        quiz: {
          ...mockValidModule.quiz,
          questions: [
            {
              id: 'q1',
              type: 'multiple-choice',
              question: 'What?',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
              explanation: 'Because.',
              points: 10,
              order: 0
            }
          ]
        }
      };

      const result = await systemValidator.validateSystem([moduleWithPoorQuiz]);

      expect(result.moduleResults[0].contentQuality.quizQuality).toBeLessThan(50);
      expect(result.moduleResults[0].warnings).toContain('Quiz questions lack depth and clarity');
    });

    it('should validate Jungian concept alignment', async () => {
      const nonJungianModule = {
        ...mockValidModule,
        topic: 'Mathematics',
        title: 'Introduction to Calculus',
        description: 'A comprehensive introduction to differential and integral calculus',
        content: {
          introduction: 'Welcome to calculus.',
          sections: [
            { title: 'Derivatives', content: 'A derivative represents the rate of change.' },
            { title: 'Integrals', content: 'Integration is the reverse of differentiation.' }
          ],
          summary: 'Calculus is fundamental to mathematics.'
        }
      };

      const result = await systemValidator.validateSystem([nonJungianModule]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(contentQuality.jungianAlignment).toBeLessThan(30);
    });

    it('should provide recommendations for improvement', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      result.recommendations.forEach(rec => {
        expect(rec.area).toBeDefined();
        expect(rec.priority).toMatch(/low|medium|high|critical/);
        expect(rec.description).toBeDefined();
        expect(rec.impact).toBeDefined();
      });
    });

    it('should handle multiple modules', async () => {
      const modules = [
        mockValidModule,
        { ...mockValidModule, id: 'test-module-2', title: 'Advanced Jungian Concepts' },
        { ...mockValidModule, id: 'test-module-3', title: 'Dream Analysis Techniques' }
      ];

      const result = await systemValidator.validateSystem(modules);

      expect(result.summary.totalModules).toBe(3);
      expect(result.moduleResults).toHaveLength(3);
      expect(result.summary.validModules).toBe(3);
    });

    it('should calculate appropriate grades', async () => {
      // Test grade boundaries by checking the grade in the result
      const testCases = [
        { expectedGrade: 'A' },  // Valid module should get A
        { expectedGrade: 'F' }   // Invalid module should get F
      ];

      // Test with valid module (should get high grade)
      const validResult = await systemValidator.validateSystem([mockValidModule]);
      expect(['A', 'B']).toContain(validResult.summary.grade);

      // Test with invalid module (should get low grade)
      const invalidModule = { id: 'invalid', title: 'Invalid' } as any;
      const invalidResult = await systemValidator.validateSystem([invalidModule]);
      expect(invalidResult.summary.grade).toBe('F');
    });
  });

  describe('structural integrity validation through public API', () => {
    it('should validate all required module fields', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);
      const structural = result.moduleResults[0].structuralIntegrity;

      expect(structural.hasAllComponents).toBe(true);
      expect(structural.missingRequiredFields).toHaveLength(0);
      expect(structural.score).toBeGreaterThan(90);
    });

    it('should detect missing components', async () => {
      const incompleteModule = {
        ...mockValidModule,
        quiz: undefined,
        bibliography: undefined
      };

      const result = await systemValidator.validateSystem([incompleteModule]);
      const structural = result.moduleResults[0].structuralIntegrity;

      expect(structural.hasAllComponents).toBe(false);
      expect(structural.quizValidity).toBe(false);
      expect(structural.bibliographyQuality).toBe(false);
      expect(structural.score).toBeLessThan(90);
    });

    it('should validate content structure', async () => {
      const moduleWithPoorContent = {
        ...mockValidModule,
        content: {
          introduction: '',
          sections: [],
          summary: ''
        }
      };

      const result = await systemValidator.validateSystem([moduleWithPoorContent]);
      const structural = result.moduleResults[0].structuralIntegrity;

      expect(structural.contentStructure).toBe(false);
      expect(structural.score).toBeLessThan(100);
    });
  });

  describe('content quality analysis through public API', () => {
    it('should calculate content metrics correctly', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(contentQuality.score).toBeGreaterThan(50);
      expect(contentQuality.clarity).toBeGreaterThan(0);
      expect(contentQuality.clarity).toBeLessThan(100);
      expect(contentQuality.jungianAlignment).toBeGreaterThan(50);
    });

    it('should detect shallow content', async () => {
      const shallowModule = {
        ...mockValidModule,
        content: {
          introduction: 'Jung was a psychologist.',
          sections: [
            { title: 'Theory', content: 'He had theories.' }
          ],
          summary: 'The end.'
        }
      };

      const result = await systemValidator.validateSystem([shallowModule]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(contentQuality.depth).toBeLessThan(30);
      expect(contentQuality.score).toBeLessThan(50);
    });

    it('should reward comprehensive objectives', async () => {
      const moduleWithGoodObjectives = {
        ...mockValidModule,
        objectives: [
          'Understand and differentiate between personal and collective unconscious',
          'Apply Jungian dream analysis techniques in therapeutic settings',
          'Evaluate the role of archetypes in personality development',
          'Synthesize Jungian concepts with modern psychological approaches',
          'Create individualized therapeutic interventions based on Jungian principles'
        ]
      };

      const result = await systemValidator.validateSystem([moduleWithGoodObjectives]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(contentQuality.relevance).toBeGreaterThan(70);
    });
  });

  describe('Jungian alignment validation through public API', () => {
    it('should detect Jungian concepts', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);
      const jungianAlignment = result.moduleResults[0].contentQuality.jungianAlignment;

      expect(jungianAlignment).toBeGreaterThan(80);
    });

    it('should give low scores to non-Jungian content', async () => {
      const nonJungianModule = {
        ...mockValidModule,
        topic: 'Physics',
        title: 'Introduction to Physics',
        description: 'An introduction to classical mechanics and Newtonian physics',
        content: {
          introduction: 'Welcome to physics.',
          sections: [
            { title: 'Newton\'s Laws', content: 'Force equals mass times acceleration.' }
          ],
          summary: 'Physics explains the natural world.'
        }
      };

      const result = await systemValidator.validateSystem([nonJungianModule]);
      const jungianAlignment = result.moduleResults[0].contentQuality.jungianAlignment;

      expect(jungianAlignment).toBeLessThan(30);
    });
  });

  describe('error handling', () => {
    it('should handle null or undefined modules', async () => {
      const result = await systemValidator.validateSystem(null as any);

      expect(result.summary.passed).toBe(false);
      expect(result.summary.score).toBe(0);
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
    });

    it('should handle modules with circular references', async () => {
      const circularModule: any = { ...mockValidModule };
      circularModule.self = circularModule;

      const result = await systemValidator.validateSystem([circularModule]);

      // Should handle gracefully
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should handle validation errors gracefully', async () => {
      const errorModule = {
        ...mockValidModule,
        content: null as any
      };

      const result = await systemValidator.validateSystem([errorModule]);

      expect(result.summary.passed).toBe(false);
      expect(result.moduleResults[0].errors.length).toBeGreaterThan(0);
    });
  });
});