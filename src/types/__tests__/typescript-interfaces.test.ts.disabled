/**
 * Comprehensive TypeScript Interface and Type Testing Suite
 * 
 * Tests type definitions, interfaces, enums, type guards, and TypeScript-specific functionality.
 * Validates type safety, runtime behavior, and complex type transformations.
 */

import {
  UserRole,
  ResourceType,
  Action,
  AuthErrorType,
  AuthError,
  User,
  Permission,
  PermissionCondition,
  LoginData,
  LoginResponse,
  ROLE_HIERARCHY,
  DEFAULT_PERMISSIONS,
  Module,
  Quiz,
  Question,
  QuestionType,
  UserProgress,
  AdaptiveQuizSettings,
  InteractiveElementType,
  DifficultyLevel,
  PublicationType,
  AchievementCategory,
  VisualizationType
} from '../index';

import {
  Database,
  Tables,
  Inserts,
  Updates,
  Enums
} from '../database';

import {
  EducationalModule,
  ValidationError
} from '../schema';

describe('TypeScript Interface and Type Testing', () => {
  describe('Authentication Types and Enums', () => {
    describe('UserRole Enum', () => {
      it('should have all expected role values', () => {
        const expectedRoles = ['super_admin', 'admin', 'instructor', 'student', 'guest'];
        const actualRoles = Object.values(UserRole);
        
        expect(actualRoles).toEqual(expect.arrayContaining(expectedRoles));
        expect(actualRoles).toHaveLength(expectedRoles.length);
      });

      it('should support type-safe role comparisons', () => {
        const adminRole: UserRole = UserRole.ADMIN;
        const studentRole: UserRole = UserRole.STUDENT;
        
        expect(adminRole).toBe('admin');
        expect(studentRole).toBe('student');
        expect(adminRole).not.toBe(studentRole);
      });

      it('should validate role hierarchy structure', () => {
        expect(ROLE_HIERARCHY[UserRole.SUPER_ADMIN]).toContain(UserRole.ADMIN);
        expect(ROLE_HIERARCHY[UserRole.ADMIN]).toContain(UserRole.INSTRUCTOR);
        expect(ROLE_HIERARCHY[UserRole.INSTRUCTOR]).toContain(UserRole.STUDENT);
        expect(ROLE_HIERARCHY[UserRole.STUDENT]).toContain(UserRole.GUEST);
        expect(ROLE_HIERARCHY[UserRole.GUEST]).toHaveLength(0);
      });
    });

    describe('ResourceType and Action Enums', () => {
      it('should define all resource types', () => {
        const resourceTypes = Object.values(ResourceType);
        
        expect(resourceTypes).toContain('module');
        expect(resourceTypes).toContain('quiz');
        expect(resourceTypes).toContain('notes');
        expect(resourceTypes).toContain('analytics');
        expect(resourceTypes).toContain('user');
        expect(resourceTypes).toContain('system');
      });

      it('should define all action types', () => {
        const actions = Object.values(Action);
        
        expect(actions).toContain('create');
        expect(actions).toContain('read');
        expect(actions).toContain('update');
        expect(actions).toContain('delete');
        expect(actions).toContain('publish');
        expect(actions).toContain('share');
      });
    });

    describe('AuthError Class', () => {
      it('should create proper error instances', () => {
        const authError = new AuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'Invalid username or password',
          { attempts: 3 }
        );

        expect(authError).toBeInstanceOf(Error);
        expect(authError).toBeInstanceOf(AuthError);
        expect(authError.name).toBe('AuthError');
        expect(authError.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
        expect(authError.message).toBe('Invalid username or password');
        expect(authError.details).toEqual({ attempts: 3 });
      });

      it('should handle all error types', () => {
        const errorTypes = Object.values(AuthErrorType);
        
        errorTypes.forEach(errorType => {
          const error = new AuthError(errorType, `Test error for ${errorType}`);
          expect(error.type).toBe(errorType);
        });
      });
    });
  });

  describe('Type Guards and Validators', () => {
    // Type guard functions
    function isUser(obj: any): obj is User {
      return (
        obj &&
        typeof obj.id === 'string' &&
        typeof obj.email === 'string' &&
        typeof obj.username === 'string' &&
        Object.values(UserRole).includes(obj.role) &&
        typeof obj.isActive === 'boolean'
      );
    }

    function isModule(obj: any): obj is Module {
      return (
        obj &&
        typeof obj.id === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.description === 'string' &&
        typeof obj.estimatedTime === 'number' &&
        ['beginner', 'intermediate', 'advanced'].includes(obj.difficulty)
      );
    }

    function isQuestionType(value: any): value is QuestionType {
      const validTypes: QuestionType[] = [
        'multiple-choice', 'multiple-select', 'true-false', 'fill-in-blank',
        'short-answer', 'essay', 'matching', 'ranking', 'drag-drop', 'interactive'
      ];
      return typeof value === 'string' && validTypes.includes(value as QuestionType);
    }

    describe('User Type Guard', () => {
      it('should validate correct User objects', () => {
        const validUser: User = {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
          passwordHash: 'hashed-password',
          salt: 'salt-123',
          role: UserRole.STUDENT,
          permissions: [],
          profile: {
            firstName: 'Test',
            lastName: 'User',
            preferences: {
              theme: 'light',
              language: 'en',
              emailNotifications: true,
              pushNotifications: false
            }
          },
          security: {
            twoFactorEnabled: false,
            passwordHistory: [],
            lastPasswordChange: new Date(),
            loginNotifications: true,
            trustedDevices: [],
            sessions: []
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isVerified: true
        };

        expect(isUser(validUser)).toBe(true);
      });

      it('should reject invalid User objects', () => {
        const invalidUsers = [
          null,
          undefined,
          {},
          { id: 123 }, // wrong type
          { id: 'test', email: null }, // missing required fields
          { id: 'test', email: 'test@example.com', role: 'invalid-role' } // invalid role
        ];

        invalidUsers.forEach(invalidUser => {
          expect(isUser(invalidUser)).toBe(false);
        });
      });
    });

    describe('Module Type Guard', () => {
      it('should validate correct Module objects', () => {
        const validModule: Module = {
          id: 'module-123',
          title: 'Test Module',
          description: 'A test module',
          estimatedTime: 60,
          difficulty: 'intermediate'
        };

        expect(isModule(validModule)).toBe(true);
      });

      it('should reject invalid Module objects', () => {
        const invalidModules = [
          null,
          { id: 'test' }, // missing required fields
          { id: 'test', title: 'Test', description: 'Test', estimatedTime: 'invalid' }, // wrong type
          { id: 'test', title: 'Test', description: 'Test', estimatedTime: 60, difficulty: 'invalid' } // invalid difficulty
        ];

        invalidModules.forEach(invalidModule => {
          expect(isModule(invalidModule)).toBe(false);
        });
      });
    });

    describe('QuestionType Validator', () => {
      it('should validate all question types', () => {
        const validTypes: QuestionType[] = [
          'multiple-choice', 'multiple-select', 'true-false', 'fill-in-blank',
          'short-answer', 'essay', 'matching', 'ranking', 'drag-drop', 'interactive'
        ];

        validTypes.forEach(type => {
          expect(isQuestionType(type)).toBe(true);
        });
      });

      it('should reject invalid question types', () => {
        const invalidTypes = [
          'invalid-type',
          'multiple_choice', // wrong format
          null,
          undefined,
          123,
          {}
        ];

        invalidTypes.forEach(type => {
          expect(isQuestionType(type)).toBe(false);
        });
      });
    });
  });

  describe('Generic Type Behavior', () => {
    // Generic utility functions for testing
    function createTypedArray<T>(items: T[]): T[] {
      return [...items];
    }

    function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
      return items.find(item => item.id === id);
    }

    function mapWithType<T, U>(items: T[], mapper: (item: T) => U): U[] {
      return items.map(mapper);
    }

    it('should work with Module generics', () => {
      const modules: Module[] = [
        {
          id: 'module-1',
          title: 'Module 1',
          description: 'First module',
          estimatedTime: 30,
          difficulty: 'beginner'
        },
        {
          id: 'module-2',
          title: 'Module 2',
          description: 'Second module',
          estimatedTime: 45,
          difficulty: 'intermediate'
        }
      ];

      const typedArray = createTypedArray(modules);
      expect(typedArray).toHaveLength(2);
      expect(typedArray[0].difficulty).toBe('beginner');

      const foundModule = findById(modules, 'module-2');
      expect(foundModule).toBeDefined();
      expect(foundModule?.title).toBe('Module 2');

      const titles = mapWithType(modules, m => m.title);
      expect(titles).toEqual(['Module 1', 'Module 2']);
    });

    it('should work with User generics', () => {
      const permissions: Permission[] = [
        {
          id: 'perm-1',
          resource: ResourceType.MODULE,
          actions: [Action.READ, Action.CREATE]
        },
        {
          id: 'perm-2',
          resource: ResourceType.QUIZ,
          actions: [Action.READ]
        }
      ];

      const typedPermissions = createTypedArray(permissions);
      expect(typedPermissions).toHaveLength(2);

      const modulePermission = findById(permissions, 'perm-1');
      expect(modulePermission?.resource).toBe(ResourceType.MODULE);
      expect(modulePermission?.actions).toContain(Action.CREATE);

      const resourceTypes = mapWithType(permissions, p => p.resource);
      expect(resourceTypes).toEqual([ResourceType.MODULE, ResourceType.QUIZ]);
    });

    it('should handle complex generic transformations', () => {
      interface WithMetadata<T> {
        data: T;
        metadata: {
          createdAt: Date;
          version: number;
        };
      }

      function addMetadata<T>(data: T): WithMetadata<T> {
        return {
          data,
          metadata: {
            createdAt: new Date(),
            version: 1
          }
        };
      }

      const module: Module = {
        id: 'test-module',
        title: 'Test',
        description: 'Test',
        estimatedTime: 60,
        difficulty: 'beginner'
      };

      const moduleWithMetadata = addMetadata(module);
      expect(moduleWithMetadata.data.id).toBe('test-module');
      expect(moduleWithMetadata.metadata.version).toBe(1);
      expect(moduleWithMetadata.metadata.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Interface Implementation Validation', () => {
    it('should validate AdaptiveQuizSettings implementation', () => {
      const adaptiveSettings: AdaptiveQuizSettings = {
        enabled: true,
        difficultyRange: [1, 5],
        minQuestions: 5,
        maxQuestions: 20,
        targetAccuracy: 0.8
      };

      expect(adaptiveSettings.enabled).toBe(true);
      expect(adaptiveSettings.difficultyRange).toEqual([1, 5]);
      expect(adaptiveSettings.targetAccuracy).toBe(0.8);
      expect(typeof adaptiveSettings.minQuestions).toBe('number');
    });

    it('should validate Permission interface with conditions', () => {
      const permissionWithConditions: Permission = {
        id: 'conditional-perm',
        resource: ResourceType.MODULE,
        actions: [Action.READ, Action.UPDATE],
        conditions: [
          {
            type: 'ownership',
            value: true
          },
          {
            type: 'time',
            value: { after: '09:00', before: '17:00' }
          },
          {
            type: 'custom',
            value: { department: 'psychology' }
          }
        ]
      };

      expect(permissionWithConditions.conditions).toHaveLength(3);
      expect(permissionWithConditions.conditions![0].type).toBe('ownership');
      expect(permissionWithConditions.conditions![1].type).toBe('time');
      expect(permissionWithConditions.conditions![2].value).toEqual({ department: 'psychology' });
    });

    it('should validate complex UserProgress interface', () => {
      const userProgress: UserProgress = {
        userId: 'user-123',
        completedModules: ['module-1', 'module-2'],
        quizScores: {
          'quiz-1': 85,
          'quiz-2': 92
        },
        totalTime: 7200, // 2 hours in seconds
        lastAccessed: Date.now(),
        notes: [],
        learningPath: {
          id: 'path-1',
          name: 'Jungian Psychology Path',
          description: 'Complete learning path for Jungian psychology',
          modules: ['module-1', 'module-2', 'module-3'],
          currentModule: 'module-3',
          progress: 0.67,
          estimatedCompletion: new Date('2024-12-31'),
          personalized: true
        },
        achievements: [
          {
            id: 'achieve-1',
            title: 'First Steps',
            description: 'Completed your first module',
            icon: '🎯',
            category: 'progress' as AchievementCategory,
            points: 100,
            unlockedAt: new Date(),
            rarity: 'common',
            requirements: [
              {
                type: 'complete_modules',
                value: 1,
                operator: '>='
              }
            ]
          }
        ]
      };

      expect(userProgress.completedModules).toHaveLength(2);
      expect(userProgress.quizScores['quiz-1']).toBe(85);
      expect(userProgress.learningPath?.progress).toBe(0.67);
      expect(userProgress.achievements).toHaveLength(1);
      expect(userProgress.achievements![0].category).toBe('progress');
    });
  });

  describe('Database Schema Types', () => {
    it('should validate Tables type helper', () => {
      type UserTable = Tables<'users'>;
      type ModuleTable = Tables<'modules'>;
      
      // These should compile without errors
      const user: UserTable = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'student',
        is_active: true,
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_login: null,
        email_verified_at: null,
        avatar_url: null
      };

      const module: ModuleTable = {
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        content: { sections: [] },
        difficulty: 'beginner',
        duration_minutes: 60,
        tags: ['psychology'],
        language: 'en',
        is_published: true,
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        version: 1,
        prerequisites: null,
        learning_objectives: null
      };

      expect(user.role).toBe('student');
      expect(module.difficulty).toBe('beginner');
    });

    it('should validate Insert and Update types', () => {
      type UserInsert = Inserts<'users'>;
      type UserUpdate = Updates<'users'>;
      
      const userInsert: UserInsert = {
        email: 'new@example.com',
        username: 'newuser',
        role: 'student',
        created_by: 'admin-1'
      };

      const userUpdate: UserUpdate = {
        last_login: '2024-01-01T12:00:00Z',
        is_active: false
      };

      expect(userInsert.email).toBe('new@example.com');
      expect(userUpdate.is_active).toBe(false);
    });

    it('should validate Enum types', () => {
      type UserRoleEnum = Enums<'user_role'>;
      type ModuleDifficultyEnum = Enums<'module_difficulty'>;
      
      const role: UserRoleEnum = 'instructor';
      const difficulty: ModuleDifficultyEnum = 'advanced';

      expect(['super_admin', 'admin', 'instructor', 'student', 'guest']).toContain(role);
      expect(['beginner', 'intermediate', 'advanced']).toContain(difficulty);
    });
  });

  describe('Complex Type Transformations', () => {
    it('should handle Partial and Pick utility types', () => {
      type PartialModule = Partial<Module>;
      type ModuleSummary = Pick<Module, 'id' | 'title' | 'difficulty'>;
      type ModuleWithoutId = Omit<Module, 'id'>;

      const partialModule: PartialModule = {
        title: 'Partial Module'
      };

      const moduleSummary: ModuleSummary = {
        id: 'module-1',
        title: 'Summary Module',
        difficulty: 'intermediate'
      };

      const moduleWithoutId: ModuleWithoutId = {
        title: 'No ID Module',
        description: 'Module without ID',
        estimatedTime: 30,
        difficulty: 'beginner'
      };

      expect(partialModule.title).toBe('Partial Module');
      expect(moduleSummary.difficulty).toBe('intermediate');
      expect(moduleWithoutId.estimatedTime).toBe(30);
      expect('id' in moduleWithoutId).toBe(false);
    });

    it('should handle Record and mapped types', () => {
      type DifficultyMap = Record<DifficultyLevel, number>;
      type QuestionTypeMap = Record<QuestionType, string>;

      const difficultyScores: DifficultyMap = {
        beginner: 1,
        intermediate: 2,
        advanced: 3
      };

      const questionDescriptions: Partial<QuestionTypeMap> = {
        'multiple-choice': 'Choose one correct answer',
        'essay': 'Write a detailed response',
        'true-false': 'Select true or false'
      };

      expect(difficultyScores.intermediate).toBe(2);
      expect(questionDescriptions['multiple-choice']).toBe('Choose one correct answer');
    });

    it('should handle conditional types', () => {
      type NonNullable<T> = T extends null | undefined ? never : T;
      type StringKeys<T> = {
        [K in keyof T]: T[K] extends string ? K : never;
      }[keyof T];

      type ModuleStringKeys = StringKeys<Module>;
      
      // These should be string keys only
      const stringKey: ModuleStringKeys = 'title';
      expect(['id', 'title', 'description', 'category'].includes(stringKey as string)).toBe(true);
    });
  });

  describe('Error Handling and Type Safety', () => {
    it('should handle AuthError type safety', () => {
      function processAuthError(error: unknown): string {
        if (error instanceof AuthError) {
          return `Auth Error: ${error.type} - ${error.message}`;
        }
        if (error instanceof Error) {
          return `General Error: ${error.message}`;
        }
        return 'Unknown error occurred';
      }

      const authError = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid credentials provided'
      );
      const generalError = new Error('Something went wrong');
      const unknownError = 'string error';

      expect(processAuthError(authError)).toContain('Auth Error: INVALID_CREDENTIALS');
      expect(processAuthError(generalError)).toContain('General Error: Something');
      expect(processAuthError(unknownError)).toBe('Unknown error occurred');
    });

    it('should validate union type discrimination', () => {
      type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
      
      interface ProcessingResult {
        status: ProcessingStatus;
        data?: any;
        error?: string;
      }

      function handleResult(result: ProcessingResult): string {
        switch (result.status) {
          case 'pending':
            return 'Waiting to start';
          case 'processing':
            return 'Currently processing';
          case 'completed':
            return `Completed with data: ${JSON.stringify(result.data)}`;
          case 'failed':
            return `Failed with error: ${result.error}`;
          default:
            // TypeScript ensures exhaustiveness
            const _exhaustive: never = result.status;
            return 'Unknown status';
        }
      }

      expect(handleResult({ status: 'pending' })).toBe('Waiting to start');
      expect(handleResult({ status: 'completed', data: { success: true } }))
        .toContain('success');
      expect(handleResult({ status: 'failed', error: 'Network timeout' }))
        .toContain('Network timeout');
    });
  });

  describe('Performance and Memory Considerations', () => {
    it('should handle large type collections efficiently', () => {
      const startTime = performance.now();
      
      // Create large collections of typed objects
      const modules: Module[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `module-${i}`,
        title: `Module ${i}`,
        description: `Description for module ${i}`,
        estimatedTime: Math.floor(Math.random() * 120) + 30,
        difficulty: (['beginner', 'intermediate', 'advanced'] as const)[i % 3]
      }));

      const users: Partial<User>[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        username: `user${i}`,
        role: UserRole.STUDENT,
        isActive: true,
        isVerified: i % 2 === 0
      }));

      // Type-safe operations
      const advancedModules = modules.filter(m => m.difficulty === 'advanced');
      const activeUsers = users.filter(u => u.isActive);
      const userMap = new Map(users.map(u => [u.id!, u]));

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(modules).toHaveLength(1000);
      expect(advancedModules.length).toBeGreaterThan(0);
      expect(activeUsers).toHaveLength(1000);
      expect(userMap.size).toBe(1000);
      expect(processingTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle deep nested type validation', () => {
      interface DeepNestedType {
        level1: {
          level2: {
            level3: {
              level4: {
                value: string;
                metadata: {
                  created: Date;
                  version: number;
                  tags: string[];
                };
              };
            };
          };
        };
      }

      const deepObject: DeepNestedType = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep value',
                metadata: {
                  created: new Date(),
                  version: 1,
                  tags: ['test', 'deep', 'nested']
                }
              }
            }
          }
        }
      };

      expect(deepObject.level1.level2.level3.level4.value).toBe('deep value');
      expect(deepObject.level1.level2.level3.level4.metadata.tags).toContain('nested');
    });
  });
});
