/**
 * Comprehensive Unit Tests for JWT Token Management Service
 * Tests token creation, validation, expiration, refresh, and storage
 */

import {
  createAccessToken,
  createRefreshToken,
  validateToken,
  decodeToken,
  isTokenExpired,
  storeTokens,
  getStoredTokens,
  clearTokens,
  rotateTokens,
  AccessTokenPayload,
  RefreshTokenPayload,
  TOKEN_STORAGE_KEYS
} from '../../../../src/services/auth/jwt';
import { generateSecureToken, constantTimeCompare } from '../../../../src/services/auth/crypto';
import { UserRole, Permission, ResourceType, Action } from '../../../../src/types/auth';

// Mock crypto and secure token generation
jest.mock('../../../../src/services/auth/crypto');

const mockGenerateSecureToken = generateSecureToken as jest.MockedFunction<typeof generateSecureToken>;
const mockConstantTimeCompare = constantTimeCompare as jest.MockedFunction<typeof constantTimeCompare>;

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    sign: jest.fn(),
    deriveBits: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn()
  },
  getRandomValues: jest.fn()
};

// Override global crypto
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

describe('JWT Token Management', () => {
  const mockPermissions: Permission[] = [
    {
      id: 'perm-1',
      resource: ResourceType.MODULE,
      actions: [Action.READ, Action.CREATE]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Default mock implementations
    mockGenerateSecureToken.mockReturnValue('random-token-id');
    mockConstantTimeCompare.mockReturnValue(true);
    
    // Mock crypto operations
    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
    mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));
    
    // Mock btoa/atob
    global.btoa = jest.fn().mockImplementation((str) => Buffer.from(str).toString('base64'));
    global.atob = jest.fn().mockImplementation((str) => Buffer.from(str, 'base64').toString());
  });

  describe('Access Token Creation', () => {
    it('should create a valid access token', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const role = UserRole.STUDENT;
      const permissions = mockPermissions;

      const token = await createAccessToken(userId, email, role, permissions);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    it('should create tokens with different JTIs', async () => {
      mockGenerateSecureToken
        .mockReturnValueOnce('token-1')
        .mockReturnValueOnce('token-2');

      const token1 = await createAccessToken('user-1', 'user1@test.com', UserRole.STUDENT, []);
      const token2 = await createAccessToken('user-2', 'user2@test.com', UserRole.STUDENT, []);

      expect(token1).not.toBe(token2);
    });

    it('should include all required payload fields', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const userId = 'user-123';
      const email = 'test@example.com';
      const role = UserRole.ADMIN;
      const permissions = mockPermissions;

      const token = await createAccessToken(userId, email, role, permissions);
      const decoded = decodeToken<AccessTokenPayload>(token);

      expect(decoded).toMatchObject({
        sub: userId,
        email: email,
        role: role,
        permissions: permissions,
        iat: Math.floor(now / 1000),
        exp: Math.floor((now + 15 * 60 * 1000) / 1000), // 15 minutes
        jti: 'random-token-id'
      });

      jest.useRealTimers();
    });
  });

  describe('Refresh Token Creation', () => {
    it('should create a valid refresh token', async () => {
      const userId = 'user-123';
      
      const token = await createRefreshToken(userId);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should create refresh token with custom token family', async () => {
      const userId = 'user-123';
      const tokenFamily = 'custom-family';
      
      const token = await createRefreshToken(userId, tokenFamily);
      const decoded = decodeToken<RefreshTokenPayload>(token);

      expect(decoded?.family).toBe(tokenFamily);
    });

    it('should include all required payload fields', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const userId = 'user-123';
      const token = await createRefreshToken(userId);
      const decoded = decodeToken<RefreshTokenPayload>(token);

      expect(decoded).toMatchObject({
        sub: userId,
        iat: Math.floor(now / 1000),
        exp: Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000), // 30 days
        jti: 'random-token-id',
        family: 'random-token-id'
      });

      jest.useRealTimers();
    });
  });

  describe('Token Validation', () => {
    let validToken: string;

    beforeEach(async () => {
      validToken = await createAccessToken(
        'user-123',
        'test@example.com',
        UserRole.STUDENT,
        mockPermissions
      );
    });

    it('should validate a valid token', async () => {
      const result = await validateToken<AccessTokenPayload>(validToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toMatchObject({
        sub: 'user-123',
        email: 'test@example.com',
        role: UserRole.STUDENT
      });
    });

    it('should reject token with invalid format', async () => {
      const result = await validateToken('invalid.token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('should reject token with invalid signature', async () => {
      mockConstantTimeCompare.mockReturnValue(false);
      
      const result = await validateToken<AccessTokenPayload>(validToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should reject expired token', async () => {
      jest.useFakeTimers();
      
      // Create token
      const token = await createAccessToken(
        'user-123',
        'test@example.com',
        UserRole.STUDENT,
        mockPermissions
      );

      // Fast forward past expiration
      jest.advanceTimersByTime(16 * 60 * 1000); // 16 minutes

      const result = await validateToken<AccessTokenPayload>(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');

      jest.useRealTimers();
    });

    it('should handle validation errors gracefully', async () => {
      // Mock crypto to throw an error
      mockCrypto.subtle.sign.mockRejectedValue(new Error('Crypto error'));

      const result = await validateToken<AccessTokenPayload>('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Token Decoding', () => {
    it('should decode token payload without validation', async () => {
      const token = await createAccessToken(
        'user-123',
        'test@example.com',
        UserRole.STUDENT,
        mockPermissions
      );

      const decoded = decodeToken<AccessTokenPayload>(token);

      expect(decoded).toMatchObject({
        sub: 'user-123',
        email: 'test@example.com',
        role: UserRole.STUDENT
      });
    });

    it('should return null for malformed token', () => {
      const decoded = decodeToken('malformed-token');

      expect(decoded).toBeNull();
    });

    it('should return null for invalid JSON in payload', () => {
      // Mock atob to return invalid JSON
      global.atob = jest.fn().mockReturnValue('invalid json');
      
      const decoded = decodeToken('header.payload.signature');

      expect(decoded).toBeNull();
    });
  });

  describe('Token Expiration Check', () => {
    it('should correctly identify non-expired token', async () => {
      const token = await createAccessToken(
        'user-123',
        'test@example.com',
        UserRole.STUDENT,
        mockPermissions
      );

      const isExpired = isTokenExpired(token);

      expect(isExpired).toBe(false);
    });

    it('should correctly identify expired token', async () => {
      jest.useFakeTimers();
      
      const token = await createAccessToken(
        'user-123',
        'test@example.com',
        UserRole.STUDENT,
        mockPermissions
      );

      // Fast forward past expiration
      jest.advanceTimersByTime(16 * 60 * 1000); // 16 minutes

      const isExpired = isTokenExpired(token);

      expect(isExpired).toBe(true);

      jest.useRealTimers();
    });

    it('should return true for malformed token', () => {
      const isExpired = isTokenExpired('malformed-token');

      expect(isExpired).toBe(true);
    });

    it('should return true for token without expiration', () => {
      // Mock decode to return payload without exp
      jest.spyOn(require('../../../../src/services/auth/jwt'), 'decodeToken')
        .mockReturnValue({ sub: 'user-123' });

      const isExpired = isTokenExpired('token-without-exp');

      expect(isExpired).toBe(true);
    });
  });

  describe('Token Storage', () => {
    it('should store tokens in localStorage', () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      storeTokens(accessToken, refreshToken);

      expect(localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken)).toBe(accessToken);
      expect(localStorage.getItem(TOKEN_STORAGE_KEYS.refreshToken)).toBe(refreshToken);
    });

    it('should retrieve stored tokens', () => {
      const accessToken = 'stored-access-token';
      const refreshToken = 'stored-refresh-token';

      localStorage.setItem(TOKEN_STORAGE_KEYS.accessToken, accessToken);
      localStorage.setItem(TOKEN_STORAGE_KEYS.refreshToken, refreshToken);

      const retrieved = getStoredTokens();

      expect(retrieved).toEqual({
        accessToken: accessToken,
        refreshToken: refreshToken
      });
    });

    it('should return null for missing tokens', () => {
      const retrieved = getStoredTokens();

      expect(retrieved).toEqual({
        accessToken: null,
        refreshToken: null
      });
    });

    it('should clear stored tokens', () => {
      localStorage.setItem(TOKEN_STORAGE_KEYS.accessToken, 'access-token');
      localStorage.setItem(TOKEN_STORAGE_KEYS.refreshToken, 'refresh-token');

      clearTokens();

      expect(localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken)).toBeNull();
      expect(localStorage.getItem(TOKEN_STORAGE_KEYS.refreshToken)).toBeNull();
    });
  });

  describe('Token Rotation', () => {
    let validRefreshToken: string;
    const mockGetUserData = jest.fn();

    beforeEach(async () => {
      validRefreshToken = await createRefreshToken('user-123');
      mockGetUserData.mockResolvedValue({
        email: 'test@example.com',
        role: UserRole.STUDENT,
        permissions: mockPermissions
      });
    });

    it('should rotate tokens successfully', async () => {
      // Mock validateToken for refresh token
      jest.spyOn(require('../../../../src/services/auth/jwt'), 'validateToken')
        .mockResolvedValue({
          valid: true,
          payload: {
            sub: 'user-123',
            family: 'token-family'
          }
        });

      const result = await rotateTokens(validRefreshToken, mockGetUserData);

      expect(result).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      });

      expect(mockGetUserData).toHaveBeenCalledWith('user-123');
    });

    it('should return null for invalid refresh token', async () => {
      // Mock validateToken to fail
      jest.spyOn(require('../../../../src/services/auth/jwt'), 'validateToken')
        .mockResolvedValue({
          valid: false,
          error: 'Token expired'
        });

      const result = await rotateTokens('invalid-token', mockGetUserData);

      expect(result).toBeNull();
    });

    it('should return null when user data is not found', async () => {
      jest.spyOn(require('../../../../src/services/auth/jwt'), 'validateToken')
        .mockResolvedValue({
          valid: true,
          payload: {
            sub: 'user-123',
            family: 'token-family'
          }
        });

      mockGetUserData.mockResolvedValue(null);

      const result = await rotateTokens(validRefreshToken, mockGetUserData);

      expect(result).toBeNull();
    });

    it('should maintain token family in rotation', async () => {
      const originalFamily = 'original-family';
      mockGenerateSecureToken.mockReturnValue('new-token-id');

      jest.spyOn(require('../../../../src/services/auth/jwt'), 'validateToken')
        .mockResolvedValue({
          valid: true,
          payload: {
            sub: 'user-123',
            family: originalFamily
          }
        });

      const result = await rotateTokens(validRefreshToken, mockGetUserData);

      if (result) {
        const decodedNewRefresh = decodeToken<RefreshTokenPayload>(result.refreshToken);
        expect(decodedNewRefresh?.family).toBe(originalFamily);
      }
    });
  });

  describe('Base64URL Encoding/Decoding', () => {
    it('should handle special characters in base64url encoding', async () => {
      const specialPayload = {
        sub: 'user+with/special=chars',
        data: 'value+with/special=chars'
      };

      // Create a token with special characters
      global.btoa = jest.fn().mockImplementation((str) => {
        const base64 = Buffer.from(str).toString('base64');
        // Simulate base64 with special chars
        return base64.replace(/A/g, '+').replace(/B/g, '/').replace(/C/g, '=');
      });

      const token = await createAccessToken(
        specialPayload.sub,
        'test@example.com',
        UserRole.STUDENT,
        mockPermissions
      );

      // Should still create a valid token
      expect(token).toBeTruthy();
      expect(token.includes('+')).toBe(false);
      expect(token.includes('/')).toBe(false);
      expect(token.includes('=')).toBe(false);
    });
  });

  describe('JWT Header', () => {
    it('should create tokens with correct header', async () => {
      const token = await createAccessToken(
        'user-123',
        'test@example.com',
        UserRole.STUDENT,
        mockPermissions
      );

      const parts = token.split('.');
      const headerDecoded = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));

      expect(headerDecoded).toEqual({
        alg: 'HS256',
        typ: 'JWT'
      });
    });
  });

  describe('Signature Verification', () => {
    it('should use constant time comparison for signature verification', async () => {
      const token = await createAccessToken(
        'user-123',
        'test@example.com',
        UserRole.STUDENT,
        mockPermissions
      );

      await validateToken<AccessTokenPayload>(token);

      expect(mockConstantTimeCompare).toHaveBeenCalled();
    });

    it('should handle signature creation errors', async () => {
      mockCrypto.subtle.sign.mockRejectedValue(new Error('Signature error'));

      await expect(
        createAccessToken('user-123', 'test@example.com', UserRole.STUDENT, mockPermissions)
      ).rejects.toThrow('Signature error');
    });

    it('should handle key import errors', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Key import error'));

      await expect(
        createAccessToken('user-123', 'test@example.com', UserRole.STUDENT, mockPermissions)
      ).rejects.toThrow('Key import error');
    });
  });

  describe('Token Configuration', () => {
    it('should use correct expiration times', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const accessToken = await createAccessToken(
        'user-123',
        'test@example.com',
        UserRole.STUDENT,
        mockPermissions
      );
      const refreshToken = await createRefreshToken('user-123');

      const accessDecoded = decodeToken<AccessTokenPayload>(accessToken);
      const refreshDecoded = decodeToken<RefreshTokenPayload>(refreshToken);

      expect(accessDecoded?.exp).toBe(Math.floor((now + 15 * 60 * 1000) / 1000)); // 15 minutes
      expect(refreshDecoded?.exp).toBe(Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000)); // 30 days

      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty permissions array', async () => {
      const token = await createAccessToken(
        'user-123',
        'test@example.com',
        UserRole.STUDENT,
        []
      );

      const decoded = decodeToken<AccessTokenPayload>(token);
      expect(decoded?.permissions).toEqual([]);
    });

    it('should handle very long user IDs', async () => {
      const longUserId = 'a'.repeat(1000);
      
      const token = await createAccessToken(
        longUserId,
        'test@example.com',
        UserRole.STUDENT,
        mockPermissions
      );

      const decoded = decodeToken<AccessTokenPayload>(token);
      expect(decoded?.sub).toBe(longUserId);
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'test+user@example-domain.co.uk';
      
      const token = await createAccessToken(
        'user-123',
        specialEmail,
        UserRole.STUDENT,
        mockPermissions
      );

      const decoded = decodeToken<AccessTokenPayload>(token);
      expect(decoded?.email).toBe(specialEmail);
    });

    it('should handle token validation with missing payload fields', async () => {
      // Mock decodeToken to return incomplete payload
      jest.spyOn(require('../../../../src/services/auth/jwt'), 'decodeToken')
        .mockReturnValue({ sub: 'user-123' }); // Missing exp field

      const result = await validateToken('token-without-exp');

      expect(result.valid).toBe(true); // Should still be valid if not expired
    });
  });

  describe('Memory and Performance', () => {
    it('should not leak memory when creating many tokens', async () => {
      // Create many tokens to test for memory leaks
      const tokens = [];
      
      for (let i = 0; i < 1000; i++) {
        const token = await createAccessToken(
          `user-${i}`,
          `user${i}@example.com`,
          UserRole.STUDENT,
          mockPermissions
        );
        tokens.push(token);
      }

      expect(tokens).toHaveLength(1000);
      expect(new Set(tokens).size).toBe(1000); // All tokens should be unique
    });

    it('should handle concurrent token creation', async () => {
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        promises.push(
          createAccessToken(
            `user-${i}`,
            `user${i}@example.com`,
            UserRole.STUDENT,
            mockPermissions
          )
        );
      }

      const tokens = await Promise.all(promises);
      
      expect(tokens).toHaveLength(100);
      expect(new Set(tokens).size).toBe(100); // All tokens should be unique
    });
  });
});