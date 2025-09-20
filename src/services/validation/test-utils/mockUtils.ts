/**
 * Mock utilities for validation tests
 * Provides consistent mocking patterns and cleanup helpers
 */

import { EducationalModule, DifficultyLevel, ModuleStatus } from '../../../schemas/module.schema';

// Performance mock utilities
export const createPerformanceMock = () => {
  const mockPerformance = {
    now: jest.fn(() => 1000),
    mark: jest.fn(),
    measure: jest.fn()
  };

  Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true
  });

  return mockPerformance;
};

// Console mock utilities
export const createConsoleMocks = () => {
  return {
    log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    error: jest.spyOn(console, 'error').mockImplementation(() => {})
  };
};

// Module creation utilities
export const createMinimalModule = (id: string, overrides: Partial<EducationalModule> = {}): EducationalModule => {
  const now = new Date().toISOString();

  return {
    id,
    title: `Test Module ${id}`,
    description: 'A test module for validation',
    content: {
      introduction: 'Test introduction.',
      sections: [
        {
          id: 'section-1',
          title: 'Test Section',
          content: 'Test content.',
          order: 0,
          keyTerms: [],
          images: [],
          interactiveElements: [],
          estimatedTime: 5
        }
      ],
      summary: 'Test summary.',
      keyTakeaways: ['Test takeaway']
    },
    videos: [],
    quiz: {
      id: 'quiz-1',
      title: 'Test Quiz',
      description: 'Test quiz',
      questions: [
        {
          id: 'q1',
          question: 'Test question?',
          type: 'multiple-choice',
          options: [
            { id: 1, text: 'A', isCorrect: true },
            { id: 2, text: 'B', isCorrect: false },
            { id: 3, text: 'C', isCorrect: false },
            { id: 4, text: 'D', isCorrect: false }
          ],
          correctAnswers: [0],
          allowMultiple: false,
          points: 10,
          explanation: 'Test explanation.'
        }
      ],
      passingScore: 70,
      timeLimit: 10,
      shuffleQuestions: false,
      showFeedback: true,
      allowRetries: true,
      maxRetries: 3
    },
    bibliography: [],
    filmReferences: [],
    tags: ['test'],
    difficultyLevel: DifficultyLevel.BEGINNER,
    timeEstimate: {
      hours: 0,
      minutes: 15,
      description: '15 minutes'
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      author: {
        id: 'author-test',
        name: 'Test Author'
      },
      status: ModuleStatus.PUBLISHED,
      language: 'en'
    },
    prerequisites: [],
    learningObjectives: ['Test objective'],
    icon: 'test',
    ...overrides
  };
};

// Service mock utilities
export const createServiceMocks = () => {
  return {
    moduleService: {
      createModule: jest.fn().mockResolvedValue(true),
      getModuleById: jest.fn().mockResolvedValue({}),
      updateModule: jest.fn().mockResolvedValue(true),
      deleteModule: jest.fn().mockResolvedValue(true)
    },
    youtubeService: jest.fn().mockImplementation(() => ({
      getVideoDetails: jest.fn().mockResolvedValue({ title: 'Test Video', duration: 300 })
    })),
    quizValidator: jest.fn().mockImplementation(() => ({
      validateQuiz: jest.fn().mockReturnValue({ isValid: true, errors: [] })
    })),
    orchestrator: jest.fn().mockImplementation(() => ({
      generateModule: jest.fn().mockResolvedValue({
        module: { title: 'Generated Module', content: { introduction: 'Generated content' } }
      })
    }))
  };
};

// Validation result utilities
export const createMockValidationResult = (passed = true, score = 85) => ({
  summary: {
    passed,
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    totalModules: 1,
    validModules: passed ? 1 : 0,
    invalidModules: passed ? 0 : 1,
    criticalIssues: passed ? 0 : 1
  },
  moduleResults: [
    {
      moduleId: 'test-module',
      passed,
      score,
      contentQuality: {
        score,
        clarity: score,
        accuracy: score,
        depth: score,
        relevance: score,
        jungianAlignment: score,
        quizQuality: score
      },
      structuralIntegrity: {
        score,
        hasAllComponents: passed,
        contentStructure: passed,
        quizValidity: passed,
        bibliographyQuality: passed,
        missingRequiredFields: []
      },
      aiAccuracy: {
        score,
        contentRelevance: score,
        conceptualAccuracy: score
      },
      userExperience: {
        score,
        readability: score,
        engagement: score,
        accessibility: score
      },
      errors: [],
      warnings: []
    }
  ],
  recommendations: [
    {
      area: 'test',
      priority: 'medium' as const,
      description: 'Test recommendation',
      impact: 'Low impact test recommendation'
    }
  ]
});

export const createMockIntegrationResult = (passed = true, score = 90) => ({
  overall: {
    passed,
    score,
    totalTests: 25,
    passedTests: passed ? 24 : 15,
    failedTests: passed ? 1 : 10,
    duration: 1000
  },
  categories: {
    moduleIntegration: [],
    serviceIntegration: [],
    dataIntegration: [],
    apiIntegration: [],
    performanceIntegration: []
  },
  recommendations: [],
  criticalIssues: passed ? [] : ['Test critical issue']
});

export const createMockEndToEndResult = (passed = true, score = 88) => ({
  overall: {
    passed,
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : 'C',
    status: passed ? 'good' : 'critical_issues'
  },
  workflows: [
    { workflowName: 'Test Workflow', passed, userExperienceScore: score, steps: [], errors: [], warnings: [] }
  ],
  criticalIssues: passed ? [] : ['Test critical issue'],
  performanceMetrics: { overallScore: score },
  securityValidation: { overallScore: score, vulnerabilities: [] },
  accessibilityValidation: { overallScore: score, issues: [] },
  reliabilityMetrics: { overallScore: score },
  recommendations: []
});

// Cleanup utilities
export const cleanupMocks = (mocks: any) => {
  Object.values(mocks).forEach((mock: any) => {
    if (mock && typeof mock.mockRestore === 'function') {
      mock.mockRestore();
    }
  });
};

// Test setup helper
export const setupValidationTest = () => {
  const performanceMock = createPerformanceMock();
  const consoleMocks = createConsoleMocks();
  const serviceMocks = createServiceMocks();

  return {
    performanceMock,
    consoleMocks,
    serviceMocks,
    cleanup: () => {
      jest.clearAllMocks();
      cleanupMocks(consoleMocks);
    }
  };
};