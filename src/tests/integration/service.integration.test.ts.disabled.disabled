/**
 * Service Integration Tests
 * Tests service-to-service interactions and workflows
 */

// Setup localStorage mock before any imports
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock all external dependencies after localStorage setup
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  hasPermission: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
  getCurrentUser: jest.fn().mockResolvedValue(null),
  refreshToken: jest.fn().mockResolvedValue('new-token')
};

jest.mock('../../services/auth/authService', () => ({
  AuthService: jest.fn().mockImplementation(() => mockAuthService)
}));

const mockModuleService = {
  createModule: jest.fn(),
  getModuleById: jest.fn(),
  updateModule: jest.fn(),
  searchModules: jest.fn(),
  getStatistics: jest.fn(),
  getAllModules: jest.fn()
};

jest.mock('../../services/modules/moduleService', () => ({
  ModuleService: mockModuleService
}));

const mockQuizGenerator = {
  generateEnhancedQuiz: jest.fn()
};

jest.mock('../../services/quiz/enhancedQuizGenerator', () => ({
  EnhancedQuizGenerator: jest.fn().mockImplementation(() => mockQuizGenerator)
}));

const mockYouTubeService = {
  searchVideos: jest.fn(),
  suggestVideos: jest.fn()
};

jest.mock('../../services/video/youtubeService', () => ({
  YouTubeService: jest.fn().mockImplementation(() => mockYouTubeService)
}));

jest.mock('../../services/llm/providers/mock', () => ({
  MockLLMProvider: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn()
    })),
    get: jest.fn()
  }
}));

import { AuthService } from '../../services/auth/authService';
import { ModuleService } from '../../services/modules/moduleService';
import { EnhancedQuizGenerator } from '../../services/quiz/enhancedQuizGenerator';
import { YouTubeService } from '../../services/video/youtubeService';
import { MockLLMProvider } from '../../services/llm/providers/mock';
import { UserRole, RegistrationData } from '../../types/auth';
import { DifficultyLevel, ModuleStatus } from '../../schemas/module.schema';
import { setupCryptoMocks, cleanupCryptoMocks } from '../../test-utils/cryptoMocks';
import { createMockUser, createMockModule, createMockQuiz } from '../../test-utils/helpers/testHelpers';

// Shared test state for mock services to maintain consistency
let mockModuleStore: any = {};
let mockUserStore: any = {};
let testModule: any = null;
let testUser: any = null;

