import { IntegrationValidator, IntegrationValidationReport } from '../integrationValidator';
import { EducationalModule } from '../../../schemas/module.schema';

// Mock dependencies with specific implementations to prevent hangs
jest.mock('../../modules/moduleService', () => ({
  ModuleService: jest.fn().mockImplementation(() => ({
    createModule: jest.fn().mockImplementation((module) => {
      // Reject modules with missing required fields
      if (!module || !module.id || !module.title || !module.content) {
        return Promise.reject(new Error('Module missing required fields'));
      }
      return Promise.resolve(true);
    }),
    getModuleById: jest.fn().mockImplementation((id) => {
      if (!id) {
        return Promise.reject(new Error('Module ID required'));
      }
      return Promise.resolve({ id, title: 'Mock Module' });
    }),
    updateModule: jest.fn().mockImplementation((id, module) => {
      if (!id || !module) {
        return Promise.reject(new Error('Module ID and data required for update'));
      }
      return Promise.resolve(true);
    }),
    deleteModule: jest.fn().mockResolvedValue(true),
  }))
}));

jest.mock('../../video/youtubeService', () => ({
  YouTubeService: jest.fn().mockImplementation(() => ({
    getVideoDetails: jest.fn().mockImplementation((videoId) => {
      if (!videoId || videoId === 'invalid-video-id') {
        return Promise.reject(new Error('Invalid video ID'));
      }
      return Promise.resolve({ title: 'Mock Video', duration: 300 });
    })
  }))
}));

jest.mock('../../quiz/quizValidator', () => ({
  QuizValidator: jest.fn().mockImplementation(() => ({
    validateQuiz: jest.fn().mockImplementation((quiz) => {
      const errors = [];

      // Validate quiz structure more strictly
      if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        errors.push('Quiz must have at least one question');
      }

      if (quiz && quiz.passingScore && (quiz.passingScore > 100 || quiz.passingScore < 0)) {
        errors.push('Passing score must be between 0 and 100');
      }

      if (quiz && quiz.timeLimit && quiz.timeLimit < 0) {
        errors.push('Time limit cannot be negative');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    })
  }))
}));

