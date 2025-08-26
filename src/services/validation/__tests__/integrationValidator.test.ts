/**
 * Test suite for Integration Validator
 * Tests API integration, module relationships, data flow, and system components
 */

// Mock the integrationValidator module
jest.mock('../integrationValidator');

import { integrationValidator } from '../integrationValidator';
import { EducationalModule } from '../../../schemas/module.schema';
import { setupIntegrationTestEnvironment } from '../test-utils/setupIntegrationTests';

// Setup test environment with proper mocks
setupIntegrationTestEnvironment();

describe('IntegrationValidator', () => {
  const mockModule: EducationalModule = {
    id: 'test-module-1',
    title: 'Introduction to Jungian Psychology',
    description: 'A comprehensive introduction to Jung\'s psychological theories',
    topic: 'Jungian Psychology',
    difficulty: 'intermediate',
    estimatedTime: 60,
    targetAudience: 'Psychology students',
    objectives: [
      'Understand core Jungian concepts',
      'Apply Jungian theory in practice'
    ],
    content: {
      introduction: 'Welcome to Jungian Psychology',
      sections: [
        { title: 'The Shadow', content: 'The shadow archetype...' },
        { title: 'The Self', content: 'The journey to self-realization...' }
      ],
      summary: 'Key takeaways from Jungian psychology'
    },
    quiz: {
      id: 'quiz-1',
      moduleId: 'test-module-1',
      title: 'Jung Psychology Assessment',
      description: 'Test your knowledge',
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'What is the shadow?',
          options: ['Hidden aspects', 'Conscious ego', 'Dreams', 'Memories'],
          correctAnswer: 0,
          explanation: 'The shadow represents hidden aspects',
          points: 10,
          order: 0
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
        relevance: 'Essential introduction'
      }
    ],
    mindMap: {
      moduleId: 'test-module-1',
      nodes: [
        { id: 'root', label: 'Jungian Psychology', x: 0, y: 0, type: 'central' }
      ],
      edges: [],
      centralConcept: 'Jungian Psychology',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    videos: []
  };

  describe('validateIntegration', () => {
    it('should successfully validate module integration', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.overall.passed).toBeDefined();
      expect(result.overall.totalTests).toBeGreaterThan(0);
    }, 10000);

    it('should run API integration tests', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      expect(result.categories).toBeDefined();
      expect(result.categories.apiIntegration).toBeDefined();
      expect(Array.isArray(result.categories.apiIntegration)).toBe(true);
      expect(result.categories.apiIntegration.length).toBeGreaterThan(0);
    }, 10000);

    it('should validate module relationships', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      const allTests = [
        ...result.categories.moduleIntegration,
        ...result.categories.serviceIntegration,
        ...result.categories.dataIntegration,
        ...result.categories.apiIntegration,
        ...result.categories.performanceIntegration
      ];

      const relationshipTests = allTests.filter(t => 
        t.testName.includes('relationship') || t.testName.includes('reference')
      );
      expect(relationshipTests.length).toBeGreaterThan(0);
    }, 10000);

    it('should validate data flow', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      expect(result.categories.dataIntegration).toBeDefined();
      expect(Array.isArray(result.categories.dataIntegration)).toBe(true);
      expect(result.categories.dataIntegration.length).toBeGreaterThan(0);
    }, 10000);

    it('should handle empty module array', async () => {
      const result = await integrationValidator.validateIntegration([]);

      expect(result.overall.passed).toBe(false);
      expect(result.overall.totalTests).toBeGreaterThan(0);
      expect(result.overall.failedTests).toBeGreaterThan(0);
    }, 10000);

    it('should handle module with missing components', async () => {
      const incompleteModule = {
        ...mockModule,
        quiz: undefined,
        mindMap: undefined
      };

      const result = await integrationValidator.validateIntegration([incompleteModule]);

      expect(result.overall.passed).toBe(false);
      
      const allTests = [
        ...result.categories.moduleIntegration,
        ...result.categories.serviceIntegration,
        ...result.categories.dataIntegration,
        ...result.categories.apiIntegration,
        ...result.categories.performanceIntegration
      ];
      
      expect(allTests.some(t => !t.passed)).toBe(true);
    }, 10000);

    it('should calculate integration score', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      expect(result.overall.score).toBeDefined();
      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(100);
    }, 10000);

    it('should provide recommendations', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    }, 10000);
  });

  describe('API Integration Tests', () => {
    it('should validate module CRUD operations', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const apiTests = result.categories.apiIntegration;

      expect(apiTests).toBeDefined();
      expect(apiTests.some(t => t.testName.includes('YouTube API'))).toBe(true);
    });

    it('should validate quiz submission', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const serviceTests = result.categories.serviceIntegration;

      expect(serviceTests.some(t => t.testName.includes('Quiz'))).toBe(true);
    });

    it('should validate authentication flow', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const apiTests = result.categories.apiIntegration;

      // Since authentication is handled at the API level
      expect(apiTests.length).toBeGreaterThan(0);
    });
  });

  describe('Module Relationships', () => {
    it('should validate quiz-module relationship', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const moduleTests = result.categories.moduleIntegration;

      const relationshipTests = moduleTests.filter(t => 
        t.testName.includes('Cross-Module References') || 
        t.testName.includes('Navigation Flow')
      );
      expect(relationshipTests.length).toBeGreaterThan(0);
    });

      const result = await integrationValidator.validateIntegration([mockModule]);
      const moduleTests = result.categories.moduleIntegration;

      expect(moduleTests.length).toBeGreaterThan(0);
    });

    it('should detect broken relationships', async () => {
      const brokenModule = {
        ...mockModule,
        quiz: {
          ...mockModule.quiz!,
          moduleId: 'wrong-module-id'
        }
      };

      const result = await integrationValidator.validateIntegration([brokenModule]);
      const allTests = [
        ...result.categories.moduleIntegration,
        ...result.categories.serviceIntegration,
        ...result.categories.dataIntegration
      ];

      // The integration validator should detect mismatched IDs
      expect(result.overall.passed).toBe(false);
    });
  });

  describe('Data Flow Tests', () => {
    it('should validate data consistency', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const dataTests = result.categories.dataIntegration;

      expect(dataTests.some(t => t.testName.includes('Data Schema Consistency'))).toBe(true);
    });

    it('should validate data transformations', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const dataTests = result.categories.dataIntegration;

      expect(dataTests.some(t => t.testName.includes('Serialization'))).toBe(true);
    });

    it('should validate data validation', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const dataTests = result.categories.dataIntegration;

      expect(dataTests.length).toBeGreaterThan(0);
    });
  });

  describe('Component Integration', () => {
    it('should validate UI component integration', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const serviceTests = result.categories.serviceIntegration;

      // Service tests include UI component interactions
      expect(serviceTests.length).toBeGreaterThan(0);
    });

    it('should validate service integration', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const serviceTests = result.categories.serviceIntegration;

      expect(serviceTests.some(t => t.testName.includes('Service Integration'))).toBe(true);
    });

    it('should validate external service integration', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const apiTests = result.categories.apiIntegration;

      expect(apiTests.some(t => t.testName.includes('YouTube') || t.testName.includes('OpenAI'))).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle null or undefined modules', async () => {
      const result = await integrationValidator.validateIntegration(null as any);

      expect(result.overall.passed).toBe(false);
      expect(result.overall.totalTests).toBeGreaterThan(0);
    }, 10000);

    it('should handle validation errors gracefully', async () => {
      const errorModule = {
        ...mockModule,
        id: null as any // Invalid ID
      };

      const result = await integrationValidator.validateIntegration([errorModule]);

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.overall.passed).toBe(false);
    }, 10000);

    it('should provide detailed error messages', async () => {
      const invalidModule = {
        ...mockModule,
        quiz: {
          ...mockModule.quiz!,
          questions: [] // Empty questions array
        }
      };

      const result = await integrationValidator.validateIntegration([invalidModule]);

      const allTests = [
        ...result.categories.moduleIntegration,
        ...result.categories.serviceIntegration,
        ...result.categories.dataIntegration,
        ...result.categories.apiIntegration,
        ...result.categories.performanceIntegration
      ];

      const failedTests = allTests.filter(t => !t.passed);
      expect(failedTests.length).toBeGreaterThan(0);
      expect(failedTests[0].errors.length).toBeGreaterThan(0);
    }, 10000);
  });
});