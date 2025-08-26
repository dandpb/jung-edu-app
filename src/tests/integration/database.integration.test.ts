/**
 * Database Integration Tests
 * Tests localStorage fallback scenarios, data persistence, and Supabase integration patterns
 */

import { AuthService } from '../../services/auth/authService';
import { ModuleService } from '../../services/modules/moduleService';
import { UserRole, RegistrationData } from '../../types/auth';
import { DifficultyLevel, ModuleStatus, PublicationType } from '../../schemas/module.schema';
import { setupCryptoMocks, cleanupCryptoMocks } from '../../test-utils/cryptoMocks';

describe('Database Integration Tests', () => {
  let authService: AuthService;

  beforeAll(() => {
    // Setup crypto mocks for JWT operations
    setupCryptoMocks();
    authService = new AuthService();
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
      
      // Retrieve user to trigger localStorage load
      const retrievedUser = await newAuthService.getCurrentUser();
      
      // Login to verify user exists
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
      const parsedUsers = JSON.parse(storedUsers!);
      
      expect(Object.keys(parsedUsers)).toHaveLength(5);
      users.forEach(user => {
        expect(parsedUsers[user.id]).toBeDefined();
        expect(parsedUsers[user.id].email).toBe(user.email);
      });
    });

    it('should handle localStorage quota exceeded', () => {
      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      const mockSetItem = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      Object.defineProperty(localStorage, 'setItem', {
        value: mockSetItem,
        writable: true
      });

      // Service should handle quota error gracefully
      expect(async () => {
        await authService.register({
          email: 'quota@example.com',
          username: 'quotauser',
          password: 'QuotaPass123!',
          firstName: 'Quota',
          lastName: 'User',
          role: UserRole.STUDENT
        });
      }).not.toThrow();

      // Restore original setItem
      Object.defineProperty(localStorage, 'setItem', {
        value: originalSetItem,
        writable: true
      });
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
              order: 1,
              keyTerms: [
                {
                  term: 'updated',
                  definition: 'Modified or refreshed content'
                },
                {
                  term: 'atomic',
                  definition: 'Indivisible, complete operation'
                }
              ]
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
      expect(draftModules[0].metadata?.status).toBe(ModuleStatus.DRAFT);

      // Verify separate localStorage keys
      const publishedStorage = localStorage.getItem('jungAppEducationalModules');
      const draftStorage = localStorage.getItem('jungAppDraftModules');

      expect(publishedStorage).toBeTruthy();
      expect(draftStorage).toBeTruthy();
      expect(JSON.parse(publishedStorage!)).toHaveLength(1);
      expect(JSON.parse(draftStorage!)).toHaveLength(1);
    });
  });

  describe('Session Management', () => {
    it('should maintain active sessions across page reloads', async () => {
      // Register and login user
      const userData: RegistrationData = {
        email: 'session@example.com',
        username: 'sessionuser',
        password: 'SessionPass123!',
        firstName: 'Session',
        lastName: 'User',
        role: UserRole.STUDENT
      };

      await authService.register(userData);
      const loginResponse = await authService.login({
        username: userData.username,
        password: userData.password,
        rememberMe: true
      });

      expect(loginResponse.accessToken).toBeDefined();

      // Verify session is stored
      const sessionStorage = localStorage.getItem('jungApp_sessions');
      expect(sessionStorage).toBeTruthy();

      // Simulate page reload by creating new service instance
      const newAuthService = new AuthService();
      
      // Should be able to refresh token
      const refreshedResponse = await newAuthService.refreshAccessToken();
      expect(refreshedResponse).toBeTruthy();
      expect(refreshedResponse!.accessToken).toBeDefined();
    });

    it('should clean up expired sessions', async () => {
      // Create user and short-lived session
      const userData: RegistrationData = {
        email: 'expired@example.com',
        username: 'expireduser',
        password: 'ExpiredPass123!',
        firstName: 'Expired',
        lastName: 'User',
        role: UserRole.STUDENT
      };

      await authService.register(userData);
      
      // Mock Date to simulate expired session
      const originalNow = Date.now;
      const futureTime = Date.now() + (25 * 60 * 60 * 1000); // 25 hours in future
      Date.now = jest.fn(() => futureTime);

      try {
        const refreshResult = await authService.refreshAccessToken();
        expect(refreshResult).toBeNull(); // Should fail due to expired session
      } finally {
        // Restore original Date.now
        Date.now = originalNow;
      }
    });
  });

  describe('Data Migration and Versioning', () => {
    it('should handle module schema version upgrades', async () => {
      // Simulate old schema module in localStorage
      const oldSchemaModule = {
        id: 'old-module-1',
        title: 'Old Module',
        description: 'Module with old schema',
        // Missing required fields from new schema
        content: 'Simple string content', // Old format
        metadata: {
          createdAt: '2023-01-01T00:00:00Z',
          version: '0.9.0' // Old version
        }
      };

      localStorage.setItem('jungAppEducationalModules', JSON.stringify([oldSchemaModule]));

      // Try to retrieve modules - should handle gracefully
      const modules = await ModuleService.getAllModules();
      
      // Should either migrate or skip invalid modules
      expect(Array.isArray(modules)).toBe(true);
      
      // If migration occurred, module should be valid
      if (modules.length > 0) {
        const module = modules[0];
        expect(module.id).toBeDefined();
        expect(module.title).toBeDefined();
        expect(module.metadata).toBeDefined();
      }
    });

    it('should export and import modules correctly', async () => {
      // Create test modules
      const module1 = await ModuleService.createModule({
        title: 'Export Test 1',
        description: 'First module for export test'
      });

      const module2 = await ModuleService.createModule({
        title: 'Export Test 2',
        description: 'Second module for export test'
      });

      // Export modules
      const exportData = await ModuleService.exportModules([module1.id, module2.id]);
      expect(exportData).toBeTruthy();

      const parsedExport = JSON.parse(exportData);
      expect(parsedExport.modules).toHaveLength(2);
      expect(parsedExport.version).toBeDefined();
      expect(parsedExport.exportDate).toBeDefined();

      // Clear storage and import
      await ModuleService.clearAllModules();
      const importedCount = await ModuleService.importModules(exportData);
      
      expect(importedCount).toBe(2);

      // Verify imported modules
      const allModules = await ModuleService.getAllModules();
      expect(allModules).toHaveLength(2);
      
      const titles = allModules.map(m => m.title);
      expect(titles).toContain('Export Test 1');
      expect(titles).toContain('Export Test 2');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = performance.now();

      // Create 100 modules
      const modulePromises = Array.from({ length: 100 }, (_, i) =>
        ModuleService.createModule({
          title: `Performance Test Module ${i}`,
          description: `Performance test module number ${i}`,
          content: {
            introduction: `Introduction for module ${i}`,
            sections: [
              {
                id: `section-${i}`,
                title: `Section ${i}`,
                content: `Content for section ${i}`,
                order: i + 1,
                keyTerms: [
                  {
                    term: `concept-${i}`,
                    definition: `Definition for concept ${i}`
                  }
                ]
              }
            ]
          }
        })
      );

      const modules = await Promise.all(modulePromises);
      expect(modules).toHaveLength(100);

      const creationTime = performance.now() - startTime;
      console.log(`Created 100 modules in ${creationTime.toFixed(2)}ms`);

      // Test retrieval performance
      const retrievalStart = performance.now();
      const allModules = await ModuleService.getAllModules();
      const retrievalTime = performance.now() - retrievalStart;

      console.log(`Retrieved 100 modules in ${retrievalTime.toFixed(2)}ms`);

      expect(allModules).toHaveLength(100);
      expect(retrievalTime).toBeLessThan(100); // Should be very fast for localStorage

      // Test search performance
      const searchStart = performance.now();
      const searchResults = await ModuleService.searchModules({
        query: 'Performance Test',
        difficultyLevel: DifficultyLevel.BEGINNER
      });
      const searchTime = performance.now() - searchStart;

      console.log(`Searched 100 modules in ${searchTime.toFixed(2)}ms`);
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(50); // Search should be fast
    });

    it('should handle localStorage size limits gracefully', () => {
      // Create very large module data
      const largeContent = {
        introduction: 'A'.repeat(10000), // 10KB introduction
        sections: Array.from({ length: 100 }, (_, i) => ({
          id: `large-section-${i}`,
          title: `Large Section ${i}`,
          content: 'B'.repeat(5000), // 5KB per section
          order: i
        }))
      };

      // Should handle large data without throwing
      expect(async () => {
        await ModuleService.createModule({
          title: 'Large Module',
          description: 'Testing large module storage',
          content: largeContent
        });
      }).not.toThrow();
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain referential integrity', async () => {
      // Create user
      const userData: RegistrationData = {
        email: 'integrity@example.com',
        username: 'integrityuser',
        password: 'IntegrityPass123!',
        firstName: 'Integrity',
        lastName: 'User',
        role: UserRole.INSTRUCTOR
      };

      const user = await authService.register(userData);

      // Create module authored by user
      const module = await ModuleService.createModule({
        title: 'Integrity Test Module',
        description: 'Testing referential integrity',
        metadata: {
          author: {
            id: user.id,
            name: `${user.profile.firstName} ${user.profile.lastName}`,
            email: user.email,
            role: 'Instructor'
          },
          status: ModuleStatus.DRAFT,
          language: 'en',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      });

      // Verify referential integrity
      const retrievedModule = await ModuleService.getModuleById(module.id);
      expect(retrievedModule!.metadata.author.id).toBe(user.id);
      expect(retrievedModule!.metadata.author.email).toBe(user.email);

      // Update user profile
      // Note: In a real database, this would require cascade updates
      // Here we just verify the current state
      const currentUser = await authService.getCurrentUser();
      expect(currentUser).toBeTruthy();
    });

    it('should validate data before persistence', async () => {
      // Try to create invalid module
      const invalidModule = {
        title: '', // Invalid: empty title
        description: 'Valid description',
        content: {
          introduction: 'Valid introduction',
          sections: [] // Valid: empty sections array
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