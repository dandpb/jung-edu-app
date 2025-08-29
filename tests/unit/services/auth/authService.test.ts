/**
 * Comprehensive Unit Tests for AuthService
 * Tests all authentication methods, user management, and error scenarios
 */

import { AuthService } from '../../../../src/services/auth/authService';
import { 
  hashPassword, 
  verifyPassword, 
  generateSalt, 
  generateSecureToken,
  validatePassword 
} from '../../../../src/services/auth/crypto';
import {
  createAccessToken,
  createRefreshToken,
  validateToken,
  rotateTokens,
  storeTokens,
  clearTokens,
  getStoredTokens
} from '../../../../src/services/auth/jwt';
import {
  User,
  UserRole,
  LoginData,
  RegistrationData,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  AuthError,
  AuthErrorType,
  DEFAULT_PERMISSIONS
} from '../../../../src/types/auth';

// Mock dependencies
jest.mock('../../../../src/services/auth/crypto');
jest.mock('../../../../src/services/auth/jwt');

const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;
const mockGenerateSalt = generateSalt as jest.MockedFunction<typeof generateSalt>;
const mockGenerateSecureToken = generateSecureToken as jest.MockedFunction<typeof generateSecureToken>;
const mockValidatePassword = validatePassword as jest.MockedFunction<typeof validatePassword>;

const mockCreateAccessToken = createAccessToken as jest.MockedFunction<typeof createAccessToken>;
const mockCreateRefreshToken = createRefreshToken as jest.MockedFunction<typeof createRefreshToken>;
const mockValidateToken = validateToken as jest.MockedFunction<typeof validateToken>;
const mockRotateTokens = rotateTokens as jest.MockedFunction<typeof rotateTokens>;
const mockStoreTokens = storeTokens as jest.MockedFunction<typeof storeTokens>;
const mockClearTokens = clearTokens as jest.MockedFunction<typeof clearTokens>;
const mockGetStoredTokens = getStoredTokens as jest.MockedFunction<typeof getStoredTokens>;

