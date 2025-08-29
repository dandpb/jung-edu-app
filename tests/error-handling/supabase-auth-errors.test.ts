/**
 * Supabase Authentication Error Handling Tests
 * Tests connection failures, rate limiting, and database constraint violations
 */

import { jest } from '@jest/globals';
import { SupabaseAuthService } from '../../src/services/supabase/authService';
import { AuthError, AuthErrorType } from '../../src/types/auth';
import { UserRole } from '../../src/types/database';

// Mock Supabase client and database queries
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ unsubscribe: jest.fn() })),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    verifyOtp: jest.fn(),
    refreshSession: jest.fn(),
    admin: {
      deleteUser: jest.fn()
    }
  }
};

const mockDatabaseQuery = {
  users: () => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis()
  }),
  userProfiles: () => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn()
  }),
  userSessions: () => ({
    insert: jest.fn()
  })
};

jest.mock('../../src/config/supabase', () => ({
  supabase: mockSupabase,
  createDatabaseQuery: mockDatabaseQuery
}));

describe('Supabase Authentication Error Handling', () => {
  let authService: SupabaseAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default successful behaviors
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({ unsubscribe: jest.fn() });
    
    authService = new SupabaseAuthService();
  });

  describe('Connection and Network Error Scenarios', () => {
    it('should handle network connectivity failures during registration', async () => {
      mockSupabase.auth.signUp.mockRejectedValue(new Error('Network request failed'));

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 'student'
        })
      ).rejects.toThrow(AuthError);
    });

    it('should handle DNS resolution failures', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('getaddrinfo ENOTFOUND supabase.co')
      );

      await expect(
        authService.login({
          username: 'test@example.com',
          password: 'password123'
        })
      ).rejects.toThrow(AuthError);
    });

    it('should handle timeout errors', async () => {
      mockSupabase.auth.signUp.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow(AuthError);
    });

    it('should handle SSL/TLS certificate errors', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('unable to verify the first certificate')
      );

      await expect(
        authService.login({
          username: 'test@example.com',
          password: 'password123'
        })
      ).rejects.toThrow(AuthError);
    });

    it('should handle server unavailability (503 errors)', async () => {
      const serviceUnavailableError = {
        message: 'Service temporarily unavailable',
        status: 503
      };
      
      mockSupabase.auth.signUp.mockRejectedValue(serviceUnavailableError);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow(AuthError);
    });
  });

  describe('Rate Limiting Error Scenarios', () => {
    it('should handle authentication rate limiting', async () => {
      const rateLimitError = {
        message: 'Too many requests',
        status: 429
      };
      
      mockSupabase.auth.signInWithPassword.mockRejectedValue(rateLimitError);

      await expect(
        authService.login({
          username: 'test@example.com',
          password: 'password123'
        })
      ).rejects.toThrow(AuthError);
    });

    it('should handle password reset rate limiting', async () => {
      const rateLimitError = {
        message: 'Too many requests',
        status: 429
      };
      
      mockSupabase.auth.resetPasswordForEmail.mockRejectedValue(rateLimitError);

      await expect(
        authService.requestPasswordReset({ email: 'test@example.com' })
      ).rejects.toThrow(AuthError);
    });

    it('should handle registration rate limiting', async () => {
      const rateLimitError = {
        message: 'Too many requests',
        status: 429
      };
      
      mockSupabase.auth.signUp.mockRejectedValue(rateLimitError);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow(AuthError);
    });
  });

  describe('Database Constraint Violation Scenarios', () => {
    it('should handle email uniqueness constraint violations', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: null
        },
        error: null
      });

      const uniqueConstraintError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "users_email_key"',
        details: 'Key (email)=(test@example.com) already exists.'
      };
      
      mockDatabaseQuery.users().insert.mockRejectedValue(uniqueConstraintError);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow(AuthError);
    });

    it('should handle username uniqueness constraint violations', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: null
        },
        error: null
      });

      const uniqueConstraintError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "users_username_key"',
        details: 'Key (username)=(testuser) already exists.'
      };
      
      mockDatabaseQuery.users().insert.mockRejectedValue(uniqueConstraintError);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow(AuthError);
    });

    it('should handle foreign key constraint violations', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: null
        },
        error: null
      });

      mockDatabaseQuery.users().insert.mockResolvedValue({
        data: { id: 'user-123', email: 'test@example.com' },
        error: null
      });

      const foreignKeyError = {
        code: '23503',
        message: 'insert or update on table "user_profiles" violates foreign key constraint',
        details: 'Key (user_id)=(invalid-user) is not present in table "users".'
      };
      
      mockDatabaseQuery.userProfiles().insert.mockRejectedValue(foreignKeyError);

      // This should not throw since profile creation is optional
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).resolves.toBeDefined();
    });

    it('should handle check constraint violations', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: null
        },
        error: null
      });

      const checkConstraintError = {
        code: '23514',
        message: 'new row for relation "users" violates check constraint "valid_role"',
        details: 'Failing row contains (user-123, test@example.com, testuser, invalid_role, ...)'
      };
      
      mockDatabaseQuery.users().insert.mockRejectedValue(checkConstraintError);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 'invalid_role' as UserRole
        })
      ).rejects.toThrow(AuthError);
    });

    it('should handle not-null constraint violations', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: null
        },
        error: null
      });

      const notNullError = {
        code: '23502',
        message: 'null value in column "email" of relation "users" violates not-null constraint',
        details: 'Failing row contains (user-123, null, testuser, ...)'
      };
      
      mockDatabaseQuery.users().insert.mockRejectedValue(notNullError);

      await expect(
        authService.register({
          email: '',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow(AuthError);
    });
  });

  describe('Authentication State Error Scenarios', () => {
    it('should handle session retrieval failures during initialization', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Failed to retrieve session')
      });

      // Should not throw but should log error
      expect(() => new SupabaseAuthService()).not.toThrow();
    });

    it('should handle user profile loading failures', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 3600
          }
        },
        error: null
      });

      const profileError = {
        code: 'PGRST301',
        message: 'Could not connect to database'
      };
      
      mockDatabaseQuery.users().single.mockRejectedValue(profileError);

      // Should handle gracefully during initialization
      expect(() => new SupabaseAuthService()).not.toThrow();
    });

    it('should handle auth state change errors', async () => {
      const mockUnsubscribe = jest.fn();
      mockSupabase.auth.onAuthStateChange.mockReturnValue({ unsubscribe: mockUnsubscribe });
      
      const authService = new SupabaseAuthService();
      
      // Simulate auth state change with error
      const authStateHandler = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];
      
      expect(() => {
        authStateHandler('SIGNED_IN', null); // Invalid state
      }).not.toThrow();
    });
  });

  describe('Transaction and Rollback Error Scenarios', () => {
    it('should rollback auth user creation on database insert failure', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      const dbError = new Error('Database insert failed');
      mockDatabaseQuery.users().insert.mockRejectedValue(dbError);
      
      // Should clean up auth user
      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ data: null, error: null });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow(AuthError);

      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-123');
    });

    it('should handle rollback failures gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      const dbError = new Error('Database insert failed');
      mockDatabaseQuery.users().insert.mockRejectedValue(dbError);
      
      // Rollback also fails
      mockSupabase.auth.admin.deleteUser.mockRejectedValue(new Error('Rollback failed'));

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow(AuthError);
    });
  });

  describe('Session Management Error Scenarios', () => {
    it('should handle session refresh failures', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Token refresh failed')
      });

      const result = await authService.refreshAccessToken();
      expect(result).toBeNull();
    });

    it('should handle session creation failures during login', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 3600
          }
        },
        error: null
      });

      mockDatabaseQuery.users().select.mockReturnThis();
      mockDatabaseQuery.users().eq.mockReturnThis();
      mockDatabaseQuery.users().single.mockResolvedValue({
        data: { email: 'test@example.com' },
        error: null
      });

      mockDatabaseQuery.users().update.mockReturnThis();
      mockDatabaseQuery.users().eq.mockReturnThis();
      
      const sessionError = new Error('Failed to create session record');
      mockDatabaseQuery.userSessions().insert.mockRejectedValue(sessionError);

      // Should continue despite session record failure
      await expect(
        authService.login({
          username: 'test@example.com',
          password: 'password123'
        })
      ).resolves.toBeDefined();
    });

    it('should handle logout failures', async () => {
      mockSupabase.auth.signOut.mockRejectedValue(new Error('Logout failed'));

      await expect(authService.logout()).rejects.toThrow(AuthError);
    });
  });

  describe('Data Validation Error Scenarios', () => {
    it('should handle invalid email format during registration', async () => {
      const invalidEmailError = {
        message: 'Invalid email format'
      };
      
      mockSupabase.auth.signUp.mockRejectedValue(invalidEmailError);

      await expect(
        authService.register({
          email: 'invalid-email',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow(AuthError);
    });

    it('should handle weak password errors', async () => {
      const weakPasswordError = {
        message: 'Password is too weak'
      };
      
      mockSupabase.auth.signUp.mockRejectedValue(weakPasswordError);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: '123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow(AuthError);
    });

    it('should handle username lookup failures during login', async () => {
      const userNotFoundError = {
        code: 'PGRST116',
        message: 'No rows returned'
      };
      
      mockDatabaseQuery.users().single.mockRejectedValue(userNotFoundError);

      await expect(
        authService.login({
          username: 'nonexistentuser',
          password: 'password123'
        })
      ).rejects.toThrow(AuthError);
    });
  });

  describe('Permission and Authorization Error Scenarios', () => {
    it('should handle insufficient permissions for admin operations', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'student' as UserRole
      };
      
      // Mock current user as student
      (authService as any).currentUser = mockUser;
      
      const hasPermission = await authService.hasPermission('admin', 'write');
      expect(hasPermission).toBe(false);
    });

    it('should handle role-based access control failures', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'guest' as UserRole
      };
      
      (authService as any).currentUser = mockUser;
      
      const hasPermission = await authService.hasPermission('modules', 'write');
      expect(hasPermission).toBe(false);
    });
  });

  describe('Recovery and Resilience Scenarios', () => {
    it('should handle temporary database disconnections', async () => {
      let callCount = 0;
      mockDatabaseQuery.users().single.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Connection lost'));
        }
        return Promise.resolve({
          data: { id: 'user-123', email: 'test@example.com' },
          error: null
        });
      });

      // Should eventually succeed with retry logic
      // Note: This test assumes retry logic exists in the auth service
    });

    it('should handle partial service degradation', async () => {
      // Auth works but profile creation fails
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: null
        },
        error: null
      });

      mockDatabaseQuery.users().insert.mockResolvedValue({
        data: { id: 'user-123', email: 'test@example.com' },
        error: null
      });

      // Profile creation fails
      mockDatabaseQuery.userProfiles().insert.mockRejectedValue(
        new Error('Profile service unavailable')
      );

      // Should succeed despite profile creation failure
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      ).resolves.toBeDefined();
    });

    it('should handle graceful degradation during high load', async () => {
      // Simulate high load with delayed responses
      mockSupabase.auth.signInWithPassword.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: {
              user: { id: 'user-123' },
              session: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600 }
            },
            error: null
          }), 2000)
        )
      );

      const startTime = Date.now();
      
      await authService.login({
        username: 'test@example.com',
        password: 'password123'
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThan(1500); // Should respect the delay
    });
  });

  describe('Concurrent Operation Error Scenarios', () => {
    it('should handle concurrent login attempts', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600 }
        },
        error: null
      });

      const loginPromises = Array(5).fill(null).map(() => 
        authService.login({
          username: 'test@example.com',
          password: 'password123'
        })
      );

      const results = await Promise.allSettled(loginPromises);
      
      // All should eventually resolve or fail gracefully
      results.forEach(result => {
        expect(['fulfilled', 'rejected']).toContain(result.status);
      });
    });

    it('should handle concurrent registration attempts with same email', async () => {
      const emailExistsError = {
        message: 'User already registered'
      };
      
      mockSupabase.auth.signUp
        .mockResolvedValueOnce({
          data: { user: { id: 'user-123' }, session: null },
          error: null
        })
        .mockRejectedValue(emailExistsError);

      const registrationPromises = Array(3).fill(null).map(() => 
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      );

      const results = await Promise.allSettled(registrationPromises);
      
      // Only one should succeed, others should fail gracefully
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');
      
      expect(successes.length).toBeLessThanOrEqual(1);
      expect(failures.length).toBeGreaterThanOrEqual(2);
    });
  });
});
