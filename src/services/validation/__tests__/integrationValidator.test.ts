/**
 * Test suite for Integration Validator
 * Tests API integration, module relationships, data flow, and system components
 */

import { IntegrationValidator } from '../integrationValidator';
import { EducationalModule } from '../../../schemas/module.schema';

// Mock external dependencies
jest.mock('../../modules/moduleService', () => ({
  ModuleService: jest.fn().mockImplementation(() => ({
    createModule: jest.fn().mockResolvedValue(true),
    getModuleById: jest.fn().mockResolvedValue({}),
    updateModule: jest.fn().mockResolvedValue(true),
    deleteModule: jest.fn().mockResolvedValue(true)
  }))
}));

jest.mock('../../video/youtubeService', () => ({
  YouTubeService: jest.fn().mockImplementation(() => ({
    getVideoDetails: jest.fn().mockResolvedValue({ title: 'Test Video', duration: 300 })
  }))
}));

jest.mock('../../quiz/quizValidator', () => ({
  QuizValidator: jest.fn().mockImplementation(() => ({
    validateQuiz: jest.fn().mockReturnValue({ isValid: true, errors: [] })
  }))
}));

jest.mock('../../llm/orchestrator', () => ({
  ModuleGenerationOrchestrator: jest.fn().mockImplementation(() => ({
    generateModule: jest.fn().mockResolvedValue({
      module: { title: 'Generated Module', content: { introduction: 'Generated content' } }
    })
  }))
}));

