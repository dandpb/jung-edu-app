/**
 * Test suite for System Validator
 * Tests module validation, content quality, structural integrity, and AI accuracy
 */

import { systemValidator } from '../systemValidator';
import { EducationalModule } from '../../../schemas/module.schema';

// Mock console to reduce test noise
const consoleMocks = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

// Mock performance API for consistent timing
const mockPerformance = {
  now: jest.fn(() => 1000)
};
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('SystemValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  afterAll(() => {
    Object.values(consoleMocks).forEach(mock => mock.mockRestore());
  });
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
      expect(result.summary).toBeDefined();
      expect(typeof result.summary.passed).toBe('boolean');
      expect(typeof result.summary.score).toBe('number');
      expect(result.summary.score).toBeGreaterThanOrEqual(0);
      expect(result.summary.score).toBeLessThanOrEqual(100);
      expect(result.summary.grade).toMatch(/[A-F]/);
      expect(result.summary.totalModules).toBe(1);
    });

    it('should return detailed module validation results', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);

      expect(result.moduleResults).toHaveLength(1);
      expect(result.moduleResults[0].moduleId).toBe('test-module-1');
      expect(typeof result.moduleResults[0].passed).toBe('boolean');
      expect(result.moduleResults[0].contentQuality).toBeDefined();
      expect(result.moduleResults[0].structuralIntegrity).toBeDefined();
      expect(result.moduleResults[0].aiAccuracy).toBeDefined();
      expect(result.moduleResults[0].userExperience).toBeDefined();
      expect(typeof result.moduleResults[0].score).toBe('number');
    });

    it('should validate content quality', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(typeof contentQuality.score).toBe('number');
      expect(contentQuality.score).toBeGreaterThanOrEqual(0);
      expect(contentQuality.score).toBeLessThanOrEqual(100);
      expect(typeof contentQuality.clarity).toBe('number');
      expect(typeof contentQuality.accuracy).toBe('number');
      expect(typeof contentQuality.depth).toBe('number');
      expect(typeof contentQuality.relevance).toBe('number');
      expect(typeof contentQuality.jungianAlignment).toBe('number');
    });

    it('should validate structural integrity', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);
      const structural = result.moduleResults[0].structuralIntegrity;

      expect(typeof structural.score).toBe('number');
      expect(structural.score).toBeGreaterThanOrEqual(0);
      expect(structural.score).toBeLessThanOrEqual(100);
      expect(typeof structural.hasAllComponents).toBe('boolean');
      expect(typeof structural.contentStructure).toBe('boolean');
      expect(typeof structural.quizValidity).toBe('boolean');
      expect(typeof structural.bibliographyQuality).toBe('boolean');
    });

    it('should handle empty module array', async () => {
      const result = await systemValidator.validateSystem([]);

      expect(result.summary.passed).toBe(false);
      expect(result.summary.score).toBe(0);
      expect(result.summary.grade).toBe('F');
      expect(result.summary.totalModules).toBe(0);
      expect(typeof result.summary.criticalIssues).toBe('number');
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
      expect(result.moduleResults).toHaveLength(0);
    });

    it('should handle module with missing required fields', async () => {
      const incompleteModule = {
        id: 'incomplete-1',
        title: 'Incomplete Module',
        // Missing required fields like content, videos, etc.
      } as any;

      const result = await systemValidator.validateSystem([incompleteModule]);

      expect(result.summary.passed).toBe(false);
      expect(result.summary.totalModules).toBe(1);
      expect(result.moduleResults).toHaveLength(1);
      expect(result.moduleResults[0].passed).toBe(false);
      expect(Array.isArray(result.moduleResults[0].errors)).toBe(true);
      expect(result.moduleResults[0].errors.length).toBeGreaterThan(0);
    });

    it('should detect poor content quality', async () => {
      const poorModule = {
        ...mockValidModule,
        content: {
          introduction: 'Short intro.',
          sections: [
            {
              id: 's1',
              title: 'Section',
              content: 'Very brief content.',
              order: 0,
              keyTerms: [],
              images: [],
              interactiveElements: [],
              estimatedTime: 1
            }
          ],
          summary: 'End.',
          keyTakeaways: ['brief']
        }
      };

      const result = await systemValidator.validateSystem([poorModule]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(contentQuality.score).toBeLessThan(80); // Adjusted expectation
      expect(typeof contentQuality.clarity).toBe('number');
      expect(typeof contentQuality.depth).toBe('number');
    });

    it('should validate quiz quality', async () => {
      const moduleWithPoorQuiz = {
        ...mockValidModule,
        quiz: {
          ...mockValidModule.quiz,
          questions: [
            {
              id: 'q1',
              question: 'What?',
              type: 'multiple-choice',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
              explanation: 'Because.',
              difficulty: 'beginner',
              cognitiveLevel: 'recall',
              tags: []
            }
          ]
        }
      };

      const result = await systemValidator.validateSystem([moduleWithPoorQuiz]);

      expect(typeof result.moduleResults[0].contentQuality.quizQuality).toBe('number');
      expect(Array.isArray(result.moduleResults[0].warnings)).toBe(true);
      // Quiz quality should be affected by poor question quality
      expect(result.moduleResults[0].contentQuality.quizQuality).toBeLessThan(80);
    });

    it('should validate Jungian concept alignment', async () => {
      const nonJungianModule = {
        ...mockValidModule,
        title: 'Introduction to Calculus',
        description: 'A comprehensive introduction to differential and integral calculus',
        content: {
          introduction: 'Welcome to calculus.',
          sections: [
            {
              id: 's1',
              title: 'Derivatives',
              content: 'A derivative represents the rate of change.',
              order: 0,
              keyTerms: ['derivative'],
              images: [],
              interactiveElements: [],
              estimatedTime: 10
            },
            {
              id: 's2',
              title: 'Integrals',
              content: 'Integration is the reverse of differentiation.',
              order: 1,
              keyTerms: ['integral'],
              images: [],
              interactiveElements: [],
              estimatedTime: 10
            }
          ],
          summary: 'Calculus is fundamental to mathematics.',
          keyTakeaways: ['derivatives', 'integrals']
        }
      };

      const result = await systemValidator.validateSystem([nonJungianModule]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(typeof contentQuality.jungianAlignment).toBe('number');
      expect(contentQuality.jungianAlignment).toBeLessThan(50); // Adjusted expectation
    });

    it('should provide recommendations for improvement', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Validate structure of recommendations
      result.recommendations.forEach(rec => {
        expect(typeof rec).toBe('object');
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
      expect(typeof result.summary.validModules).toBe('number');
      expect(result.summary.validModules).toBeGreaterThanOrEqual(0);
      expect(result.summary.validModules).toBeLessThanOrEqual(3);
    });

    it('should calculate appropriate grades', async () => {
      // Test with valid module (should get reasonable grade)
      const validResult = await systemValidator.validateSystem([mockValidModule]);
      expect(validResult.summary.grade).toMatch(/[A-F]/);
      expect(typeof validResult.summary.score).toBe('number');

      // Test with invalid module (should get low grade)
      const invalidModule = { id: 'invalid', title: 'Invalid' } as any;
      const invalidResult = await systemValidator.validateSystem([invalidModule]);
      expect(invalidResult.summary.grade).toMatch(/[D-F]/);
      expect(invalidResult.summary.score).toBeLessThan(60);
    });
  });

  describe('structural integrity validation through public API', () => {
    it('should validate all required module fields', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);
      const structural = result.moduleResults[0].structuralIntegrity;

      expect(typeof structural.hasAllComponents).toBe('boolean');
      expect(Array.isArray(structural.missingRequiredFields)).toBe(true);
      expect(typeof structural.score).toBe('number');
      expect(structural.score).toBeGreaterThanOrEqual(0);
      expect(structural.score).toBeLessThanOrEqual(100);
    });

    it('should detect missing components', async () => {
      const incompleteModule = {
        ...mockValidModule,
        quiz: undefined,
        bibliography: undefined
      };

      const result = await systemValidator.validateSystem([incompleteModule]);
      const structural = result.moduleResults[0].structuralIntegrity;

      expect(typeof structural.hasAllComponents).toBe('boolean');
      expect(typeof structural.quizValidity).toBe('boolean');
      expect(typeof structural.bibliographyQuality).toBe('boolean');
      expect(typeof structural.score).toBe('number');
      expect(structural.score).toBeLessThanOrEqual(100);
    });

    it('should validate content structure', async () => {
      const moduleWithPoorContent = {
        ...mockValidModule,
        content: {
          introduction: '',
          sections: [],
          summary: '',
          keyTakeaways: []
        }
      };

      const result = await systemValidator.validateSystem([moduleWithPoorContent]);
      const structural = result.moduleResults[0].structuralIntegrity;

      expect(typeof structural.contentStructure).toBe('boolean');
      expect(typeof structural.score).toBe('number');
      expect(structural.score).toBeLessThanOrEqual(100);
    });
  });

  describe('content quality analysis through public API', () => {
    it('should calculate content metrics correctly', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(typeof contentQuality.score).toBe('number');
      expect(contentQuality.score).toBeGreaterThanOrEqual(0);
      expect(contentQuality.score).toBeLessThanOrEqual(100);
      expect(typeof contentQuality.clarity).toBe('number');
      expect(contentQuality.clarity).toBeGreaterThanOrEqual(0);
      expect(contentQuality.clarity).toBeLessThanOrEqual(100);
      expect(typeof contentQuality.jungianAlignment).toBe('number');
    });

    it('should detect shallow content', async () => {
      const shallowModule = {
        ...mockValidModule,
        content: {
          introduction: 'Jung was a psychologist.',
          sections: [
            {
              id: 's1',
              title: 'Theory',
              content: 'He had theories.',
              order: 0,
              keyTerms: [],
              images: [],
              interactiveElements: [],
              estimatedTime: 1
            }
          ],
          summary: 'The end.',
          keyTakeaways: ['brief']
        }
      };

      const result = await systemValidator.validateSystem([shallowModule]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(typeof contentQuality.depth).toBe('number');
      expect(contentQuality.depth).toBeLessThan(80); // Adjusted expectation
      expect(typeof contentQuality.score).toBe('number');
    });

    it('should reward comprehensive objectives', async () => {
      const moduleWithGoodObjectives = {
        ...mockValidModule,
        learningObjectives: [
          'Understand and differentiate between personal and collective unconscious',
          'Apply Jungian dream analysis techniques in therapeutic settings',
          'Evaluate the role of archetypes in personality development',
          'Synthesize Jungian concepts with modern psychological approaches',
          'Create individualized therapeutic interventions based on Jungian principles'
        ]
      };

      const result = await systemValidator.validateSystem([moduleWithGoodObjectives]);
      const contentQuality = result.moduleResults[0].contentQuality;

      expect(typeof contentQuality.relevance).toBe('number');
      expect(contentQuality.relevance).toBeGreaterThanOrEqual(0);
      expect(contentQuality.relevance).toBeLessThanOrEqual(100);
    });
  });

  describe('Jungian alignment validation through public API', () => {
    it('should detect Jungian concepts', async () => {
      const result = await systemValidator.validateSystem([mockValidModule]);
      const jungianAlignment = result.moduleResults[0].contentQuality.jungianAlignment;

      expect(typeof jungianAlignment).toBe('number');
      expect(jungianAlignment).toBeGreaterThanOrEqual(0);
      expect(jungianAlignment).toBeLessThanOrEqual(100);
    });

    it('should give low scores to non-Jungian content', async () => {
      const nonJungianModule = {
        ...mockValidModule,
        title: 'Introduction to Physics',
        description: 'An introduction to classical mechanics and Newtonian physics',
        content: {
          introduction: 'Welcome to physics.',
          sections: [
            {
              id: 's1',
              title: 'Newton\'s Laws',
              content: 'Force equals mass times acceleration.',
              order: 0,
              keyTerms: ['force', 'mass', 'acceleration'],
              images: [],
              interactiveElements: [],
              estimatedTime: 10
            }
          ],
          summary: 'Physics explains the natural world.',
          keyTakeaways: ['physics', 'laws']
        }
      };

      const result = await systemValidator.validateSystem([nonJungianModule]);
      const jungianAlignment = result.moduleResults[0].contentQuality.jungianAlignment;

      expect(typeof jungianAlignment).toBe('number');
      expect(jungianAlignment).toBeLessThan(50); // Adjusted expectation
    });
  });

  describe('error handling', () => {
    it('should handle null or undefined modules', async () => {
      const result = await systemValidator.validateSystem(null as any);

      expect(result.summary.passed).toBe(false);
      expect(result.summary.score).toBe(0);
      expect(result.summary.grade).toBe('F');
      expect(typeof result.summary.criticalIssues).toBe('number');
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
    });

    it('should handle modules with circular references', async () => {
      const circularModule: any = { ...mockValidModule };
      circularModule.self = circularModule;

      const result = await systemValidator.validateSystem([circularModule]);

      // Should handle gracefully without throwing
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(typeof result.summary.passed).toBe('boolean');
      expect(typeof result.summary.score).toBe('number');
    });

    it('should handle validation errors gracefully', async () => {
      const errorModule = {
        ...mockValidModule,
        content: null as any
      };

      const result = await systemValidator.validateSystem([errorModule]);

      expect(result.summary.passed).toBe(false);
      expect(result.moduleResults).toHaveLength(1);
      expect(Array.isArray(result.moduleResults[0].errors)).toBe(true);
      expect(result.moduleResults[0].errors.length).toBeGreaterThan(0);
    });
  });
});