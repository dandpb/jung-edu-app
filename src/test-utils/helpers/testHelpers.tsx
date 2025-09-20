import { render, RenderOptions, RenderResult } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { AdminContext } from '../../contexts/AdminContext';
import { I18nContext } from '../../contexts/I18nContext';
import { Question, Module, Option, UserProgress, Quiz, QuestionType } from '../../types';
import { EducationalModule } from '../../schemas/module.schema';
import { UserRole } from '../../types/auth';
import { DifficultyLevel, ModuleStatus } from '../../schemas/module.schema';

/**
 * Custom render function that includes commonly needed providers
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: RenderOptions
): RenderResult {
  return render(
    React.createElement(BrowserRouter, null, ui),
    options
  );
}

/**
 * Wait for async operations with timeout
 */
export const waitForAsync = (ms: number = 100): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock fetch responses for testing
 */
export const mockFetch = (response: any, options?: {
  status?: number;
  headers?: Record<string, string>;
  delay?: number;
}) => {
  const { status = 200, headers = {}, delay = 0 } = options || {};
  
  global.fetch = jest.fn(() => 
    new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: status >= 200 && status < 300,
          status,
          headers: new Headers(headers),
          json: async () => response,
          text: async () => JSON.stringify(response),
          blob: async () => new Blob([JSON.stringify(response)]),
        } as Response);
      }, delay);
    })
  );
};

/**
 * Restore fetch to original implementation
 */
export const restoreFetch = () => {
  if ('fetch' in global && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockRestore();
  }
};

/**
 * Local storage test utilities
 */
export const localStorageUtils = {
  setup: () => {
    const store: Record<string, string> = {};
    
    const mockLocalStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: jest.fn((index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      })
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    return mockLocalStorage;
  },
  
  reset: () => {
    localStorage.clear();
    jest.clearAllMocks();
  }
};

/**
 * Session storage test utilities (similar to localStorage)
 */
export const sessionStorageUtils = {
  setup: () => {
    const store: Record<string, string> = {};
    
    const mockSessionStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      })
    };

    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });

    return mockSessionStorage;
  },
  
  reset: () => {
    sessionStorage.clear();
    jest.clearAllMocks();
  }
};

/**
 * Assert that a module is valid according to schema
 */
export function assertValidModule(module: any): asserts module is EducationalModule {
  expect(module).toHaveProperty('id');
  expect(module).toHaveProperty('title');
  expect(module).toHaveProperty('content');
  expect(module.content).toHaveProperty('introduction');
  expect(module.content).toHaveProperty('sections');
  expect(Array.isArray(module.content.sections)).toBe(true);
}

/**
 * Assert that a quiz is valid
 */
export function assertValidQuiz(quiz: any): asserts quiz is Quiz {
  expect(quiz).toHaveProperty('id');
  expect(quiz).toHaveProperty('title');
  expect(quiz).toHaveProperty('questions');
  expect(Array.isArray(quiz.questions)).toBe(true);
  expect(quiz.questions.length).toBeGreaterThan(0);
}

/**
 * Assert that a question is valid
 */
export function assertValidQuestion(question: any): asserts question is Question {
  expect(question).toHaveProperty('id');
  expect(question).toHaveProperty('type');
  expect(question).toHaveProperty('question');
  
  if (question.type === 'multiple-choice') {
    expect(question).toHaveProperty('options');
    expect(Array.isArray(question.options)).toBe(true);
    expect(question.options.length).toBeGreaterThan(1);
  }
  
  if (question.type !== 'essay') {
    expect(question).toHaveProperty('correctAnswer');
  }
}

/**
 * Create a mock console to suppress or capture logs in tests
 */
