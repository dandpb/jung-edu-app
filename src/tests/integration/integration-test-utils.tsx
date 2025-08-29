/**
 * Integration Test Utilities
 * Shared utilities and helpers for integration testing
 * 
 * Provides:
 * - Mock data factories for complex test scenarios
 * - Test setup helpers for different workflow contexts
 * - Performance measurement utilities
 * - State management test helpers
 * - Service integration mocks
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../contexts/AuthContext';
import { AdminContext } from '../../contexts/AdminContext';
import { UserRole } from '../../types/auth';
import { DifficultyLevel, ModuleStatus } from '../../schemas/module.schema';
import { UserProgress, Module, Quiz, Question } from '../../types';

// ===========================
// Mock Data Factories
// ===========================

export const createMockUser = (overrides: any = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  username: 'testuser',
  role: UserRole.STUDENT,
  profile: {
    firstName: 'Test',
    lastName: 'User',
    preferences: {
      theme: 'light' as const,
      language: 'en',
      emailNotifications: true,
      pushNotifications: false
    }
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  isVerified: true,
  ...overrides
});

export const createMockAdmin = (overrides: any = {}) => ({
  ...createMockUser(),
  id: 'admin-123',
  email: 'admin@example.com',
  username: 'admin',
  role: UserRole.ADMIN,
  profile: {
    firstName: 'Admin',
    lastName: 'User',
    preferences: {
      theme: 'light' as const,
      language: 'en',
      emailNotifications: true,
      pushNotifications: false
    }
  },
  ...overrides
});

export const createMockQuestion = (overrides: any = {}): Question => ({
  id: 'q1',
  type: 'multiple-choice' as const,
  question: 'What is the collective unconscious?',
  options: [
    { id: '0', text: 'Personal memories', isCorrect: false },
    { id: '1', text: 'Universal patterns', isCorrect: true },
    { id: '2', text: 'Learned behaviors', isCorrect: false },
    { id: '3', text: 'Cultural norms', isCorrect: false }
  ],
  correctAnswer: 1,
  explanation: 'The collective unconscious contains universal patterns and archetypes.',
  points: 10,
  order: 0,
  difficulty: DifficultyLevel.BEGINNER,
  ...overrides
});

export const createMockQuiz = (overrides: any = {}): Quiz => ({
  id: 'quiz-1',
  title: 'Test Quiz',
  description: 'A test quiz for integration testing',
  questions: [createMockQuestion()],
  passingScore: 70,
  timeLimit: 30,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockModule = (overrides: any = {}): Module => ({
  id: 'module-1',
  title: 'Test Module',
  description: 'A test module for integration testing',
  estimatedTime: 60,
  difficulty: 'beginner' as const,
  content: {
    introduction: 'This is a test module introduction',
    sections: [
      {
        id: 'section-1',
        title: 'Test Section',
        content: 'This is test content for the section',
        order: 1
      }
    ]
  },
  videos: [{
    id: 'video-1',
    title: 'Test Video',
    url: 'https://example.com/test-video',
    duration: { hours: 0, minutes: 10, seconds: 0 },
    description: 'A test video'
  }],
  quiz: createMockQuiz({ id: 'quiz-module-1' }),
  bibliography: [],
  filmReferences: [],
  tags: ['test', 'integration'],
  difficultyLevel: DifficultyLevel.BEGINNER,
  timeEstimate: { hours: 1, minutes: 0 },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    status: ModuleStatus.PUBLISHED,
    language: 'en',
    author: {
      id: 'instructor-1',
      name: 'Test Instructor',
      email: 'instructor@example.com',
      role: 'Instructor'
    }
  },
  ...overrides
});

export const createMockUserProgress = (overrides: any = {}): UserProgress => ({
  userId: 'test-user-123',
  completedModules: [],
  quizScores: {},
  totalTime: 0,
  lastAccessed: Date.now(),
  notes: [],
  ...overrides
});

// ===========================
// Learning Path Mock Data
// ===========================

export const createLearningPathModules = () => [
  createMockModule({
    id: 'basics',
    title: 'Jung Basics',
    difficulty: 'beginner',
    difficultyLevel: DifficultyLevel.BEGINNER,
    prerequisites: []
  }),
  createMockModule({
    id: 'shadow',
    title: 'Shadow Work',
    difficulty: 'intermediate',
    difficultyLevel: DifficultyLevel.INTERMEDIATE,
    prerequisites: ['basics']
  }),
  createMockModule({
    id: 'individuation',
    title: 'Individuation Process',
    difficulty: 'advanced',
    difficultyLevel: DifficultyLevel.ADVANCED,
    prerequisites: ['basics', 'shadow']
  })
];

export const createProgressiveUserProgress = (completedModules: string[] = []) => ({
  ...createMockUserProgress(),
  completedModules,
  quizScores: completedModules.reduce((acc, moduleId) => {
    acc[moduleId] = {
      score: Math.floor(Math.random() * 3) + 3, // 3-5 score
      total: 5,
      percentage: 80 + Math.floor(Math.random() * 20), // 80-100%
      completedAt: new Date()
    };
    return acc;
  }, {} as any),
  totalTime: completedModules.length * 3600 // 1 hour per module
});

// ===========================
// Context Providers Setup
// ===========================

export interface IntegrationTestOptions {
  user?: any;
  isAuthenticated?: boolean;
  modules?: Module[];
  initialRoute?: string;
  queryClientOptions?: any;
}

export const createTestQueryClient = (options: any = {}) => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
      mutations: { retry: false },
      ...options
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

export const createMockAuthContext = (overrides: any = {}) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn(),
  hasPermission: jest.fn().mockReturnValue(true),
  hasRole: jest.fn().mockReturnValue(true),
  refreshSession: jest.fn(),
  clearError: jest.fn(),
  ...overrides
});

export const createMockAdminContext = (overrides: any = {}) => ({
  isAdmin: false,
  currentAdmin: null,
  login: jest.fn(),
  logout: jest.fn(),
  modules: [],
  updateModules: jest.fn(),
  ...overrides
});

// ===========================
// Custom Render Function
// ===========================

export function renderWithIntegrationProviders(
  ui: React.ReactElement,
  options: IntegrationTestOptions = {}
) {
  const {
    user = null,
    isAuthenticated = false,
    modules = [],
    initialRoute = '/',
    queryClientOptions = {}
  } = options;

  const queryClient = createTestQueryClient(queryClientOptions);
  const authContextValue = createMockAuthContext({
    user,
    isAuthenticated
  });
  const adminContextValue = createMockAdminContext({ modules });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <AuthContext.Provider value={authContextValue}>
            <AdminContext.Provider value={adminContextValue}>
              {children}
            </AdminContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  const renderResult = render(ui, { wrapper: Wrapper });

  return {
    ...renderResult,
    queryClient,
    authContext: authContextValue,
    adminContext: adminContextValue
  };
}

// ===========================
// Performance Test Utilities
// ===========================

export class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  private measurements: Map<string, number> = new Map();

  mark(label: string) {
    this.marks.set(label, performance.now());
  }

  measure(startLabel: string, endLabel?: string): number {
    const start = this.marks.get(startLabel);
    if (!start) throw new Error(`No mark found for ${startLabel}`);

    const end = endLabel ? this.marks.get(endLabel) : performance.now();
    if (endLabel && !end) throw new Error(`No mark found for ${endLabel}`);

    const duration = (end || performance.now()) - start;
    this.measurements.set(`${startLabel}-${endLabel || 'end'}`, duration);
    return duration;
  }

  getMeasurement(key: string): number | undefined {
    return this.measurements.get(key);
  }

  getAllMeasurements(): Record<string, number> {
    return Object.fromEntries(this.measurements);
  }

  clear() {
    this.marks.clear();
    this.measurements.clear();
  }
}

// ===========================
// Workflow Test Scenarios
// ===========================

export const TestScenarios = {
  // User Journey Scenarios
  newUser: {
    user: createMockUser(),
    progress: createMockUserProgress(),
    modules: createLearningPathModules()
  },

  experiencedUser: {
    user: createMockUser(),
    progress: createProgressiveUserProgress(['basics', 'shadow']),
    modules: createLearningPathModules()
  },

  strugglingUser: {
    user: createMockUser(),
    progress: {
      ...createMockUserProgress(),
      quizScores: {
        'basics': { score: 2, total: 5, percentage: 40, attempts: 3 }
      },
      totalTime: 7200 // 2 hours for one module (struggling)
    },
    modules: createLearningPathModules()
  },

  adminUser: {
    user: createMockAdmin(),
    progress: createMockUserProgress(),
    modules: createLearningPathModules()
  },

  // Specific workflow scenarios
  quizCompletion: {
    quiz: createMockQuiz({
      questions: [
        createMockQuestion({ id: 'q1', correctAnswer: 1 }),
        createMockQuestion({ 
          id: 'q2', 
          question: 'What is individuation?',
          options: [
            { id: '0', text: 'Becoming whole', isCorrect: true },
            { id: '1', text: 'Separating from others', isCorrect: false },
            { id: '2', text: 'Following social norms', isCorrect: false },
            { id: '3', text: 'Avoiding conflict', isCorrect: false }
          ],
          correctAnswer: 0
        })
      ]
    }),
    expectedScore: { score: 2, total: 2, percentage: 100 }
  },

  moduleProgression: {
    startModule: 'basics',
    progressSteps: [
      { action: 'watch-video', timeSpent: 600 },
      { action: 'read-content', timeSpent: 1200 },
      { action: 'take-quiz', score: 4, total: 5 },
      { action: 'complete', totalTime: 2400 }
    ]
  }
};

// ===========================
// Service Mock Helpers
// ===========================

export const mockServiceResponses = {
  authService: {
    login: (success: boolean = true) => {
      if (success) {
        return Promise.resolve({
          user: createMockUser(),
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          expiresIn: 3600
        });
      } else {
        return Promise.reject(new Error('Invalid credentials'));
      }
    },

    register: (success: boolean = true) => {
      if (success) {
        return Promise.resolve(createMockUser());
      } else {
        return Promise.reject(new Error('Registration failed'));
      }
    }
  },

  moduleService: {
    getAllModules: (modules: Module[] = createLearningPathModules()) => {
      return Promise.resolve(modules);
    },

    getModuleById: (moduleId: string) => {
      const modules = createLearningPathModules();
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        return Promise.resolve(module);
      } else {
        return Promise.reject(new Error('Module not found'));
      }
    }
  },

  quizGenerator: {
    generateQuiz: () => {
      return Promise.resolve(createMockQuiz());
    },

    generateAdaptiveQuestions: (difficulty: string = 'medium') => {
      return Promise.resolve([
        createMockQuestion({
          difficulty: difficulty,
          question: `${difficulty} difficulty question about Jung`
        })
      ]);
    }
  }
};

// ===========================
// Async Test Helpers
// ===========================

export const waitForWorkflowCompletion = async (
  checkCondition: () => boolean,
  timeout: number = 10000,
  interval: number = 100
) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (checkCondition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Workflow completion check timed out after ${timeout}ms`);
};

export const simulateUserInteractionDelay = (minMs: number = 100, maxMs: number = 500) => {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// ===========================
// Integration Test Setup
// ===========================

export const setupIntegrationTest = () => {
  const performanceTracker = new PerformanceTracker();
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    performanceTracker.clear();
    
    // Mock console methods to avoid noise in test output
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    performanceTracker.clear();
  });

  return {
    performanceTracker,
    scenarios: TestScenarios,
    mocks: mockServiceResponses
  };
};

// ===========================
// Coverage Helpers
// ===========================

export const getCoverageMetrics = () => {
  // This would integrate with Jest coverage or other coverage tools
  return {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0
  };
};

export const generateCoverageReport = (testSuiteName: string) => {
  const metrics = getCoverageMetrics();
  console.log(`\n📊 Integration Test Coverage Report: ${testSuiteName}`);
  console.log('='.repeat(50));
  console.log(`Statements: ${metrics.statements}%`);
  console.log(`Branches: ${metrics.branches}%`);
  console.log(`Functions: ${metrics.functions}%`);
  console.log(`Lines: ${metrics.lines}%`);
  console.log('='.repeat(50));
  
  return metrics;
};