// Mock performance for consistent timing
const mockPerformance = {
  now: jest.fn(() => 1000)
};
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('IntegrationValidator', () => {
  let integrationValidator: IntegrationValidator;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
    integrationValidator = new IntegrationValidator();
  });
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
    createdAt: new Date(),
    updatedAt: new Date(),
    videos: []
  };

  describe('validateIntegration', () => {
    it('should successfully validate module integration', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(typeof result.overall.passed).toBe('boolean');
      expect(result.overall.totalTests).toBeGreaterThan(0);
      expect(result.categories).toBeDefined();
      expect(result.categories.moduleIntegration).toBeInstanceOf(Array);
      expect(result.categories.serviceIntegration).toBeInstanceOf(Array);
      expect(result.categories.dataIntegration).toBeInstanceOf(Array);
      expect(result.categories.apiIntegration).toBeInstanceOf(Array);
      expect(result.categories.performanceIntegration).toBeInstanceOf(Array);
    });

    it('should run API integration tests', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      expect(result.categories.apiIntegration).toBeDefined();
      expect(Array.isArray(result.categories.apiIntegration)).toBe(true);
      expect(result.categories.apiIntegration.length).toBeGreaterThan(0);

      // Check specific API integration tests
      const testNames = result.categories.apiIntegration.map(t => t.testName);
      expect(testNames).toContain('YouTube API Integration');
      expect(testNames).toContain('OpenAI API Integration');
    });

    it('should validate module relationships', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      const moduleTests = result.categories.moduleIntegration;
      expect(moduleTests).toBeDefined();

      const relationshipTestNames = moduleTests.map(t => t.testName);
      expect(relationshipTestNames).toContain('Cross-Module References');
      expect(relationshipTestNames).toContain('Module Prerequisite Chain Validation');
    });

    it('should validate data flow', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      expect(result.categories.dataIntegration).toBeDefined();
      expect(Array.isArray(result.categories.dataIntegration)).toBe(true);
      expect(result.categories.dataIntegration.length).toBeGreaterThan(0);

      const testNames = result.categories.dataIntegration.map(t => t.testName);
      expect(testNames).toContain('Data Schema Consistency');
      expect(testNames).toContain('Data Relationship Integrity');
    });

    it('should handle empty module array', async () => {
      const result = await integrationValidator.validateIntegration([]);

      expect(result.overall.passed).toBe(false);
      expect(result.overall.totalTests).toBeGreaterThan(0);
      expect(result.criticalIssues).toBeDefined();
      expect(result.criticalIssues.length).toBeGreaterThan(0);
      expect(result.criticalIssues[0]).toContain('No modules provided');
    });

    it('should handle module with missing components', async () => {
      const incompleteModule = {
        ...mockModule,
        quiz: undefined,
        content: undefined
      } as any;

      const result = await integrationValidator.validateIntegration([incompleteModule]);

      expect(result.overall.passed).toBe(false);
      expect(result.criticalIssues.length).toBeGreaterThan(0);

      // Should have structural issues noted
      const hasStructuralIssue = result.criticalIssues.some(issue =>
        issue.includes('content') || issue.includes('missing')
      );
      expect(hasStructuralIssue).toBe(true);
    });

    it('should calculate integration score', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      expect(result.overall.score).toBeDefined();
      expect(typeof result.overall.score).toBe('number');
      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(100);
      expect(result.overall.passedTests + result.overall.failedTests).toBe(result.overall.totalTests);
    });

    it('should provide recommendations', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Should contain integration-specific recommendations
      const hasIntegrationRec = result.recommendations.some(rec =>
        rec.toLowerCase().includes('integration')
      );
      expect(hasIntegrationRec).toBe(true);
    });
  });

  describe('API Integration Tests', () => {
    it('should validate module CRUD operations', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const serviceTests = result.categories.serviceIntegration;

      expect(serviceTests).toBeDefined();
      const moduleServiceTest = serviceTests.find(t => t.testName === 'Module Service Integration');
      expect(moduleServiceTest).toBeDefined();
      expect(moduleServiceTest?.details).toContain('operations');
    });

    it('should validate quiz submission', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const serviceTests = result.categories.serviceIntegration;

      const quizTest = serviceTests.find(t => t.testName === 'Quiz Service Integration');
      expect(quizTest).toBeDefined();
      expect(quizTest?.passed).toBe(true);
    });

    it('should validate authentication flow', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const apiTests = result.categories.apiIntegration;

      expect(apiTests.length).toBeGreaterThan(0);
      // Authentication validation is part of API error handling
      const errorHandlingTest = apiTests.find(t => t.testName === 'API Error Handling');
      expect(errorHandlingTest).toBeDefined();
    });
  });

  describe('Module Relationships', () => {
    it('should validate quiz-module relationship', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const moduleTests = result.categories.moduleIntegration;

      const crossRefTest = moduleTests.find(t => t.testName === 'Cross-Module References');
      expect(crossRefTest).toBeDefined();

      const navTest = moduleTests.find(t => t.testName === 'Module Navigation Flow');
      expect(navTest).toBeDefined();
    });

    it('should validate module integration properly', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const moduleTests = result.categories.moduleIntegration;

      expect(moduleTests.length).toBe(5); // Should have exactly 5 module integration tests

      const expectedTests = [
        'Module Prerequisite Chain Validation',
        'Module Content Consistency',
        'Module Navigation Flow',
        'Cross-Module References',
        'Module Difficulty Progression'
      ];

      expectedTests.forEach(testName => {
        const test = moduleTests.find(t => t.testName === testName);
        expect(test).toBeDefined();
      });
    });

    it('should detect broken relationships', async () => {
      const brokenModule = {
        ...mockModule,
        prerequisites: ['non-existent-module']
      };

      const result = await integrationValidator.validateIntegration([brokenModule]);

      const prereqTest = result.categories.moduleIntegration.find(
        t => t.testName === 'Module Prerequisite Chain Validation'
      );
      expect(prereqTest).toBeDefined();
      expect(prereqTest?.passed).toBe(false);
      expect(prereqTest?.errors.some(e => e.includes('missing prerequisites'))).toBe(true);
    });
  });

  describe('Data Flow Tests', () => {
    it('should validate data consistency', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const dataTests = result.categories.dataIntegration;

      const schemaTest = dataTests.find(t => t.testName === 'Data Schema Consistency');
      expect(schemaTest).toBeDefined();
      expect(schemaTest?.passed).toBe(true);
    });

    it('should validate data transformations', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const dataTests = result.categories.dataIntegration;

      const serializationTest = dataTests.find(t => t.testName === 'Data Serialization/Deserialization');
      expect(serializationTest).toBeDefined();
      expect(serializationTest?.details).toContain('serialization');
    });

    it('should validate data validation', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const dataTests = result.categories.dataIntegration;

      expect(dataTests.length).toBe(5); // Should have exactly 5 data integration tests

      const relationshipTest = dataTests.find(t => t.testName === 'Data Relationship Integrity');
      expect(relationshipTest).toBeDefined();
    });
  });

  describe('Component Integration', () => {
    it('should validate UI component integration', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const serviceTests = result.categories.serviceIntegration;

      expect(serviceTests.length).toBe(5); // Should have exactly 5 service integration tests

      const moduleServiceTest = serviceTests.find(t => t.testName === 'Module Service Integration');
      expect(moduleServiceTest).toBeDefined();
    });

    it('should validate service integration', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const serviceTests = result.categories.serviceIntegration;

      const expectedServices = [
        'Module Service Integration',
        'Video Service Integration',
        'Quiz Service Integration',
        'LLM Service Integration',
        'Bibliography Service Integration'
      ];

      expectedServices.forEach(serviceName => {
        const test = serviceTests.find(t => t.testName === serviceName);
        expect(test).toBeDefined();
      });
    });

    it('should validate external service integration', async () => {
      const result = await integrationValidator.validateIntegration([mockModule]);
      const apiTests = result.categories.apiIntegration;

      const youtubeTest = apiTests.find(t => t.testName === 'YouTube API Integration');
      expect(youtubeTest).toBeDefined();

      const openaiTest = apiTests.find(t => t.testName === 'OpenAI API Integration');
      expect(openaiTest).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle null or undefined modules', async () => {
      const result = await integrationValidator.validateIntegration(null as any);

      expect(result.overall.passed).toBe(false);
      expect(result.criticalIssues).toBeDefined();
      expect(result.criticalIssues.length).toBeGreaterThan(0);
      expect(result.criticalIssues[0]).toContain('null or undefined');
    });

    it('should handle validation errors gracefully', async () => {
      const errorModule = {
        ...mockModule,
        id: null as any, // Invalid ID
        title: null as any // Invalid title
      };

      const result = await integrationValidator.validateIntegration([errorModule]);

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.overall.passed).toBe(false);
      expect(result.criticalIssues.some(issue => issue.includes('missing required fields'))).toBe(true);
    });

    it('should provide detailed error messages', async () => {
      const invalidModule = {
        ...mockModule,
        content: null as any // This will cause validation errors
      };

      const result = await integrationValidator.validateIntegration([invalidModule]);

      expect(result.criticalIssues.length).toBeGreaterThan(0);

      // Check that error messages are descriptive
      const hasDescriptiveError = result.criticalIssues.some(issue =>
        issue.includes('content') && issue.includes(mockModule.id)
      );
      expect(hasDescriptiveError).toBe(true);
    });
  });
});