export const mockConsole = () => {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  const logs: { type: string; args: any[] }[] = [];

  console.log = jest.fn((...args) => logs.push({ type: 'log', args }));
  console.error = jest.fn((...args) => logs.push({ type: 'error', args }));
  console.warn = jest.fn((...args) => logs.push({ type: 'warn', args }));
  console.info = jest.fn((...args) => logs.push({ type: 'info', args }));
  console.debug = jest.fn((...args) => logs.push({ type: 'debug', args }));

  return {
    logs,
    restore: () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    },
    expectNoErrors: () => {
      expect(logs.filter(l => l.type === 'error')).toHaveLength(0);
    },
    expectNoWarnings: () => {
      expect(logs.filter(l => l.type === 'warn')).toHaveLength(0);
    }
  };
};

/**
 * Test data constants
 */
export const testConstants = {
  sampleYouTubeId: 'dQw4w9WgXcQ',
  sampleYouTubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  sampleImageUrl: 'https://example.com/test-image.jpg',
  samplePdfUrl: 'https://example.com/test-document.pdf',
  
  jungianConcepts: [
    'Collective Unconscious',
    'Archetypes',
    'Shadow',
    'Anima/Animus',
    'Self',
    'Individuation',
    'Persona',
    'Complexes',
    'Synchronicity',
    'Active Imagination'
  ],
  
  difficultyLevels: ['beginner', 'intermediate', 'advanced', 'expert'] as const,
  
  questionTypes: ['multiple-choice', 'true-false', 'essay'] as const,
  
  moduleStatuses: ['draft', 'published', 'archived'] as const
};

/**
 * Generate test IDs consistently
 */
export const generateTestId = (prefix: string): string => {
  return `${prefix}-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Clean up after tests (useful for integration tests)
 */
export const cleanupTestData = () => {
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Restore all mocks
  jest.restoreAllMocks();
};

/**
 * Performance testing helper
 */
export const measurePerformance = async (
  fn: () => Promise<any>,
  label: string = 'Operation'
): Promise<{ result: any; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  console.log(`${label} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
};

/**
 * Retry helper for flaky operations
 */
export const retry = async <T,>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 100
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await waitForAsync(delay * attempt);
      }
    }
  }
  
  throw lastError;
};

// ===========================
// Mock Data Factories
// ===========================

/**
 * Creates a mock user for testing with realistic data
 */
export const createMockUser = (overrides: Partial<any> = {}): any => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  email: `test.user.${Math.random().toString(36).substr(2, 5)}@example.com`,
  username: `testuser${Math.random().toString(36).substr(2, 5)}`,
  role: UserRole.STUDENT,
  profile: {
    firstName: 'Test',
    lastName: 'User',
    avatar: null,
    bio: 'A test user for unit testing',
    preferences: {
      theme: 'light' as const,
      language: 'en',
      emailNotifications: true,
      pushNotifications: false,
      studyReminders: true,
      weeklyProgress: true
    },
    settings: {
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    }
  },
  progress: {
    completedModules: [],
    quizScores: {},
    totalTime: 0,
    lastAccessed: Date.now(),
    streak: 0,
    achievements: []
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
  isActive: true,
  isVerified: true,
  emailVerifiedAt: new Date(),
  ...overrides
});

/**
 * Creates a mock question for testing with proper structure
 */
export const createMockQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: `question-${Math.random().toString(36).substr(2, 9)}`,
  type: 'multiple-choice' as QuestionType,
  question: 'What is the collective unconscious according to Jung?',
  options: [
    { id: '0', text: 'Personal memories and experiences', isCorrect: false, explanation: 'This describes the personal unconscious' },
    { id: '1', text: 'Universal patterns shared by all humanity', isCorrect: true, explanation: 'Correct! The collective unconscious contains universal archetypes' },
    { id: '2', text: 'Learned behaviors from society', isCorrect: false, explanation: 'This is more related to social conditioning' },
    { id: '3', text: 'Dreams and fantasies', isCorrect: false, explanation: 'While dreams can reflect it, this is not the definition' }
  ] as Option[],
  correctAnswer: 1,
  explanation: 'The collective unconscious is Jung\'s concept of a deeper layer of unconscious shared by all humans, containing universal patterns called archetypes.',
  difficulty: 'intermediate',
  cognitiveLevel: 'understanding',
  tags: ['jung', 'collective-unconscious', 'archetypes'],
  points: 10,
  order: 0,
  timeLimit: 60,
  hints: [
    'Think about what Jung believed all humans share',
    'Consider the difference between personal and collective',
    'Remember that archetypes are universal patterns'
  ],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'test-author',
    reviewedBy: 'test-reviewer',
    difficulty: 'intermediate',
    bloomsLevel: 'comprehension'
  },
  ...overrides
});

