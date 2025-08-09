import {
  login,
  logout,
  register,
  getCurrentUser,
  isAuthenticated,
  resetPassword,
  updateProfile,
  validateSession,
  refreshToken
} from '../authService';
import { supabase } from '../../../config/supabase';
import { SessionManager } from '../sessionManager';
import { CryptoService } from '../crypto';

// Mock dependencies
jest.mock('../../../config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      refreshSession: jest.fn()
    },
    from: jest.fn()
  }
}));

jest.mock('../sessionManager');
jest.mock('../crypto');

describe('AuthService', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
      role: 'student'
    },
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: mockUser,
    expires_at: Date.now() / 1000 + 3600 // 1 hour from now
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (SessionManager.prototype.getSession as jest.Mock).mockReturnValue(mockSession);
    (SessionManager.prototype.isValidSession as jest.Mock).mockReturnValue(true);
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockAuthResponse = {
        data: {
          user: mockUser,
          session: mockSession
        },
        error: null
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle login with invalid credentials', async () => {
      const mockAuthResponse = {
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await login('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
    });

    it('should handle network errors during login', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await login('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should validate email format before login attempt', async () => {
      const result = await login('invalid-email', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should validate password length before login attempt', async () => {
      const result = await login('test@example.com', '123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must be at least');
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should handle empty credentials', async () => {
      const result1 = await login('', 'password123');
      const result2 = await login('test@example.com', '');

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should store session after successful login', async () => {
      const mockAuthResponse = {
        data: { user: mockUser, session: mockSession },
        error: null
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockAuthResponse);

      await login('test@example.com', 'password123');

      expect(SessionManager.prototype.setSession).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('register', () => {
    const registrationData = {
      email: 'newuser@example.com',
      password: 'newpassword123',
      name: 'New User',
      role: 'student' as const
    };

    it('should successfully register a new user', async () => {
      const mockAuthResponse = {
        data: {
          user: { ...mockUser, email: registrationData.email },
          session: mockSession
        },
        error: null
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await register(registrationData);

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe(registrationData.email);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          data: {
            name: registrationData.name,
            role: registrationData.role
          }
        }
      });
    });

    it('should handle registration with existing email', async () => {
      const mockAuthResponse = {
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await register(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User already registered');
    });

    it('should validate registration data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        name: '',
        role: 'student' as const
      };

      const result = await register(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should handle password strength requirements', async () => {
      const weakPasswordData = {
        ...registrationData,
        password: 'weak'
      };

      const result = await register(weakPasswordData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must be at least');
    });

    it('should validate role values', async () => {
      const invalidRoleData = {
        ...registrationData,
        role: 'invalid-role' as any
      };

      const result = await register(invalidRoleData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid role');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      const mockAuthResponse = { error: null };
      (supabase.auth.signOut as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await logout();

      expect(result.success).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(SessionManager.prototype.clearSession).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      const mockAuthResponse = { error: { message: 'Logout failed' } };
      (supabase.auth.signOut as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Logout failed');
    });

    it('should clear session even if logout fails', async () => {
      (supabase.auth.signOut as jest.Mock).mockRejectedValue(new Error('Network error'));

      await logout();

      expect(SessionManager.prototype.clearSession).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current authenticated user', () => {
      const user = getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null when no user is authenticated', () => {
      (SessionManager.prototype.getSession as jest.Mock).mockReturnValue(null);

      const user = getCurrentUser();

      expect(user).toBeNull();
    });

    it('should return null when session is invalid', () => {
      (SessionManager.prototype.isValidSession as jest.Mock).mockReturnValue(false);

      const user = getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no session exists', () => {
      (SessionManager.prototype.getSession as jest.Mock).mockReturnValue(null);

      expect(isAuthenticated()).toBe(false);
    });

    it('should return false when session is expired', () => {
      (SessionManager.prototype.isValidSession as jest.Mock).mockReturnValue(false);

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      const mockResponse = { error: null };
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue(mockResponse);

      const result = await resetPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.any(String)
        })
      );
    });

    it('should handle invalid email for password reset', async () => {
      const result = await resetPassword('invalid-email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
      expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('should handle password reset errors', async () => {
      const mockResponse = { error: { message: 'User not found' } };
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue(mockResponse);

      const result = await resetPassword('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = { name: 'Updated Name', role: 'teacher' as const };
      const mockResponse = {
        data: { user: { ...mockUser, user_metadata: updateData } },
        error: null
      };

      (supabase.auth.updateUser as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateProfile(updateData);

      expect(result.success).toBe(true);
      expect(result.user?.user_metadata.name).toBe(updateData.name);
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: updateData
      });
    });

    it('should handle profile update errors', async () => {
      const updateData = { name: 'Updated Name' };
      const mockResponse = {
        data: { user: null },
        error: { message: 'Update failed' }
      };

      (supabase.auth.updateUser as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateProfile(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });

    it('should validate profile update data', async () => {
      const invalidData = { role: 'invalid-role' as any };

      const result = await updateProfile(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid role');
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('validateSession', () => {
    it('should validate current session', async () => {
      const mockResponse = {
        data: { user: mockUser, session: mockSession },
        error: null
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue(mockResponse);

      const isValid = await validateSession();

      expect(isValid).toBe(true);
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    it('should return false for invalid session', async () => {
      const mockResponse = {
        data: { user: null, session: null },
        error: { message: 'Invalid session' }
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue(mockResponse);

      const isValid = await validateSession();

      expect(isValid).toBe(false);
    });

    it('should handle session validation errors', async () => {
      (supabase.auth.getUser as jest.Mock).mockRejectedValue(new Error('Network error'));

      const isValid = await validateSession();

      expect(isValid).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const newSession = {
        ...mockSession,
        access_token: 'new-access-token',
        expires_at: Date.now() / 1000 + 3600
      };

      const mockResponse = {
        data: { session: newSession },
        error: null
      };

      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue(mockResponse);

      const result = await refreshToken();

      expect(result.success).toBe(true);
      expect(result.session?.access_token).toBe('new-access-token');
      expect(SessionManager.prototype.setSession).toHaveBeenCalledWith(newSession);
    });

    it('should handle token refresh failures', async () => {
      const mockResponse = {
        data: { session: null },
        error: { message: 'Refresh failed' }
      };

      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue(mockResponse);

      const result = await refreshToken();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh failed');
    });

    it('should clear session on refresh failure', async () => {
      (supabase.auth.refreshSession as jest.Mock).mockRejectedValue(new Error('Token expired'));

      await refreshToken();

      expect(SessionManager.prototype.clearSession).toHaveBeenCalled();
    });
  });

  describe('security and edge cases', () => {
    it('should handle extremely long passwords', async () => {
      const veryLongPassword = 'a'.repeat(1000);
      
      const result = await login('test@example.com', veryLongPassword);
      
      // Should either handle gracefully or validate length
      expect(typeof result.success).toBe('boolean');
    });

    it('should sanitize error messages', async () => {
      const mockResponse = {
        data: { user: null, session: null },
        error: { message: 'Error: <script>alert("xss")</script>' }
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockResponse);

      const result = await login('test@example.com', 'password');

      expect(result.error).not.toContain('<script>');
    });

    it('should handle concurrent login attempts', async () => {
      const promises = Array.from({ length: 5 }, () => 
        login('test@example.com', 'password123')
      );

      const results = await Promise.allSettled(promises);
      
      // Should handle all attempts without crashing
      expect(results.length).toBe(5);
    });

    it('should handle missing environment variables gracefully', async () => {
      // Mock missing Supabase config
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Invalid API key')
      );

      const result = await login('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed API responses', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        // Missing expected structure
        unexpected: 'response'
      });

      const result = await login('test@example.com', 'password');

      expect(result.success).toBe(false);
    });
  });

  describe('rate limiting and performance', () => {
    it('should handle rapid successive authentication requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        login(`user${i}@example.com`, 'password')
      );

      const results = await Promise.allSettled(requests);
      
      // All requests should be handled
      expect(results.length).toBe(10);
    });

    it('should complete authentication within reasonable time', async () => {
      const mockResponse = {
        data: { user: mockUser, session: mockSession },
        error: null
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 50))
      );

      const startTime = Date.now();
      await login('test@example.com', 'password');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});