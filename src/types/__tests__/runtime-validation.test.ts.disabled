/**
 * Runtime Type Validation and Error Handling Tests
 * 
 * Tests runtime type validation, type guards, error handling with TypeScript types,
 * and validation of complex nested structures.
 */

import {
  AuthError,
  AuthErrorType,
  User,
  UserRole,
  Module,
  Quiz,
  Question,
  QuestionType,
  Permission,
  ResourceType,
  Action,
  UserProgress
} from '../index';

import {
  EducationalModule,
  ValidationError,
  Quiz as SchemaQuiz
} from '../schema';

describe('Runtime Type Validation and Error Handling', () => {
  describe('Type Guard Functions', () => {
    // Comprehensive type guards
    function isString(value: unknown): value is string {
      return typeof value === 'string';
    }

    function isNumber(value: unknown): value is number {
      return typeof value === 'number' && !isNaN(value);
    }

    function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
      return Array.isArray(value) && value.every(guard);
    }

    function hasRequiredProperties<T extends Record<string, any>>(
      obj: unknown,
      requiredKeys: (keyof T)[]
    ): obj is T {
      if (!obj || typeof obj !== 'object') return false;
      return requiredKeys.every(key => key in obj);
    }

    function isUserRole(value: unknown): value is UserRole {
      return typeof value === 'string' && 
             Object.values(UserRole).includes(value as UserRole);
    }

    function isDifficulty(value: unknown): value is 'beginner' | 'intermediate' | 'advanced' {
      return typeof value === 'string' && 
             ['beginner', 'intermediate', 'advanced'].includes(value);
    }

    function isQuestionType(value: unknown): value is QuestionType {
      const validTypes = [
        'multiple-choice', 'multiple-select', 'true-false', 'fill-in-blank',
        'short-answer', 'essay', 'matching', 'ranking', 'drag-drop', 'interactive'
      ];
      return typeof value === 'string' && validTypes.includes(value as QuestionType);
    }

    function isValidModule(obj: unknown): obj is Module {
      if (!hasRequiredProperties(obj, ['id', 'title', 'description', 'estimatedTime', 'difficulty'])) {
        return false;
      }
      
      const candidate = obj as Record<string, unknown>;
      return (
        isString(candidate.id) &&
        isString(candidate.title) &&
        isString(candidate.description) &&
        isNumber(candidate.estimatedTime) &&
        isDifficulty(candidate.difficulty)
      );
    }

    function isValidUser(obj: unknown): obj is Partial<User> {
      if (!hasRequiredProperties(obj, ['id', 'email', 'role'])) {
        return false;
      }
      
      const candidate = obj as Record<string, unknown>;
      return (
        isString(candidate.id) &&
        isString(candidate.email) &&
        isUserRole(candidate.role)
      );
    }

    function isValidQuestion(obj: unknown): obj is Question {
      if (!hasRequiredProperties(obj, ['id', 'question', 'type', 'options', 'correctAnswer', 'explanation'])) {
        return false;
      }
      
      const candidate = obj as Record<string, unknown>;
      return (
        isString(candidate.id) &&
        isString(candidate.question) &&
        isQuestionType(candidate.type) &&
        Array.isArray(candidate.options) &&
        (isNumber(candidate.correctAnswer) || isArrayOf(candidate.correctAnswer, isNumber)) &&
        isString(candidate.explanation)
      );
    }

    it('should validate primitive types', () => {
      expect(isString('hello')).toBe(true);
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);

      expect(isNumber(42)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber('42')).toBe(false);
      expect(isNumber(NaN)).toBe(false);
    });

    it('should validate arrays with type guards', () => {
      expect(isArrayOf(['a', 'b', 'c'], isString)).toBe(true);
      expect(isArrayOf([1, 2, 3], isNumber)).toBe(true);
      expect(isArrayOf(['a', 1, 'b'], isString)).toBe(false);
      expect(isArrayOf([1, 'a', 3], isNumber)).toBe(false);
      expect(isArrayOf('not-array', isString)).toBe(false);
    });

    it('should validate enum values', () => {
      expect(isUserRole('admin')).toBe(true);
      expect(isUserRole('student')).toBe(true);
      expect(isUserRole('invalid_role')).toBe(false);
      expect(isUserRole(null)).toBe(false);

      expect(isDifficulty('beginner')).toBe(true);
      expect(isDifficulty('expert')).toBe(false);

      expect(isQuestionType('multiple-choice')).toBe(true);
      expect(isQuestionType('single-choice')).toBe(false);
    });

    it('should validate complex objects - Module', () => {
      const validModule = {
        id: 'module-1',
        title: 'Test Module',
        description: 'A test module',
        estimatedTime: 60,
        difficulty: 'beginner'
      };

      const invalidModules = [
        null,
        undefined,
        {},
        { id: 'module-1' }, // missing required fields
        { id: 123, title: 'Test' }, // wrong type for id
        { id: 'module-1', title: 'Test', description: 'Test', estimatedTime: '60' }, // wrong type for estimatedTime
        { id: 'module-1', title: 'Test', description: 'Test', estimatedTime: 60, difficulty: 'expert' } // invalid difficulty
      ];

      expect(isValidModule(validModule)).toBe(true);
      
      invalidModules.forEach((invalidModule, index) => {
        expect(isValidModule(invalidModule)).toBe(false);
      });
    });

    it('should validate complex objects - User', () => {
      const validUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const invalidUsers = [
        null,
        { id: 'user-1' }, // missing email and role
        { id: 'user-1', email: 'invalid-email' }, // missing role
        { id: 'user-1', email: 'test@example.com', role: 'invalid-role' }, // invalid role
        { id: null, email: 'test@example.com', role: UserRole.STUDENT } // null id
      ];

      expect(isValidUser(validUser)).toBe(true);
      
      invalidUsers.forEach(invalidUser => {
        expect(isValidUser(invalidUser)).toBe(false);
      });
    });
  });

  describe('AuthError Runtime Behavior', () => {
    it('should create and identify AuthError instances', () => {
      const authError = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Login failed',
        { attempts: 3 }
      );

      expect(authError).toBeInstanceOf(Error);
      expect(authError).toBeInstanceOf(AuthError);
      expect(authError.name).toBe('AuthError');
      expect(authError.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
      expect(authError.message).toBe('Login failed');
      expect(authError.details).toEqual({ attempts: 3 });
    });

    it('should handle error type discrimination', () => {
      function handleError(error: unknown): string {
        if (error instanceof AuthError) {
          switch (error.type) {
            case AuthErrorType.INVALID_CREDENTIALS:
              return 'Please check your username and password';
            case AuthErrorType.ACCOUNT_LOCKED:
              return 'Your account has been temporarily locked';
            case AuthErrorType.RATE_LIMIT_EXCEEDED:
              return 'Too many attempts, please try again later';
            default:
              return `Authentication error: ${error.message}`;
          }
        }
        
        if (error instanceof Error) {
          return `System error: ${error.message}`;
        }
        
        return 'An unknown error occurred';
      }

      const authError = new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Bad credentials');
      const systemError = new Error('Database connection failed');
      const unknownError = 'String error';

      expect(handleError(authError)).toBe('Please check your username and password');
      expect(handleError(systemError)).toBe('System error: Database connection failed');
      expect(handleError(unknownError)).toBe('An unknown error occurred');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large data structures efficiently', () => {
      const startTime = performance.now();
      
      // Create large array of objects to validate
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Title ${i}`,
        description: `Description for item ${i}`,
        estimatedTime: Math.floor(Math.random() * 120) + 30,
        difficulty: ['beginner', 'intermediate', 'advanced'][i % 3]
      }));

      // Validate all items using the local isValidModule function
      const validationResults = largeDataset.map(item => {
        return {
          item,
          isValid: isModuleValid(item)
        };
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // All items should be valid
      const allValid = validationResults.every(result => result.isValid);
      expect(allValid).toBe(true);
      
      // Should complete within reasonable time
      expect(processingTime).toBeLessThan(1000); // Less than 1 second
    });
  });

  // Helper function for performance test
  function isModuleValid(obj: unknown): obj is Module {
    if (!obj || typeof obj !== 'object') return false;
    
    const candidate = obj as Record<string, unknown>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      typeof candidate.description === 'string' &&
      typeof candidate.estimatedTime === 'number' &&
      ['beginner', 'intermediate', 'advanced'].includes(candidate.difficulty as string)
    );
  }
});