/**
 * Creates a mock quiz with realistic questions and structure
 */
export const createMockQuiz = (overrides: Partial<Quiz> = {}): Quiz => {
  const defaultQuestions = [
    createMockQuestion({ id: 'q1', order: 0 }),
    createMockQuestion({
      id: 'q2',
      order: 1,
      question: 'The Shadow archetype represents:',
      options: [
        { id: '0', text: 'The dark side of personality', isCorrect: true },
        { id: '1', text: 'The ideal self', isCorrect: false },
        { id: '2', text: 'The wise old man', isCorrect: false },
        { id: '3', text: 'The hero journey', isCorrect: false }
      ] as Option[],
      correctAnswer: 0
    }),
    createMockQuestion({
      id: 'q3',
      order: 2,
      type: 'true-false',
      question: 'Jung believed that individuation is a lifelong process.',
      correctAnswer: 'true',
      explanation: 'True. Jung viewed individuation as the central process of human development that continues throughout life.'
    })
  ];

  return {
    id: `quiz-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Introduction to Jungian Psychology',
    description: 'Test your understanding of basic Jungian concepts including the collective unconscious, archetypes, and individuation.',
    questions: defaultQuestions as any,
    moduleId: `module-${Math.random().toString(36).substr(2, 9)}`,
    passingScore: 70,
    timeLimit: 30,
    maxAttempts: 3,
    shuffleQuestions: true,
    shuffleAnswers: true,
    showResults: true,
    allowReview: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      version: '1.0.0',
      author: 'test-author',
      reviewedBy: 'test-reviewer',
      tags: ['jung', 'psychology', 'assessment'],
      difficulty: 'intermediate',
      estimatedTime: 25,
      language: 'en'
    },
    adaptiveSettings: {
      enabled: false,
      difficultyRange: [1, 5],
      minQuestions: 3,
      maxQuestions: 10,
      targetAccuracy: 0.7
    },
    ...overrides
  } as any;
};

/**
 * Creates a mock module with complete structure and realistic content
 */
export const createMockModule = (overrides: Partial<Module> = {}): Module => {
  const moduleId = `module-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: moduleId,
    title: 'Introduction to Carl Jung and Analytical Psychology',
    description: 'Explore the foundational concepts of Carl Jung\'s analytical psychology, including the collective unconscious, archetypes, and the process of individuation.',
    icon: '🧠',
    estimatedTime: 120, // 2 hours in minutes
    difficulty: 'intermediate',
    category: 'Psychology',
    status: 'published',
    version: 1,
    author: 'Dr. Jung Expert',
    publishedAt: new Date(),
    updatedAt: new Date(),
    prerequisites: ['basic-psychology'],
    learningObjectives: [
      'Understand Jung\'s concept of the collective unconscious',
      'Identify major Jungian archetypes',
      'Explain the process of individuation',
      'Analyze how Jungian concepts apply to personal development'
    ],
    tags: ['jung', 'psychology', 'archetypes', 'individuation', 'unconscious'],
    content: {
      introduction: 'Carl Gustav Jung (1875-1961) was a Swiss psychiatrist and psychoanalyst who founded analytical psychology. His work has profoundly influenced psychology, anthropology, archaeology, literature, philosophy, and religious studies.',
      sections: [
        {
          id: 'section-1',
          title: 'The Structure of the Psyche',
          content: 'Jung proposed that the human psyche consists of three main components: the conscious mind (ego), the personal unconscious, and the collective unconscious. Understanding this structure is fundamental to grasping Jung\'s psychological theory.',
          order: 0,
          estimatedTime: 20,
          keyTerms: [
            { term: 'Ego', definition: 'The conscious mind, including thoughts, memories, and emotions we are aware of' },
            { term: 'Personal Unconscious', definition: 'Forgotten or repressed memories from an individual\'s personal experience' },
            { term: 'Collective Unconscious', definition: 'The deepest layer containing universal patterns shared by all humanity' }
          ],
          images: [
            {
              id: 'img-1',
              url: '/images/jung-psyche-diagram.jpg',
              caption: 'Jung\'s model of the psyche showing the relationship between conscious and unconscious layers',
              alt: 'Diagram illustrating Jung\'s three-layer model of the human psyche'
            }
          ]
        },
        {
          id: 'section-2',
          title: 'Major Archetypes',
          content: 'Archetypes are universal, recurring patterns or motifs that derive from the collective unconscious. Jung identified several key archetypes that appear across cultures and throughout history.',
          order: 1,
          estimatedTime: 30,
          keyTerms: [
            { term: 'Archetype', definition: 'Universal patterns or images in the collective unconscious' },
            { term: 'Self', definition: 'The unified totality of conscious and unconscious' },
            { term: 'Shadow', definition: 'The hidden, repressed, or undeveloped aspects of the personality' },
            { term: 'Anima/Animus', definition: 'The contrasexual aspects of the psyche' }
          ]
        }
      ],
      summary: 'Jung\'s analytical psychology provides a rich framework for understanding the human psyche through concepts like the collective unconscious, archetypes, and individuation. These ideas continue to influence psychology, therapy, and personal development today.',
      keyTakeaways: [
        'The psyche consists of conscious and unconscious layers',
        'The collective unconscious contains universal patterns called archetypes',
        'Individuation is the process of psychological development toward wholeness',
        'Jung\'s concepts help explain universal human experiences and behaviors'
      ],
      videos: [
      {
        id: 'video-1',
        title: 'Introduction to Carl Jung',
        youtubeId: 'dQw4w9WgXcQ',
        description: 'A comprehensive overview of Jung\'s life and key contributions to psychology',
        duration: { hours: 0, minutes: 15, seconds: 30 },
        keyMoments: [
          {
            timestamp: 180,
            title: 'Early Life and Influences',
            description: 'Jung\'s childhood and early influences that shaped his thinking',
            type: 'concept'
          },
          {
            timestamp: 480,
            title: 'Break with Freud',
            description: 'The philosophical differences that led Jung to develop his own approach',
            type: 'concept'
          }
        ]
      }
    ]
    },
    quiz: createMockQuiz({ moduleId }),
    practicalExercises: [
      {
        id: 'exercise-1',
        title: 'Shadow Work Reflection',
        description: 'A guided reflection on identifying and integrating shadow aspects',
        instructions: [
          'Find a quiet space for reflection',
          'Consider traits you dislike in others',
          'Reflect on how these might exist within yourself',
          'Write about your insights in a journal'
        ],
        estimatedTime: 30,
        difficulty: 'intermediate',
        type: 'reflection',
        expectedOutcomes: [
          'Increased self-awareness',
          'Better understanding of projection',
          'Personal growth insights'
        ]
      }
    ],
    analytics: {
      totalViews: Math.floor(Math.random() * 1000) + 100,
      averageCompletionTime: 95,
      completionRate: 0.78,
      averageQuizScore: 82.5,
      popularSections: ['section-1', 'section-2'],
      userFeedback: []
    },
    ...overrides
  };
};

