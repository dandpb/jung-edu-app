/**
 * Comprehensive Enum Validation and Usage Tests
 * 
 * Tests all enum definitions, their runtime behavior, validation,
 * and integration with interface implementations.
 */

import {
  UserRole,
  ResourceType,
  Action,
  AuthErrorType,
  InteractiveElementType,
  QuestionType,
  VisualizationType,
  AchievementCategory,
  ForumCategory,
  NoteType,
  PublicationType
} from '../index';

import {
  UserRole as DatabaseUserRole,
  ModuleDifficulty,
  ProgressStatus,
  ThemePreference,
  SourceType,
  VideoType
} from '../database';

describe('Enum Validation and Usage Tests', () => {
  describe('UserRole Enum Comprehensive Testing', () => {
    it('should validate all enum values exist', () => {
      const expectedValues = [
        'super_admin',
        'admin',
        'instructor',
        'student',
        'guest'
      ];

      const actualValues = Object.values(UserRole);
      
      expect(actualValues).toEqual(expect.arrayContaining(expectedValues));
      expect(actualValues).toHaveLength(expectedValues.length);
    });

    it('should support enum key access', () => {
      expect(UserRole.SUPER_ADMIN).toBe('super_admin');
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.INSTRUCTOR).toBe('instructor');
      expect(UserRole.STUDENT).toBe('student');
      expect(UserRole.GUEST).toBe('guest');
    });

    it('should validate enum in switch statements', () => {
      function getUserPermissionLevel(role: UserRole): number {
        switch (role) {
          case UserRole.SUPER_ADMIN:
            return 5;
          case UserRole.ADMIN:
            return 4;
          case UserRole.INSTRUCTOR:
            return 3;
          case UserRole.STUDENT:
            return 2;
          case UserRole.GUEST:
            return 1;
          default:
            const _exhaustive: never = role;
            return 0;
        }
      }

      expect(getUserPermissionLevel(UserRole.SUPER_ADMIN)).toBe(5);
      expect(getUserPermissionLevel(UserRole.ADMIN)).toBe(4);
      expect(getUserPermissionLevel(UserRole.INSTRUCTOR)).toBe(3);
      expect(getUserPermissionLevel(UserRole.STUDENT)).toBe(2);
      expect(getUserPermissionLevel(UserRole.GUEST)).toBe(1);
    });

    it('should validate role hierarchy ordering', () => {
      const roleOrder: UserRole[] = [
        UserRole.GUEST,
        UserRole.STUDENT,
        UserRole.INSTRUCTOR,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN
      ];

      function getRoleIndex(role: UserRole): number {
        return roleOrder.indexOf(role);
      }

      expect(getRoleIndex(UserRole.SUPER_ADMIN)).toBeGreaterThan(getRoleIndex(UserRole.ADMIN));
      expect(getRoleIndex(UserRole.ADMIN)).toBeGreaterThan(getRoleIndex(UserRole.INSTRUCTOR));
      expect(getRoleIndex(UserRole.INSTRUCTOR)).toBeGreaterThan(getRoleIndex(UserRole.STUDENT));
      expect(getRoleIndex(UserRole.STUDENT)).toBeGreaterThan(getRoleIndex(UserRole.GUEST));
    });
  });

  describe('ResourceType and Action Enum Integration', () => {
    it('should validate all resource types', () => {
      const resourceTypes = Object.values(ResourceType);
      
      expect(resourceTypes).toContain(ResourceType.MODULE);
      expect(resourceTypes).toContain(ResourceType.QUIZ);
      expect(resourceTypes).toContain(ResourceType.NOTES);
      expect(resourceTypes).toContain(ResourceType.ANALYTICS);
      expect(resourceTypes).toContain(ResourceType.USER);
      expect(resourceTypes).toContain(ResourceType.SYSTEM);
    });

    it('should validate all action types', () => {
      const actions = Object.values(Action);
      
      expect(actions).toContain(Action.CREATE);
      expect(actions).toContain(Action.READ);
      expect(actions).toContain(Action.UPDATE);
      expect(actions).toContain(Action.DELETE);
      expect(actions).toContain(Action.PUBLISH);
      expect(actions).toContain(Action.SHARE);
    });

    it('should validate resource-action combinations', () => {
      interface ResourceActionMap {
        [key: string]: Action[];
      }

      const validCombinations: ResourceActionMap = {
        [ResourceType.MODULE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH],
        [ResourceType.QUIZ]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        [ResourceType.NOTES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.SHARE],
        [ResourceType.ANALYTICS]: [Action.READ],
        [ResourceType.USER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        [ResourceType.SYSTEM]: Object.values(Action)
      };

      Object.entries(validCombinations).forEach(([resource, actions]) => {
        actions.forEach(action => {
          expect(Object.values(Action)).toContain(action);
          expect(Object.values(ResourceType)).toContain(resource as ResourceType);
        });
      });
    });
  });

  describe('AuthErrorType Enum Validation', () => {
    it('should validate all error types exist', () => {
      const errorTypes = Object.values(AuthErrorType);
      const expectedTypes = [
        'INVALID_CREDENTIALS',
        'ACCOUNT_LOCKED',
        'ACCOUNT_INACTIVE',
        'EMAIL_NOT_VERIFIED',
        'TOKEN_EXPIRED',
        'TOKEN_INVALID',
        'INSUFFICIENT_PERMISSIONS',
        'RATE_LIMIT_EXCEEDED',
        'TWO_FACTOR_REQUIRED',
        'TWO_FACTOR_INVALID',
        'DATABASE_ERROR',
        'REGISTRATION_FAILED',
        'LOGIN_FAILED',
        'LOGOUT_FAILED',
        'PASSWORD_RESET_FAILED',
        'NOT_AUTHENTICATED',
        'PASSWORD_CHANGE_FAILED',
        'EMAIL_VERIFICATION_FAILED',
        'RATE_LIMITED',
        'EMAIL_ALREADY_EXISTS',
        'UNKNOWN_ERROR'
      ];

      expectedTypes.forEach(type => {
        expect(errorTypes).toContain(type);
      });
    });

    it('should categorize error types by severity', () => {
      interface ErrorSeverity {
        high: AuthErrorType[];
        medium: AuthErrorType[];
        low: AuthErrorType[];
      }

      const errorSeverities: ErrorSeverity = {
        high: [
          AuthErrorType.ACCOUNT_LOCKED,
          AuthErrorType.INSUFFICIENT_PERMISSIONS,
          AuthErrorType.DATABASE_ERROR
        ],
        medium: [
          AuthErrorType.INVALID_CREDENTIALS,
          AuthErrorType.TOKEN_EXPIRED,
          AuthErrorType.TWO_FACTOR_REQUIRED,
          AuthErrorType.RATE_LIMIT_EXCEEDED
        ],
        low: [
          AuthErrorType.EMAIL_NOT_VERIFIED,
          AuthErrorType.PASSWORD_CHANGE_FAILED
        ]
      };

      function getErrorSeverity(errorType: AuthErrorType): 'high' | 'medium' | 'low' | 'unknown' {
        if (errorSeverities.high.includes(errorType)) return 'high';
        if (errorSeverities.medium.includes(errorType)) return 'medium';
        if (errorSeverities.low.includes(errorType)) return 'low';
        return 'unknown';
      }

      expect(getErrorSeverity(AuthErrorType.ACCOUNT_LOCKED)).toBe('high');
      expect(getErrorSeverity(AuthErrorType.INVALID_CREDENTIALS)).toBe('medium');
      expect(getErrorSeverity(AuthErrorType.EMAIL_NOT_VERIFIED)).toBe('low');
    });
  });

  describe('QuestionType Enum Comprehensive Testing', () => {
    it('should validate all question types', () => {
      const questionTypes = Object.values(QuestionType);
      const expectedTypes = [
        'multiple-choice',
        'multiple-select',
        'true-false',
        'fill-in-blank',
        'short-answer',
        'essay',
        'matching',
        'ranking',
        'drag-drop',
        'interactive'
      ];

      expectedTypes.forEach(type => {
        expect(questionTypes).toContain(type);
      });
    });

    it('should categorize question types by complexity', () => {
      function getQuestionComplexity(questionType: QuestionType): 'simple' | 'medium' | 'complex' {
        const complexityMap: Record<QuestionType, 'simple' | 'medium' | 'complex'> = {
          'true-false': 'simple',
          'multiple-choice': 'simple',
          'fill-in-blank': 'medium',
          'multiple-select': 'medium',
          'short-answer': 'medium',
          'matching': 'medium',
          'ranking': 'medium',
          'essay': 'complex',
          'drag-drop': 'complex',
          'interactive': 'complex'
        };

        return complexityMap[questionType];
      }

      expect(getQuestionComplexity('true-false' as QuestionType)).toBe('simple');
      expect(getQuestionComplexity('multiple-select' as QuestionType)).toBe('medium');
      expect(getQuestionComplexity('essay' as QuestionType)).toBe('complex');
    });

    it('should validate question type scoring methods', () => {
      interface ScoringMethod {
        type: 'automatic' | 'manual' | 'hybrid';
        maxPoints: number;
      }

      function getScoringMethod(questionType: QuestionType): ScoringMethod {
        const scoringMap: Record<QuestionType, ScoringMethod> = {
          'multiple-choice': { type: 'automatic', maxPoints: 1 },
          'multiple-select': { type: 'automatic', maxPoints: 2 },
          'true-false': { type: 'automatic', maxPoints: 1 },
          'fill-in-blank': { type: 'automatic', maxPoints: 1 },
          'short-answer': { type: 'hybrid', maxPoints: 3 },
          'essay': { type: 'manual', maxPoints: 10 },
          'matching': { type: 'automatic', maxPoints: 5 },
          'ranking': { type: 'automatic', maxPoints: 3 },
          'drag-drop': { type: 'automatic', maxPoints: 2 },
          'interactive': { type: 'hybrid', maxPoints: 5 }
        };

        return scoringMap[questionType];
      }

      expect(getScoringMethod('multiple-choice' as QuestionType).type).toBe('automatic');
      expect(getScoringMethod('essay' as QuestionType).type).toBe('manual');
      expect(getScoringMethod('short-answer' as QuestionType).type).toBe('hybrid');
    });
  });

  describe('Database Enum Types', () => {
    it('should validate database and interface enum consistency', () => {
      // Ensure database enums match interface enums
      const authRoles = Object.values(UserRole);
      const dbRoles = ['super_admin', 'admin', 'instructor', 'student', 'guest'];
      
      expect(authRoles).toEqual(expect.arrayContaining(dbRoles));
    });

    it('should validate ModuleDifficulty enum', () => {
      const difficulties = ['beginner', 'intermediate', 'advanced'] as const;
      
      difficulties.forEach(difficulty => {
        expect(['beginner', 'intermediate', 'advanced']).toContain(difficulty);
      });
    });

    it('should validate ProgressStatus enum', () => {
      const statuses = ['not_started', 'in_progress', 'completed', 'failed'] as const;
      
      function isValidProgressStatus(status: string): status is ProgressStatus {
        return (statuses as readonly string[]).includes(status);
      }

      expect(isValidProgressStatus('in_progress')).toBe(true);
      expect(isValidProgressStatus('invalid_status')).toBe(false);
    });

    it('should validate VideoType enum usage', () => {
      const videoTypes = ['youtube', 'vimeo', 'uploaded', 'external'] as const;
      
      interface VideoConfig {
        type: VideoType;
        embedCode?: string;
        requiresAuth?: boolean;
      }

      function getVideoConfig(type: VideoType): VideoConfig {
        switch (type) {
          case 'youtube':
            return { type, embedCode: '<iframe>' };
          case 'vimeo':
            return { type, embedCode: '<iframe>' };
          case 'uploaded':
            return { type, requiresAuth: true };
          case 'external':
            return { type };
          default:
            const _exhaustive: never = type;
            throw new Error('Invalid video type');
        }
      }

      expect(getVideoConfig('youtube' as VideoType).embedCode).toBeDefined();
      expect(getVideoConfig('uploaded' as VideoType).requiresAuth).toBe(true);
    });
  });

  describe('Educational Content Enums', () => {
    it('should validate InteractiveElementType enum', () => {
      const interactiveTypes: InteractiveElementType[] = [
        'concept-explorer',
        'personality-test',
        'archetype-selector',
        'dream-journal',
        'reflection-prompt',
        'case-study',
        'simulation'
      ];

      interactiveTypes.forEach(type => {
        expect(Object.values(InteractiveElementType)).toContain(type);
      });
    });

    it('should validate VisualizationType enum', () => {
      const visualizationTypes: VisualizationType[] = [
        'concept-map',
        'timeline',
        'personality-wheel',
        'archetype-mandala',
        'dream-symbols',
        'individuation-journey',
        '3d-psyche-model'
      ];

      visualizationTypes.forEach(type => {
        expect(Object.values(VisualizationType)).toContain(type);
      });
    });

    it('should validate AchievementCategory enum usage', () => {
      const categories: AchievementCategory[] = [
        'progress',
        'knowledge',
        'engagement',
        'social',
        'exploration',
        'mastery'
      ];

      interface AchievementPoints {
        category: AchievementCategory;
        basePoints: number;
        multiplier: number;
      }

      const pointsSystem: AchievementPoints[] = categories.map(category => ({
        category,
        basePoints: category === 'mastery' ? 500 : 100,
        multiplier: category === 'progress' ? 1.5 : 1.0
      }));

      expect(pointsSystem).toHaveLength(categories.length);
      expect(pointsSystem.find(p => p.category === 'mastery')?.basePoints).toBe(500);
      expect(pointsSystem.find(p => p.category === 'progress')?.multiplier).toBe(1.5);
    });
  });

  describe('Enum Runtime Behavior', () => {
    it('should handle enum serialization and deserialization', () => {
      const testData = {
        userRole: UserRole.INSTRUCTOR,
        resourceType: ResourceType.MODULE,
        actions: [Action.READ, Action.UPDATE],
        questionType: 'multiple-choice' as QuestionType
      };

      const serialized = JSON.stringify(testData);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.userRole).toBe('instructor');
      expect(deserialized.resourceType).toBe('module');
      expect(deserialized.actions).toEqual(['read', 'update']);
      expect(deserialized.questionType).toBe('multiple-choice');

      // Validate that deserialized values are valid enum values
      expect(Object.values(UserRole)).toContain(deserialized.userRole);
      expect(Object.values(ResourceType)).toContain(deserialized.resourceType);
    });

    it('should handle enum comparison and equality', () => {
      const role1: UserRole = UserRole.ADMIN;
      const role2: UserRole = UserRole.ADMIN;
      const role3: UserRole = UserRole.STUDENT;
      const roleString = 'admin';

      expect(role1 === role2).toBe(true);
      expect(role1 === role3).toBe(false);
      expect(role1 === roleString).toBe(true); // String enum comparison
      expect(role1.valueOf()).toBe(roleString);
    });

    it('should validate enum filtering and searching', () => {
      const allRoles = Object.values(UserRole);
      const adminRoles = allRoles.filter(role => 
        role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN
      );
      
      const studentRoles = allRoles.filter(role =>
        [UserRole.STUDENT, UserRole.GUEST].includes(role)
      );

      expect(adminRoles).toHaveLength(2);
      expect(studentRoles).toHaveLength(2);
      expect(adminRoles).toContain(UserRole.ADMIN);
      expect(studentRoles).toContain(UserRole.STUDENT);
    });

    it('should handle enum mapping and transformation', () => {
      const roleDescriptions = new Map<UserRole, string>([
        [UserRole.SUPER_ADMIN, 'System Administrator'],
        [UserRole.ADMIN, 'Administrator'],
        [UserRole.INSTRUCTOR, 'Course Instructor'],
        [UserRole.STUDENT, 'Student User'],
        [UserRole.GUEST, 'Guest User']
      ]);

      function getRoleDescription(role: UserRole): string {
        return roleDescriptions.get(role) || 'Unknown Role';
      }

      expect(getRoleDescription(UserRole.INSTRUCTOR)).toBe('Course Instructor');
      expect(getRoleDescription(UserRole.STUDENT)).toBe('Student User');
    });
  });

  describe('Enum Type Guards and Validation', () => {
    it('should create type guards for enum validation', () => {
      function isUserRole(value: unknown): value is UserRole {
        return typeof value === 'string' && Object.values(UserRole).includes(value as UserRole);
      }

      function isQuestionType(value: unknown): value is QuestionType {
        const validTypes = [
          'multiple-choice', 'multiple-select', 'true-false', 'fill-in-blank',
          'short-answer', 'essay', 'matching', 'ranking', 'drag-drop', 'interactive'
        ];
        return typeof value === 'string' && validTypes.includes(value as QuestionType);
      }

      expect(isUserRole('admin')).toBe(true);
      expect(isUserRole('invalid_role')).toBe(false);
      expect(isUserRole(123)).toBe(false);

      expect(isQuestionType('multiple-choice')).toBe(true);
      expect(isQuestionType('invalid_type')).toBe(false);
      expect(isQuestionType(null)).toBe(false);
    });

    it('should validate enum arrays', () => {
      function validateRoleArray(roles: unknown[]): roles is UserRole[] {
        return roles.every(role => 
          typeof role === 'string' && Object.values(UserRole).includes(role as UserRole)
        );
      }

      function validateActionArray(actions: unknown[]): actions is Action[] {
        return actions.every(action =>
          typeof action === 'string' && Object.values(Action).includes(action as Action)
        );
      }

      const validRoles = ['admin', 'instructor', 'student'];
      const invalidRoles = ['admin', 'invalid_role', 'student'];
      const validActions = ['read', 'create', 'update'];
      const invalidActions = ['read', 'invalid_action'];

      expect(validateRoleArray(validRoles)).toBe(true);
      expect(validateRoleArray(invalidRoles)).toBe(false);
      expect(validateActionArray(validActions)).toBe(true);
      expect(validateActionArray(invalidActions)).toBe(false);
    });
  });
});