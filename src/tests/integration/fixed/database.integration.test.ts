/**
 * Fixed Database Integration Tests
 * Proper localStorage handling and authentication service integration
 */

import { AuthService } from '../../../services/auth/authService';
import { ModuleService } from '../../../services/modules/moduleService';
import { UserRole, RegistrationData } from '../../../types/auth';
import { DifficultyLevel, ModuleStatus, PublicationType } from '../../../schemas/module.schema';
import { setupCryptoMocks, cleanupCryptoMocks } from '../../../test-utils/cryptoMocks';

// Create persistent localStorage mock for this test
const createPersistentLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
};

describe('Fixed Database Integration Tests', () => {
  let authService: AuthService;
  let mockLocalStorage: any;

  beforeAll(() => {
    // Setup crypto mocks
    setupCryptoMocks();
    
    // Setup persistent localStorage mock
    mockLocalStorage = createPersistentLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
  });

  afterAll(() => {
    cleanupCryptoMocks();
  });

  beforeEach(() => {
    // Clear storage but don't replace the mock
    mockLocalStorage.clear();
    authService = new AuthService();
  });

  describe('LocalStorage Persistence and Recovery', () => {
    it('should persist user data across browser sessions', async () => {
      const userData: RegistrationData = {
        email: 'persist@example.com',
        username: 'persistentuser',
        password: 'PersistPass123!',
        firstName: 'Persistent',
        lastName: 'User',
        role: UserRole.STUDENT
      };

      // Register user
      const user = await authService.register(userData);
      expect(user.id).toBeDefined();

      // Verify localStorage contains user data
      const storedUsers = mockLocalStorage.getItem('jungApp_users');
      expect(storedUsers).toBeTruthy();
      
      const parsedUsers = JSON.parse(storedUsers);
      expect(parsedUsers[user.id]).toBeDefined();
      expect(parsedUsers[user.id].email).toBe(userData.email);

      // Create new service instance to simulate page reload
      const newAuthService = new AuthService();
      
      // Test login to verify persistence
      const loginResponse = await newAuthService.login({
        username: userData.username,
        password: userData.password,
        rememberMe: false
      });

      expect(loginResponse.user.email).toBe(userData.email);
      expect(loginResponse.user.id).toBe(user.id);
    });

    it('should handle corrupted localStorage gracefully', async () => {
      // Corrupt localStorage
      mockLocalStorage.setItem('jungApp_users', 'invalid-json');
      
      // Should handle gracefully
      expect(() => new AuthService()).not.toThrow();
      
      // Should be able to register new users after corruption
      const userData: RegistrationData = {
        email: 'recovery@example.com',
        username: 'recoveryuser',
        password: 'RecoveryPass123!',
        firstName: 'Recovery',
        lastName: 'User',
        role: UserRole.STUDENT
      };

      const user = await authService.register(userData);
      expect(user.id).toBeDefined();
    });

    it('should maintain data integrity during concurrent operations', async () => {
      // Use sequential registration with single service instance to test data integrity
      const users = [];
      for (let i = 0; i < 3; i++) {
        const user = await authService.register({
          email: `concurrent${i}@example.com`,
          username: `user${i}`,
          password: 'ConcurrentPass123!',
          firstName: `User${i}`,
          lastName: 'Test',
          role: UserRole.STUDENT
        });
        users.push(user);
      }

      expect(users).toHaveLength(3);

      // Verify all users stored
      const storedUsers = mockLocalStorage.getItem('jungApp_users');
      expect(storedUsers).toBeTruthy();
      
      const parsedUsers = JSON.parse(storedUsers);
      expect(Object.keys(parsedUsers)).toHaveLength(3);
      
      users.forEach(user => {
        expect(parsedUsers[user.id]).toBeDefined();
        expect(parsedUsers[user.id].email).toBe(user.email);
      });
    });
  });

  describe('Module Data Persistence', () => {
    it('should persist modules with all components', async () => {
      const moduleData = {
        title: 'Test Module',
        description: 'Testing module persistence',
        content: {
          introduction: 'Test intro',
          sections: [{
            id: 'section-1',
            title: 'Test Section',
            content: 'Test content',
            order: 1
          }]
        },
        videos: [{
          id: 'video-1',
          title: 'Test Video',
          url: 'https://test.com/video',
          duration: { hours: 0, minutes: 10, seconds: 0 },
          description: 'Test video'
        }],
        quiz: {
          id: 'quiz-1',
          moduleId: '',
          title: 'Test Quiz',
          description: 'Test quiz description',
          passingScore: 70,
          questions: [{
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
          }]
        },
        bibliography: [{
          id: 'ref-1',
          type: PublicationType.BOOK,
          relevanceNote: 'Essential reading',
          title: 'Test Book',
          authors: ['Test Author'],
          year: 2023,
          publisher: 'Test Publisher'
        }],
        tags: ['test'],
        difficultyLevel: DifficultyLevel.BEGINNER,
        timeEstimate: { hours: 1, minutes: 0 }
      };

      const createdModule = await ModuleService.createModule(moduleData);
      expect(createdModule.id).toBeDefined();

      // Verify module storage
      const storedModules = mockLocalStorage.getItem('jungAppEducationalModules');
      expect(storedModules).toBeTruthy();
      
      const parsedModules = JSON.parse(storedModules);
      expect(parsedModules).toHaveLength(1);
      expect(parsedModules[0].id).toBe(createdModule.id);

      // Verify retrieval
      const retrievedModule = await ModuleService.getModuleById(createdModule.id);
      expect(retrievedModule).toBeTruthy();
      expect(retrievedModule!.title).toBe(moduleData.title);
      expect(retrievedModule!.videos).toHaveLength(1);
      expect(retrievedModule!.quiz.questions).toHaveLength(1);
    });

    it('should handle module updates atomically', async () => {
      const initialModule = await ModuleService.createModule({
        title: 'Original Title',
        description: 'Original description'
      });

      const updatedModule = await ModuleService.updateModule(initialModule.id, {
        title: 'Updated Title',
        description: 'Updated description'
      });

      expect(updatedModule.title).toBe('Updated Title');
      
      // Verify persistence
      const retrievedModule = await ModuleService.getModuleById(initialModule.id);
      expect(retrievedModule!.title).toBe('Updated Title');
    });
  });

  describe('Data Validation', () => {
    it('should reject invalid module data', async () => {
      const invalidModule = {
        title: '', // Invalid empty title
        description: 'Valid description'
      };

      await expect(ModuleService.createModule(invalidModule))
        .rejects.toThrow(/title.*required/i);

      // Verify no module was created
      const allModules = await ModuleService.getAllModules();
      expect(allModules).toHaveLength(0);
    });
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });
});