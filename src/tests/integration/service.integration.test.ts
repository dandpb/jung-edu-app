/**
 * Service Integration Tests
 * Tests service-to-service interactions and workflows
 */

import { AuthService } from '../../services/auth/authService';
import { ModuleService } from '../../services/modules/moduleService';
import { EnhancedQuizGenerator } from '../../services/quiz/enhancedQuizGenerator';
import { YouTubeService } from '../../services/video/youtubeService';
import { MockLLMProvider } from '../../services/llm/providers/mock';
import { UserRole, RegistrationData } from '../../types/auth';
import { DifficultyLevel, ModuleStatus, PublicationType } from '../../schemas/module.schema';
import { setupCryptoMocks, cleanupCryptoMocks } from '../../test-utils/cryptoMocks';

// Mock axios for YouTube API tests
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn()
    })),
    get: jest.fn()
  }
}));

describe('Service Integration Tests', () => {
  let authService: AuthService;
  let mockLLMProvider: MockLLMProvider;
  let quizGenerator: EnhancedQuizGenerator;
  let youtubeService: YouTubeService;

  beforeAll(async () => {
    // Setup crypto mocks for JWT operations
    setupCryptoMocks();
    
    // Initialize services
    authService = new AuthService();
    mockLLMProvider = new MockLLMProvider(50);
    quizGenerator = new EnhancedQuizGenerator(mockLLMProvider);
    youtubeService = new YouTubeService('mock-api-key');
  });

  afterAll(() => {
    cleanupCryptoMocks();
  });

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
    // Reinitialize auth service for each test
    authService = new AuthService();
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
      expect(user.id).toBeDefined();
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
                },
                {
                  term: 'archetypes',
                  definition: 'Universal symbols and patterns'
                }
              ]
            }
          ]
        },
        videos: [],
        mindMaps: [],
        quiz: {
          id: 'quiz-1',
          title: 'Jung Basics Quiz',
          description: 'Test your understanding',
          questions: [],
          passingScore: 70
        },
        bibliography: [],
        filmReferences: [],
        tags: ['jung', 'psychology'],
        difficultyLevel: DifficultyLevel.BEGINNER,
        timeEstimate: { hours: 1, minutes: 30 },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          author: {
            id: user.id,
            name: `${user.profile.firstName} ${user.profile.lastName}`,
            email: user.email,
            role: 'Instructor'
          },
          status: ModuleStatus.DRAFT,
          language: 'en'
        }
      };

      const createdModule = await ModuleService.createModule(moduleData);
      expect(createdModule.id).toBeDefined();
      expect(createdModule.metadata.author.id).toBe(user.id);
      expect(createdModule.metadata.status).toBe(ModuleStatus.DRAFT);

      // Step 5: Verify module was stored correctly
      const retrievedModule = await ModuleService.getModuleById(createdModule.id);
      expect(retrievedModule).toBeTruthy();
      expect(retrievedModule!.title).toBe(moduleData.title);
    });

    it('should handle module access permissions correctly', async () => {
      // Create a student user
      const studentData: RegistrationData = {
        email: 'student@example.com',
        username: 'student',
        password: 'StudentPass123!',
        firstName: 'Student',
        lastName: 'User',
        role: UserRole.STUDENT
      };

      const student = await authService.register(studentData);

      // Check that student cannot create modules
      const hasCreatePermission = await authService.hasPermission(
        student.id,
        'modules',
        'create'
      );
      expect(hasCreatePermission).toBe(false);

      // Create a module as instructor for testing access
      const instructorData: RegistrationData = {
        email: 'instructor@example.com',
        username: 'instructor',
        password: 'InstructorPass123!',
        firstName: 'Instructor',
        lastName: 'User',
        role: UserRole.INSTRUCTOR
      };

      const instructor = await authService.register(instructorData);
      const module = await ModuleService.createModule({
        title: 'Test Module',
        description: 'Test Description',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          author: {
            id: instructor.id,
            name: `${instructor.profile.firstName} ${instructor.profile.lastName}`,
            email: instructor.email,
            role: 'Instructor'
          },
          status: ModuleStatus.PUBLISHED,
          language: 'en'
        }
      });

      // Student should be able to read published modules
      const hasReadPermission = await authService.hasPermission(
        student.id,
        'modules',
        'read'
      );
      expect(hasReadPermission).toBe(true);

      // Verify module can be retrieved
      const retrievedModule = await ModuleService.getModuleById(module.id);
      expect(retrievedModule).toBeTruthy();
    });
  });

  describe('Module Service → Quiz Generator Integration', () => {
    it('should generate quiz for module content', async () => {
      // Create a module with content
      const module = await ModuleService.createModule({
        title: 'Jung\'s Archetypes',
        description: 'Understanding archetypal patterns',
        content: {
          introduction: 'Carl Jung identified universal patterns in the human psyche',
          sections: [
            {
              id: 'section-1',
              title: 'The Shadow',
              content: 'The shadow represents the hidden aspects of personality',
              order: 1,
              keyTerms: [
                {
                  term: 'shadow',
                  definition: 'The hidden or unconscious aspect of personality'
                },
                {
                  term: 'projection',
                  definition: 'Unconsciously attributing qualities to others'
                },
                {
                  term: 'integration',
                  definition: 'Bringing unconscious content into consciousness'
                }
              ]
            },
            {
              id: 'section-2',
              title: 'The Anima/Animus',
              content: 'The contrasexual aspect of the psyche',
              order: 2,
              keyTerms: [
                {
                  term: 'anima',
                  definition: 'The feminine aspect in the male unconscious'
                },
                {
                  term: 'animus',
                  definition: 'The masculine aspect in the female unconscious'
                },
                {
                  term: 'gender psychology',
                  definition: 'Psychological aspects related to gender identity'
                }
              ]
            }
          ]
        },
        videos: [],
        mindMaps: [],
        quiz: {
          id: 'quiz-1',
          title: 'Advanced Jung Quiz',
          description: 'Test advanced concepts',
          questions: [],
          passingScore: 75
        },
        bibliography: [],
        filmReferences: [],
        tags: ['jung', 'shadow', 'anima', 'animus'],
        difficultyLevel: DifficultyLevel.INTERMEDIATE,
        timeEstimate: { hours: 2, minutes: 0 },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          author: {
            id: 'test-instructor',
            name: 'Test Instructor',
            email: 'instructor@example.com',
            role: 'Instructor'
          },
          status: ModuleStatus.PUBLISHED,
          language: 'en'
        }
      });

      // Generate quiz based on module content
      const quiz = await quizGenerator.generateEnhancedQuiz(
        module.id,
        module.title,
        JSON.stringify(module.content),
        ['Understand the concept of the shadow', 'Recognize anima/animus projections'],
        5,
        {
          useTemplates: true,
          enhanceQuestions: true,
          adaptiveDifficulty: true,
          includeEssayQuestions: false,
          contextualizeQuestions: true,
          userLevel: 'intermediate'
        }
      );

      expect(quiz.id).toBeDefined();
      expect(quiz.moduleId).toBe(module.id);
      expect(quiz.questions).toHaveLength(5);
      
      // Verify question quality
      quiz.questions.forEach(question => {
        expect(question.question).toBeDefined();
        expect(question.options).toHaveLength(4);
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswer).toBeLessThan(4);
        expect(question.explanation).toBeDefined();
      });

      // Update module with generated quiz
      const updatedModule = await ModuleService.updateModule(module.id, {
        quiz: quiz as any // Type casting due to Question type mismatch between schemas
      });

      expect(updatedModule.quiz.questions).toHaveLength(5);
    });

    it('should handle quiz generation errors gracefully', async () => {
      // Create module with minimal content
      const module = await ModuleService.createModule({
        title: 'Empty Module',
        description: 'Minimal content module',
        content: {
          introduction: '',
          sections: []
        }
      });

      // Try to generate quiz - should handle gracefully
      const quiz = await quizGenerator.generateEnhancedQuiz(
        module.id,
        module.title,
        JSON.stringify(module.content),
        [],
        3
      );

      // Mock provider should still generate basic questions
      expect(quiz.questions).toHaveLength(3);
      expect(quiz.moduleId).toBe(module.id);
    });
  });

  describe('Module Service → Video Service Integration', () => {
    it('should integrate YouTube video suggestions with modules', async () => {
      // Mock YouTube API response
      const mockSearchResponse = {
        data: {
          items: [
            {
              id: { videoId: 'test-video-1' },
              snippet: {
                title: 'Jung and the Shadow',
                description: 'An introduction to Jung\'s concept of the shadow',
                channelTitle: 'Psychology Today',
                publishedAt: '2023-01-01T00:00:00Z',
                thumbnails: {
                  default: { url: 'https://example.com/thumb1.jpg', width: 120, height: 90 },
                  medium: { url: 'https://example.com/thumb1_med.jpg', width: 320, height: 180 },
                  high: { url: 'https://example.com/thumb1_high.jpg', width: 480, height: 360 }
                }
              }
            },
            {
              id: { videoId: 'test-video-2' },
              snippet: {
                title: 'Understanding Archetypes',
                description: 'Exploring Jungian archetypes',
                channelTitle: 'Educational Channel',
                publishedAt: '2023-01-02T00:00:00Z',
                thumbnails: {
                  default: { url: 'https://example.com/thumb2.jpg', width: 120, height: 90 },
                  medium: { url: 'https://example.com/thumb2_med.jpg', width: 320, height: 180 },
                  high: { url: 'https://example.com/thumb2_high.jpg', width: 480, height: 360 }
                }
              }
            }
          ]
        }
      };

      const axios = require('axios');
      axios.get.mockResolvedValueOnce(mockSearchResponse);

      // Create a module about Jung's concepts
      const module = await ModuleService.createModule({
        title: 'The Shadow in Jungian Psychology',
        description: 'Exploring the shadow archetype',
        content: {
          introduction: 'The shadow represents the hidden parts of our personality',
          sections: [
            {
              id: 'section-1',
              title: 'What is the Shadow?',
              content: 'Jung defined the shadow as...',
              order: 1,
              keyTerms: [
                {
                  term: 'shadow',
                  definition: 'Hidden aspects of the personality'
                },
                {
                  term: 'unconscious',
                  definition: 'Mental processes outside of awareness'
                },
                {
                  term: 'projection',
                  definition: 'Attributing inner qualities to external objects'
                }
              ]
            }
          ]
        }
      });

      // Search for relevant videos
      const videos = await youtubeService.searchVideos('Jung shadow psychology', {
        maxResults: 2,
        order: 'relevance',
        videoDuration: 'medium'
      });

      expect(videos).toHaveLength(2);
      expect(videos[0].title).toBe('Jung and the Shadow');
      expect(videos[1].title).toBe('Understanding Archetypes');

      // Update module with video suggestions
      const updatedModule = await ModuleService.updateModule(module.id, {
        videos: videos.map(video => ({
          id: video.videoId,
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          duration: { hours: 0, minutes: 10, seconds: 0 },
          description: video.description
        }))
      });

      expect(updatedModule.videos).toHaveLength(2);
      expect(updatedModule.videos[0].id).toBe('test-video-1');
    });
  });

  describe('Complete Learning Module Generation Workflow', () => {
    it('should orchestrate full module creation with all components', async () => {
      // Step 1: Create authenticated instructor
      const instructorData: RegistrationData = {
        email: 'instructor@jaqedu.com',
        username: 'jung_instructor',
        password: 'JungPass123!',
        firstName: 'Carl',
        lastName: 'Instructor',
        role: UserRole.INSTRUCTOR
      };

      const instructor = await authService.register(instructorData);
      const loginResponse = await authService.login({
        username: instructorData.username,
        password: instructorData.password,
        rememberMe: false
      });

      expect(loginResponse.accessToken).toBeDefined();

      // Step 2: Create base module
      const moduleData = {
        title: 'Introduction to Analytical Psychology',
        description: 'A comprehensive introduction to Jung\'s analytical psychology',
        content: {
          introduction: 'Analytical psychology explores the depths of the human psyche through Jung\'s revolutionary insights.',
          sections: [
            {
              id: 'section-1',
              title: 'The Structure of the Psyche',
              content: 'Jung divided the psyche into conscious, personal unconscious, and collective unconscious.',
              order: 1,
              keyTerms: [
                {
                  term: 'consciousness',
                  definition: 'The aware mind and its contents'
                },
                {
                  term: 'personal unconscious',
                  definition: 'Individual unconscious material'
                },
                {
                  term: 'collective unconscious',
                  definition: 'Shared human unconscious patterns'
                }
              ]
            },
            {
              id: 'section-2',
              title: 'Archetypes and Symbols',
              content: 'Universal patterns and symbols that emerge from the collective unconscious.',
              order: 2,
              keyTerms: [
                {
                  term: 'archetypes',
                  definition: 'Universal patterns and images in the collective unconscious'
                },
                {
                  term: 'symbols',
                  definition: 'Representations of archetypal content'
                },
                {
                  term: 'collective patterns',
                  definition: 'Shared behavioral and psychological tendencies'
                }
              ]
            }
          ]
        },
        videos: [],
        mindMaps: [],
        quiz: {
          id: 'quiz-1',
          title: 'Jung Foundations Quiz',
          description: 'Test your knowledge',
          questions: [],
          passingScore: 70
        },
        bibliography: [],
        filmReferences: [],
        tags: ['jung', 'psyche', 'archetypes'],
        difficultyLevel: DifficultyLevel.BEGINNER,
        timeEstimate: { hours: 2, minutes: 30 },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          author: {
            id: instructor.id,
            name: `${instructor.profile.firstName} ${instructor.profile.lastName}`,
            email: instructor.email,
            role: 'Instructor'
          },
          status: ModuleStatus.DRAFT,
          language: 'en'
        }
      };

      const module = await ModuleService.createModule(moduleData);

      // Step 3: Generate quiz
      const quiz = await quizGenerator.generateEnhancedQuiz(
        module.id,
        module.title,
        JSON.stringify(module.content),
        ['Understand the structure of the psyche', 'Recognize archetypal patterns'],
        8,
        {
          useTemplates: true,
          enhanceQuestions: true,
          adaptiveDifficulty: true,
          includeEssayQuestions: true,
          contextualizeQuestions: true,
          userLevel: 'beginner'
        }
      );

      // Step 4: Mock video search
      const mockVideoResponse = {
        data: {
          items: [
            {
              id: { videoId: 'jung-intro-video' },
              snippet: {
                title: 'Carl Jung: An Introduction',
                description: 'Introduction to Jung\'s life and work',
                channelTitle: 'Academy of Ideas',
                publishedAt: '2023-01-01T00:00:00Z',
                thumbnails: {
                  default: { url: 'https://example.com/jung.jpg', width: 120, height: 90 },
                  medium: { url: 'https://example.com/jung_med.jpg', width: 320, height: 180 },
                  high: { url: 'https://example.com/jung_high.jpg', width: 480, height: 360 }
                }
              }
            }
          ]
        }
      };

      const axios = require('axios');
      axios.get.mockResolvedValueOnce(mockVideoResponse);

      const videos = await youtubeService.searchVideos('Carl Jung analytical psychology introduction');

      // Step 5: Complete module with all components
      const finalModule = await ModuleService.updateModule(module.id, {
        quiz: quiz as any, // Type casting due to Question type mismatch between schemas
        videos: videos.map(video => ({
          id: video.videoId,
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          duration: { hours: 0, minutes: 15, seconds: 30 },
          description: video.description
        })),
        bibliography: [
          {
            id: 'ref-1',
            type: PublicationType.BOOK,
            title: 'Memories, Dreams, Reflections',
            authors: ['Carl Jung'],
            year: 1961,
            publisher: 'Pantheon Books',
            url: 'https://example.com/jung-memories',
            relevanceNote: 'Essential autobiographical work by Jung'
          }
        ],
        metadata: {
          ...module.metadata,
          status: ModuleStatus.REVIEW
        }
      });

      // Step 6: Validate complete module
      expect(finalModule.id).toBeDefined();
      expect(finalModule.title).toBe(moduleData.title);
      expect(finalModule.quiz.questions).toHaveLength(8);
      expect(finalModule.videos).toHaveLength(1);
      expect(finalModule.bibliography).toHaveLength(1);
      expect(finalModule.metadata.status).toBe(ModuleStatus.REVIEW);
      expect(finalModule.metadata.author.id).toBe(instructor.id);

      // Step 7: Publish module
      const publishedModule = await ModuleService.updateModule(finalModule.id, {
        metadata: {
          ...finalModule.metadata,
          status: ModuleStatus.PUBLISHED
        }
      });

      expect(publishedModule.metadata.status).toBe(ModuleStatus.PUBLISHED);

      // Step 8: Verify module statistics
      const stats = await ModuleService.getStatistics();
      expect(stats.total).toBe(1);
      expect(stats.byStatus[ModuleStatus.PUBLISHED]).toBe(1);
      expect(stats.byDifficulty[DifficultyLevel.BEGINNER]).toBe(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle service failures gracefully', async () => {
      // Create a module that will cause errors
      const module = await ModuleService.createModule({
        title: 'Test Error Handling',
        description: 'Module for testing error scenarios'
      });

      // Test quiz generation with invalid content
      try {
        await quizGenerator.generateEnhancedQuiz(
          module.id,
          'Invalid Topic',
          '', // Empty content
          [],
          0 // Zero questions
        );
      } catch (error) {
        // Should handle gracefully and return empty quiz
        expect(error).toBeDefined();
      }

      // Test YouTube API failure
      const axios = require('axios');
      axios.get.mockRejectedValueOnce(new Error('API Rate Limit Exceeded'));

      try {
        await youtubeService.searchVideos('test query');
      } catch (error) {
        expect((error as Error).message).toContain('API Rate Limit Exceeded');
      }
    });

    it('should handle concurrent module operations', async () => {
      const promises = [];

      // Create multiple modules concurrently
      for (let i = 0; i < 5; i++) {
        promises.push(
          ModuleService.createModule({
            title: `Concurrent Module ${i}`,
            description: `Module created concurrently #${i}`
          })
        );
      }

      const modules = await Promise.all(promises);
      
      expect(modules).toHaveLength(5);
      modules.forEach((module, index) => {
        expect(module.title).toBe(`Concurrent Module ${index}`);
        expect(module.id).toBeDefined();
      });

      // Verify all modules were stored
      const allModules = await ModuleService.getAllModules();
      expect(allModules).toHaveLength(5);
    });
  });

  afterAll(() => {
    // Clean up
    localStorage.clear();
  });
});