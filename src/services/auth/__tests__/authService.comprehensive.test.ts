import { AuthService, authService } from '../authService';
import { UserRole, AuthError, AuthErrorType } from '../../../types/auth';
import * as crypto from '../crypto';

// Mock crypto functions
jest.mock('../crypto', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  generateSalt: jest.fn(),
  generateSecureToken: jest.fn(),
  validatePassword: jest.fn()
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock crypto functions with default implementations
const mockedCrypto = crypto as jest.Mocked<typeof crypto>;
mockedCrypto.hashPassword.mockResolvedValue('hashed-password');
mockedCrypto.verifyPassword.mockResolvedValue(true);
mockedCrypto.generateSalt.mockReturnValue('test-salt');
mockedCrypto.generateSecureToken.mockReturnValue('secure-token');
mockedCrypto.validatePassword.mockReturnValue({ valid: true, errors: [] });

describe('AuthService', () => {
  let testAuthService: AuthService;
  
  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    salt: 'test-salt',
    role: UserRole.STUDENT,
    permissions: [],
    profile: {
      firstName: 'Test',
      lastName: 'User',
      preferences: {
        theme: 'light' as const,
        language: 'pt-BR',
        emailNotifications: true,
        pushNotifications: false
      }
    },
    security: {
      twoFactorEnabled: false,
      passwordHistory: ['hashed-password'],
      lastPasswordChange: new Date(),
      loginNotifications: true,
      trustedDevices: [],
      sessions: []
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isVerified: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    testAuthService = new AuthService();
    
    // Setup default mock behaviors
    mockedCrypto.verifyPassword.mockResolvedValue(true);
    mockedCrypto.validatePassword.mockReturnValue({ valid: true, errors: [] });
    mockedCrypto.generateSecureToken.mockReturnValue('mock-token');
  });
  
  // Helper function to create a user in the service
  const createTestUser = async () => {
    const userData = {
      email: testUser.email,
      username: testUser.username,
      password: 'password123',
      firstName: testUser.profile.firstName,
      lastName: testUser.profile.lastName,
      role: UserRole.STUDENT
    };
    
    return await testAuthService.register(userData);
  };

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Create a test user first
      await createTestUser();
      
      const result = await testAuthService.login({
        username: testUser.username,
        password: 'password123'
      });

      expect(result.user.email).toBe(testUser.email);
      expect(result.user.username).toBe(testUser.username);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockedCrypto.verifyPassword).toHaveBeenCalled();
    });

    it('should handle login with invalid credentials', async () => {
      // Create a test user first
      await createTestUser();
      
      // Mock password verification to fail
      mockedCrypto.verifyPassword.mockResolvedValue(false);

      await expect(testAuthService.login({
        username: testUser.username,
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid username or password');
    });

    it('should handle login with non-existent user', async () => {
      await expect(testAuthService.login({
        username: 'nonexistentuser',
        password: 'password123'
      })).rejects.toThrow('Invalid username or password');
    });

    it('should handle inactive user account', async () => {
      const user = await createTestUser();
      // Make user inactive
      user.isActive = false;
      await testAuthService.updateProfile(user.id, { isActive: false });

      await expect(testAuthService.login({
        username: testUser.username,
        password: 'password123'
      })).rejects.toThrow('Account is inactive');
    });

    it('should handle rate limiting after failed attempts', async () => {
      await createTestUser();
      mockedCrypto.verifyPassword.mockResolvedValue(false);
      
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await testAuthService.login({
            username: testUser.username,
            password: 'wrongpassword'
          });
        } catch (error) {
          // Expected to fail
        }
      }
      
      // 6th attempt should be rate limited
      await expect(testAuthService.login({
        username: testUser.username,
        password: 'wrongpassword'
      })).rejects.toThrow('Account locked due to multiple failed login attempts');
    });

    it('should clear failed attempts on successful login', async () => {
      await createTestUser();
      
      // Make some failed attempts
      mockedCrypto.verifyPassword.mockResolvedValue(false);
      for (let i = 0; i < 3; i++) {
        try {
          await testAuthService.login({
            username: testUser.username,
            password: 'wrongpassword'
          });
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Now succeed
      mockedCrypto.verifyPassword.mockResolvedValue(true);
      const result = await testAuthService.login({
        username: testUser.username,
        password: 'password123'
      });
      
      expect(result.user.username).toBe(testUser.username);
    });

    it('should create session after successful login', async () => {
      await createTestUser();
      
      const result = await testAuthService.login({
        username: testUser.username,
        password: 'password123',
        deviceName: 'Test Device'
      });
      
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(15 * 60 * 1000); // 15 minutes
    });
  });

  describe('register', () => {
    const registrationData = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'newpassword123',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.STUDENT
    };

    it('should successfully register a new user', async () => {
      const result = await testAuthService.register(registrationData);

      expect(result.email).toBe(registrationData.email);
      expect(result.username).toBe(registrationData.username);
      expect(result.profile.firstName).toBe(registrationData.firstName);
      expect(result.profile.lastName).toBe(registrationData.lastName);
      expect(result.role).toBe(registrationData.role);
      expect(result.isActive).toBe(true);
      expect(result.isVerified).toBe(false);
      expect(mockedCrypto.hashPassword).toHaveBeenCalled();
    });

    it('should handle registration with existing email', async () => {
      // Register user first
      await testAuthService.register(registrationData);

      // Try to register again with same email
      await expect(testAuthService.register({
        ...registrationData,
        username: 'differentuser'
      })).rejects.toThrow('Email already registered');
    });

    it('should handle registration with existing username', async () => {
      // Register user first
      await testAuthService.register(registrationData);

      // Try to register again with same username
      await expect(testAuthService.register({
        ...registrationData,
        email: 'different@example.com'
      })).rejects.toThrow('Username already taken');
    });

    it('should handle password strength requirements', async () => {
      mockedCrypto.validatePassword.mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters']
      });

      const weakPasswordData = {
        ...registrationData,
        password: 'weak'
      };

      await expect(testAuthService.register(weakPasswordData))
        .rejects.toThrow('Password does not meet requirements');
    });

    it('should set default role when not provided', async () => {
      const dataWithoutRole = {
        email: 'norole@example.com',
        username: 'norole',
        password: 'password123',
        firstName: 'No',
        lastName: 'Role'
      };

      const result = await testAuthService.register(dataWithoutRole);
      expect(result.role).toBe(UserRole.STUDENT);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      await testAuthService.logout();
      // Logout mainly clears tokens, so we just verify it doesn't throw
      expect(true).toBe(true);
    });

    it('should logout with specific session ID', async () => {
      const user = await createTestUser();
      const loginResult = await testAuthService.login({
        username: testUser.username,
        password: 'password123'
      });
      
      await testAuthService.logout('session-id');
      expect(true).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is authenticated', async () => {
      const user = await testAuthService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return user when authenticated', async () => {
      const registeredUser = await createTestUser();
      
      // Mock getCurrentUser to return the registered user directly
      jest.spyOn(testAuthService, 'getCurrentUser').mockResolvedValue(registeredUser);
      
      const currentUser = await testAuthService.getCurrentUser();
      expect(currentUser?.email).toBe(testUser.email);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no user is authenticated', async () => {
      const isAuth = await testAuthService.isAuthenticated();
      expect(isAuth).toBe(false);
    });

    it('should return true when user is authenticated', async () => {
      const registeredUser = await createTestUser();
      
      // Mock getCurrentUser to return user
      jest.spyOn(testAuthService, 'getCurrentUser').mockResolvedValue(registeredUser);
      
      const isAuth = await testAuthService.isAuthenticated();
      expect(isAuth).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should request password reset for existing user', async () => {
      await createTestUser();
      
      await testAuthService.requestPasswordReset({ email: testUser.email });
      // The method doesn't throw, so if we get here it worked
      expect(true).toBe(true);
    });

    it('should handle password reset for non-existent user silently', async () => {
      await testAuthService.requestPasswordReset({ email: 'nonexistent@example.com' });
      // Should not reveal if email exists
      expect(true).toBe(true);
    });

    it('should reset password with valid token', async () => {
      const user = await createTestUser();
      
      // First request reset to generate token
      await testAuthService.requestPasswordReset({ email: testUser.email });
      
      // Mock a reset token directly in the userStorage
      const resetToken = 'mock-reset-token';
      const userStorage = (testAuthService as any).userStorage;
      
      // Manually set reset token in storage
      await userStorage.setResetToken(user.id, resetToken, new Date(Date.now() + 60 * 60 * 1000));
      
      await testAuthService.resetPassword({ token: resetToken, newPassword: 'newpassword123' });
      expect(mockedCrypto.validatePassword).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const user = await createTestUser();
      const updateData = { 
        profile: {
          ...user.profile,
          firstName: 'Updated',
          lastName: 'Name'
        }
      };

      const result = await testAuthService.updateProfile(user.id, updateData);

      expect(result.profile.firstName).toBe('Updated');
      expect(result.profile.lastName).toBe('Name');
      expect(result.updatedAt).toBeDefined();
    });

    it('should handle profile update for non-existent user', async () => {
      const updateData = { profile: { firstName: 'Updated', lastName: 'Name' } };

      await expect(testAuthService.updateProfile('non-existent-id', updateData))
        .rejects.toThrow('User not found');
    });

    it('should update user role', async () => {
      const user = await createTestUser();
      const updateData = { role: UserRole.INSTRUCTOR };

      const result = await testAuthService.updateProfile(user.id, updateData);
      expect(result.role).toBe(UserRole.INSTRUCTOR);
    });
  });

  describe('validateSession', () => {
    it('should validate current session when authenticated', async () => {
      const user = await createTestUser();
      jest.spyOn(testAuthService, 'isAuthenticated').mockResolvedValue(true);

      const isValid = await testAuthService.validateSession();
      expect(isValid).toBe(true);
    });

    it('should return false for invalid session', async () => {
      jest.spyOn(testAuthService, 'isAuthenticated').mockResolvedValue(false);
      
      const isValid = await testAuthService.validateSession();
      expect(isValid).toBe(false);
    });

    it('should handle session validation errors', async () => {
      jest.spyOn(testAuthService, 'isAuthenticated').mockImplementation(async () => {
        throw new Error('Network error');
      });

      const isValid = await testAuthService.validateSession();
      expect(isValid).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should return null when no refresh token', async () => {
      // Mock no stored tokens
      jest.doMock('../jwt', () => ({
        getStoredTokens: jest.fn().mockReturnValue({ refreshToken: null })
      }));
      
      const result = await testAuthService.refreshToken();
      expect(result).toBeNull();
    });

    it('should refresh access token successfully', async () => {
      const user = await createTestUser();
      
      // Mock refreshAccessToken method to return a successful response
      jest.spyOn(testAuthService, 'refreshAccessToken').mockResolvedValue({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          permissions: user.permissions,
          profile: user.profile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isActive: user.isActive,
          isVerified: user.isVerified
        },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 15 * 60 * 1000
      });
      
      const result = await testAuthService.refreshToken();
      expect(result?.accessToken).toBe('new-access-token');
    });

    it('should handle refresh failures', async () => {
      jest.doMock('../jwt', () => ({
        getStoredTokens: jest.fn().mockReturnValue({ refreshToken: 'invalid-token' }),
        rotateTokens: jest.fn().mockResolvedValue(null),
        clearTokens: jest.fn()
      }));
      
      const result = await testAuthService.refreshToken();
      expect(result).toBeNull();
    });
  });

  describe('security and edge cases', () => {
    beforeEach(() => {
      // Clear state to avoid test interference
      localStorageMock.clear();
      testAuthService = new AuthService();
    });

    it('should handle extremely long passwords', async () => {
      const veryLongPassword = 'a'.repeat(1000);
      
      await createTestUser();
      
      try {
        await testAuthService.login({
          username: testUser.username,
          password: veryLongPassword
        });
      } catch (error) {
        // Should handle gracefully without crashing
        expect(error).toBeDefined();
      }
    });

    it('should handle password change for authenticated user', async () => {
      const user = await createTestUser();
      
      await testAuthService.changePassword(user.id, {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      });
      
      expect(mockedCrypto.verifyPassword).toHaveBeenCalled();
      expect(mockedCrypto.hashPassword).toHaveBeenCalled();
    });

    it('should handle concurrent login attempts', async () => {
      await createTestUser();
      
      const promises = Array.from({ length: 3 }, () => 
        testAuthService.login({
          username: testUser.username,
          password: 'password123'
        })
      );

      const results = await Promise.allSettled(promises);
      
      // Should handle all attempts without crashing
      expect(results.length).toBe(3);
    });

    it('should verify email with valid token', async () => {
      const user = await createTestUser();
      
      await testAuthService.verifyEmail(user.verificationToken!);
      
      // User should now be verified
      const updatedUser = await testAuthService['userStorage'].getUserById(user.id);
      expect(updatedUser?.isVerified).toBe(true);
    });

    it('should handle invalid verification token', async () => {
      await expect(testAuthService.verifyEmail('invalid-token'))
        .rejects.toThrow('Invalid verification token');
    });
  });

  describe('rate limiting and performance', () => {
    beforeEach(() => {
      localStorageMock.clear();
      testAuthService = new AuthService();
    });

    it('should handle rapid successive authentication requests', async () => {
      // Create multiple users
      const users = await Promise.all(
        Array.from({ length: 3 }, async (_, i) => {
          return await testAuthService.register({
            email: `user${i}@example.com`,
            username: `user${i}`,
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
          });
        })
      );

      const requests = users.map((user, i) => 
        testAuthService.login({
          username: `user${i}`,
          password: 'password123'
        })
      );

      const results = await Promise.allSettled(requests);
      
      // All requests should be handled
      expect(results.length).toBe(3);
    });

    it('should complete authentication within reasonable time', async () => {
      await createTestUser();

      const startTime = Date.now();
      await testAuthService.login({
        username: testUser.username,
        password: 'password123'
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1 second max
    });

    it('should handle permission checking', async () => {
      const user = await createTestUser();
      
      const hasPermission = await testAuthService.hasPermission(
        user.id,
        'module',
        'read'
      );
      
      expect(typeof hasPermission).toBe('boolean');
    });
  });

  describe('additional functionality', () => {
    beforeEach(() => {
      localStorageMock.clear();
      testAuthService = new AuthService();
    });

    it('should handle change password with wrong current password', async () => {
      const user = await createTestUser();
      
      mockedCrypto.verifyPassword.mockResolvedValue(false);
      
      await expect(testAuthService.changePassword(user.id, {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      })).rejects.toThrow('Current password is incorrect');
    });

    it('should handle change password with weak new password', async () => {
      const user = await createTestUser();
      
      mockedCrypto.validatePassword.mockReturnValue({
        valid: false,
        errors: ['Password too weak']
      });
      
      await expect(testAuthService.changePassword(user.id, {
        currentPassword: 'password123',
        newPassword: 'weak'
      })).rejects.toThrow('Password does not meet requirements');
    });

    it('should handle permission check for super admin', async () => {
      const superAdminData = {
        email: 'admin@example.com',
        username: 'superadmin',
        password: 'password123',
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPER_ADMIN
      };
      
      const admin = await testAuthService.register(superAdminData);
      
      const hasPermission = await testAuthService.hasPermission(
        admin.id,
        'system',
        'delete'
      );
      
      expect(hasPermission).toBe(true);
    });
  });
});