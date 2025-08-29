/**
 * Comprehensive Integration Tests for Token Expiration and Refresh
 * Tests the complete flow of token lifecycle, expiration, and refresh scenarios
 */

import { AuthService } from '../../../src/services/auth/authService';
import {
  createAccessToken,
  createRefreshToken,
  validateToken,
  isTokenExpired,
  rotateTokens,
  storeTokens,
  clearTokens,
  getStoredTokens
} from '../../../src/services/auth/jwt';
import {
  User,
  UserRole,
  DEFAULT_PERMISSIONS,
  AuthError,
  AuthErrorType
} from '../../../src/types/auth';

// Integration test: Don't mock the actual JWT and crypto functions
// Only mock storage and time-sensitive operations

describe('Token Expiration and Refresh Integration', () => {
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
    isVerified: true
  };

  beforeEach(() => {
    authService = new AuthService();
    localStorage.clear();
    
    // Store the mock user
    localStorage.setItem('jungApp_users', JSON.stringify({
      [mockUser.id]: mockUser
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Token Creation and Validation Flow', () => {
    it('should create valid tokens that pass validation', async () => {
      const accessToken = await createAccessToken(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        mockUser.permissions
      );
      
      const refreshToken = await createRefreshToken(mockUser.id);

      // Both tokens should be created
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');

      // Tokens should have proper JWT format
      expect(accessToken.split('.')).toHaveLength(3);
      expect(refreshToken.split('.')).toHaveLength(3);

      // Tokens should validate successfully
      const accessValidation = await validateToken(accessToken);
      const refreshValidation = await validateToken(refreshToken);

      expect(accessValidation.valid).toBe(true);
      expect(accessValidation.payload).toMatchObject({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });

      expect(refreshValidation.valid).toBe(true);
      expect(refreshValidation.payload).toMatchObject({
        sub: mockUser.id
      });
    });

    it('should create tokens that are not immediately expired', async () => {
      const accessToken = await createAccessToken(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        mockUser.permissions
      );
      
      const refreshToken = await createRefreshToken(mockUser.id);

      expect(isTokenExpired(accessToken)).toBe(false);
      expect(isTokenExpired(refreshToken)).toBe(false);
    });
  });

  describe('Token Expiration Scenarios', () => {
    it('should detect when access token expires naturally', async () => {
      jest.useFakeTimers();
      
      const accessToken = await createAccessToken(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        mockUser.permissions
      );

      // Token should be valid initially
      expect(isTokenExpired(accessToken)).toBe(false);

      // Fast forward past access token expiration (15 minutes + buffer)
      jest.advanceTimersByTime(16 * 60 * 1000);

      // Token should now be expired
      expect(isTokenExpired(accessToken)).toBe(true);
      
      // Validation should also fail
      const validation = await validateToken(accessToken);
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Token expired');
    });

    it('should detect when refresh token expires naturally', async () => {
      jest.useFakeTimers();
      
      const refreshToken = await createRefreshToken(mockUser.id);

      // Token should be valid initially
      expect(isTokenExpired(refreshToken)).toBe(false);

      // Fast forward past refresh token expiration (30 days + buffer)
      jest.advanceTimersByTime(31 * 24 * 60 * 60 * 1000);

      // Token should now be expired
      expect(isTokenExpired(refreshToken)).toBe(true);
      
      // Validation should also fail
      const validation = await validateToken(refreshToken);
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Token expired');
    });

    it('should handle edge case of token expiring exactly at boundary', async () => {
      jest.useFakeTimers();
      const startTime = Date.now();
      jest.setSystemTime(startTime);

      const accessToken = await createAccessToken(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        mockUser.permissions
      );

      // Move to exactly the expiration time
      jest.setSystemTime(startTime + (15 * 60 * 1000));

      // Token should be expired (boundary is exclusive)
      expect(isTokenExpired(accessToken)).toBe(true);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should successfully rotate tokens with valid refresh token', async () => {
      const originalRefreshToken = await createRefreshToken(mockUser.id, 'family-123');

      const getUserData = async (userId: string) => {
        if (userId !== mockUser.id) return null;
        return {
          email: mockUser.email,
          role: mockUser.role,
          permissions: mockUser.permissions
        };
      };

      const newTokens = await rotateTokens(originalRefreshToken, getUserData);

      expect(newTokens).not.toBeNull();
      expect(newTokens!.accessToken).toBeTruthy();
      expect(newTokens!.refreshToken).toBeTruthy();

      // New tokens should be different from original
      expect(newTokens!.accessToken).not.toBe(originalRefreshToken);
      expect(newTokens!.refreshToken).not.toBe(originalRefreshToken);

      // New tokens should be valid
      const accessValidation = await validateToken(newTokens!.accessToken);
      const refreshValidation = await validateToken(newTokens!.refreshToken);

      expect(accessValidation.valid).toBe(true);
      expect(refreshValidation.valid).toBe(true);
    });

    it('should fail rotation with invalid refresh token', async () => {
      const invalidRefreshToken = 'invalid.refresh.token';

      const getUserData = jest.fn();

      const newTokens = await rotateTokens(invalidRefreshToken, getUserData);

      expect(newTokens).toBeNull();
      expect(getUserData).not.toHaveBeenCalled();
    });

    it('should fail rotation with expired refresh token', async () => {
      jest.useFakeTimers();
      
      const refreshToken = await createRefreshToken(mockUser.id);

      // Expire the refresh token
      jest.advanceTimersByTime(31 * 24 * 60 * 60 * 1000);

      const getUserData = jest.fn();

      const newTokens = await rotateTokens(refreshToken, getUserData);

      expect(newTokens).toBeNull();
      expect(getUserData).not.toHaveBeenCalled();
    });

    it('should fail rotation when user data is not found', async () => {
      const refreshToken = await createRefreshToken('non-existent-user');

      const getUserData = async (userId: string) => {
        return null; // User not found
      };

      const newTokens = await rotateTokens(refreshToken, getUserData);

      expect(newTokens).toBeNull();
    });

    it('should maintain token family during rotation', async () => {
      const familyId = 'test-family-123';
      const originalRefreshToken = await createRefreshToken(mockUser.id, familyId);

      const getUserData = async () => ({
        email: mockUser.email,
        role: mockUser.role,
        permissions: mockUser.permissions
      });

      const newTokens = await rotateTokens(originalRefreshToken, getUserData);

      expect(newTokens).not.toBeNull();
      
      // Verify that the new refresh token maintains the same family
      const refreshValidation = await validateToken(newTokens!.refreshToken);
      expect(refreshValidation.payload.family).toBe(familyId);
    });
  });

  describe('AuthService Integration with Token Lifecycle', () => {
    it('should handle complete login to token refresh flow', async () => {
      // Register and login user
      await authService.register({
        email: mockUser.email,
        username: mockUser.username,
        password: 'TestPassword123!',
        firstName: mockUser.profile.firstName,
        lastName: mockUser.profile.lastName
      });

      const loginResponse = await authService.login({
        username: mockUser.username,
        password: 'TestPassword123!'
      });

      // Tokens should be created and stored
      expect(loginResponse.accessToken).toBeTruthy();
      expect(loginResponse.refreshToken).toBeTruthy();

      const storedTokens = getStoredTokens();
      expect(storedTokens.accessToken).toBe(loginResponse.accessToken);
      expect(storedTokens.refreshToken).toBe(loginResponse.refreshToken);

      // Should be able to get current user
      const currentUser = await authService.getCurrentUser();
      expect(currentUser).toBeTruthy();
      expect(currentUser!.email).toBe(mockUser.email);

      // Should be able to refresh tokens
      const refreshResponse = await authService.refreshAccessToken();
      expect(refreshResponse).not.toBeNull();
      expect(refreshResponse!.accessToken).not.toBe(loginResponse.accessToken);
      expect(refreshResponse!.refreshToken).not.toBe(loginResponse.refreshToken);
    });

    it('should handle expired access token with valid refresh token', async () => {
      jest.useFakeTimers();

      // Setup user and login
      await authService.register({
        email: mockUser.email,
        username: mockUser.username,
        password: 'TestPassword123!',
        firstName: mockUser.profile.firstName,
        lastName: mockUser.profile.lastName
      });

      await authService.login({
        username: mockUser.username,
        password: 'TestPassword123!'
      });

      // Fast forward to expire access token but not refresh token
      jest.advanceTimersByTime(16 * 60 * 1000); // 16 minutes

      // getCurrentUser should fail due to expired access token
      const userWithExpiredToken = await authService.getCurrentUser();
      expect(userWithExpiredToken).toBeNull();

      // But refresh should work
      const refreshResponse = await authService.refreshAccessToken();
      expect(refreshResponse).not.toBeNull();
      expect(refreshResponse!.accessToken).toBeTruthy();

      // After refresh, getCurrentUser should work again
      const userAfterRefresh = await authService.getCurrentUser();
      expect(userAfterRefresh).toBeTruthy();
      expect(userAfterRefresh!.email).toBe(mockUser.email);
    });

    it('should handle both tokens expired', async () => {
      jest.useFakeTimers();

      // Setup user and login
      await authService.register({
        email: mockUser.email,
        username: mockUser.username,
        password: 'TestPassword123!',
        firstName: mockUser.profile.firstName,
        lastName: mockUser.profile.lastName
      });

      await authService.login({
        username: mockUser.username,
        password: 'TestPassword123!'
      });

      // Fast forward to expire both tokens
      jest.advanceTimersByTime(31 * 24 * 60 * 60 * 1000); // 31 days

      // getCurrentUser should fail
      const userWithExpiredTokens = await authService.getCurrentUser();
      expect(userWithExpiredTokens).toBeNull();

      // Refresh should also fail
      const refreshResponse = await authService.refreshAccessToken();
      expect(refreshResponse).toBeNull();

      // Tokens should be cleared
      const storedTokens = getStoredTokens();
      expect(storedTokens.accessToken).toBeNull();
      expect(storedTokens.refreshToken).toBeNull();
    });

    it('should clear tokens when refresh fails', async () => {
      // Store invalid tokens
      storeTokens('invalid-access-token', 'invalid-refresh-token');

      const refreshResponse = await authService.refreshAccessToken();
      expect(refreshResponse).toBeNull();

      // Tokens should be cleared after failed refresh
      const storedTokens = getStoredTokens();
      expect(storedTokens.accessToken).toBeNull();
      expect(storedTokens.refreshToken).toBeNull();
    });
  });

  describe('Token Storage Integration', () => {
    it('should persist tokens through browser sessions', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      // Store tokens
      storeTokens(accessToken, refreshToken);

      // Verify immediate retrieval
      let storedTokens = getStoredTokens();
      expect(storedTokens.accessToken).toBe(accessToken);
      expect(storedTokens.refreshToken).toBe(refreshToken);

      // Simulate page reload by clearing memory but keeping localStorage
      const localStorageData = { ...localStorage };
      
      // Clear and restore localStorage to simulate browser session
      localStorage.clear();
      Object.keys(localStorageData).forEach(key => {
        localStorage.setItem(key, localStorageData[key]);
      });

      // Tokens should still be retrievable
      storedTokens = getStoredTokens();
      expect(storedTokens.accessToken).toBe(accessToken);
      expect(storedTokens.refreshToken).toBe(refreshToken);
    });

    it('should handle localStorage being unavailable', () => {
      const originalSetItem = Storage.prototype.setItem;
      const originalGetItem = Storage.prototype.getItem;
      const originalRemoveItem = Storage.prototype.removeItem;

      // Mock localStorage to throw errors
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage not available');
      });
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error('Storage not available');
      });
      Storage.prototype.removeItem = jest.fn(() => {
        throw new Error('Storage not available');
      });

      // Operations should not throw
      expect(() => storeTokens('access', 'refresh')).not.toThrow();
      expect(() => getStoredTokens()).not.toThrow();
      expect(() => clearTokens()).not.toThrow();

      // Should return null when storage is unavailable
      const tokens = getStoredTokens();
      expect(tokens.accessToken).toBeNull();
      expect(tokens.refreshToken).toBeNull();

      // Restore original methods
      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.getItem = originalGetItem;
      Storage.prototype.removeItem = originalRemoveItem;
    });
  });

  describe('Concurrent Token Operations', () => {
    it('should handle concurrent token refresh requests', async () => {
      // Setup user
      await authService.register({
        email: mockUser.email,
        username: mockUser.username,
        password: 'TestPassword123!',
        firstName: mockUser.profile.firstName,
        lastName: mockUser.profile.lastName
      });

      await authService.login({
        username: mockUser.username,
        password: 'TestPassword123!'
      });

      // Make multiple concurrent refresh requests
      const refreshPromises = Array(5).fill(null).map(() =>
        authService.refreshAccessToken()
      );

      const results = await Promise.all(refreshPromises);

      // All should succeed (or gracefully handle race conditions)
      results.forEach(result => {
        expect(result).not.toBeNull();
        expect(result!.accessToken).toBeTruthy();
        expect(result!.refreshToken).toBeTruthy();
      });
    });

    it('should handle concurrent validation requests', async () => {
      const accessToken = await createAccessToken(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        mockUser.permissions
      );

      // Make multiple concurrent validation requests
      const validationPromises = Array(10).fill(null).map(() =>
        validateToken(accessToken)
      );

      const results = await Promise.all(validationPromises);

      // All should succeed
      results.forEach(result => {
        expect(result.valid).toBe(true);
        expect(result.payload.sub).toBe(mockUser.id);
      });
    });
  });

  describe('Token Security Edge Cases', () => {
    it('should reject tokens with tampered signatures', async () => {
      const validToken = await createAccessToken(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        mockUser.permissions
      );

      const parts = validToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tampered-signature`;

      const validation = await validateToken(tamperedToken);
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Invalid signature');
    });

    it('should reject tokens with tampered payload', async () => {
      const validToken = await createAccessToken(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        mockUser.permissions
      );

      const parts = validToken.split('.');
      // Create a tampered payload (change user ID)
      const tamperedPayload = btoa(JSON.stringify({
        sub: 'hacker-123',
        email: mockUser.email,
        role: UserRole.SUPER_ADMIN,
        exp: Math.floor((Date.now() + 15 * 60 * 1000) / 1000)
      })).replace(/=/g, '');

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const validation = await validateToken(tamperedToken);
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Invalid signature');
    });

    it('should handle malformed tokens gracefully', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'only.two.parts',
        'too.many.parts.here.invalid',
        '',
        'single-string-no-dots',
        '..', // Empty parts
      ];

      for (const malformedToken of malformedTokens) {
        const validation = await validateToken(malformedToken);
        expect(validation.valid).toBe(false);
        expect(validation.error).toBeTruthy();
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle token operations efficiently at scale', async () => {
      const start = performance.now();

      // Create many tokens
      const tokenPromises = [];
      for (let i = 0; i < 100; i++) {
        tokenPromises.push(
          createAccessToken(
            `user-${i}`,
            `user${i}@example.com`,
            UserRole.STUDENT,
            DEFAULT_PERMISSIONS[UserRole.STUDENT]
          )
        );
      }

      const tokens = await Promise.all(tokenPromises);
      
      // Validate all tokens
      const validationPromises = tokens.map(token => validateToken(token));
      const validations = await Promise.all(validationPromises);

      const end = performance.now();

      // All operations should succeed
      expect(tokens).toHaveLength(100);
      expect(validations.every(v => v.valid)).toBe(true);
      
      // Should complete in reasonable time
      expect(end - start).toBeLessThan(5000); // Less than 5 seconds
    });
  });
});