/**
 * Custom render function that includes all necessary providers for testing
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: {
    initialEntries?: string[];
    user?: any;
    isAuthenticated?: boolean;
    isAdmin?: boolean;
  } & Omit<RenderOptions, 'wrapper'>
) => {
  const {
    initialEntries = ['/'],
    user = createMockUser(),
    isAuthenticated = true,
    isAdmin = false,
    ...renderOptions
  } = options || {};

  const mockAuthValue = {
    user: isAuthenticated ? user : null,
    isAuthenticated,
    isLoading: false,
    error: null,
    login: jest.fn().mockResolvedValue(user),
    logout: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue(user),
    updateProfile: jest.fn().mockResolvedValue(user),
    requestPasswordReset: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue(undefined),
    changePassword: jest.fn().mockResolvedValue(undefined),
    verifyEmail: jest.fn().mockResolvedValue(undefined),
    resendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    hasPermission: jest.fn().mockReturnValue(true),
    hasRole: jest.fn().mockReturnValue(true),
    refreshSession: jest.fn().mockResolvedValue(user),
    clearError: jest.fn()
  };

  const mockAdminValue = {
    isAdmin,
    currentAdmin: isAdmin ? { id: 'admin-1', username: 'admin', password: 'password', role: 'admin' as const } : null,
    login: jest.fn().mockReturnValue(true),
    logout: jest.fn(),
    users: [user],
    modules: [createMockModule()],
    updateModules: jest.fn(),
    quizzes: [createMockQuiz()],
    analytics: {
      totalUsers: 100,
      activeUsers: 85,
      totalModules: 25,
      averageCompletion: 0.78
    },
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    createModule: jest.fn(),
    updateModule: jest.fn(),
    deleteModule: jest.fn(),
    getAnalytics: jest.fn()
  };

  const mockI18nValue = {
    t: (key: string | null | undefined, params?: Record<string, any>): string | null | undefined => {
      // Handle null and undefined cases
      if (key === null) {
        return null;
      }
      if (typeof key === 'undefined') {
        return undefined;
      }
      // Simple mock translation that returns the key
      if (params) {
        let result = key;
        Object.entries(params).forEach(([param, value]) => {
          result = result.replace(`{{${param}}}`, String(value));
        });
        return result;
      }
      return key;
    },
    language: 'en',
    supportedLanguages: ['en', 'pt-BR'],
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
    isReady: true,
    getAvailableTranslations: jest.fn().mockReturnValue([]),
    hasTranslation: jest.fn().mockReturnValue(true),
    getCurrentNamespace: jest.fn().mockReturnValue('translation'),
    loadNamespace: jest.fn().mockResolvedValue(undefined)
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={mockAuthValue}>
        <AdminContext.Provider value={mockAdminValue}>
          <I18nContext.Provider value={mockI18nValue}>
            {children}
          </I18nContext.Provider>
        </AdminContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    user,
    mockAuthValue,
    mockAdminValue,
    mockI18nValue
  };
};

// Missing functions needed by the tests
export const createMockNote = (overrides: Partial<any> = {}): any => ({
  id: generateTestId('note'),
  moduleId: generateTestId('module'),
  content: 'Sample note content for testing',
  timestamp: Date.now(),
  tags: ['test', 'note'],
  type: 'text',
  mediaAttachments: [],
  linkedConcepts: ['concept1', 'concept2'],
  isShared: false,
  parentNoteId: null,
  ...overrides
});

export const generateValidationTestCases = () => ([
  { input: '', expected: false, description: 'empty string' },
  { input: 'valid', expected: true, description: 'valid input' },
  { input: null, expected: false, description: 'null value' },
  { input: undefined, expected: false, description: 'undefined value' }
]);

export const assertDeepEquality = (actual: any, expected: any): void => {
  expect(actual).toEqual(expected);
};

export const assertTypeCompliance = (obj: any, type: string): void => {
  expect(obj).toBeDefined();
  expect(typeof obj).toBe('object');
};

export const createDataFactory = (defaultData: any) => ({
  create: (overrides = {}) => ({ ...defaultData, ...overrides }),
  createMany: (count: number, overrides = {}) => 
    Array.from({ length: count }, (_, i) => ({ ...defaultData, ...overrides, id: `${defaultData.id || 'item'}-${i}` }))
});

export const MockDataGenerator = {
  generateName: () => `Test User ${Math.floor(Math.random() * 1000)}`,
  generateEmail: () => `test${Math.floor(Math.random() * 1000)}@example.com`,
  generateId: () => generateTestId('mock'),
  generateText: (length = 100) => 'Lorem ipsum '.repeat(Math.ceil(length / 12)).substring(0, length),
  generateNumber: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min
};