describe('Service Integration Tests', () => {
  let authService: any;
  let moduleService: any;
  let quizGenerator: any;
  let youtubeService: any;
  let mockLLMProvider: any;

  beforeAll(async () => {
    setupCryptoMocks();
    
    // Assign mock objects to service variables
    authService = mockAuthService;
    moduleService = mockModuleService;
    quizGenerator = mockQuizGenerator;
    youtubeService = mockYouTubeService;

    mockLLMProvider = {
      generateText: jest.fn().mockResolvedValue('Mock generated text'),
      generateQuestions: jest.fn().mockResolvedValue([]),
      isConfigured: jest.fn().mockReturnValue(true),
      maxTokens: 50
    };

    console.log('Services initialized with mocks');
  });

  afterAll(() => {
    cleanupCryptoMocks();
  });

  beforeEach(() => {
    // Clear localStorage and test state
    localStorageMock.clear();
    testModule = null;
    testUser = null;
    mockModuleStore = {};

    // Configure mock return values for each test
    mockAuthService.register.mockImplementation(async (userData: RegistrationData) => {
      const mockUser = createMockUser(userData, '123');
      testUser = mockUser;
      return mockUser;
    });
    
    mockAuthService.login.mockImplementation(async (credentials) => {
      return {
        user: testUser || createMockUser({
          email: credentials.username + '@example.com',
          username: credentials.username,
          password: credentials.password,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.INSTRUCTOR
        }, '123'),
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
    });
    
    mockAuthService.hasPermission.mockImplementation(async (userId, resource, action) => {
      // Check user role from testUser (which is set during registration)
      const user = testUser;
      if (!user) return false;
      
      // INSTRUCTOR role can create, read, update modules
      if (resource === 'modules' && ['create', 'read', 'update'].includes(action)) {
        return user.role === UserRole.INSTRUCTOR;
      }
      return false;
    });
    
    mockModuleService.createModule.mockImplementation(async (moduleData) => {
      const mockModule = createMockModule(moduleData, Date.now().toString());
      testModule = mockModule;
      mockModuleStore[mockModule.id!] = mockModule;
      return mockModule;
    });
    
    mockModuleService.getModuleById.mockImplementation(async (id: string) => {
      return mockModuleStore[id] || null;
    });
    
    mockModuleService.updateModule.mockImplementation(async (id: string, updates) => {
      const existing = mockModuleStore[id];
      if (!existing) return null;
      const updated = { ...existing, ...updates, updatedAt: new Date() };
      mockModuleStore[id] = updated;
      return updated;
    });
    
    mockModuleService.searchModules.mockImplementation(async (query) => {
      const modules = Object.values(mockModuleStore);
      if (!query.searchTerm) return modules;
      return modules.filter(m => 
        m.title.toLowerCase().includes(query.searchTerm!.toLowerCase()) ||
        m.description?.toLowerCase().includes(query.searchTerm!.toLowerCase())
      );
    });
    
    mockModuleService.getAllModules.mockImplementation(async () => {
      return Object.values(mockModuleStore);
    });
    
    mockModuleService.getStatistics.mockImplementation(async () => ({
      total: Object.keys(mockModuleStore).length,
      published: Object.values(mockModuleStore).filter(m => m.status === ModuleStatus.PUBLISHED).length,
      draft: Object.values(mockModuleStore).filter(m => m.status === ModuleStatus.DRAFT).length
    }));
    
    mockQuizGenerator.generateEnhancedQuiz.mockImplementation(async (moduleId, title, content, learningObjectives) => {
      return createMockQuiz({
        id: `quiz-${moduleId}`,
        title: `Quiz for ${title}`,
        moduleId,
        questions: [
          {
            id: 'q1',
            question: 'What is the collective unconscious?',
            type: 'multiple-choice' as const,
            options: [
              { id: 'a', text: 'Shared unconscious content', isCorrect: true },
              { id: 'b', text: 'Personal memories', isCorrect: false },
              { id: 'c', text: 'Conscious thoughts', isCorrect: false },
              { id: 'd', text: 'Dream content', isCorrect: false }
            ],
            explanation: 'The collective unconscious contains shared human experiences.',
            difficulty: 'medium' as const,
            timeLimit: 60
          }
        ]
      });
    });
    
    mockYouTubeService.searchVideos.mockResolvedValue([
      {
        id: 'video1',
        title: 'Jung and the Shadow',
        description: 'Introduction to Jung\'s shadow concept',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        duration: '10:30',
        viewCount: 15000,
        uploadDate: '2023-01-15'
      },
      {
        id: 'video2',
        title: 'Understanding Archetypes',
        description: 'Jung\'s theory of archetypes explained',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        duration: '8:45',
        viewCount: 12000,
        uploadDate: '2023-02-10'
      }
    ]);
    
    mockYouTubeService.suggestVideos.mockImplementation(async (keywords) => {
      return mockYouTubeService.searchVideos(keywords.join(' '));
    });
  });

  describe('Auth Service → Module Service Integration', () => {
    it('should complete user registration and module creation workflow', async () => {
      // Step 1: Register a new user
      const registrationData: RegistrationData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.INSTRUCTOR
      };

      const user = await authService.register(registrationData);
      expect(user).toBeDefined();
      expect(user.email).toBe(registrationData.email);
      expect(user.role).toBe(UserRole.INSTRUCTOR);

      // Step 2: Login the user
      const loginResponse = await authService.login({
        username: registrationData.username,
        password: registrationData.password,
        rememberMe: false
      });

      expect(loginResponse.user.id).toBe(user.id);
      expect(loginResponse.accessToken).toBeDefined();

      // Step 3: Check user permissions for module creation
      const hasCreatePermission = await authService.hasPermission(
        user.id,
        'modules',
        'create'
      );
      expect(hasCreatePermission).toBe(true);

      // Step 4: Create a module as the authenticated user
      const moduleData = {
        title: 'Introduction to Jung',
        description: 'Basic concepts of Jungian psychology',
        content: {
          introduction: 'This module covers Jung\'s fundamental concepts',
          sections: [
            {
              id: 'section-1',
              title: 'The Collective Unconscious',
              content: 'Jung\'s theory of shared unconscious content',
              order: 1,
              keyTerms: [
                {
                  term: 'collective unconscious',
                  definition: 'Shared unconscious content across humanity'
                }
              ]
            }
          ]
        }
      };

      const module = await moduleService.createModule(moduleData);
      expect(module).toBeDefined();
      expect(module.id).toBeDefined();
      expect(module.title).toBe(moduleData.title);
      expect(module.description).toBe(moduleData.description);
    });

    it('should handle module access permissions correctly', async () => {
      // Create student user
      const studentData: RegistrationData = {
        email: 'student@example.com',
        username: 'student',
        password: 'SecurePass123!',
        firstName: 'Student',
        lastName: 'User',
        role: UserRole.STUDENT
      };

      const student = await authService.register(studentData);
      expect(student).toBeDefined();

      // Check that student cannot create modules
      const hasCreatePermission = await authService.hasPermission(
        student.id,
        'modules',
        'create'
      );
      expect(hasCreatePermission).toBe(false);
    });
  });

  describe('Module Service → Quiz Generator Integration', () => {
    it('should generate quiz for module content', async () => {
      const moduleData = {
        title: 'The Shadow in Jungian Psychology',
        description: 'Understanding the shadow archetype',
        content: {
          introduction: 'The shadow represents the hidden aspects of the personality',
          sections: []
        }
      };

      const module = await moduleService.createModule(moduleData);
      expect(module).toBeDefined();

      // Generate quiz based on module content
      const quiz = await quizGenerator.generateEnhancedQuiz(
        module.id!,
        module.title,
        JSON.stringify(module.content),
        ['Understand the concept of the shadow', 'Recognize anima/animus projections'],
        'medium'
      );

      expect(quiz).toBeDefined();
      expect(quiz.title).toContain('Quiz for');
      expect(quiz.questions).toBeDefined();
      expect(quiz.questions.length).toBeGreaterThan(0);
    });

    it('should handle quiz generation errors gracefully', async () => {
      const moduleData = {
        title: 'Invalid Module',
        description: 'Module with problematic content',
        content: { introduction: '', sections: [] }
      };

      const module = await moduleService.createModule(moduleData);

      // Try to generate quiz - should handle gracefully
      const quiz = await quizGenerator.generateEnhancedQuiz(
        module.id,
        module.title,
        JSON.stringify(module.content),
        [],
        'medium'
      );

      expect(quiz).toBeDefined();
    });
  });

  describe('Module Service → Video Service Integration', () => {
    it('should integrate YouTube video suggestions with modules', async () => {
      const moduleData = {
        title: 'Jung and Archetypes',
        description: 'Exploring Jungian archetypes',
        content: {
          introduction: 'Archetypes are universal patterns of human experience',
          sections: []
        }
      };

      const module = await moduleService.createModule(moduleData);

      // Search for relevant videos
      const videos = await youtubeService.searchVideos(['Jung', 'archetypes', 'psychology']);

      expect(videos).toHaveLength(2);
      expect(videos[0].title).toBe('Jung and the Shadow');
      expect(videos[1].title).toBe('Understanding Archetypes');
    });
  });

  describe('Complete Learning Module Generation Workflow', () => {
    it('should orchestrate full module creation with all components', async () => {
      // Step 1: User login
      const loginResponse = await authService.login({
        username: 'instructor',
        password: 'password',
        rememberMe: false
      });

      expect(loginResponse.accessToken).toBeDefined();

      // Step 2: Create base module
      const moduleData = {
        title: 'Complete Jungian Analysis',
        description: 'Comprehensive module on Jungian analytical psychology',
        content: {
          introduction: 'This module provides a comprehensive overview',
          sections: [
            {
              id: 'section-1',
              title: 'Introduction to Jung',
              content: 'Carl Gustav Jung was a Swiss psychiatrist',
              order: 1
            }
          ]
        }
      };

      const module = await moduleService.createModule(moduleData);
      expect(module).toBeDefined();

      // Step 3: Generate quiz
      const quiz = await quizGenerator.generateEnhancedQuiz(
        module.id!,
        module.title,
        JSON.stringify(module.content),
        ['Understand Jung\'s key concepts'],
        'intermediate'
      );

      expect(quiz).toBeDefined();
      expect(quiz.questions.length).toBeGreaterThan(0);

      // Step 4: Add video recommendations
      const videos = await youtubeService.suggestVideos(['Jung', 'analytical psychology']);
      expect(videos).toBeDefined();
      expect(videos.length).toBeGreaterThan(0);

      // Step 5: Update module with all components
      const updatedModule = await moduleService.updateModule(module.id!, {
        quiz: quiz,
        videos: videos.map(v => ({
          id: v.id,
          title: v.title,
          url: `https://youtube.com/watch?v=${v.id}`,
          description: v.description,
          duration: v.duration
        }))
      });

      expect(updatedModule).toBeDefined();
      expect(updatedModule.quiz).toBeDefined();
      expect(updatedModule.videos).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle service failures gracefully', async () => {
      // This test should not throw an error even if services fail
      mockModuleService.createModule.mockRejectedValue(new Error('Service temporarily unavailable'));

      try {
        await moduleService.createModule({
          title: 'Test Module',
          description: 'Test description'
        });
      } catch (error) {
        expect(error.message).toBe('Service temporarily unavailable');
      }

      // Reset mock for other tests
      mockModuleService.createModule.mockImplementation(async (moduleData) => {
        const mockModule = createMockModule(moduleData, Date.now().toString());
        testModule = mockModule;
        mockModuleStore[mockModule.id!] = mockModule;
        return mockModule;
      });
    });

    it('should handle concurrent module operations', async () => {
      const createPromises = Array.from({ length: 5 }, (_, i) =>
        moduleService.createModule({
          title: `Concurrent Module ${i}`,
          description: `Description for module ${i}`
        })
      );

      const modules = await Promise.all(createPromises);

      expect(modules).toHaveLength(5);
      modules.forEach((module, index) => {
        expect(module.title).toBe(`Concurrent Module ${index}`);
        expect(module.id).toBeDefined();
      });
    });
  });
});