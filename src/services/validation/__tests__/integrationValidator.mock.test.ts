/**
 * Unit tests for IntegrationValidator mock behavior
 * Testing edge cases and error handling with mocked dependencies
 */

// Mock the integrationValidator module
jest.mock('../integrationValidator');

import { IntegrationValidator } from '../integrationValidator';
import { EducationalModule } from '../../../schemas/module.schema';

// Mock dependencies
jest.mock('../../modules/moduleService');
jest.mock('../../video/youtubeService');
jest.mock('../../quiz/quizValidator');
jest.mock('../../llm/orchestrator');

describe('IntegrationValidator Mock Tests', () => {
  let validator: IntegrationValidator;

  beforeEach(() => {
    // Clear all mocks and create a new instance
    jest.clearAllMocks();
    validator = new IntegrationValidator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateIntegration - Error Handling', () => {
    it('should handle null/undefined modules gracefully', async () => {
      const modules: any[] = [null, undefined, {} as EducationalModule];
      
      const report = await validator.validateIntegration(modules);
      
      expect(report).toBeDefined();
      expect(report.overall).toBeDefined();
      expect(report.overall.passed).toBe(false);
      expect(report.criticalIssues.length).toBeGreaterThan(0);
      expect(report.criticalIssues).toContain('Null or undefined modules detected');
    });

    it('should handle empty module array', async () => {
      const report = await validator.validateIntegration([]);
      
      expect(report).toBeDefined();
      expect(report.overall.totalTests).toBeGreaterThan(0);
      expect(report.categories).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should handle modules with missing required fields', async () => {
      const incompleteModules: Partial<EducationalModule>[] = [
        { id: 'test-1' }, // Missing everything else
        { title: 'Test Module' }, // Missing id
        { id: 'test-2', title: 'Test', content: {} as any } // Missing nested content
      ];
      
      const report = await validator.validateIntegration(incompleteModules as EducationalModule[]);
      
      expect(report.overall.score).toBeLessThan(100);
      expect(report.criticalIssues.length).toBeGreaterThan(0);
    });

    it('should handle circular module dependencies', async () => {
      const circularModules: EducationalModule[] = [
        {
          id: 'module-a',
          title: 'Module A',
          prerequisites: ['module-b'],
          content: { introduction: 'Content A' },
          timeEstimate: { hours: 1, minutes: 0 },
          difficultyLevel: 'Beginner'
        },
        {
          id: 'module-b',
          title: 'Module B',
          prerequisites: ['module-c'],
          content: { introduction: 'Content B' },
          timeEstimate: { hours: 1, minutes: 0 },
          difficultyLevel: 'Beginner'
        },
        {
          id: 'module-c',
          title: 'Module C',
          prerequisites: ['module-a'], // Creates circular dependency
          content: { introduction: 'Content C' },
          timeEstimate: { hours: 1, minutes: 0 },
          difficultyLevel: 'Beginner'
        }
      ];
      
      const report = await validator.validateIntegration(circularModules);
      
      const prereqTest = report.categories.moduleIntegration.find(
        t => t.testName === 'Module Prerequisite Chain Validation'
      );
      expect(prereqTest?.passed).toBe(false);
      expect(prereqTest?.errors.some(e => e.includes('Circular dependency'))).toBe(true);
    });

    it('should detect missing prerequisites', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'advanced-module',
          title: 'Advanced Module',
          prerequisites: ['missing-module-1', 'missing-module-2'],
          content: { introduction: 'Advanced content' },
          timeEstimate: { hours: 2, minutes: 0 },
          difficultyLevel: 'Advanced'
        }
      ];
      
      const report = await validator.validateIntegration(modules);
      const prereqTest = report.categories.moduleIntegration.find(
        t => t.testName === 'Module Prerequisite Chain Validation'
      );
      
      expect(prereqTest?.passed).toBe(false);
      expect(prereqTest?.errors.some(e => e.includes('missing prerequisites') || e.includes('prerequisite'))).toBe(true);
    });

    it('should handle quiz structure edge cases', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'quiz-module',
          title: 'Quiz Module',
          content: { introduction: 'Content' },
          quiz: {
            questions: [], // Empty questions array
            passingScore: 150, // Invalid passing score
            timeLimit: -30 // Negative time limit
          } as any,
          timeEstimate: { hours: 1, minutes: 0 },
          difficultyLevel: 'Beginner'
        }
      ];
      
      const report = await validator.validateIntegration(modules);
      const quizTest = report.categories.serviceIntegration.find(
        t => t.testName === 'Quiz Service Integration'
      );
      
      expect(quizTest?.passed).toBe(false);
    });

    it('should generate meaningful recommendations', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'problematic',
          title: 'Problematic Module',
          prerequisites: ['missing'],
          content: { introduction: 'Content' },
          quiz: { questions: [] } as any,
          videos: [{ id: '1', title: 'Bad', url: 'invalid', duration: 0 }],
          timeEstimate: { hours: -1, minutes: 0 },
          difficultyLevel: 'Unknown' as any
        }
      ];
      
      const report = await validator.validateIntegration(modules);
      
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify critical issues correctly', async () => {
      // Create a scenario that will fail many tests
      const badModules: any[] = [
        null,
        undefined,
        { id: 'incomplete' }, // missing title
        { 
          id: 'circular-1',
          title: 'Circular 1',
          prerequisites: ['circular-2']
        },
        {
          id: 'circular-2',
          title: 'Circular 2', 
          prerequisites: ['circular-1']
        }
      ];
      
      const report = await validator.validateIntegration(badModules);
      
      // Should detect null modules, missing fields, and score issues
      expect(report.criticalIssues.length).toBeGreaterThan(0);
      expect(report.overall.score).toBeLessThan(60);
      
      // Check for specific critical issue detection
      const hasNullModuleIssue = report.criticalIssues.some(i => i.includes('null or undefined'));
      const hasIncompleteModuleIssue = report.criticalIssues.some(i => i.includes('missing required fields'));
      const hasCircularDepIssue = report.criticalIssues.some(i => i.includes('Circular module dependencies'));
      
      expect(hasNullModuleIssue || hasIncompleteModuleIssue || hasCircularDepIssue).toBe(true);
    });

    it('should calculate scores accurately', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'good-module',
          title: 'Good Module',
          content: { 
            introduction: 'Well-structured content',
            sections: [
              { title: 'Section 1', content: 'Content 1', order: 1 },
              { title: 'Section 2', content: 'Content 2', order: 2 }
            ]
          },
          timeEstimate: { hours: 2, minutes: 30 },
          difficultyLevel: 'Intermediate',
          quiz: {
            questions: [
              {
                id: 'q1',
                text: 'Question 1',
                options: ['A', 'B', 'C'],
                correctAnswer: 0,
                explanation: 'Because A is correct'
              }
            ],
            passingScore: 70,
            timeLimit: 30
          }
        }
      ];
      
      const report = await validator.validateIntegration(modules);
      
      expect(report.overall.score).toBeGreaterThan(0);
      expect(report.overall.score).toBeLessThanOrEqual(100);
      expect(report.overall.passedTests + report.overall.failedTests).toBe(report.overall.totalTests);
    });
  });
});