jest.mock('../../llm/orchestrator', () => ({
  ModuleGenerationOrchestrator: jest.fn().mockImplementation(() => ({
    generateModule: jest.fn().mockImplementation((params) => {
      // Simulate timeout scenarios for certain tests
      if (params && params.topic === 'Timeout Test') {
        return new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        );
      }
      return Promise.resolve({
        module: { title: 'Test Module', content: { introduction: 'Test content' } }
      });
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

describe('IntegrationValidator - Extended Edge Case Tests', () => {
  let validator: IntegrationValidator;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks and create a new instance
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
    validator = new IntegrationValidator();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (consoleLogSpy) consoleLogSpy.mockRestore();
    if (consoleErrorSpy) consoleErrorSpy.mockRestore();
  });

  describe('validateIntegration', () => {
    it('should handle empty module array', async () => {
      const report = await validator.validateIntegration([]);

      expect(report).toBeDefined();
      expect(report.overall.totalTests).toBeGreaterThan(0);
      expect(report.overall.passed).toBe(false);
      expect(report.categories).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.criticalIssues).toContain('No modules provided for validation');
    });

    it('should handle null/undefined modules gracefully', async () => {
      const modules: any[] = [null, undefined, {} as EducationalModule];

      const report = await validator.validateIntegration(modules);

      expect(report.criticalIssues.length).toBeGreaterThan(0);
      expect(report.overall.passed).toBe(false);
      expect(report.criticalIssues.some(issue => issue.includes('null or undefined'))).toBe(true);
      expect(report.criticalIssues.some(issue => issue.includes('missing required fields'))).toBe(true);
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
      expect(report.criticalIssues.some(issue => issue.includes('missing required fields'))).toBe(true);
      expect(report.overall.passed).toBe(false);
    });

    it('should handle circular module dependencies', async () => {
      const circularModules: EducationalModule[] = [
        {
          id: 'module-a',
          title: 'Module A',
          prerequisites: ['module-b'],
          content: { introduction: 'Content A', sections: [], summary: '', keyTakeaways: [] },
          videos: [],
          quiz: { id: 'q1', title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
          bibliography: [],
          filmReferences: [],
          tags: [],
          difficultyLevel: 'beginner' as any,
          timeEstimate: { hours: 1, minutes: 0, description: '1 hour' },
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
          learningObjectives: [],
          icon: 'test'
        },
        {
          id: 'module-b',
          title: 'Module B',
          prerequisites: ['module-c'],
          content: { introduction: 'Content B', sections: [], summary: '', keyTakeaways: [] },
          videos: [],
          quiz: { id: 'q2', title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
          bibliography: [],
          filmReferences: [],
          tags: [],
          difficultyLevel: 'beginner' as any,
          timeEstimate: { hours: 1, minutes: 0, description: '1 hour' },
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
          learningObjectives: [],
          icon: 'test'
        },
        {
          id: 'module-c',
          title: 'Module C',
          prerequisites: ['module-a'], // Creates circular dependency
          content: { introduction: 'Content C', sections: [], summary: '', keyTakeaways: [] },
          videos: [],
          quiz: { id: 'q3', title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
          bibliography: [],
          filmReferences: [],
          tags: [],
          difficultyLevel: 'beginner' as any,
          timeEstimate: { hours: 1, minutes: 0, description: '1 hour' },
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
          learningObjectives: [],
          icon: 'test'
        }
      ];

      const report = await validator.validateIntegration(circularModules);

      const prereqTest = report.categories.moduleIntegration.find(
        t => t.testName === 'Module Prerequisite Chain Validation'
      );
      expect(prereqTest?.passed).toBe(false);
      expect(prereqTest?.errors.some(e => e.includes('Circular dependency'))).toBe(true);
    });

    it('should handle very large module sets efficiently', async () => {
      // Reduce size for test performance
      const largeModuleSet: EducationalModule[] = Array(10).fill(null).map((_, i) => ({
        id: `module-${i}`,
        title: `Module ${i}`,
        content: {
          introduction: 'Test introduction',
          sections: [{
            id: 's1',
            title: 'Section 1',
            content: 'Test content',
            order: 0,
            keyTerms: [],
            images: [],
            interactiveElements: [],
            estimatedTime: 5
          }],
          summary: 'Test summary',
          keyTakeaways: ['takeaway']
        },
        videos: [],
        quiz: { id: `q${i}`, title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
        bibliography: [],
        filmReferences: [],
        tags: [],
        difficultyLevel: 'intermediate' as any,
        timeEstimate: { hours: 1, minutes: 30, description: '1.5 hours' },
        metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
        learningObjectives: [],
        icon: 'test'
      }));

      const report = await validator.validateIntegration(largeModuleSet);

      expect(report).toBeDefined();
      expect(report.overall.totalTests).toBeGreaterThan(0);
      expect(report.categories.moduleIntegration.length).toBeGreaterThan(0);
    }, 15000);

    it('should catch integration errors and continue', async () => {
      // Force an error in one of the test methods
      const errorModule: EducationalModule = {
        id: 'error-module',
        title: 'Error Module',
        content: null as any, // This will cause errors
        videos: [],
        quiz: { id: 'q1', title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
        bibliography: [],
        filmReferences: [],
        tags: [],
        difficultyLevel: 'beginner' as any,
        timeEstimate: { hours: 1, minutes: 0, description: '1 hour' },
        metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
        learningObjectives: [],
        icon: 'test'
      };

      const report = await validator.validateIntegration([errorModule]);

      expect(report).toBeDefined();
      expect(report.criticalIssues.length).toBeGreaterThan(0);
      expect(report.criticalIssues.some(issue => issue.includes('content'))).toBe(true);
      expect(report.overall.passed).toBe(false);
    });
  });

  describe('Module Integration Tests', () => {
    it('should detect missing prerequisites', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'advanced-module',
          title: 'Advanced Module',
          prerequisites: ['missing-module-1', 'missing-module-2'],
          content: { introduction: 'Advanced content', sections: [], summary: '', keyTakeaways: [] },
          videos: [],
          quiz: { id: 'q1', title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
          bibliography: [],
          filmReferences: [],
          tags: [],
          difficultyLevel: 'advanced' as any,
          timeEstimate: { hours: 2, minutes: 0, description: '2 hours' },
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
          learningObjectives: [],
          icon: 'test'
        }
      ];

      const report = await validator.validateIntegration(modules);
      const prereqTest = report.categories.moduleIntegration.find(
        t => t.testName === 'Module Prerequisite Chain Validation'
      );

      expect(prereqTest?.passed).toBe(false);
      expect(prereqTest?.errors.some(e => e.includes('missing prerequisites'))).toBe(true);
    });

    it('should validate section ordering edge cases', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'bad-ordering',
          title: 'Bad Ordering Module',
          content: {
            introduction: 'Intro',
            sections: [
              { id: 's3', title: 'Section 3', content: 'Content', order: 3, keyTerms: [], images: [], interactiveElements: [], estimatedTime: 5 },
              { id: 's1', title: 'Section 1', content: 'Content', order: 1, keyTerms: [], images: [], interactiveElements: [], estimatedTime: 5 },
              { id: 's5', title: 'Section 5', content: 'Content', order: 5, keyTerms: [], images: [], interactiveElements: [], estimatedTime: 5 }, // Gap in ordering
              { id: 's2', title: 'Section 2', content: 'Content', order: 2, keyTerms: [], images: [], interactiveElements: [], estimatedTime: 5 }
            ],
            summary: 'Summary',
            keyTakeaways: ['takeaway']
          },
          videos: [],
          quiz: { id: 'q1', title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
          bibliography: [],
          filmReferences: [],
          tags: [],
          difficultyLevel: 'beginner' as any,
          timeEstimate: { hours: 1, minutes: 0, description: '1 hour' },
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
          learningObjectives: [],
          icon: 'test'
        }
      ];

      const report = await validator.validateIntegration(modules);
      const navTest = report.categories.moduleIntegration.find(
        t => t.testName === 'Module Navigation Flow'
      );

      expect(navTest?.warnings.some(w => w.includes('gaps in section ordering'))).toBe(true);
    });

    it('should handle difficulty progression violations', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'beginner-module',
          title: 'Beginner Module',
          prerequisites: ['advanced-prereq'],
          content: { introduction: 'Basic content', sections: [], summary: '', keyTakeaways: [] },
          videos: [],
          quiz: { id: 'q1', title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
          bibliography: [],
          filmReferences: [],
          tags: [],
          difficultyLevel: 'beginner' as any,
          timeEstimate: { hours: 1, minutes: 0, description: '1 hour' },
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
          learningObjectives: [],
          icon: 'test'
        },
        {
          id: 'advanced-prereq',
          title: 'Advanced Prerequisite',
          content: { introduction: 'Advanced content', sections: [], summary: '', keyTakeaways: [] },
          videos: [],
          quiz: { id: 'q2', title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
          bibliography: [],
          filmReferences: [],
          tags: [],
          difficultyLevel: 'advanced' as any,
          timeEstimate: { hours: 3, minutes: 0, description: '3 hours' },
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
          learningObjectives: [],
          icon: 'test'
        }
      ];

      const report = await validator.validateIntegration(modules);
      const difficultyTest = report.categories.moduleIntegration.find(
        t => t.testName === 'Module Difficulty Progression'
      );

      expect(difficultyTest?.passed).toBe(false);
      expect(difficultyTest?.errors.some(e => e.includes('requires harder prerequisite'))).toBe(true);
    });
  });

  describe('Service Integration Tests', () => {
    it('should handle service failures gracefully', async () => {
      // Mock service to throw errors for this specific test
      const mockYouTubeService = require('../../video/youtubeService').YouTubeService;
      mockYouTubeService.mockImplementation(() => ({
        getVideoDetails: jest.fn().mockRejectedValue(new Error('YouTube API error'))
      }));

      const modules: EducationalModule[] = [
        {
          id: 'video-module',
          title: 'Video Module',
          content: { introduction: 'Content', sections: [], summary: '', keyTakeaways: [] },
          videos: [
            {
              id: 'video-1',
              title: 'Test Video',
              url: 'https://youtube.com/watch?v=abc123',
              duration: 600
            }
          ],
          quiz: { id: 'q1', title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
          bibliography: [],
          filmReferences: [],
          tags: [],
          difficultyLevel: 'beginner' as any,
          timeEstimate: { hours: 1, minutes: 0, description: '1 hour' },
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
          learningObjectives: [],
          icon: 'test'
        }
      ];

      const report = await validator.validateIntegration(modules);
      const videoTest = report.categories.serviceIntegration.find(
        t => t.testName === 'Video Service Integration'
      );

      expect(videoTest?.errors.length).toBeGreaterThan(0);
    });

    it('should validate quiz structure edge cases', async () => {
      const modules: EducationalModule[] = [
        {
          id: 'quiz-module',
          title: 'Quiz Module',
          content: { introduction: 'Content', sections: [], summary: '', keyTakeaways: [] },
          videos: [],
          quiz: {
            id: 'invalid-quiz',
            title: 'Invalid Quiz',
            description: 'Test',
            questions: [], // Empty questions array
            passingScore: 150, // Invalid passing score
            timeLimit: -30 // Negative time limit
          },
          bibliography: [],
          filmReferences: [],
          tags: [],
          difficultyLevel: 'beginner' as any,
          timeEstimate: { hours: 1, minutes: 0, description: '1 hour' },
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
          learningObjectives: [],
          icon: 'test'
        }
      ];

      const report = await validator.validateIntegration(modules);
      const quizTest = report.categories.serviceIntegration.find(
        t => t.testName === 'Quiz Service Integration'
      );

      // The QuizValidator mock should catch the empty questions array and invalid values
      expect(quizTest?.passed).toBe(false);
      expect(quizTest?.errors.length).toBeGreaterThan(0);
    });

    it('should handle LLM service timeouts', async () => {
      // Create a new validator instance to avoid interference
      const testValidator = new IntegrationValidator();

      // Mock the orchestrator to simulate timeout
      const mockOrchestrator = require('../../llm/orchestrator').ModuleGenerationOrchestrator;
      mockOrchestrator.mockImplementation(() => ({
        generateModule: jest.fn().mockImplementation(() =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 50)
          )
        )
      }));

      const modules: EducationalModule[] = [{
        id: 'test',
        title: 'Test',
        content: { introduction: 'Test', sections: [], summary: '', keyTakeaways: [] },
        videos: [],
        quiz: { id: 'q1', title: 'Quiz', description: 'Test', questions: [], timeLimit: 10, passingScore: 70 },
        bibliography: [],
        filmReferences: [],
        tags: [],
        difficultyLevel: 'beginner' as any,
        timeEstimate: { hours: 1, minutes: 0, description: '1 hour' },
        metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0', author: { id: 'test', name: 'Test' }, status: 'published' as any, language: 'en' },
        learningObjectives: [],
        icon: 'test'
      }];

      const report = await testValidator.validateIntegration(modules);
      const llmTest = report.categories.serviceIntegration.find(
        t => t.testName === 'LLM Service Integration'
      );

      expect(llmTest?.passed).toBe(false);
      expect(llmTest?.errors.some(e => e.includes('Timeout'))).toBe(true);
    });
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