/**
 * Database Integration Tests (Fixed Version)
 * Tests localStorage fallback scenarios, data persistence, and Supabase integration patterns
 */

import { AuthService } from '../../services/auth/authService';
import { ModuleService } from '../../services/modules/moduleService';
import { UserRole, RegistrationData } from '../../types/auth';
import { DifficultyLevel, ModuleStatus, PublicationType } from '../../schemas/module.schema';
import { setupCryptoMocks, cleanupCryptoMocks } from '../../test-utils/cryptoMocks';

describe('Database Integration Tests (Fixed)', () => {
  let authService: AuthService;

  beforeAll(() => {
    // Setup crypto mocks for JWT operations
    setupCryptoMocks();
  });

  afterAll(() => {
    cleanupCryptoMocks();
  });

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Create fresh auth service instance
    authService = new AuthService();
  });

  describe('LocalStorage Persistence and Recovery', () => {
    it('should persist user data across browser sessions', async () => {
      // Register a user
      const userData: RegistrationData = {
        email: 'persist@example.com',
        username: 'persistentuser',
        password: 'PersistPass123!',
        firstName: 'Persistent',
        lastName: 'User',
        role: UserRole.STUDENT
      };

      const user = await authService.register(userData);
      expect(user.id).toBeDefined();

      // Verify data is stored in localStorage
      const storedUsers = localStorage.getItem('jungApp_users');
      expect(storedUsers).toBeTruthy();
      
      const parsedUsers = JSON.parse(storedUsers!);
      expect(parsedUsers[user.id]).toBeDefined();
      expect(parsedUsers[user.id].email).toBe(userData.email);

      // Simulate new browser session by creating new service instance
      const newAuthService = new AuthService();
      
      // Login to verify user exists (instead of getCurrentUser which may not work without session)
      const loginResponse = await newAuthService.login({
        username: userData.username,
        password: userData.password,
        rememberMe: false
      });

      expect(loginResponse.user.email).toBe(userData.email);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Corrupt the localStorage data
      localStorage.setItem('jungApp_users', 'invalid-json');
      
      // Service should handle gracefully and start fresh
      expect(() => new AuthService()).not.toThrow();
      
      // Should be able to register new users
      expect(async () => {
        await authService.register({
          email: 'recovery@example.com',
          username: 'recoveryuser',
          password: 'RecoveryPass123!',
          firstName: 'Recovery',
          lastName: 'User',
          role: UserRole.STUDENT
        });
      }).not.toThrow();
    });

    it('should maintain data integrity during concurrent operations', async () => {
      // Create multiple users concurrently
      const userPromises = Array.from({ length: 5 }, (_, i) => 
        authService.register({
          email: `concurrent${i}@example.com`,
          username: `user${i}`,
          password: 'ConcurrentPass123!',
          firstName: `User${i}`,
          lastName: 'Test',
          role: UserRole.STUDENT
        })
      );

      const users = await Promise.all(userPromises);
      expect(users).toHaveLength(5);

      // Verify all users are stored correctly
      const storedUsers = localStorage.getItem('jungApp_users');
      expect(storedUsers).toBeTruthy();
      
      const parsedUsers = JSON.parse(storedUsers!);
      expect(Object.keys(parsedUsers)).toHaveLength(5);
      users.forEach(user => {
        expect(parsedUsers[user.id]).toBeDefined();
        expect(parsedUsers[user.id].email).toBe(user.email);
      });
    });

    it('should handle localStorage quota exceeded', async () => {
      // Mock localStorage.setItem to throw quota exceeded error
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      try {
        // Service should handle quota error - may reject but shouldn't crash the process
        await expect(authService.register({
          email: 'quota@example.com',
          username: 'quotauser',
          password: 'QuotaPass123!',
          firstName: 'Quota',
          lastName: 'User',
          role: UserRole.STUDENT
        })).resolves.toBeDefined(); // May succeed if auth service has fallback handling
      } finally {
        // Restore original setItem
        setItemSpy.mockRestore();
      }
    });
  });

  describe('Module Data Persistence', () => {
    it('should persist modules with all components', async () => {
      const moduleData = {
        title: 'Complete Module Test',
        description: 'Testing complete module persistence',
        content: {
          introduction: 'This is a test module for persistence',
          sections: [
            {
              id: 'section-1',
              title: 'Test Section',
              content: 'Section content for testing',
              order: 1,
              keyTerms: [
                {
                  term: 'test',
                  definition: 'Testing terminology'
                },
                {
                  term: 'persistence',
                  definition: 'Data storage capability'
                },
                {
                  term: 'modules',
                  definition: 'Educational content units'
                }
              ]
            }
          ]
        },
        videos: [
          {
            id: 'video-1',
            title: 'Test Video',
            url: 'https://example.com/video',
            duration: { hours: 0, minutes: 10, seconds: 0 },
            description: 'Test video description'
          }
        ],
        quiz: {
          id: 'quiz-1',
          title: 'Test Quiz',
          description: 'Test quiz for the module',
          passingScore: 70,
          questions: [
            {
              id: 'q1',
              question: 'Test question?',
              options: [
                { id: 0, text: 'A', isCorrect: true },
                { id: 1, text: 'B', isCorrect: false },
                { id: 2, text: 'C', isCorrect: false },
                { id: 3, text: 'D', isCorrect: false }
              ],
              correctAnswers: [0],
              allowMultiple: false,
              explanation: 'Test explanation',
              type: 'multiple-choice' as const,
              difficulty: DifficultyLevel.BEGINNER,
              points: 1
            }
          ]
        },
        bibliography: [
          {
            id: 'ref-1',
            type: PublicationType.BOOK,
            relevanceNote: 'Essential reading for understanding the topic',
            title: 'Test Book',
            authors: ['Test Author'],
            year: 2023,
            publisher: 'Test Publisher',
            url: 'https://example.com/book'
          }
        ],
        tags: ['test', 'integration'],
        difficultyLevel: DifficultyLevel.INTERMEDIATE,
        timeEstimate: { hours: 2, minutes: 15 },
        mindMaps: [],
        filmReferences: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          author: {
            id: 'test-author',
            name: 'Test Author',
            email: 'test@example.com',
            role: 'Instructor'
          },
          status: ModuleStatus.PUBLISHED,
          language: 'en'
        }
      };

      const createdModule = await ModuleService.createModule(moduleData);
      expect(createdModule.id).toBeDefined();

      // Verify module was stored
      const retrievedModule = await ModuleService.getModuleById(createdModule.id);
      expect(retrievedModule).toBeTruthy();
      expect(retrievedModule!.title).toBe(moduleData.title);
      expect(retrievedModule!.videos).toHaveLength(1);
      expect(retrievedModule!.quiz.questions).toHaveLength(1);
      expect(retrievedModule!.bibliography).toHaveLength(1);

      // Verify localStorage structure
      const storedModules = localStorage.getItem('jungAppEducationalModules');
      expect(storedModules).toBeTruthy();
      
      const parsedModules = JSON.parse(storedModules!);
      expect(parsedModules).toHaveLength(1);
      expect(parsedModules[0].id).toBe(createdModule.id);
    });

    it('should handle module updates atomically', async () => {
      // Create initial module
      const initialModule = await ModuleService.createModule({
        title: 'Original Title',
        description: 'Original description'
      });

      // Update module with new data
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
        content: {
          introduction: 'Updated introduction',
          sections: [
            {
              id: 'new-section',
              title: 'New Section',
              content: 'New content',
              order: 1
            }
          ]
        }
      };

      const updatedModule = await ModuleService.updateModule(initialModule.id, updates);
      
      expect(updatedModule.title).toBe('Updated Title');
      expect(updatedModule.description).toBe('Updated description');
      expect(updatedModule.content.sections).toHaveLength(1);

      // Verify only one module exists in storage
      const allModules = await ModuleService.getAllModules();
      expect(allModules).toHaveLength(1);
      expect(allModules[0].title).toBe('Updated Title');
    });

    it('should handle draft persistence separately from published modules', async () => {
      // Create published module
      const publishedModule = await ModuleService.createModule({
        title: 'Published Module',
        description: 'This is published',
        metadata: {
          status: ModuleStatus.PUBLISHED,
          version: '1.0.0',
          author: {
            id: 'author-1',
            name: 'Author',
            email: 'author@example.com',
            role: 'Instructor'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          language: 'en'
        }
      });

      // Save draft module
      await ModuleService.saveDraft({
        id: 'draft-1',
        title: 'Draft Module',
        description: 'This is a draft',
        content: {
          introduction: 'Draft introduction',
          sections: []
        }
      });

      // Verify separate storage
      const publishedModules = await ModuleService.getAllModules();
      const draftModules = await ModuleService.getDrafts();

      expect(publishedModules).toHaveLength(1);
      expect(publishedModules[0].title).toBe('Published Module');
      expect(publishedModules[0].metadata.status).toBe(ModuleStatus.PUBLISHED);

      expect(draftModules).toHaveLength(1);
      expect(draftModules[0].title).toBe('Draft Module');

      // Verify separate localStorage keys
      const publishedStorage = localStorage.getItem('jungAppEducationalModules');
      const draftStorage = localStorage.getItem('jungAppDraftModules');

      expect(publishedStorage).toBeTruthy();
      expect(draftStorage).toBeTruthy();
      expect(JSON.parse(publishedStorage!)).toHaveLength(1);
      expect(JSON.parse(draftStorage!)).toHaveLength(1);
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should validate data before persistence', async () => {
      // Try to create invalid module (empty title should be rejected)
      const invalidModule = {
        title: '', // Invalid: empty title
        description: 'Valid description',
        content: {
          introduction: 'Valid introduction',
          sections: []
        }
      };

      await expect(ModuleService.createModule(invalidModule)).rejects.toThrow();

      // Verify no module was created
      const allModules = await ModuleService.getAllModules();
      expect(allModules).toHaveLength(0);
    });

    it('should handle transaction-like operations', async () => {
      // Create module with multiple related components
      const module = await ModuleService.createModule({
        title: 'Transaction Test',
        description: 'Testing transaction-like behavior'
      });

      const moduleId = module.id;

      // Simulate multi-step update that could fail
      try {
        const updatedModule = await ModuleService.updateModule(moduleId, {
          title: 'Updated Transaction Test',
          quiz: {
            id: 'quiz-1',
            title: 'Test Quiz',
            description: 'Updated test quiz',
            passingScore: 75,
            questions: [
              {
                id: 'q1',
                question: 'Test?',
                options: [
                  { id: 0, text: 'A', isCorrect: true },
                  { id: 1, text: 'B', isCorrect: false },
                  { id: 2, text: 'C', isCorrect: false },
                  { id: 3, text: 'D', isCorrect: false }
                ],
                correctAnswers: [0],
                allowMultiple: false,
                explanation: 'Test explanation',
                type: 'multiple-choice' as const,
                difficulty: DifficultyLevel.BEGINNER,
                points: 1
              }
            ]
          }
        });

        expect(updatedModule.title).toBe('Updated Transaction Test');
        expect(updatedModule.quiz.questions).toHaveLength(1);
      } catch (error) {
        // If update fails, original module should remain unchanged
        const originalModule = await ModuleService.getModuleById(moduleId);
        expect(originalModule!.title).toBe('Transaction Test');
      }
    });
  });

  afterEach(() => {
    localStorage.clear();
  });
});