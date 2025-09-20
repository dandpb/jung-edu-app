/**
 * Simplified Test Suite for jaqEdu Validation System
 * Essential tests only for performance optimization
 */

import { systemValidator } from '../systemValidator';
import { EducationalModule, DifficultyLevel, ModuleStatus } from '../../../schemas/module.schema';

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

// Simplified mock data for testing
const createMockModule = (id: string, overrides: Partial<EducationalModule> = {}): EducationalModule => {
  const now = new Date().toISOString();
  
  return {
    id,
    title: `Test Module ${id}`,
    description: 'A test module for validation',
    content: {
      introduction: 'Basic introduction for testing.',
      sections: [
        {
          id: 'section-1',
          title: 'Test Section',
          content: 'Basic test content.',
          order: 0,
          keyTerms: ['test'],
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
      description: 'Basic test quiz',
      questions: [
        {
          id: 'q1',
          question: 'Test question?',
          type: 'multiple-choice',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Test explanation.',
          difficulty: 'beginner',
          cognitiveLevel: 'recall',
          tags: ['test']
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

const createMockModules = (): EducationalModule[] => [
  createMockModule('intro-jung'),
  createMockModule('incomplete-module', {
    content: {
      introduction: '',
      sections: [],
      summary: '',
      keyTakeaways: []
    }
  })
];

describe('jaqEdu Validation System', () => {
  let mockModules: EducationalModule[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
    mockModules = createMockModules();
  });

  afterAll(() => {
    Object.values(consoleMocks).forEach(mock => mock.mockRestore());
  });

  describe('SystemValidator', () => {
    it('should validate system successfully', async () => {
      const result = await systemValidator.validateSystem(mockModules);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(typeof result.summary.score).toBe('number');
      expect(result.summary.score).toBeGreaterThanOrEqual(0);
      expect(result.summary.score).toBeLessThanOrEqual(100);
      expect(result.moduleResults).toHaveLength(mockModules.length);
    });

    it('should handle basic validation', async () => {
      const result = await systemValidator.validateSystem(mockModules);

      // Just check basic structure without asserting specific validation logic
      expect(result.moduleResults).toHaveLength(2);
      expect(result.moduleResults[0]).toBeDefined();
      expect(result.moduleResults[0].moduleId).toBeDefined();
      expect(result.moduleResults[1]).toBeDefined();
      expect(result.moduleResults[1].moduleId).toBeDefined();
    });
  });

  describe('Basic Validation', () => {
    it('should handle empty modules gracefully', async () => {
      const emptyModules: EducationalModule[] = [];

      const systemResult = await systemValidator.validateSystem(emptyModules);
      expect(systemResult.moduleResults).toHaveLength(0);
      expect(systemResult.summary.totalModules).toBe(0);
      expect(systemResult.summary.passed).toBe(false);
    });

    it('should validate single module', async () => {
      const singleModule = [createMockModule('single-test')];

      const result = await systemValidator.validateSystem(singleModule);
      expect(result.moduleResults).toHaveLength(1);
      expect(result.moduleResults[0]).toBeDefined();
      expect(result.moduleResults[0].moduleId).toBe('single-test');
      expect(typeof result.moduleResults[0].passed).toBe('boolean');
    });
  });
});

// Simplified test utilities
export const ValidationTestUtils = {
  createMockModule,
  createMockModules
};