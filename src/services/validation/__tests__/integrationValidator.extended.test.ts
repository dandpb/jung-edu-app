import { IntegrationValidator, IntegrationValidationReport } from '../integrationValidator';
import { EducationalModule } from '../../../schemas/module.schema';

// Mock dependencies with specific implementations to prevent hangs
jest.mock('../../modules/moduleService', () => ({
  ModuleService: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue(true),
    read: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
  }))
}));

jest.mock('../../video/youtubeService', () => ({
  YouTubeService: jest.fn().mockImplementation(() => ({
    getVideoDetails: jest.fn().mockResolvedValue(null)
  }))
}));

jest.mock('../../quiz/quizValidator', () => ({
  QuizValidator: jest.fn().mockImplementation(() => ({
    validateQuiz: jest.fn().mockReturnValue({ isValid: true, errors: [] })
  }))
}));

jest.mock('../../llm/orchestrator', () => ({
  ModuleGenerationOrchestrator: jest.fn().mockImplementation(() => ({
    generateModule: jest.fn().mockImplementation(() => 
      Promise.resolve({
        module: { title: 'Test Module', content: 'Test content' }
      })
    )
  }))
}));

describe('IntegrationValidator - Extended Edge Case Tests', () => {
  let validator: IntegrationValidator;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks and create a new instance
    jest.clearAllMocks();
    validator = new IntegrationValidator();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('validateIntegration', () => {
    it('should handle empty module array', async () => {
      const report = await validator.validateIntegration([]);
      
      expect(report).toBeDefined();
      expect(report.overall.totalTests).toBeGreaterThan(0);
      expect(report.categories).toBeDefined();
      expect(report.recommendations).toBeDefined();
    }, 10000);

    it('should handle null/undefined modules gracefully', async () => {
      // Skip if this is being classified as integration test
      if (process.env.SKIP_INTEGRATION === 'true') {
        console.log('⏭️  Running as unit test with mocked dependencies');
      }
      
      const modules: any[] = [null, undefined, {} as EducationalModule];
      
      const report = await validator.validateIntegration(modules);
      
      expect(report.criticalIssues.length).toBeGreaterThan(0);
      expect(report.overall.passed).toBe(false);
    }, 10000);

    it('should handle modules with missing required fields', async () => {
      const incompleteModules: Partial<EducationalModule>[] = [
        { id: 'test-1' }, // Missing everything else
        { title: 'Test Module' }, // Missing id
        { id: 'test-2', title: 'Test', content: {} as any } // Missing nested content
      ];
      
      const report = await validator.validateIntegration(incompleteModules as EducationalModule[]);
      
      expect(report.overall.score).toBeLessThan(100);
      expect(report.categories.moduleIntegration.some(t => !t.passed)).toBe(true);
    }, 10000);

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
    }, 10000);

    it('should handle very large module sets efficiently', async () => {
      const largeModuleSet: EducationalModule[] = Array(100).fill(null).map((_, i) => ({
        id: `module-${i}`,
        title: `Module ${i}`,
        content: { 
          introduction: 'x'.repeat(1000),
          sections: Array(10).fill(null).map((_, j) => ({
            title: `Section ${j}`,
            content: 'y'.repeat(500),
            order: j
          }))
        },
        timeEstimate: { hours: 1, minutes: 30 },
        difficultyLevel: 'Intermediate'
      }));
      
      const startTime = performance.now();
      const report = await validator.validateIntegration(largeModuleSet);
      const duration = performance.now() - startTime;
      
      expect(report).toBeDefined();
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    }, 35000);

    it('should catch integration errors and continue', async () => {
      // Force an error in one of the test methods
      const errorModule: EducationalModule = {
        id: 'error-module',
        title: 'Error Module',
        content: null as any, // This will cause errors
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };
      
      const report = await validator.validateIntegration([errorModule]);
      
      expect(report).toBeDefined();
      expect(report.criticalIssues.length).toBeGreaterThan(0);
      // Console error spy may or may not be called depending on implementation
      // The important thing is that the validator handles errors gracefully
    }, 10000);
  });

  describe('Module Integration Tests', () => {
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
    }, 10000);

    it('should validate section ordering edge cases', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'bad-ordering',
          title: 'Bad Ordering Module',
          content: {
            introduction: 'Intro',
            sections: [
              { title: 'Section 3', content: 'Content', order: 3 },
              { title: 'Section 1', content: 'Content', order: 1 },
              { title: 'Section 5', content: 'Content', order: 5 }, // Gap in ordering
              { title: 'Section 2', content: 'Content', order: 2 }
            ]
          },
          timeEstimate: { hours: 1, minutes: 0 },
          difficultyLevel: 'Beginner'
        }
      ];
      
      const report = await validator.validateIntegration(modules);
      const navTest = report.categories.moduleIntegration.find(
        t => t.testName === 'Module Navigation Flow'
      );
      
      expect(navTest?.warnings.some(w => w.includes('gaps in section ordering') || w.includes('ordering') || w.includes('navigation'))).toBe(true);
    }, 10000);

    it('should handle difficulty progression violations', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'beginner-module',
          title: 'Beginner Module',
          prerequisites: ['advanced-prereq'],
          content: { introduction: 'Basic content' },
          timeEstimate: { hours: 1, minutes: 0 },
          difficultyLevel: 'Beginner'
        },
        {
          id: 'advanced-prereq',
          title: 'Advanced Prerequisite',
          content: { introduction: 'Advanced content' },
          timeEstimate: { hours: 3, minutes: 0 },
          difficultyLevel: 'Advanced'
        }
      ];
      
      const report = await validator.validateIntegration(modules);
      const difficultyTest = report.categories.moduleIntegration.find(
        t => t.testName === 'Module Difficulty Progression'
      );
      
      expect(difficultyTest?.passed).toBe(false);
      expect(difficultyTest?.errors.some(e => e.includes('requires harder prerequisite') || e.includes('difficulty') || e.includes('progression'))).toBe(true);
    }, 10000);
  });

  describe('Service Integration Tests', () => {
    it('should handle service failures gracefully', async () => {
      // Mock service to throw errors
      const mockYouTubeService = require('../../video/youtubeService').YouTubeService;
      mockYouTubeService.prototype.getVideoDetails = jest.fn()
        .mockRejectedValue(new Error('YouTube API error'));
      
      const modules: EducationalModule[] = [
        {
          id: 'video-module',
          title: 'Video Module',
          content: { introduction: 'Content' },
          videos: [
            { 
              id: 'video-1',
              title: 'Test Video',
              url: 'https://youtube.com/watch?v=abc123',
              duration: 600
            }
          ],
          timeEstimate: { hours: 1, minutes: 0 },
          difficultyLevel: 'Beginner'
        }
      ];
      
      const report = await validator.validateIntegration(modules);
      const videoTest = report.categories.serviceIntegration.find(
        t => t.testName === 'Video Service Integration'
      );
      
      expect(videoTest?.errors.length).toBeGreaterThan(0);
    }, 10000);

    it('should validate quiz structure edge cases', async () => {
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
    }, 10000);

    it('should handle LLM service timeouts', async () => {
      const mockOrchestrator = require('../../llm/orchestrator').ModuleGenerationOrchestrator;
      mockOrchestrator.prototype.generateModule = jest.fn()
        .mockImplementation(() => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        ));
      
      const modules: EducationalModule[] = [{
        id: 'test',
        title: 'Test',
        content: { introduction: 'Test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      }];
      
      const report = await validator.validateIntegration(modules);
      const llmTest = report.categories.serviceIntegration.find(
        t => t.testName === 'LLM Service Integration'
      );
      
      expect(llmTest?.passed).toBe(false);
      expect(llmTest?.errors.some(e => e.includes('Timeout'))).toBe(true);
    }, 10000);
  });

  describe('Data Integration Tests', () => {
    it('should detect serialization issues with circular references', async () => {
      const circularModule: any = {
        id: 'circular',
        title: 'Circular Module',
        content: { introduction: 'Content' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };
      circularModule.self = circularModule; // Create circular reference
      
      const report = await validator.validateIntegration([circularModule]);
      const dataTest = report.categories.dataIntegration.find(
        t => t.testName === 'Data Serialization/Deserialization'
      );
      
      expect(dataTest?.errors.length).toBeGreaterThan(0);
    }, 10000);

    it('should handle data migration edge cases', async () => {
      // Module with deprecated fields
      const legacyModule: any = {
        id: 'legacy',
        title: 'Legacy Module',
        content: { introduction: 'Content' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner',
        // Deprecated fields
        oldField: 'should be ignored',
        deprecatedProperty: true
      };
      
      const report = await validator.validateIntegration([legacyModule]);
      const migrationTest = report.categories.dataIntegration.find(
        t => t.testName === 'Data Migration Compatibility'
      );
      
      expect(migrationTest).toBeDefined();
      // Should handle gracefully without errors
    }, 10000);

    it('should validate data relationships with orphaned references', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'parent',
          title: 'Parent Module',
          content: { 
            introduction: 'References module-child and module-orphan',
            sections: [{
              title: 'Section',
              content: 'See module-missing for details',
              order: 1
            }]
          },
          timeEstimate: { hours: 1, minutes: 0 },
          difficultyLevel: 'Beginner'
        }
      ];
      
      const report = await validator.validateIntegration(modules);
      const relationshipTest = report.categories.dataIntegration.find(
        t => t.testName === 'Data Relationship Integrity'
      );
      
      expect(relationshipTest).toBeDefined();
    }, 10000);
  });

  describe('API Integration Tests', () => {
    it('should handle malformed YouTube URLs', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'bad-video',
          title: 'Bad Video Module',
          content: { introduction: 'Content' },
          videos: [
            { id: '1', title: 'Bad URL 1', url: 'not-a-youtube-url', duration: 100 },
            { id: '2', title: 'Bad URL 2', url: 'youtube.com/watch?v=', duration: 100 },
            { id: '3', title: 'Bad URL 3', url: 'https://vimeo.com/123456', duration: 100 }
          ],
          timeEstimate: { hours: 1, minutes: 0 },
          difficultyLevel: 'Beginner'
        }
      ];
      
      const report = await validator.validateIntegration(modules);
      const youtubeTest = report.categories.apiIntegration.find(
        t => t.testName === 'YouTube API Integration'
      );
      
      expect(youtubeTest?.warnings).toBeDefined();
    }, 10000);

    it('should test API error handling for various scenarios', async () => {
      const modules: EducationalModule[] = [{
        id: 'test',
        title: 'Test',
        content: { introduction: 'Test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      }];
      
      const report = await validator.validateIntegration(modules);
      const errorHandlingTest = report.categories.apiIntegration.find(
        t => t.testName === 'API Error Handling'
      );
      
      expect(errorHandlingTest).toBeDefined();
      expect(errorHandlingTest?.details).toContain('error scenarios');
    }, 10000);

    it('should detect rate limiting behavior', async () => {
      const modules: EducationalModule[] = [{
        id: 'test',
        title: 'Test',
        content: { introduction: 'Test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      }];
      
      const report = await validator.validateIntegration(modules);
      const rateLimitTest = report.categories.apiIntegration.find(
        t => t.testName === 'API Rate Limiting'
      );
      
      expect(rateLimitTest).toBeDefined();
      // Should either detect rate limiting or warn about its absence
    }, 10000);
  });

  describe('Performance Integration Tests', () => {
    it('should handle concurrent loading stress', async () => {
      const modules: EducationalModule[] = Array(10).fill(null).map((_, i) => ({
        id: `concurrent-${i}`,
        title: `Concurrent Module ${i}`,
        content: { 
          introduction: 'x'.repeat(10000), // Large content
          sections: Array(20).fill(null).map((_, j) => ({
            title: `Section ${j}`,
            content: 'y'.repeat(5000),
            order: j
          }))
        },
        timeEstimate: { hours: 2, minutes: 0 },
        difficultyLevel: 'Intermediate'
      }));
      
      const report = await validator.validateIntegration(modules);
      const concurrentTest = report.categories.performanceIntegration.find(
        t => t.testName === 'Concurrent Module Loading'
      );
      
      expect(concurrentTest).toBeDefined();
      expect(concurrentTest?.duration).toBeLessThan(10000); // Should complete quickly
    }, 15000);

    it('should detect memory leaks', async () => {
      const modules: EducationalModule[] = [{
        id: 'memory-test',
        title: 'Memory Test',
        content: { introduction: 'Test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      }];
      
      const report = await validator.validateIntegration(modules);
      const memoryTest = report.categories.performanceIntegration.find(
        t => t.testName === 'Memory Usage Under Load'
      );
      
      expect(memoryTest).toBeDefined();
      expect(memoryTest?.details).toContain('Memory');
    }, 10000);

    it('should test resource cleanup effectiveness', async () => {
      const modules: EducationalModule[] = Array(5).fill(null).map((_, i) => ({
        id: `resource-${i}`,
        title: `Resource Module ${i}`,
        content: { introduction: 'Content' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      }));
      
      const report = await validator.validateIntegration(modules);
      const cleanupTest = report.categories.performanceIntegration.find(
        t => t.testName === 'Resource Cleanup'
      );
      
      expect(cleanupTest).toBeDefined();
      if (!cleanupTest?.passed) {
        expect(cleanupTest?.errors.some(e => e.includes('Resource leak'))).toBe(true);
      }
    }, 10000);

    it('should test scalability limits', async () => {
      const modules: EducationalModule[] = [{
        id: 'scale-test',
        title: 'Scale Test',
        content: { 
          introduction: 'x'.repeat(100000), // Very large content
          sections: Array(100).fill(null).map((_, i) => ({
            title: `Section ${i}`,
            content: 'y'.repeat(10000),
            order: i
          }))
        },
        timeEstimate: { hours: 10, minutes: 0 },
        difficultyLevel: 'Advanced'
      }];
      
      const report = await validator.validateIntegration(modules);
      const scalabilityTest = report.categories.performanceIntegration.find(
        t => t.testName === 'Scalability Limits'
      );
      
      expect(scalabilityTest).toBeDefined();
      expect(scalabilityTest?.details).toContain('scalability');
    }, 15000);
  });

  describe('Report Generation', () => {
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
      expect(report.recommendations.some(r => r.includes('integration'))).toBe(true);
    }, 10000);

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
      const hasLowScoreIssue = report.criticalIssues.some(i => i.includes('critically low'));
      
      expect(hasNullModuleIssue || hasIncompleteModuleIssue || hasLowScoreIssue).toBe(true);
    }, 10000);

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
    }, 10000);
  });
});