describe('AuthService', () => {
  let authService: AuthService;
  
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    salt: 'random-salt',
    role: UserRole.STUDENT,
    permissions: DEFAULT_PERMISSIONS[UserRole.STUDENT],
    profile: {
      firstName: 'Test',
      lastName: 'User',
      preferences: {
        theme: 'light',
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
    isVerified: false,
    verificationToken: 'verification-token'
  };

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
    localStorage.clear();

    // Default mock implementations
    mockGenerateSalt.mockReturnValue('random-salt');
    mockGenerateSecureToken.mockReturnValue('secure-token');
    mockHashPassword.mockResolvedValue('hashed-password');
    mockValidatePassword.mockReturnValue({
      valid: true,
      errors: [],
      strength: 'strong'
    });
    mockVerifyPassword.mockResolvedValue(true);
    mockCreateAccessToken.mockResolvedValue('access-token');
    mockCreateRefreshToken.mockResolvedValue('refresh-token');
    mockGetStoredTokens.mockReturnValue({
      accessToken: null,
      refreshToken: null
    });
  });

  describe('User Registration', () => {
    const validRegistrationData: RegistrationData = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'SecurePass123!',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.STUDENT
    };

    it('should register a new user successfully', async () => {
      const result = await authService.register(validRegistrationData);

      expect(result).toMatchObject({
        email: validRegistrationData.email,
        username: validRegistrationData.username,
        role: validRegistrationData.role,
        profile: {
          firstName: validRegistrationData.firstName,
          lastName: validRegistrationData.lastName
        },
        isActive: true,
        isVerified: false
      });

      expect(mockValidatePassword).toHaveBeenCalledWith(
        validRegistrationData.password,
        validRegistrationData.username
      );
      expect(mockHashPassword).toHaveBeenCalledWith(
        validRegistrationData.password,
        'random-salt'
      );
    });

    it('should reject registration with invalid password', async () => {
      mockValidatePassword.mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters long'],
        strength: 'weak'
      });

      await expect(authService.register(validRegistrationData))
        .rejects
        .toThrow(AuthError);

      await expect(authService.register(validRegistrationData))
        .rejects
        .toMatchObject({
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Password does not meet requirements'
        });
    });

    it('should reject registration with existing email', async () => {
      // Register first user
      await authService.register(validRegistrationData);

      // Try to register with same email
      const duplicateData = { ...validRegistrationData, username: 'different' };
      
      await expect(authService.register(duplicateData))
        .rejects
        .toThrow(AuthError);

      await expect(authService.register(duplicateData))
        .rejects
        .toMatchObject({
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Email already registered'
        });
    });

    it('should reject registration with existing username', async () => {
      // Register first user
      await authService.register(validRegistrationData);

      // Try to register with same username
      const duplicateData = { ...validRegistrationData, email: 'different@example.com' };
      
      await expect(authService.register(duplicateData))
        .rejects
        .toThrow(AuthError);

      await expect(authService.register(duplicateData))
        .rejects
        .toMatchObject({
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Username already taken'
        });
    });

    it('should create user with default role if not specified', async () => {
      const { role, ...dataWithoutRole } = validRegistrationData;
      
      const result = await authService.register(dataWithoutRole);

      expect(result.role).toBe(UserRole.STUDENT);
      expect(result.permissions).toEqual(DEFAULT_PERMISSIONS[UserRole.STUDENT]);
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Register a user first
      await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      });
    });

    const validLoginData: LoginData = {
      username: 'testuser',
      password: 'SecurePass123!'
    };

    it('should login successfully with valid credentials', async () => {
      const result = await authService.login(validLoginData);

      expect(result).toMatchObject({
        user: expect.objectContaining({
          email: 'test@example.com',
          username: 'testuser'
        }),
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 15 * 60 * 1000
      });

      expect(mockCreateAccessToken).toHaveBeenCalled();
      expect(mockCreateRefreshToken).toHaveBeenCalled();
      expect(mockStoreTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should fail login with invalid username', async () => {
      const invalidLoginData = { ...validLoginData, username: 'nonexistent' };

      await expect(authService.login(invalidLoginData))
        .rejects
        .toThrow(AuthError);

      await expect(authService.login(invalidLoginData))
        .rejects
        .toMatchObject({
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Invalid username or password'
        });
    });

    it('should fail login with invalid password', async () => {
      mockVerifyPassword.mockResolvedValue(false);
      
      const invalidLoginData = { ...validLoginData, password: 'wrongpassword' };

      await expect(authService.login(invalidLoginData))
        .rejects
        .toThrow(AuthError);

      await expect(authService.login(invalidLoginData))
        .rejects
        .toMatchObject({
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Invalid username or password'
        });
    });

    it('should handle rate limiting for failed login attempts', async () => {
      mockVerifyPassword.mockResolvedValue(false);
      const invalidLoginData = { ...validLoginData, password: 'wrongpassword' };

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await authService.login(invalidLoginData);
        } catch (error) {
          // Expected to fail
        }
      }

      // 6th attempt should be rate limited
      await expect(authService.login(invalidLoginData))
        .rejects
        .toMatchObject({
          type: AuthErrorType.ACCOUNT_LOCKED,
          message: expect.stringContaining('Account locked due to multiple failed login attempts')
        });
    });

    it('should clear rate limiting after timeout', async () => {
      jest.useFakeTimers();
      mockVerifyPassword.mockResolvedValue(false);
      
      const invalidLoginData = { ...validLoginData, password: 'wrongpassword' };

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await authService.login(invalidLoginData);
        } catch (error) {
          // Expected to fail
        }
      }

      // Fast forward past rate limit timeout (30 minutes)
      jest.advanceTimersByTime(31 * 60 * 1000);

      // Reset password verification to succeed
      mockVerifyPassword.mockResolvedValue(true);

      // Should be able to login again
      const result = await authService.login(validLoginData);
      expect(result.accessToken).toBe('access-token');

      jest.useRealTimers();
    });

    it('should fail login for inactive user', async () => {
      // Create user directly in storage with inactive status
      const inactiveUser = { ...mockUser, isActive: false };
      localStorage.setItem('jungApp_users', JSON.stringify({
        [inactiveUser.id]: inactiveUser
      }));

      await expect(authService.login(validLoginData))
        .rejects
        .toMatchObject({
          type: AuthErrorType.ACCOUNT_INACTIVE,
          message: 'Account is inactive'
        });
    });

    it('should create session on successful login', async () => {
      const loginDataWithDevice = {
        ...validLoginData,
        deviceId: 'device-123',
        deviceName: 'Test Device',
        rememberMe: true
      };

      const result = await authService.login(loginDataWithDevice);

      expect(result.user).toBeDefined();
      expect(result.user.security.sessions).toHaveLength(1);
      expect(result.user.security.sessions[0]).toMatchObject({
        deviceId: 'device-123',
        deviceName: 'Test Device',
        isActive: true
      });
    });
  });

  describe('User Logout', () => {
    it('should logout successfully', async () => {
      await authService.logout();

      expect(mockClearTokens).toHaveBeenCalled();
    });

    it('should logout with session ID', async () => {
      const sessionId = 'session-123';
      
      await authService.logout(sessionId);

      expect(mockClearTokens).toHaveBeenCalled();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token successfully', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: 'old-access-token',
        refreshToken: 'valid-refresh-token'
      });

      mockRotateTokens.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });

      mockValidateToken.mockResolvedValue({
        valid: true,
        payload: {
          sub: 'user-123',
          email: 'test@example.com',
          role: UserRole.STUDENT,
          permissions: []
        }
      });

      // Create user in storage
      localStorage.setItem('jungApp_users', JSON.stringify({
        'user-123': mockUser
      }));

      const result = await authService.refreshAccessToken();

      expect(result).toMatchObject({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 15 * 60 * 1000
      });

      expect(mockStoreTokens).toHaveBeenCalledWith('new-access-token', 'new-refresh-token');
    });

    it('should return null if no refresh token', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: null,
        refreshToken: null
      });

      const result = await authService.refreshAccessToken();

      expect(result).toBeNull();
    });

    it('should clear tokens if refresh fails', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: 'old-access-token',
        refreshToken: 'invalid-refresh-token'
      });

      mockRotateTokens.mockResolvedValue(null);

      const result = await authService.refreshAccessToken();

      expect(result).toBeNull();
      expect(mockClearTokens).toHaveBeenCalled();
    });
  });

  describe('Password Management', () => {
    beforeEach(async () => {
      // Register a user first
      await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      });
    });

    describe('Password Reset Request', () => {
      it('should handle password reset request for existing user', async () => {
        const resetRequest: PasswordResetRequest = {
          email: 'test@example.com'
        };

        await authService.requestPasswordReset(resetRequest);

        // Should not throw error for existing user
        expect(mockGenerateSecureToken).toHaveBeenCalled();
      });

      it('should silently handle password reset for non-existent user', async () => {
        const resetRequest: PasswordResetRequest = {
          email: 'nonexistent@example.com'
        };

        await authService.requestPasswordReset(resetRequest);

        // Should not throw error (security: don't reveal if email exists)
        expect(mockGenerateSecureToken).not.toHaveBeenCalled();
      });
    });

    describe('Password Reset Confirmation', () => {
      let resetToken: string;

      beforeEach(async () => {
        resetToken = 'reset-token';
        mockGenerateSecureToken.mockReturnValue(resetToken);
        
        await authService.requestPasswordReset({ email: 'test@example.com' });
      });

      it('should reset password with valid token', async () => {
        const resetData: PasswordResetConfirm = {
          token: resetToken,
          newPassword: 'NewSecurePass456!'
        };

        await authService.resetPassword(resetData);

        expect(mockValidatePassword).toHaveBeenCalledWith(resetData.newPassword, 'testuser');
        expect(mockHashPassword).toHaveBeenCalledWith(resetData.newPassword, expect.any(String));
      });

      it('should fail password reset with invalid token', async () => {
        const resetData: PasswordResetConfirm = {
          token: 'invalid-token',
          newPassword: 'NewSecurePass456!'
        };

        await expect(authService.resetPassword(resetData))
          .rejects
          .toMatchObject({
            type: AuthErrorType.TOKEN_INVALID,
            message: 'Invalid or expired reset token'
          });
      });

      it('should fail password reset with expired token', async () => {
        jest.useFakeTimers();
        
        // Fast forward past expiration (1 hour)
        jest.advanceTimersByTime(61 * 60 * 1000);

        const resetData: PasswordResetConfirm = {
          token: resetToken,
          newPassword: 'NewSecurePass456!'
        };

        await expect(authService.resetPassword(resetData))
          .rejects
          .toMatchObject({
            type: AuthErrorType.TOKEN_INVALID,
            message: 'Invalid or expired reset token'
          });

        jest.useRealTimers();
      });

      it('should reject weak password in reset', async () => {
        mockValidatePassword.mockReturnValue({
          valid: false,
          errors: ['Password is too weak'],
          strength: 'weak'
        });

        const resetData: PasswordResetConfirm = {
          token: resetToken,
          newPassword: 'weak'
        };

        await expect(authService.resetPassword(resetData))
          .rejects
          .toMatchObject({
            type: AuthErrorType.INVALID_CREDENTIALS,
            message: 'Password does not meet requirements'
          });
      });
    });

    describe('Password Change', () => {
      let userId: string;

      beforeEach(async () => {
        // Get user ID from registered user
        const stored = localStorage.getItem('jungApp_users');
        if (stored) {
          const users = JSON.parse(stored);
          userId = Object.keys(users)[0];
        }
      });

      it('should change password successfully', async () => {
        const changeData: ChangePasswordRequest = {
          currentPassword: 'SecurePass123!',
          newPassword: 'NewSecurePass789!'
        };

        await authService.changePassword(userId, changeData);

        expect(mockVerifyPassword).toHaveBeenCalledWith(
          changeData.currentPassword,
          expect.any(String),
          expect.any(String)
        );
        expect(mockHashPassword).toHaveBeenCalledWith(changeData.newPassword, expect.any(String));
      });

      it('should fail password change with wrong current password', async () => {
        mockVerifyPassword.mockResolvedValue(false);

        const changeData: ChangePasswordRequest = {
          currentPassword: 'wrongpassword',
          newPassword: 'NewSecurePass789!'
        };

        await expect(authService.changePassword(userId, changeData))
          .rejects
          .toMatchObject({
            type: AuthErrorType.INVALID_CREDENTIALS,
            message: 'Current password is incorrect'
          });
      });

      it('should fail password change for non-existent user', async () => {
        const changeData: ChangePasswordRequest = {
          currentPassword: 'SecurePass123!',
          newPassword: 'NewSecurePass789!'
        };

        await expect(authService.changePassword('nonexistent', changeData))
          .rejects
          .toMatchObject({
            type: AuthErrorType.INVALID_CREDENTIALS,
            message: 'User not found'
          });
      });

      it('should reject weak new password', async () => {
        mockValidatePassword.mockReturnValue({
          valid: false,
          errors: ['Password is too weak'],
          strength: 'weak'
        });

        const changeData: ChangePasswordRequest = {
          currentPassword: 'SecurePass123!',
          newPassword: 'weak'
        };

        await expect(authService.changePassword(userId, changeData))
          .rejects
          .toMatchObject({
            type: AuthErrorType.INVALID_CREDENTIALS,
            message: 'Password does not meet requirements'
          });
      });
    });
  });

  describe('Email Verification', () => {
    beforeEach(async () => {
      // Register a user with verification token
      await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      });
    });

    it('should verify email with valid token', async () => {
      await authService.verifyEmail('secure-token');

      // Check that user is now verified
      const stored = localStorage.getItem('jungApp_users');
      if (stored) {
        const users = JSON.parse(stored);
        const user = Object.values(users)[0] as User;
        expect(user.isVerified).toBe(true);
        expect(user.verificationToken).toBeUndefined();
      }
    });

    it('should fail email verification with invalid token', async () => {
      await expect(authService.verifyEmail('invalid-token'))
        .rejects
        .toMatchObject({
          type: AuthErrorType.TOKEN_INVALID,
          message: 'Invalid verification token'
        });
    });
  });

  describe('Current User', () => {
    it('should return current user with valid token', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: 'valid-token',
        refreshToken: 'refresh-token'
      });

      mockValidateToken.mockResolvedValue({
        valid: true,
        payload: {
          sub: 'user-123'
        }
      });

      localStorage.setItem('jungApp_users', JSON.stringify({
        'user-123': mockUser
      }));

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null if no token', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: null,
        refreshToken: null
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null if token is invalid', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: 'invalid-token',
        refreshToken: 'refresh-token'
      });

      mockValidateToken.mockResolvedValue({
        valid: false,
        error: 'Token expired'
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('Permission Checking', () => {
    beforeEach(() => {
      localStorage.setItem('jungApp_users', JSON.stringify({
        'user-123': mockUser,
        'admin-123': { ...mockUser, id: 'admin-123', role: UserRole.SUPER_ADMIN }
      }));
    });

    it('should check permission for regular user', async () => {
      const result = await authService.hasPermission('user-123', 'module', 'read');

      expect(result).toBe(true);
    });

    it('should grant all permissions to super admin', async () => {
      const result = await authService.hasPermission('admin-123', 'any-resource', 'any-action');

      expect(result).toBe(true);
    });

    it('should deny permission for non-existent user', async () => {
      const result = await authService.hasPermission('nonexistent', 'module', 'read');

      expect(result).toBe(false);
    });

    it('should deny permission user does not have', async () => {
      const result = await authService.hasPermission('user-123', 'module', 'delete');

      expect(result).toBe(false);
    });
  });

  describe('User Profile Updates', () => {
    beforeEach(() => {
      localStorage.setItem('jungApp_users', JSON.stringify({
        'user-123': mockUser
      }));
    });

    it('should update user profile', async () => {
      const updates = {
        profile: {
          ...mockUser.profile,
          firstName: 'Updated'
        }
      };

      const result = await authService.updateProfile('user-123', updates);

      expect(result.profile.firstName).toBe('Updated');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should fail to update non-existent user', async () => {
      await expect(authService.updateProfile('nonexistent', {}))
        .rejects
        .toMatchObject({
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'User not found'
        });
    });
  });

  describe('Session Validation', () => {
    it('should validate session when authenticated', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: 'valid-token',
        refreshToken: 'refresh-token'
      });

      mockValidateToken.mockResolvedValue({
        valid: true,
        payload: { sub: 'user-123' }
      });

      localStorage.setItem('jungApp_users', JSON.stringify({
        'user-123': mockUser
      }));

      const result = await authService.validateSession();

      expect(result).toBe(true);
    });

    it('should invalidate session when not authenticated', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: null,
        refreshToken: null
      });

      const result = await authService.validateSession();

      expect(result).toBe(false);
    });

    it('should handle validation errors gracefully', async () => {
      mockGetStoredTokens.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await authService.validateSession();

      expect(result).toBe(false);
    });
  });

  describe('Rate Limiting Edge Cases', () => {
    beforeEach(async () => {
      // Register a user
      await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      });
    });

    it('should handle rate limiting per username (case insensitive)', async () => {
      mockVerifyPassword.mockResolvedValue(false);

      // Make failed attempts with different cases
      const attempts = [
        'testuser',
        'TestUser', 
        'TESTUSER',
        'testUSER',
        'TESTuser'
      ];

      for (const username of attempts) {
        try {
          await authService.login({ username, password: 'wrong' });
        } catch (error) {
          // Expected to fail
        }
      }

      // Next attempt should be rate limited
      await expect(authService.login({ username: 'testuser', password: 'wrong' }))
        .rejects
        .toMatchObject({
          type: AuthErrorType.ACCOUNT_LOCKED
        });
    });
  });

  describe('Storage Error Handling', () => {
    it('should handle localStorage save errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock localStorage to throw
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw, just log warning
      await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save users to localStorage:',
        expect.any(Error)
      );

      // Restore
      Storage.prototype.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should handle localStorage load errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Put invalid JSON in localStorage
      localStorage.setItem('jungApp_users', 'invalid json');

      // Creating new service should not throw
      const newAuthService = new AuthService();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load users from localStorage:',
        expect.any(SyntaxError)
      );

      consoleSpy.mockRestore();
    });
  });
});